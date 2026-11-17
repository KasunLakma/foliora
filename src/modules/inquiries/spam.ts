import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const MAX_LINKS = 2;

export function countLinks(text: string) {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

/** Messages stuffed with links are almost always advertising. They are kept, but filed under Spam. */
export function looksLikeSpam(message: string) {
  return countLinks(message) > MAX_LINKS;
}

/** A one-way fingerprint of the sender's address. The address itself is never stored. */
export function hashIp(ip: string, secret: string) {
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

const sign = (timestamp: string, secret: string) =>
  createHmac("sha256", secret).update(`inquiry:${timestamp}`).digest("hex");

/** Given to the form when the page is drawn. A robot that posts at once, or forges one, is caught. */
export function createFormToken(secret: string, now = Date.now()) {
  const timestamp = String(now);
  return `${timestamp}.${sign(timestamp, secret)}`;
}

export type TokenCheck = "ok" | "too_fast" | "expired" | "invalid";

export function verifyFormToken(
  token: string,
  secret: string,
  now = Date.now(),
  minAgeMs = 3_000,
  maxAgeMs = 2 * 60 * 60 * 1000,
): TokenCheck {
  const [timestamp, signature] = token.split(".");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return "invalid";

  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(timestamp, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return "invalid";

  const age = now - Number(timestamp);
  if (age < minAgeMs) return "too_fast";
  if (age > maxAgeMs) return "expired";
  return "ok";
}
