import Link from "next/link";
import { LanguageSwitch } from "@/components/app/language-switch";
import { Logo } from "@/components/ui/logo";

export type LegalSection = { heading: string; paragraphs: string[] };

export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: LegalSection[];
}) {
  return (
    <div className="bg-stage min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link href="/" aria-label="Foliora">
          <Logo size={34} />
        </Link>
        <LanguageSwitch />
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-[0.12em] uppercase sm:text-4xl">{title}</h1>
        <p className="mt-6 rounded-2xl bg-warning/12 px-5 py-4 text-sm font-medium text-warning">
          DRAFT. This text is a starting point and must be reviewed by a lawyer before Foliora is launched. Items in
          [square brackets] still have to be filled in. English only for now.
        </p>
        <p className="mt-4 text-sm text-white/45">Last updated: [DATE]</p>

        <div className="mt-10 flex flex-col gap-9">
          {sections.map((section, index) => (
            <section key={section.heading} className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">
                {index + 1}. {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-white/70">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/8 px-6 py-8 text-center text-sm text-white/40">
        <Link href="/" className="transition hover:text-white/70">
          Foliora
        </Link>
      </footer>
    </div>
  );
}
