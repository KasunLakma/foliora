import { describe, expect, it } from "vitest";
import { SLUG_MAX, slugify, validateSlug } from "../../src/modules/portfolio/slug";

describe("slugify", () => {
  it("turns a name into an address", () => {
    expect(slugify("Dinuka Senanayake")).toBe("dinuka-senanayake");
    expect(slugify("Éloïse O'Neil")).toBe("eloise-o-neil");
    expect(slugify("  --Hello__World--  ")).toBe("hello-world");
  });

  it("returns an empty text when nothing usable is left (for example Sinhala letters)", () => {
    expect(slugify("දිනුක")).toBe("");
    expect(slugify("!!!")).toBe("");
  });

  it("never returns more than the maximum, and never ends with a hyphen", () => {
    const slug = slugify("a".repeat(28) + " bbbbbbbbbbbb");
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accepts good addresses and lower-cases them", () => {
    expect(validateSlug("dinuka")).toEqual({ ok: true, slug: "dinuka" });
    expect(validateSlug(" Dinuka-S ")).toEqual({ ok: true, slug: "dinuka-s" });
    expect(validateSlug("abc123")).toEqual({ ok: true, slug: "abc123" });
  });

  it("rejects short, long and badly shaped addresses", () => {
    expect(validateSlug("ab")).toEqual({ ok: false, problem: "short" });
    expect(validateSlug("a".repeat(SLUG_MAX + 1))).toEqual({ ok: false, problem: "long" });
    expect(validateSlug("my_name")).toEqual({ ok: false, problem: "chars" });
    expect(validateSlug("-abc")).toEqual({ ok: false, problem: "chars" });
    expect(validateSlug("abc-")).toEqual({ ok: false, problem: "chars" });
    expect(validateSlug("a--b")).toEqual({ ok: false, problem: "chars" });
    expect(validateSlug("ශිල්පී")).toEqual({ ok: false, problem: "chars" });
    expect(validateSlug("a b c")).toEqual({ ok: false, problem: "chars" });
  });

  it("keeps the pages of Foliora itself for Foliora", () => {
    for (const word of ["portal", "admin", "api", "login", "register", "design", "foliora"]) {
      expect(validateSlug(word)).toEqual({ ok: false, problem: "reserved" });
    }
  });
});
