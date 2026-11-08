import type { BadgeTone } from "@/components/ui/badge";

export const TENANT_TONE: Record<string, BadgeTone> = {
  PENDING: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  CLOSED: "neutral",
};

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting for approval",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
};

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

export const formatDateTime = (date: Date) => dateTime.format(date);
export const formatDate = (date: Date) => dateOnly.format(date);
