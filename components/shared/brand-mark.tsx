import type { ComponentPropsWithoutRef } from "react";
import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
} & ComponentPropsWithoutRef<"div">;

export default function BrandMark({
  title = "GreenCloud",
  subtitle = "Smart irrigation",
  compact = false,
  className,
  ...props
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center",
        compact ? "gap-2.5" : "gap-4",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/10 shadow-[0_18px_42px_rgba(0,0,0,0.24)] transition duration-300 group-hover:scale-[1.03]",
          compact ? "h-12 w-12 rounded-[18px]" : "h-16 w-16 rounded-[22px]",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--gc-accent-2)_42%,transparent),color-mix(in_srgb,var(--gc-accent)_20%,transparent)_46%,rgba(10,14,10,0.92)_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent-2)_26%,transparent),color-mix(in_srgb,var(--gc-accent)_18%,transparent),transparent)]" />

        <div className="absolute inset-[1px] rounded-[inherit] border border-white/5" />

        <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/10 blur-2xl" />

        <Leaf
          className={cn(
            "relative z-10 text-[var(--gc-accent-2)] drop-shadow-[0_0_14px_var(--gc-glow)]",
            compact ? "h-5 w-5" : "h-7 w-7",
          )}
          strokeWidth={1.9}
        />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "truncate uppercase tracking-[0.28em] text-[var(--gc-muted)]",
            compact ? "text-[9px]" : "text-[10px]",
          )}
        >
          {subtitle}
        </p>

        <h2
          className={cn(
            "truncate font-semibold tracking-[-0.05em] text-[var(--gc-text)]",
            compact ? "text-2xl" : "text-[2.1rem] leading-none",
          )}
        >
          {title}
        </h2>
      </div>
    </div>
  );
}