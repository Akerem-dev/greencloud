import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SectionBadgeProps = ComponentPropsWithoutRef<"span">;

export default function SectionBadge({
  children,
  className,
  ...props
}: SectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]",
        "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)]",
        "bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)]",
        "text-[color-mix(in_srgb,var(--gc-accent-2)_84%,white)]",
        "shadow-[0_0_26px_var(--gc-glow)]",
        className,
      )}
      {...props}
    >
      <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gc-accent)] shadow-[0_0_12px_var(--gc-glow-strong)]" />
      <span className="min-w-0">{children}</span>
    </span>
  );
}