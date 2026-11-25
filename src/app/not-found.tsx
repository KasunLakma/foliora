import Link from "next/link";
import { LanguageSwitch } from "@/components/app/language-switch";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getDictionary } from "@/lib/i18n/server";

// Shown for every address that does not exist, and for pages that are not public (drafts, the admin area for non-staff).
export default async function NotFound() {
  const { t } = await getDictionary();

  return (
    <div className="bg-stage grid min-h-dvh place-items-center px-6">
      <div className="absolute top-6 right-6">
        <LanguageSwitch />
      </div>
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <Logo size={44} />
        <p className="font-display text-7xl font-semibold tracking-[0.2em] text-brand">404</p>
        <h1 className="font-display text-2xl font-semibold tracking-[0.12em] uppercase">{t.errorPages.notFoundTitle}</h1>
        <p className="text-white/65">{t.errorPages.notFoundText}</p>
        <Link href="/" className={buttonStyles({ size: "lg" })}>
          {t.errorPages.goHome}
        </Link>
      </div>
    </div>
  );
}
