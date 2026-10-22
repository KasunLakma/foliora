import type { Metadata, Viewport } from "next";
import { Cinzel, Manrope, Noto_Sans_Sinhala, Noto_Serif_Sinhala } from "next/font/google";
import { getDictionary } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel", display: "swap" });
const sinhalaSans = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala-sans",
  display: "swap",
  preload: false,
});
const sinhalaSerif = Noto_Serif_Sinhala({
  subsets: ["sinhala"],
  variable: "--font-sinhala-serif",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Foliora", template: "%s | Foliora" },
  description: "Portfolio websites for actors, actresses, models and agencies.",
  applicationName: "Foliora",
  appleWebApp: { capable: true, title: "Foliora", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDictionary();

  return (
    <html
      lang={locale}
      className={`${manrope.variable} ${cinzel.variable} ${sinhalaSans.variable} ${sinhalaSerif.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <I18nProvider locale={locale} t={t}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
