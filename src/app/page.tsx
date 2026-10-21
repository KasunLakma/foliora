import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

const SAMPLE_CARDS = [
  { title: "Headshots", text: "Raw portraits", bg: "linear-gradient(160deg,#4a2d1c 0%,#16120f 70%)" },
  { title: "Showreel", text: "Your best scenes", bg: "linear-gradient(160deg,#5a2a12 0%,#120d0a 70%)" },
  { title: "Works", text: "Film, TV, stage", bg: "linear-gradient(160deg,#3a2a2a 0%,#0f0d0d 70%)" },
  { title: "Casting", text: "Apply in a tap", bg: "linear-gradient(160deg,#6b3410 0%,#130e0a 70%)" },
];

const POINTS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "image",
    title: "A portfolio in minutes",
    text: "Add your photos, showreel and credits, pick a look, and publish.",
  },
  {
    icon: "film",
    title: "Casting calls in one place",
    text: "Browse open calls and apply with your portfolio in a few taps.",
  },
  {
    icon: "phone",
    title: "Made for your phone",
    text: "Update your profile and answer inquiries wherever you are.",
  },
];

export default function Home() {
  return (
    <div className="bg-stage min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Logo size={38} />
        <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          Sign in
        </Link>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pt-20 pb-16 sm:pt-28">
        <h1 className="max-w-3xl font-display text-4xl leading-[1.2] font-semibold tracking-[0.1em] uppercase sm:text-6xl">
          Your work, in the spotlight
        </h1>
        <p className="max-w-xl text-lg text-white/65">
          Build a portfolio that looks as good as you do, get found by casting directors, and
          answer every inquiry from your phone.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Create your portfolio
          </Link>
          <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Sign in
          </Link>
        </div>
      </section>

      <section aria-label="Portfolio preview" className="mx-auto max-w-5xl px-6">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SAMPLE_CARDS.map((card) => (
            <li
              key={card.title}
              className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-white/10 even:translate-y-6 sm:even:translate-y-10"
              style={{ background: card.bg }}
            >
              <span className="glass-card absolute inset-x-3 bottom-3 rounded-2xl px-4 py-3">
                <span className="block text-sm font-bold tracking-[0.12em] uppercase">{card.title}</span>
                <span className="block text-xs text-white/55">{card.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16">
        <ul className="grid gap-4 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="glass-card flex gap-4 rounded-[1.75rem] p-5 sm:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/12 text-brand">
                <Icon name={point.icon} size={24} />
              </span>
              <span>
                <span className="block font-display text-base font-semibold tracking-[0.08em] uppercase">
                  {point.title}
                </span>
                <span className="mt-2 block text-muted-foreground">{point.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="px-6 pb-10 text-center text-sm text-white/40">
        Foliora. Portfolios for actors, actresses, models and agencies.
      </footer>
    </div>
  );
}
