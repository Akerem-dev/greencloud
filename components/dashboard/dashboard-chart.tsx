"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Droplets, Gauge, TrendingUp } from "lucide-react";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type DashboardChartProps = {
  values?: number[];
  threshold?: number;
  title?: string;
  subtitle?: string;
};

type Tone = "live" | "safe" | "warning" | "pending";

const fallbackValues = [
  42, 46, 44, 48, 51, 43, 39, 41, 45, 49, 52, 50, 48, 47, 49, 51, 52,
];

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function StatBox({
  label,
  value,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string;
  icon: typeof Droplets;
  tone?: Tone;
}) {
  return (
    <div className={cn("rounded-[20px] border p-4", toneClass(tone))}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] opacity-75">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0" />
      </div>

      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.05em]">
        {value}
      </p>
    </div>
  );
}

function DashboardChart({
  values = fallbackValues,
  threshold = 35,
  title = "Moisture rhythm",
  subtitle = "Live soil history with dry-risk threshold context.",
}: DashboardChartProps) {
  const safeValues = useMemo(() => {
    const source = values.length ? values : fallbackValues;

    return source.map((value) =>
      typeof value === "number" && Number.isFinite(value) ? clamp(value) : 0,
    );
  }, [values]);

  const safeThreshold = clamp(threshold);

  const { minimum, maximum, average, riskCount } = useMemo(() => {
    const total = safeValues.reduce((sum, value) => sum + value, 0);

    return {
      minimum: Math.min(...safeValues),
      maximum: Math.max(...safeValues),
      average: Math.round(total / safeValues.length),
      riskCount: safeValues.filter((value) => value <= safeThreshold).length,
    };
  }, [safeValues, safeThreshold]);

  return (
    <GlassCard className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionBadge>Telemetry rhythm</SectionBadge>

          <h3 className="mt-4 text-[clamp(2rem,3vw,3.3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
            {title}
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--gc-soft)]">
            {subtitle} The dashed threshold line marks where irrigation risk
            begins.
          </p>
        </div>

        <div className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-2 text-xs text-[var(--gc-soft)]">
          Last {safeValues.length} cycles
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-4">
        <StatBox
          label="Average"
          value={`${average}%`}
          icon={Activity}
          tone="safe"
        />

        <StatBox
          label="Lowest"
          value={`${minimum}%`}
          icon={Droplets}
          tone={minimum <= safeThreshold ? "warning" : "pending"}
        />

        <StatBox
          label="Highest"
          value={`${maximum}%`}
          icon={TrendingUp}
          tone="live"
        />

        <StatBox
          label="Risk hits"
          value={String(riskCount)}
          icon={Gauge}
          tone={riskCount > 0 ? "warning" : "safe"}
        />
      </div>

      <div className="relative mt-8 h-[320px] overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(214,205,112,0.10),transparent_44%)]" />

        <div
          className="absolute left-5 right-5 z-20 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_72%,transparent)]"
          style={{ bottom: `${safeThreshold}%` }}
        >
          <span className="absolute -top-4 left-0 rounded-full border border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-warn)] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
            Threshold {safeThreshold}%
          </span>
        </div>

        <div className="absolute bottom-5 left-5 right-5 top-8 z-10 flex items-end gap-2">
          {safeValues.map((value, index) => {
            const height = Math.max(8, value);
            const isRisk = value <= safeThreshold;

            return (
              <motion.div
                key={`bar-${index}-${value}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}%`, opacity: 1 }}
                transition={{
                  duration: 0.75,
                  delay: index * 0.035,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "group relative flex-1 rounded-t-[18px] shadow-[0_0_22px_var(--gc-glow)] transition-all hover:brightness-110",
                  isRisk
                    ? "bg-[linear-gradient(180deg,var(--gc-warn),color-mix(in_srgb,var(--gc-warn)_55%,black))]"
                    : "bg-[linear-gradient(180deg,var(--gc-accent-2),var(--gc-accent),color-mix(in_srgb,var(--gc-accent)_45%,black))]",
                )}
              >
                <div className="absolute inset-x-0 top-0 h-8 rounded-t-[18px] bg-white/20 blur-[7px]" />

                <div className="pointer-events-none absolute -top-12 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#111611] px-3 py-2 text-xs font-medium text-[var(--gc-text)] shadow-[0_12px_30px_rgba(0,0,0,0.32)] group-hover:block">
                  {value}% moisture
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          `${minimum}% lowest`,
          `${average}% average`,
          `${maximum}% highest`,
          `${safeThreshold}% threshold`,
        ].map((text) => (
          <div
            key={text}
            className="rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-3 text-sm text-[var(--gc-soft)]"
          >
            {text}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default memo(DashboardChart);