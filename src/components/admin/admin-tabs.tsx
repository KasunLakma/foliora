"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/tenants", label: "Accounts", exact: false },
  { href: "/admin/audit", label: "Audit log", exact: false },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="glass-card flex gap-1 rounded-full p-1">
      {TABS.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 flex-1 items-center justify-center rounded-full text-sm font-semibold transition",
              active ? "bg-brand-gradient text-on-brand" : "text-white/65 hover:text-white",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
