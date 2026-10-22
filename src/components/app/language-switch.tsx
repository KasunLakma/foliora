"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

/** Shows the language you can switch TO: "සිං" while the site is in English, "EN" while in Sinhala. */
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "en" ? "si" : "en";
  const name = next === "si" ? "සිංහල" : "English";

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${t.common.switchLanguage}: ${name}`}
      title={name}
      onClick={() =>
        startTransition(async () => {
          await setLocaleAction(next);
          router.refresh();
        })
      }
      className={cn(
        "glass-card inline-flex h-10 min-w-12 items-center justify-center rounded-full px-4 text-sm font-semibold text-white/85 transition hover:text-white active:scale-95 disabled:opacity-60",
        className,
      )}
    >
      {next === "si" ? "සිං" : "EN"}
    </button>
  );
}
