import { describe, expect, it } from "vitest";
import { embedUrl, parseVideoUrl, thumbnailUrl, watchUrl } from "../../src/modules/showreel/video";

const ID = "dQw4w9WgXcQ";

describe("parseVideoUrl", () => {
  it("reads the common YouTube links", () => {
    const expected = { provider: "YOUTUBE", videoId: ID };
    expect(parseVideoUrl(`https://www.youtube.com/watch?v=${ID}`)).toEqual(expected);
    expect(parseVideoUrl(`https://youtube.com/watch?v=${ID}&t=42s`)).toEqual(expected);
    expect(parseVideoUrl(`https://m.youtube.com/watch?v=${ID}`)).toEqual(expected);
    expect(parseVideoUrl(`https://youtu.be/${ID}?si=abc`)).toEqual(expected);
    expect(parseVideoUrl(`https://www.youtube.com/shorts/${ID}`)).toEqual(expected);
    expect(parseVideoUrl(`https://www.youtube.com/embed/${ID}`)).toEqual(expected);
    expect(parseVideoUrl(`https://www.youtube-nocookie.com/embed/${ID}`)).toEqual(expected);
  });

  it("reads the common Vimeo links", () => {
    const expected = { provider: "VIMEO", videoId: "123456789" };
    expect(parseVideoUrl("https://vimeo.com/123456789")).toEqual(expected);
    expect(parseVideoUrl("https://www.vimeo.com/123456789?share=copy")).toEqual(expected);
    expect(parseVideoUrl("https://player.vimeo.com/video/123456789")).toEqual(expected);
    expect(parseVideoUrl("https://vimeo.com/channels/staffpicks/123456789")).toEqual(expected);
  });

  it("rejects anything else", () => {
    expect(parseVideoUrl("")).toBeNull();
    expect(parseVideoUrl("not a link")).toBeNull();
    expect(parseVideoUrl("https://example.com/watch?v=" + ID)).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(parseVideoUrl("https://www.youtube.com/")).toBeNull();
    expect(parseVideoUrl("https://vimeo.com/about")).toBeNull();
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
    expect(parseVideoUrl("https://evil.com/?u=https://youtu.be/" + ID)).toBeNull();
  });
});

describe("video address helpers", () => {
  it("builds watch, embed and thumbnail addresses", () => {
    expect(watchUrl("YOUTUBE", ID)).toBe(`https://www.youtube.com/watch?v=${ID}`);
    expect(watchUrl("VIMEO", "42")).toBe("https://vimeo.com/42");
    expect(embedUrl("YOUTUBE", ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
    expect(embedUrl("VIMEO", "42")).toBe("https://player.vimeo.com/video/42");
    expect(thumbnailUrl("YOUTUBE", ID)).toBe(`https://img.youtube.com/vi/${ID}/hqdefault.jpg`);
    expect(thumbnailUrl("VIMEO", "42")).toBeNull();
  });
});
