import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { imageUrl } from "@/lib/cloudinary";
import { getDictionary } from "@/lib/i18n/server";
import { createFormToken } from "@/modules/inquiries/spam";
import { getPublicPortfolio } from "@/modules/portfolio/service";
import { SOCIAL_LABELS } from "@/modules/profiles/constants";
import { CinematicTemplate } from "@/templates/cinematic";

type Props = { params: Promise<{ slug: string }> };

// Loaded once per request, even though both the metadata and the page need it.
const load = cache(async (slug: string) => {
  const session = await auth();
  return getPublicPortfolio(slug, { previewTenantId: session?.user?.activeTenantId ?? undefined });
});

const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Not found", robots: { index: false, follow: false } };

  const { locale } = await getDictionary();
  const tagline = locale === "si" ? data.taglineSi || data.taglineEn : data.taglineEn || data.taglineSi;
  const bio = locale === "si" ? data.bioSi || data.bioEn : data.bioEn || data.bioSi;
  const description = data.seoDescription ?? tagline ?? bio?.slice(0, 160) ?? undefined;
  const title = data.seoTitle ?? data.stageName;
  const cover = data.photos.find((p) => p.isCover) ?? data.photos[0];
  const image = cover ? imageUrl(cover.publicId, { width: 1200, height: 630, fit: "fill" }) : undefined;
  const url = `${baseUrl()}/${data.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // A draft that only the owner can see must never be indexed.
    robots: data.live ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: "Foliora",
      type: "profile",
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { locale, t } = await getDictionary();
  const cover = data.photos.find((p) => p.isCover) ?? data.photos[0];

  // Structured data helps Google understand the page (a person, with links to their profiles).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.stageName,
    url: `${baseUrl()}/${data.slug}`,
    description: data.seoDescription ?? data.taglineEn ?? data.taglineSi ?? undefined,
    image: cover ? imageUrl(cover.publicId, { width: 1200 }) : undefined,
    knowsLanguage: data.languages,
    sameAs: data.socialLinks
      .filter((link) => link.platform in SOCIAL_LABELS)
      .map((link) => link.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so that no text typed by a user can close the script tag early
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <CinematicTemplate
        data={data}
        locale={locale}
        t={t}
        contact={{ token: createFormToken(process.env.AUTH_SECRET ?? "") }}
      />
    </>
  );
}
