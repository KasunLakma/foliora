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
    <div className="min-h-dvh">
      <SideNav />
      <div className="md:pl-64">
        <header className="glass sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <div className="md:hidden">
              <Logo size={30} />
            </div>
            <p className="hidden truncate text-sm font-semibold text-muted-foreground md:block">
              {tenantName ?? "Foliora"}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                title={userName}
                className="bg-velvet grid size-9 place-items-center rounded-full text-sm font-semibold text-gilt"
              >
                {initial}
              </span>
              <form action={signOutAction}>
                <button
                  aria-label="Sign out"
                  className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-2 active:scale-95"
                >
                  <Icon name="logout" size={20} />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pt-5 pb-28 md:pb-12">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
