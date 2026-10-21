import { BottomNav, SideNav } from "@/components/app/nav";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { signOutAction } from "@/modules/auth/actions";

export function PortalShell({
  userName,
  tenantName,
  children,
}: {
  userName: string;
  tenantName: string | null;
  children: React.ReactNode;
}) {
  const initial = userName.trim().charAt(0).toUpperCase() || "F";

  return (
    <div className="bg-stage min-h-dvh">
      <SideNav />
      <div className="md:pl-64">
        <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <div className="md:hidden">
              <Logo size={32} />
            </div>
            <p className="hidden truncate text-sm font-semibold text-muted-foreground md:block">
              {tenantName ?? "Foliora"}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                title={userName}
                className="bg-brand-gradient grid size-10 place-items-center rounded-full text-sm font-bold text-on-brand"
              >
                {initial}
              </span>
              <form action={signOutAction}>
                <button
                  aria-label="Sign out"
                  className="glass-card grid size-10 place-items-center rounded-full text-white/70 transition hover:text-white active:scale-95"
                >
                  <Icon name="logout" size={18} />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pt-2 pb-32 md:pb-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
