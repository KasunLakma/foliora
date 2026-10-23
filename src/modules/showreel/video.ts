export type VideoProvider = "YOUTUBE" | "VIMEO";

const YOUTUBE_ID = /^[\w-]{11}$/;

/** Turns any common YouTube or Vimeo link into { provider, videoId }, or null if it is not one. */
export function parseVideoUrl(input: string): { provider: VideoProvider; videoId: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1] ?? "";
    return YOUTUBE_ID.test(id) ? { provider: "YOUTUBE", videoId: id } : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v") ?? "";
      return YOUTUBE_ID.test(id) ? { provider: "YOUTUBE", videoId: id } : null;
    }
    const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
    return match ? { provider: "YOUTUBE", videoId: match[1] } : null;
  }

  if (host === "vimeo.com") {
    const match = url.pathname.match(/^\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/)?(\d+)/);
    return match ? { provider: "VIMEO", videoId: match[1] } : null;
  }

  if (host === "player.vimeo.com") {
    const match = url.pathname.match(/^\/video\/(\d+)/);
    return match ? { provider: "VIMEO", videoId: match[1] } : null;
  }

  return null;
}

export function watchUrl(provider: VideoProvider, videoId: string) {
  return provider === "YOUTUBE"
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://vimeo.com/${videoId}`;
}

export function embedUrl(provider: VideoProvider, videoId: string) {
  return provider === "YOUTUBE"
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : `https://player.vimeo.com/video/${videoId}`;
}

/** YouTube has a public thumbnail address. Vimeo does not, so it returns null. */
export function thumbnailUrl(provider: VideoProvider, videoId: string) {
  return provider === "YOUTUBE" ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}
