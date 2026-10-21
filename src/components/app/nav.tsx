"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: IconName; soon?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Home", icon: "home" },
  { href: "/portal/profile", label: "Profile", icon: "user", soon: true },
  { href: "/portal/media", label: "Media", icon: "image", soon: true },
  { href: "/portal/casting", label: "Casting", icon: "film", soon: true },
  { href: "/portal/inbox", label: "Inbox", icon: "mail", soon: true },
];

function isActive(pathname: string, href: string) {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

/** Phone: bottom tab bar, like a native app. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const inner = (
            <>
              <span
                className={cn(
                  "grid h-8 w-14 place-items-center rounded-full transition",
                  active && "bg-brand/12 text-brand",
                )}
              >
                <Icon name={item.icon} size={22} />
              </span>
              <span className={cn(active && "text-brand")}>{item.label}</span>
            </>
          );
          const base =
            "flex flex-col items-center gap-0.5 rounded-2xl py-1 text-[11px] font-semibold";

          return (
            <li key={item.href} className="flex-1">
              {item.soon ? (
                <span aria-disabled="true" className={cn(base, "text-muted-foreground opacity-45")}>
                  {inner}
                </span>
              ) : (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(base, "text-muted-foreground active:scale-95")}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet and desktop: a velvet side rail. */
export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="bg-velvet fixed inset-y-0 left-0 hidden w-64 flex-col gap-10 p-5 text-white md:flex">
      <Logo inverse size={36} />
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const row = cn(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition",
              active ? "bg-white/12 text-gilt" : "text-white/70",
            );
            return (
              <li key={item.href}>
                {item.soon ? (
                  <span aria-disabled="true" className={cn(row, "opacity-45")}>
                    <Icon name={item.icon} size={20} />
                    {item.label}
                    <span className="ml-auto text-xs font-medium">Soon</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(row, "hover:bg-white/8")}
                  >
                    <Icon name={item.icon} size={20} />
                    {item.label}
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
