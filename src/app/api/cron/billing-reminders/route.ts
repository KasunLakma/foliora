import { timingSafeEqual } from "node:crypto";
import { sendRenewalReminders } from "@/modules/billing/reminders";

// Runs on every call. Vercel calls it once a day (see vercel.json) and sends the CRON_SECRET with it.
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await sendRenewalReminders());
}
