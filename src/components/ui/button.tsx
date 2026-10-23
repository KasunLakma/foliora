import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "light" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-gradient text-on-brand shadow-lg shadow-brand/25 hover:brightness-110",
  secondary: "glass-card text-foreground hover:bg-white/10",
  light: "bg-white text-black hover:bg-white/90",
  ghost: "text-foreground hover:bg-white/8",
  danger: "text-danger hover:bg-danger/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

/** Use on a <Link> too: className={buttonStyles({ variant: "primary", size: "lg" })} */
export function buttonStyles({
  variant = "primary",
  size = "md",
  full = false,
}: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
    VARIANTS[variant],
    SIZES[size],
    full && "w-full",
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  full,
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles({ variant, size, full }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
