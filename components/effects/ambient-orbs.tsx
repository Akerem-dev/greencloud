"use client";

import { memo } from "react";
import type { ThemePreset } from "@/components/providers/app-state-provider";

const PALETTES: Record<ThemePreset, [string, string, string, string]> = {
  "botanical-dark": [
    "rgba(126, 151, 55, 0.18)",
    "rgba(212, 188, 96, 0.12)",
    "rgba(88, 118, 61, 0.14)",
    "rgba(193, 206, 103, 0.10)",
  ],
  "forest-mist": [
    "rgba(147, 173, 92, 0.20)",
    "rgba(224, 215, 150, 0.13)",
    "rgba(92, 135, 86, 0.16)",
    "rgba(184, 206, 122, 0.11)",
  ],
  "aurora-gold": [
    "rgba(224, 193, 94, 0.22)",
    "rgba(180, 209, 97, 0.13)",
    "rgba(176, 140, 61, 0.16)",
    "rgba(224, 205, 121, 0.12)",
  ],
  "midnight-moss": [
    "rgba(88, 139, 83, 0.18)",
    "rgba(140, 164, 84, 0.11)",
    "rgba(57, 100, 72, 0.16)",
    "rgba(181, 193, 98, 0.09)",
  ],
  "golden-hour": [
    "rgba(240, 184, 77, 0.24)",
    "rgba(227, 208, 106, 0.14)",
    "rgba(202, 122, 66, 0.16)",
    "rgba(255, 220, 134, 0.11)",
  ],
  "rain-glass": [
    "rgba(143, 200, 230, 0.22)",
    "rgba(196, 229, 247, 0.13)",
    "rgba(91, 147, 176, 0.16)",
    "rgba(182, 216, 121, 0.10)",
  ],
};

function AmbientOrbs({
  themePreset = "botanical-dark",
}: {
  themePreset?: ThemePreset;
}) {
  const [a, b, c, d] = PALETTES[themePreset] ?? PALETTES["botanical-dark"];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute left-[-10%] top-[3%] h-[460px] w-[460px] rounded-full blur-[95px]"
        style={{
          background: a,
          animation: "gc-orb-float 18s ease-in-out infinite",
        }}
      />

      <div
        className="absolute right-[4%] top-[8%] h-[380px] w-[380px] rounded-full blur-[100px]"
        style={{
          background: b,
          animation: "gc-orb-float 22s ease-in-out infinite reverse",
        }}
      />

      <div
        className="absolute bottom-[8%] right-[10%] h-[340px] w-[340px] rounded-full blur-[100px]"
        style={{
          background: c,
          animation: "gc-orb-float 20s ease-in-out infinite",
        }}
      />

      <div
        className="absolute bottom-[14%] left-[6%] h-[280px] w-[280px] rounded-full blur-[90px]"
        style={{
          background: d,
          animation: "gc-orb-float 24s ease-in-out infinite reverse",
        }}
      />

      <style jsx global>{`
        @keyframes gc-orb-float {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.68;
          }

          50% {
            transform: translate3d(22px, -26px, 0) scale(1.08);
            opacity: 1;
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.68;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(AmbientOrbs);