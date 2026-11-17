import type { BadgeTone } from "@/components/ui/badge";

/** The colour of each inquiry status badge. (Next.js pages may not export extra values, so it lives here.) */
export const STATUS_TONE: Record<string, BadgeTone> = {
  NEW: "brand",
  READ: "neutral",
  REPLIED: "success",
  ARCHIVED: "neutral",
  SPAM: "danger",
};
