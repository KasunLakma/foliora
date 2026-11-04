import Link from "next/link";
import { LanguageSwitch } from "@/components/app/language-switch";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";

const PLANS = [
  { key: "free", monthly: 0, yearly: 0 },
  { key: "pro", monthly: 2500, yearly: 25000, popular: true },
  { key: "agency", monthly: 12500, yearly: 125000 },
] as const;

const FEATURES: { key: keyof Dictionary["home"]["features"]["items"]; icon: IconName }[] = [
  { key: "address", icon: "home" },
  { key: "bilingual", icon: "user" },
  { key: "phone", icon: "phone" },
  { key: "inbox", icon: "mail" },
  { key: "google", icon: "eye" },
  { key: "casting", icon: "film" },
];

const STEPS = ["one", "two", "three"] as const;
const LOOKS = [
  { key: "cinematic", bg: "linear-gradient(160deg,#4a2d1c 0%,#0f0d0c 75%)", live: true },
  { key: "editorial", bg: "linear-gradient(160deg,#e9e4dc 0%,#bdb6aa 80%)", live: false },
  { key: "minimal", bg: "linear-gradient(160deg,#2b2b2e 0%,#121214 80%)", live: false },
] as const;

const SectionHeading = ({ title, text }: { title: string; text?: string }) => (
  <div className="flex max-w-2xl flex-col gap-3">
    <h2 className="font-display text-3xl font-semibold tracking-[0.12em] uppercase sm:text-4xl">{title}</h2>
    {text && <p className="text-lg text-white/65">{text}</p>}
  </div>
);

export function Landing({
  t,
  locale,
  demoSlug,
}: {
  t: Dictionary;
  locale: Locale;
  demoSlug: string | null;
}) {
  const h = t.home;
  const money = new Intl.NumberFormat(locale === "si" ? "si-LK" : "en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="bg-stage min-h-dvh">
      {/* ---------- header ---------- */}
      <header className="glass sticky top-0 z-40 border-b border-white/8 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <Logo size={34} />
          <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex">
            <a href="#how" className="transition hover:text-white">{h.nav.how}</a>
            <a href="#features" className="transition hover:text-white">{h.nav.features}</a>
            <a href="#pricing" className="transition hover:text-white">{h.nav.pricing}</a>
            <a href="#faq" className="transition hover:text-white">{h.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <Link href="/login" className={cn(buttonStyles({ variant: "secondary", size: "sm" }), "hidden sm:inline-flex")}>
              {t.common.signIn}
            </Link>
            <Link href="/register" className={buttonStyles({ size: "sm" })}>
              {h.startFree}
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-16 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
        <div className="flex flex-col gap-7">
          <h1 className="font-display text-4xl leading-[1.18] font-semibold tracking-[0.08em] uppercase sm:text-5xl lg:text-6xl">
            {h.hero.title}
          </h1>
          <p className="max-w-xl text-lg text-white/70">{h.hero.text}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonStyles({ size: "lg" })}>
              {h.startFree}
            </Link>
            {demoSlug && (
              <Link href={`/${demoSlug}`} className={buttonStyles({ variant: "secondary", size: "lg" })}>
                {h.hero.secondary}
              </Link>
            )}
          </div>
          <p className="text-sm text-white/45">{h.hero.note}</p>
        </div>
        <PhoneMockup demoSlug={demoSlug} labels={h.mock} title={h.hero.secondary} />
      </section>

      {/* ---------- how it works ---------- */}
      <section id="how" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-6 py-20">
        <SectionHeading title={h.how.title} />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((key, index) => (
            <li key={key} className="glass-card flex flex-col gap-3 rounded-[1.75rem] p-7">
              <span className="font-display text-5xl font-semibold text-brand/50">{index + 1}</span>
              <h3 className="text-xl font-semibold">{h.how.steps[key].title}</h3>
              <p className="text-white/65">{h.how.steps[key].text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- features ---------- */}
      <section id="features" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-6 py-20">
        <SectionHeading title={h.features.title} />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.key} className="glass-card flex flex-col gap-4 rounded-[1.75rem] p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand/12 text-brand">
                <Icon name={feature.icon} size={24} />
              </span>
              <h3 className="text-lg font-semibold">{h.features.items[feature.key].title}</h3>
              <p className="text-white/65">{h.features.items[feature.key].text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- looks ---------- */}
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20">
        <SectionHeading title={h.looks.title} text={h.looks.text} />
        <ul className="grid gap-4 sm:grid-cols-3">
          {LOOKS.map((look) => (
            <li
              key={look.key}
              className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/10"
              style={{ background: look.bg }}
            >
              <span
                className={cn(
                  "absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold tracking-[0.12em] uppercase",
                  look.live ? "glass-card" : "bg-black/55 text-white/80 backdrop-blur",
                )}
              >
                {h.looks.names[look.key]}
                {!look.live && <Badge>{h.looks.soon}</Badge>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- pricing ---------- */}
      <section id="pricing" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-6 py-20">
        <SectionHeading title={h.pricing.title} text={h.pricing.text} />
        <ul className="grid items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const info = h.pricing.plans[plan.key];
            const popular = "popular" in plan && plan.popular;
            return (
              <li
                key={plan.key}
                className={cn(
                  "glass-card relative flex flex-col gap-6 rounded-[1.75rem] p-8",
                  popular && "ring-2 ring-brand",
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-8">
                    <Badge tone="brand" className="bg-brand-gradient text-on-brand">{h.pricing.popular}</Badge>
                  </span>
                )}
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-[0.1em] uppercase">{info.name}</h3>
                  <p className="mt-1 text-sm text-white/55">{info.text}</p>
                </div>
                <div>
                  <p className="font-display text-4xl font-semibold">{money.format(plan.monthly)}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {h.pricing.month}
                    {plan.yearly > 0 && ` · ${format(h.pricing.year, { price: money.format(plan.yearly) })}`}
                  </p>
                </div>
                <ul className="flex flex-1 flex-col gap-3">
                  {info.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-white/80">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success/20 text-success">
                        <Icon name="check" size={12} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={buttonStyles({ variant: popular ? "primary" : "secondary", size: "md", full: true })}
                >
                  {format(h.pricing.choose, { plan: info.name })}
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="rounded-2xl bg-warning/12 px-5 py-4 text-sm font-medium text-warning">{h.pricing.note}</p>
      </section>

      {/* ---------- faq ---------- */}
      <section id="faq" className="mx-auto flex max-w-3xl scroll-mt-20 flex-col gap-10 px-6 py-20">
        <SectionHeading title={h.faq.title} />
        <div className="flex flex-col gap-3">
          {Object.values(h.faq.items).map((item) => (
            <details key={item.q} className="glass-card group rounded-[1.5rem] px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {item.q}
                <span aria-hidden="true" className="text-xl text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-white/65">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- final call ---------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="glass-card relative overflow-hidden rounded-[2rem] px-8 py-16 text-center">
          <div aria-hidden="true" className="absolute inset-x-0 -top-24 mx-auto h-48 w-2/3 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex flex-col items-center gap-6">
            <h2 className="max-w-3xl font-display text-3xl leading-[1.2] font-semibold tracking-[0.1em] uppercase sm:text-4xl">
              {h.cta.title}
            </h2>
            <p className="text-lg text-white/65">{h.cta.text}</p>
            <Link href="/register" className={buttonStyles({ size: "lg" })}>
              {h.startFree}
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- footer ---------- */}
      <footer className="border-t border-white/8 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Logo size={34} />
            <p className="text-sm text-white/55">{h.footer.tagline}</p>
          </div>
          <nav aria-label="Legal" className="flex gap-6 text-sm font-semibold text-white/65">
            <Link href="/terms" className="transition hover:text-white">{h.footer.terms}</Link>
            <Link href="/privacy" className="transition hover:text-white">{h.footer.privacy}</Link>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-sm text-white/35">
          {format(h.footer.rights, { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}
