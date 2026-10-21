import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stage flex min-h-dvh flex-col">
      <header className="flex flex-col items-center gap-4 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10 text-center">
        <Logo size={48} />
        <p className="max-w-xs text-white/65">Your work, in the spotlight.</p>
      </header>
      <main className="glass-card animate-sheet mx-auto w-full max-w-md flex-1 rounded-t-[2rem] border-b-0 px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:mb-10 sm:flex-none sm:rounded-[2rem] sm:border-b">
        {children}
      </main>
    </div>
  );
}
