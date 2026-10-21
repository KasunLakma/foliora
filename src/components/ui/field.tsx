import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// 16px text on purpose: iOS Safari zooms into inputs smaller than that.
export const controlStyles =
  "h-13 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-foreground " +
  "placeholder:text-white/35 outline-none transition " +
  "focus:border-brand focus:bg-white/8 focus:ring-4 focus:ring-brand/20";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-white/85">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlStyles, className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlStyles, "bg-surface", className)} {...props} />;
}
