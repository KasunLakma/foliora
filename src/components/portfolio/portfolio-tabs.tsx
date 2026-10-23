"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

export function PortfolioTabs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/portal/portfolio", label: t.portfolio.tabs.works, active: pathname === "/portal/portfolio" },
    {
      href: "/portal/portfolio/showreel",
      label: t.portfolio.tabs.showreel,
      active: pathname.startsWith("/portal/portfolio/showreel"),
    },
  ];

  return (
    <nav aria-label={t.portfolio.title} className="glass-card flex gap-1 rounded-full p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition",
            tab.active ? "bg-brand-gradient text-on-brand" : "text-white/65 hover:text-white",
          )}
        >
          {tab.label}
        </Link>
      ))}
      <span
        aria-disabled="true"
        className="flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold text-white/30"
      >
        {t.portfolio.tabs.photos}
      </span>
    </nav>
  );
}
