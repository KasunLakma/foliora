import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, Noto_Sans_Sinhala, Noto_Serif_Sinhala } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1b0a12" },
    { media: "(prefers-color-scheme: dark)", color: "#120a0e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable} ${sinhalaSans.variable} ${sinhalaSerif.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
