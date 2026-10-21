import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-velvet flex min-h-dvh flex-col">
      <header className="flex flex-col items-center gap-3 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-10 text-center">
        <Logo inverse size={48} />
        <p className="font-display text-lg text-white/75">Your work, in the spotlight.</p>
      </header>
      <main className="animate-sheet mx-auto w-full max-w-md flex-1 rounded-t-[2rem] bg-background px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-2xl sm:mb-10 sm:flex-none sm:rounded-[2rem]">
        {children}
      </main>
    </div>
  );
}
