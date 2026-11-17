import { LanguageSwitch } from "@/components/app/language-switch";
import { ContactForm } from "@/components/site/contact-form";
import { VideoPlayer } from "@/components/site/video-player";
import { imageUrl } from "@/lib/cloudinary";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import type { PublicPortfolio } from "@/modules/portfolio/public-types";
import { SOCIAL_LABELS } from "@/modules/profiles/constants";
import { thumbnailUrl } from "@/modules/showreel/video";

/** Shows the visitor's language first and falls back to the other one. */
function pick(en: string | null, si: string | null, locale: Locale) {
  return (locale === "si" ? si || en : en || si) || null;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-2xl font-semibold tracking-[0.18em] uppercase sm:text-3xl">{children}</h2>
);

export function CinematicTemplate({
  data,
  locale,
  t,
  contact,
}: {
  data: PublicPortfolio;
  locale: Locale;
  t: Dictionary;
  contact?: { token: string };
}) {
  const s = t.publicSite;
  const c = t.contact;
  const tagline = pick(data.taglineEn, data.taglineSi, locale);
  const bio = pick(data.bioEn, data.bioSi, locale);
  const cover = data.photos.find((p) => p.isCover) ?? data.photos[0] ?? null;
  const [firstName, ...otherNames] = data.stageName.trim().split(/\s+/);

  const stats = [
    data.heightCm !== null && { label: s.height, value: format(s.cm, { value: data.heightCm }) },
    data.build && { label: s.build, value: data.build },
    data.eyeColor && { label: s.eyes, value: data.eyeColor },
    data.hairColor && { label: s.hair, value: data.hairColor },
    data.location && { label: s.location, value: data.location },
    data.languages.length > 0 && {
      label: s.languages,
      value: data.languages.map((code) => t.languages[code as keyof typeof t.languages] ?? code).join(", "),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  const [mainVideo, ...otherVideos] = data.showreels;

  return (
    <div className="min-h-dvh bg-background">
      {!data.live && (
        <p className="sticky top-0 z-50 bg-warning px-4 py-2 text-center text-sm font-semibold text-black">
          {s.preview}
        </p>
      )}

      {/* ---------- hero ---------- */}
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(cover.publicId, { width: 1600 })}
            alt=""
            className="absolute inset-0 -z-20 size-full object-cover object-top opacity-60"
          />
        ) : (
          <div className="bg-stage absolute inset-0 -z-20" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-background to-transparent" />

        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
          <span className="font-display text-sm font-semibold tracking-[0.3em] text-white/80 uppercase">
            {data.stageName}
          </span>
          <LanguageSwitch />
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end gap-7 px-6 pt-24 pb-14">
          <h1 className="font-display leading-[1.05] uppercase">
            <span className="block text-5xl font-semibold tracking-[0.18em] break-words sm:text-7xl lg:text-8xl">
              {firstName}
            </span>
            {otherNames.length > 0 && (
              <span className="mt-2 block text-3xl font-normal tracking-[0.32em] break-words text-white/75 sm:text-5xl lg:text-6xl">
                {otherNames.join(" ")}
              </span>
            )}
          </h1>

          {tagline && <p className="max-w-xl text-lg text-white/70">{tagline}</p>}

          {stats.length > 0 && (
            <dl className="glass-card grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 rounded-[1.75rem] p-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-medium tracking-wider text-white/45 uppercase">{stat.label}</dt>
                  <dd className="mt-1 font-semibold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {mainVideo && (
            <a
              href="#showreel"
              className="glass-card inline-flex h-14 w-fit items-center gap-3 rounded-full px-7 text-sm font-bold tracking-[0.18em] uppercase transition hover:bg-white/10"
            >
              <span aria-hidden="true">▶</span>
              {s.play}
            </a>
          )}

          {contact && (
            <a
              href="#contact"
              className="glass-card inline-flex h-14 w-fit items-center rounded-full px-7 text-sm font-bold tracking-[0.18em] uppercase transition hover:bg-white/10"
            >
              {c.title}
            </a>
          )}
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-20">
        {/* ---------- about ---------- */}
        {(bio || data.skills.length > 0) && (
          <section aria-labelledby="about" className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-5">
              <div id="about">
                <SectionTitle>{s.about}</SectionTitle>
              </div>
              {bio && <p className="max-w-2xl text-lg leading-relaxed whitespace-pre-line text-white/75">{bio}</p>}
            </div>
            {data.skills.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-wider text-white/45 uppercase">{s.skills}</h3>
                <ul className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <li
                      key={skill.nameEn}
                      className="glass-card rounded-full px-4 py-2 text-sm font-medium text-white/85"
                    >
                      {locale === "si" ? skill.nameSi : skill.nameEn}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ---------- headshots ---------- */}
        {data.photos.length > 0 && (
          <section aria-labelledby="headshots" className="flex flex-col gap-8">
            <div id="headshots">
              <SectionTitle>{s.headshots}</SectionTitle>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.photos.map((photo) => (
                <li
                  key={photo.publicId}
                  className="glass-card relative aspect-[4/5] overflow-hidden rounded-[1.75rem] even:translate-y-6 lg:even:translate-y-10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(photo.publicId, { width: 700, height: 875, fit: "fill" })}
                    alt={photo.caption ?? data.stageName}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                  {photo.caption && (
                    <span className="glass-card absolute inset-x-3 bottom-3 rounded-2xl px-4 py-2 text-xs font-bold tracking-[0.14em] uppercase">
                      {photo.caption}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- showreel ---------- */}
        {mainVideo && (
          <section id="showreel" aria-labelledby="showreel-title" className="flex scroll-mt-8 flex-col gap-8">
            <div id="showreel-title">
              <SectionTitle>{s.showreel}</SectionTitle>
            </div>
            <VideoPlayer
              provider={mainVideo.provider}
              videoId={mainVideo.videoId}
              title={mainVideo.title}
              thumbnail={thumbnailUrl(mainVideo.provider, mainVideo.videoId)}
              playLabel={s.play}
            />
            {otherVideos.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2">
                {otherVideos.map((video) => (
                  <li key={video.videoId + video.title} className="flex flex-col gap-3">
                    <VideoPlayer
                      provider={video.provider}
                      videoId={video.videoId}
                      title={video.title}
                      thumbnail={thumbnailUrl(video.provider, video.videoId)}
                      playLabel={s.play}
                    />
                    <p className="px-1 text-sm font-semibold text-white/75">{video.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ---------- works ---------- */}
        {data.works.length > 0 && (
          <section aria-labelledby="works" className="flex flex-col gap-8">
            <div id="works">
              <SectionTitle>{s.works}</SectionTitle>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {data.works.map((work) => (
                <li
                  key={`${work.title}-${work.year}`}
                  className="glass-card flex gap-5 rounded-[1.75rem] p-6"
                >
                  <span className="font-display text-2xl font-semibold text-brand">{work.year}</span>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{work.title}</h3>
                    <p className="mt-1 text-sm text-white/55">
                      {[
                        t.workTypes[work.type as keyof typeof t.workTypes] ?? work.type,
                        work.roleName,
                        work.roleType ? t.roleTypes[work.roleType as keyof typeof t.roleTypes] : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {(work.director || work.company) && (
                      <p className="mt-1 text-sm text-white/45">
                        {[work.director, work.company].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {work.description && <p className="mt-3 text-sm text-white/70">{work.description}</p>}
                    {work.link && (
                      <a
                        href={work.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
                      >
                        {work.link.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- connect ---------- */}
        {data.socialLinks.length > 0 && (
          <section aria-labelledby="connect" className="flex flex-col gap-8">
            <div id="connect">
              <SectionTitle>{s.connect}</SectionTitle>
            </div>
            <ul className="flex flex-wrap gap-3">
              {data.socialLinks.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold transition hover:bg-white/10"
                  >
                    {SOCIAL_LABELS[link.platform as keyof typeof SOCIAL_LABELS] ?? link.platform}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- contact ---------- */}
        {contact && (
          <section id="contact" aria-labelledby="contact-title" className="flex scroll-mt-8 flex-col gap-8">
            <div id="contact-title">
              <SectionTitle>{c.title}</SectionTitle>
            </div>
            <p className="max-w-xl text-white/65">{c.intro}</p>
            <div className="max-w-2xl">
              <ContactForm slug={data.slug} token={contact.token} ownerName={data.stageName} />
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/8 px-6 py-8 text-center text-sm text-white/40">
        <a href="/" className="transition hover:text-white/70">
          {s.poweredBy}
        </a>
      </footer>
    </div>
  );
}
