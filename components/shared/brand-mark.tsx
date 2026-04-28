import type { ComponentPropsWithoutRef } from "react";
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
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] shadow-[0_18px_42px_rgba(0,0,0,0.24),0_0_28px_var(--gc-glow)] transition duration-300 group-hover:scale-[1.03]",
          compact ? "h-12 w-12 rounded-[18px]" : "h-16 w-16 rounded-[22px]",
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,color-mix(in_srgb,var(--gc-accent-2)_34%,transparent),transparent_40%),radial-gradient(circle_at_76%_78%,color-mix(in_srgb,var(--gc-accent)_22%,transparent),transparent_44%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),transparent_38%,rgba(255,255,255,0.035))]" />

        <div className="absolute -right-4 -top-4 h-14 w-14 rounded-full bg-white/10 blur-2xl" />

        <svg
          viewBox="0 0 64 64"
          className={cn(
            "relative z-10 drop-shadow-[0_0_16px_var(--gc-glow)]",
            compact ? "h-8 w-8" : "h-11 w-11",
          )}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="greencloud-logo-line" x1="8" y1="8" x2="56" y2="56">
              <stop offset="0%" stopColor="var(--gc-accent-2)" />
              <stop offset="55%" stopColor="var(--gc-accent)" />
              <stop offset="100%" stopColor="#edf7d1" />
            </linearGradient>

            <filter
              id="greencloud-logo-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2.1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M18.5 42.5H16.5C10.9 42.5 6.5 38.2 6.5 32.8C6.5 27.5 10.7 23.2 16 23C18.3 15.9 24.7 11 32.1 11C39.7 11 46.1 16 48.2 23.2C53.5 23.8 57.5 27.9 57.5 33C57.5 38.3 53.2 42.5 47.8 42.5H45.5"
            fill="none"
            stroke="url(#greencloud-logo-line)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#greencloud-logo-glow)"
          />

          <path
            d="M32 45.5C25.8 41.7 22.8 36.8 23.3 31.6C23.8 25.9 28.5 21.1 36.9 17.2C39.2 25.7 38.4 32.4 34.4 37.3C31.8 40.4 28.6 42 25 42"
            fill="none"
            stroke="url(#greencloud-logo-line)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#greencloud-logo-glow)"
          />

          <path
            d="M32 45.5V29.8"
            fill="none"
            stroke="url(#greencloud-logo-line)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#greencloud-logo-glow)"
          />

          <path
            d="M32 45.5V53"
            fill="none"
            stroke="url(#greencloud-logo-line)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          <path
            d="M32 52.8H22.7M32 52.8H41.3"
            fill="none"
            stroke="url(#greencloud-logo-line)"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.8"
          />

          <circle cx="32" cy="55.5" r="2.1" fill="var(--gc-accent)" />
          <circle cx="22.5" cy="52.8" r="1.8" fill="var(--gc-accent-2)" />
          <circle cx="41.5" cy="52.8" r="1.8" fill="var(--gc-accent-2)" />
        </svg>

        <div className="absolute inset-[1px] rounded-[inherit] border border-white/5" />
        <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
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
            "truncate font-semibold tracking-[-0.055em]",
            compact ? "text-2xl" : "text-[2.1rem] leading-none",
          )}
        >
          <span className="bg-gradient-to-r from-[var(--gc-accent)] via-[var(--gc-accent-2)] to-[#edf7d1] bg-clip-text text-transparent">
            Green
          </span>
          <span className="text-[var(--gc-text)]">Cloud</span>
        </h2>
      </div>
    </div>
  );
}