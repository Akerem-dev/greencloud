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
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em]",
        "border-[color-mix(in_srgb,var(--gc-accent-2)_22%,transparent)]",
        "bg-[color-mix(in_srgb,var(--gc-accent-2)_7%,transparent)]",
        "text-[color-mix(in_srgb,var(--gc-accent-2)_78%,var(--gc-text))]",
        "shadow-[inset_0_1px_0_rgba(133,213,245,0.035)]",
        className,
      )}
      {...props}
    >
      <span className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gc-accent-2)] shadow-[0_0_10px_color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)]" />
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}