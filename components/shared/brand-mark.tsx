"use client";

import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  logoSrc?: string;
  card?: boolean;
  showImageLogo?: boolean;
} & ComponentPropsWithoutRef<"div">;

export default function BrandMark({
  title = "GreenCloud",
  subtitle = "SMART IRRIGATION WORKSPACE",
  compact = false,
  logoSrc = "/logo.png?v=12",
  card = false,
  showImageLogo = true,
  className,
  ...props
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center",
        compact ? "gap-2.5" : "gap-3.5",
        card
          ? "rounded-full border border-[color-mix(in_srgb,var(--gc-border)_42%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-panel)_70%,transparent),color-mix(in_srgb,var(--gc-bg)_84%,black))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.018),0_14px_34px_rgba(0,0,0,0.22)]"
          : "",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border",
          "border-[color-mix(in_srgb,var(--gc-accent-2)_24%,transparent)]",
          "bg-[radial-gradient(circle_at_35%_25%,color-mix(in_srgb,var(--gc-accent-2)_22%,transparent),transparent_38%),color-mix(in_srgb,var(--gc-bg)_72%,black)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_0_18px_color-mix(in_srgb,var(--gc-glow)_58%,transparent)]",
          compact ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        {showImageLogo ? (
          <Image
            src={logoSrc}
            alt={`${title} logo`}
            fill
            sizes={compact ? "36px" : "44px"}
            className="object-contain p-1.5 drop-shadow-[0_0_10px_color-mix(in_srgb,var(--gc-glow)_80%,transparent)]"
            priority
            unoptimized
          />
        ) : (
          <Sprout className="h-4.5 w-4.5 text-[var(--gc-accent-2)]" />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-bold uppercase text-[var(--gc-muted)]",
            compact
              ? "text-[7.5px] tracking-[0.22em]"
              : "text-[9px] tracking-[0.26em]",
          )}
        >
          {subtitle}
        </p>

        <h2
          className={cn(
            "truncate font-semibold leading-none tracking-[-0.055em]",
            compact ? "text-[1.05rem]" : "text-[1.35rem]",
          )}
        >
          <span className="bg-gradient-to-r from-[var(--gc-accent-2)] via-[var(--gc-accent)] to-[#f4f1dc] bg-clip-text text-transparent">
            Green
          </span>
          <span className="text-[var(--gc-text)]">Cloud</span>
        </h2>
      </div>
    </div>
  );
}