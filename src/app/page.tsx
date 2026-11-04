import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { getDictionary } from "@/lib/i18n/server";

const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  const { title, description } = t.home.meta;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: baseUrl() },
    openGraph: { title, description, url: baseUrl(), siteName: "Foliora", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Home() {
  const { t, locale } = await getDictionary();
  // When this is set, the phone on the landing page shows a REAL published portfolio.
  const demoSlug = process.env.NEXT_PUBLIC_DEMO_SLUG?.trim().toLowerCase() || null;

  // Tells Google what this site is.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Foliora",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t.home.meta.description,
    url: baseUrl(),
    offers: { "@type": "Offer", price: "0", priceCurrency: "LKR" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Landing t={t} locale={locale} demoSlug={demoSlug} />
    </>
  );
}
