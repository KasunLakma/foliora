/** Addresses that must never be given to a talent: they are pages of Foliora itself or may become so. */
export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "assets", "auth", "blog", "casting", "dashboard", "design", "help",
  "icons", "inbox", "login", "logout", "manifest", "portal", "pricing", "privacy", "profile",
  "register", "robots", "settings", "signin", "signup", "sitemap", "static", "support", "terms",
  "welcome", "www", "foliora", "about", "contact", "home", "media", "new", "null", "undefined",
]);

export type SlugProblem = "short" | "long" | "chars" | "reserved";

export const SLUG_MIN = 3;
export const SLUG_MAX = 30;

/** "Dinuka Senanayake!" -> "dinuka-senanayake". Returns "" when nothing usable is left (for example Sinhala letters). */
export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function validateSlug(raw: string): { ok: true; slug: string } | { ok: false; problem: SlugProblem } {
  const slug = raw.trim().toLowerCase();
  if (slug.length < SLUG_MIN) return { ok: false, problem: "short" };
  if (slug.length > SLUG_MAX) return { ok: false, problem: "long" };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { ok: false, problem: "chars" };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, problem: "reserved" };
  return { ok: true, slug };
}
