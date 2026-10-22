"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { useI18n } from "@/lib/i18n/provider";

type NavKey = "home" | "profile" | "media" | "casting" | "inbox";
type NavItem = { href: string; key: NavKey; icon: IconName; soon?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/portal", key: "home", icon: "home" },
  { href: "/portal/profile", key: "profile", icon: "user" },
  { href: "/portal/media", key: "media", icon: "image", soon: true },
  { href: "/portal/casting", key: "casting", icon: "film", soon: true },
  { href: "/portal/inbox", key: "inbox", icon: "mail", soon: true },
];

function isActive(pathname: string, href: string) {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

/** Phone: a floating pill tab bar. The active tab expands to show its name. */
export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="glass mx-auto flex max-w-md items-center justify-between rounded-full border border-white/10 p-1.5 shadow-2xl shadow-black/60">
        {NAV_ITEMS.map((item) => {
          const label = t.nav[item.key];
          const active = isActive(pathname, item.href);
          const base = "flex h-12 items-center justify-center gap-2 rounded-full px-3.5 transition";
          const content = (
            <>
              <Icon name={item.icon} size={22} />
              {active && <span className="text-sm font-semibold">{label}</span>}
            </>
          );

          return (
            <li key={item.href}>
              {item.soon ? (
                <span
                  aria-disabled="true"
                  aria-label={format(t.nav.soonAria, { item: label })}
                  className={cn(base, "text-white/30")}
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    active ? "bg-brand-gradient text-on-brand" : "text-white/65 active:scale-95",
                  )}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet and desktop: a glass side rail. */
export function SideNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="glass fixed inset-y-0 left-0 hidden w-64 flex-col gap-10 border-r border-white/8 p-5 md:flex">
      <Logo size={38} />
      <nav aria-label={t.nav.label}>
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const label = t.nav[item.key];
            const active = isActive(pathname, item.href);
            const row = cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition",
              active ? "bg-white/8 text-brand" : "text-white/65",
            );
            return (
              <li key={item.href}>
                {item.soon ? (
                  <span aria-disabled="true" className={cn(row, "opacity-45")}>
                    <Icon name={item.icon} size={20} />
                    {label}
                    <span className="ml-auto text-xs font-medium">{t.common.soon}</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(row, "hover:bg-white/6")}
                  >
                    <Icon name={item.icon} size={20} />
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
