"use client";

import {
  Activity,
  Droplets,
  Gauge,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/shared/glass-card";
import { cn } from "@/lib/utils";

type OverviewStatLike = {
  label?: string;
  value?: string | number;
  detail?: string;
  tone?: "live" | "safe" | "pending" | "warning";
};

type DashboardStatsProps = {
  items?: OverviewStatLike[];
  [key: string]: unknown;
};

const FALLBACK_STATS: OverviewStatLike[] = [
  {
    label: "Live moisture",
    value: "Waiting",
    detail: "ESP32 telemetry appears here after Firebase receives live soil data.",
    tone: "pending",
  },
  {
    label: "Command layer",
    value: "Ready",
    detail: "Irrigation commands can be written safely to the Firebase path.",
    tone: "live",
  },
  {
    label: "Pump safety",
    value: "Locked",
    detail: "Relay output stays protected while safe-mode is active.",
    tone: "safe",
  },
  {
    label: "System health",
    value: "UID",
    detail: "Each signed-in user has a private GreenCloud workspace.",
    tone: "safe",
  },
];

const icons: LucideIcon[] = [Droplets, Activity, Gauge, ShieldCheck];

function toneClass(tone: OverviewStatLike["tone"]) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_12%,transparent)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]";
}

export default function DashboardStats({
  items = FALLBACK_STATS,
}: DashboardStatsProps) {
  const safeItems = items.length ? items : FALLBACK_STATS;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {safeItems.map((item, index) => {
        const Icon = icons[index % icons.length];
        const tone = item.tone ?? "pending";

        return (
          <GlassCard
            key={`${item.label ?? "metric"}-${item.value ?? index}`}
            className={cn("min-w-0 overflow-hidden border", toneClass(tone))}
          >
            <div className="h-[2px] w-full bg-[linear-gradient(90deg,var(--gc-accent),var(--gc-accent-2),var(--gc-warn))]" />

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                  {item.label ?? "Metric"}
                </p>

                <div className="shrink-0 text-[var(--gc-accent-2)]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.2rem,4vw,3.5rem)] font-semibold leading-none tracking-[-0.07em] text-[var(--gc-text)]">
                {item.value ?? "—"}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                {item.detail ?? "Live workspace signal remains readable."}
              </p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}