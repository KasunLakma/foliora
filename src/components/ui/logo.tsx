import { cn } from "@/lib/cn";

export function Logo({
  size = 36,
  showName = true,
  className,
}: {
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        aria-hidden="true"
        className="bg-brand-gradient grid place-items-center rounded-[30%] font-display font-bold text-on-brand shadow-lg shadow-brand/30"
        style={{ width: size, height: size, fontSize: size * 0.56, lineHeight: 1 }}
      >
        F
      </span>
      {showName && (
        <span
          className="font-display font-semibold tracking-[0.22em] text-foreground uppercase"
          style={{ fontSize: size * 0.4 }}
        >
          Foliora
        </span>
      )}
    </span>
  );
}
