import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";

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
    <div className="min-h-dvh">
      <section className="bg-velvet flex min-h-[88dvh] flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 text-white">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Logo inverse size={36} />
          <Link href="/login" className={buttonStyles({ variant: "light", size: "sm" })}>
            Sign in
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 py-16">
          <h1 className="font-display max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-7xl">
            Your work, in the spotlight.
          </h1>
          <p className="max-w-xl text-lg text-white/75">
            Build a portfolio that looks as good as you do, get found by casting directors, and
            answer every inquiry from your phone.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonStyles({ variant: "gilt", size: "lg" })}>
              Create your portfolio
            </Link>
            <Link href="/login" className={buttonStyles({ variant: "light", size: "lg" })}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-14">
        <ul className="grid gap-8 sm:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="flex gap-4 sm:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-brand shadow-sm ring-1 ring-border">
                <Icon name={point.icon} size={24} />
              </span>
              <span>
                <span className="block font-display text-xl font-semibold">{point.title}</span>
                <span className="mt-1 block text-muted-foreground">{point.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="px-6 pb-10 text-center text-sm text-muted-foreground">
        Foliora. Portfolios for actors, actresses, models and agencies.
      </footer>
    </div>
  );
}
