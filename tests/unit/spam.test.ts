import { describe, expect, it } from "vitest";
import {
  countLinks,
  createFormToken,
  hashIp,
  looksLikeSpam,
  verifyFormToken,
} from "../../src/modules/inquiries/spam";

describe("link counting", () => {
  it("counts web addresses", () => {
    expect(countLinks("hello")).toBe(0);
    expect(countLinks("see https://a.com and http://b.com and www.c.com")).toBe(3);
  });

  it("files a message with many links as spam, and leaves normal ones alone", () => {
    expect(looksLikeSpam("Please see our script at https://drive.example.com/x")).toBe(false);
    expect(looksLikeSpam("https://a.com https://b.com https://c.com")).toBe(true);
  });
});

describe("sender fingerprint", () => {
  it("is stable for the same sender and differs between senders and secrets", () => {
    expect(hashIp("1.2.3.4", "s")).toBe(hashIp("1.2.3.4", "s"));
    expect(hashIp("1.2.3.4", "s")).not.toBe(hashIp("1.2.3.5", "s"));
    expect(hashIp("1.2.3.4", "s")).not.toBe(hashIp("1.2.3.4", "other"));
    expect(hashIp("1.2.3.4", "s")).not.toContain("1.2.3.4");
  });
});

describe("form token", () => {
  const now = 1_000_000_000_000;
  const token = createFormToken("secret", now);

  it("is accepted after a few seconds and before it expires", () => {
    expect(verifyFormToken(token, "secret", now + 10_000)).toBe("ok");
  });

  it("is refused when the form is sent instantly (a robot)", () => {
    expect(verifyFormToken(token, "secret", now + 500)).toBe("too_fast");
  });

  it("is refused after it has expired", () => {
    expect(verifyFormToken(token, "secret", now + 3 * 60 * 60 * 1000)).toBe("expired");
  });

  it("is refused when forged, changed, empty or made with another secret", () => {
    expect(verifyFormToken("", "secret", now + 10_000)).toBe("invalid");
    expect(verifyFormToken("abc.def", "secret", now + 10_000)).toBe("invalid");
    expect(verifyFormToken(token, "other-secret", now + 10_000)).toBe("invalid");
    const [timestamp, signature] = token.split(".");
    expect(verifyFormToken(`${Number(timestamp) - 10_000_000}.${signature}`, "secret", now + 10_000)).toBe("invalid");
  });
});
