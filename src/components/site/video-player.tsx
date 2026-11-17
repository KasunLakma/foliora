"use client";

import { useState } from "react";
import { embedUrl, type VideoProvider } from "@/modules/showreel/video";

/** Shows a picture first. The real player (and its tracking) loads only when the visitor presses play. */
export function VideoPlayer({
  provider,
  videoId,
  title,
  thumbnail,
  playLabel,
}: {
  provider: VideoProvider;
  videoId: string;
  title: string;
  thumbnail: string | null;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    const extra = provider === "YOUTUBE" ? "?autoplay=1&rel=0" : "?autoplay=1";
    return (
      <iframe
        src={`${embedUrl(provider, videoId)}${extra}`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-[1.75rem] border-0 bg-black"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${playLabel}: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-surface"
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="bg-stage absolute inset-0" />
      )}
      <span className="absolute inset-0 grid place-items-center bg-black/35 transition group-hover:bg-black/20">
        <span className="bg-brand-gradient grid size-20 place-items-center rounded-full pl-1 text-3xl text-on-brand shadow-xl shadow-black/50 transition group-active:scale-95">
          ▶
        </span>
      </span>
    </button>
  );
}
