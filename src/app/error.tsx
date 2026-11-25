"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";

// Shown when something breaks while a page is being drawn. The visitor never sees technical details,
// only a short reference code (the "digest") that we can look up in the server logs.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-stage grid min-h-dvh place-items-center px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <Logo size={44} />
        <h1 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">{t.errorPages.errorTitle}</h1>
        <p className="text-white/65">{t.errorPages.errorText}</p>
        {error.digest && (
          <p className="font-mono text-xs text-white/40">{format(t.errorPages.reference, { code: error.digest })}</p>
        )}
        <Button size="lg" onClick={reset}>
          {t.errorPages.retry}
        </Button>
      </div>
    </div>
  );
}
