import type { Metadata } from "next";
import Link from "next/link";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { adminContext } from "@/modules/admin/guard";
import { signOutAction } from "@/modules/auth/actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Foliora Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, email } = await adminContext();

  return (
    <div className="bg-stage min-h-dvh">
      <header className="glass sticky top-0 z-30 border-b border-white/8 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <Badge tone="brand">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs text-white/50 sm:block" title={email}>
              {role.replace("_", " ").toLowerCase()} · {email}
            </span>
            <Link
              href="/portal"
              className="glass-card inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-white/85 transition hover:text-white"
            >
              Portal
            </Link>
            <form action={signOutAction}>
              <button
                aria-label="Sign out"
                title="Sign out"
                className="glass-card grid size-10 place-items-center rounded-full text-white/70 transition hover:text-white active:scale-95"
              >
                <Icon name="logout" size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6">
        <AdminTabs />
        {children}
      </main>
    </div>
  );
}
