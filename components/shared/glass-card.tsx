"use client";

import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = ComponentPropsWithoutRef<"div">;

export default function GlassCard({
  children,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "premium-noise group relative overflow-hidden rounded-[32px] border backdrop-blur-2xl transition duration-300",
        "border-[color-mix(in_srgb,var(--gc-border)_94%,transparent)]",
        "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-panel-2)_78%,transparent),color-mix(in_srgb,var(--gc-panel)_72%,transparent))]",
        "shadow-[0_24px_90px_rgba(0,0,0,0.34),0_0_52px_var(--gc-glow)]",
        "before:pointer-events-none before:absolute before:inset-0 before:z-[1] before:rounded-[inherit] before:border before:border-white/[0.035]",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none !absolute inset-0 !z-[1] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent-2)_12%,transparent),transparent_26%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--gc-accent)_10%,transparent),transparent_30%)]" />

      <div className="pointer-events-none !absolute inset-x-0 top-0 !z-[2] h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

      <div className="pointer-events-none !absolute -right-20 -top-20 !z-[1] h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--gc-accent)_18%,transparent)] opacity-70 blur-[70px] transition duration-500 group-hover:opacity-100" />

      <div className="pointer-events-none !absolute -bottom-24 -left-24 !z-[1] h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] opacity-45 blur-[82px]" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}