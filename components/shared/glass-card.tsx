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
        "premium-noise relative isolate overflow-hidden rounded-[32px] border backdrop-blur-2xl transition duration-300",
        "border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)]",
        "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-panel-2)_92%,transparent),color-mix(in_srgb,var(--gc-panel)_82%,transparent))]",
        "shadow-[0_24px_78px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.035)]",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_16%_0%,color-mix(in_srgb,var(--gc-accent)_10%,transparent),transparent_38%),radial-gradient(circle_at_92%_8%,color-mix(in_srgb,var(--gc-accent-2)_8%,transparent),transparent_36%)]" />

      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%,rgba(0,0,0,0.045))]" />

      {children}
    </div>
  );
}