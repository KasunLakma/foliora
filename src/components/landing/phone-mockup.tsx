import type { Dictionary } from "@/lib/i18n/dictionaries";

const TILES = [
  "linear-gradient(160deg,#4a2d1c 0%,#16120f 80%)",
  "linear-gradient(160deg,#5a2a12 0%,#120d0a 80%)",
  "linear-gradient(160deg,#3a2a2a 0%,#0f0d0d 80%)",
  "linear-gradient(160deg,#6b3410 0%,#130e0a 80%)",
];

/** A phone showing a portfolio page. With a demo address it shows the REAL page; otherwise an abstract drawing. */
export function PhoneMockup({
  demoSlug,
  labels,
  title,
}: {
  demoSlug: string | null;
  labels: Dictionary["home"]["mock"];
  title: string;
}) {
  return (
    <div className="relative mx-auto w-[16.5rem] sm:w-[19rem]">
      <div aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-brand/25 blur-3xl" />
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2.6rem] border-[9px] border-[#1d1d22] bg-background shadow-2xl shadow-black/70">
        <span
          aria-hidden="true"
          className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black"
        />
        {demoSlug ? (
          <iframe src={`/${demoSlug}`} title={title} loading="lazy" className="size-full border-0" />
        ) : (
          <div aria-hidden="true" className="bg-stage flex size-full flex-col gap-3 overflow-hidden p-4 pt-12">
            <div>
              <p className="font-display text-xl font-semibold tracking-[0.18em] uppercase">{labels.name}</p>
              <p className="mt-1 text-[11px] text-white/60">{labels.tagline}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <span className="h-1 w-6 rounded bg-white/25" />
                  <span className="h-1.5 w-9 rounded bg-white/55" />
                </div>
              ))}
            </div>
            <p className="font-display text-[10px] tracking-[0.2em] text-white/70 uppercase">{labels.headshots}</p>
            <div className="grid grid-cols-2 gap-2">
              {TILES.map((background, i) => (
                <span
                  key={i}
                  className="aspect-[4/5] rounded-xl border border-white/10"
                  style={{ background, transform: i % 2 ? "translateY(8px)" : undefined }}
                />
              ))}
            </div>
            <p className="mt-3 font-display text-[10px] tracking-[0.2em] text-white/70 uppercase">{labels.works}</p>
            <div className="flex flex-col gap-1.5">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 p-2">
                  <span className="h-2 w-7 rounded bg-brand/70" />
                  <span className="h-1.5 flex-1 rounded bg-white/30" />
                </div>
              ))}
            </div>
            <div className="bg-brand-gradient mt-auto rounded-full py-2 text-center text-[10px] font-bold text-on-brand">
              {labels.contact}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
