import { LanguageSwitch } from "@/components/app/language-switch";
import { Logo } from "@/components/ui/logo";
import { getDictionary } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDictionary();

  return (
    <div className="bg-stage flex min-h-dvh flex-col">
      <div className="flex justify-end px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <LanguageSwitch />
      </div>
      <header className="flex flex-col items-center gap-4 px-6 pt-4 pb-10 text-center">
        <Logo size={48} />
        <p className="max-w-xs text-white/65">{t.auth.tagline}</p>
      </header>
      <main className="glass-card animate-sheet mx-auto w-full max-w-md flex-1 rounded-t-[2rem] border-b-0 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:mb-10 sm:flex-none sm:rounded-[2rem] sm:border-b">
        {children}
      </main>
    </div>
  );
}
