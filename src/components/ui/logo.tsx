import { cn } from "@/lib/cn";

export function Logo({
  size = 36,
  showName = true,
  inverse = false,
  className,
}: {
  size?: number;
  showName?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className="grid place-items-center rounded-[28%] bg-velvet font-display font-semibold text-gilt shadow-md ring-1 ring-white/10"
        style={{ width: size, height: size, fontSize: size * 0.58, lineHeight: 1 }}
      >
        F
      </span>
      {showName && (
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            inverse ? "text-white" : "text-foreground",
          )}
          style={{ fontSize: size * 0.56 }}
        >
          Foliora
        </span>
      )}
    </span>
  );
}
