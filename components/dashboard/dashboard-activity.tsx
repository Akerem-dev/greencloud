"use client";

import { memo } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Droplets, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardActivityItem = {
  id?: string;
  title?: string;
  description?: string;
  time?: string;
  status?: "Completed" | "Manual" | "Waiting" | "Skipped" | "Info" | string;
};

type DashboardActivityProps = {
  items?: DashboardActivityItem[];
  limit?: number;
};

type Tone = "live" | "safe" | "pending" | "warning";

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

function statusTone(status: string): Tone {
  const normalized = status.toLowerCase();

  if (normalized.includes("completed") || normalized.includes("handled")) {
    return "live";
  }

  if (
    normalized.includes("manual") ||
    normalized.includes("safe") ||
    normalized.includes("protected") ||
    normalized.includes("dry-run")
  ) {
    return "safe";
  }

  if (
    normalized.includes("waiting") ||
    normalized.includes("warning") ||
    normalized.includes("risk") ||
    normalized.includes("sensor")
  ) {
    return "warning";
  }

  return "pending";
}

function statusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("completed")) return CheckCircle2;
  if (normalized.includes("manual")) return Droplets;
  if (normalized.includes("waiting")) return Clock3;

  return Info;
}

function createStableFallbackKey(item: DashboardActivityItem, index: number) {
  const titlePart = item.title
    ? item.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")
    : "workspace-event";

  const timePart = item.time
    ? item.time.toLowerCase().replace(/[^a-z0-9]+/gi, "-")
    : "now";

  return `activity-${titlePart}-${timePart}-${index}`;
}

function DashboardActivity({
  items = [],
  limit = 5,
}: DashboardActivityProps) {
  const visibleItems = items.slice(0, limit);

  if (!visibleItems.length) {
    return (
      <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
        <p className="text-base font-semibold text-[var(--gc-text)]">
          No activity yet.
        </p>

        <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
          Manual irrigation, device updates, telemetry packets and threshold
          events will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="gc-scrollbar max-h-[520px] space-y-3 overflow-y-auto pr-2">
        {visibleItems.map((item, index) => {
          const status = item.status ?? "Completed";
          const safeKey = item.id ?? createStableFallbackKey(item, index);
          const Icon = statusIcon(status);
          const tone = statusTone(status);

          return (
            <article
              key={safeKey}
              className="min-w-0 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5 transition hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.045]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                    toneClass(tone),
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="min-w-0 break-words text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                      {item.title ?? "Workspace event"}
                    </h4>

                    <span
                      className={cn(
                        "inline-flex max-w-full shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        toneClass(tone),
                      )}
                    >
                      <span className="truncate">{status}</span>
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                    {item.description ?? "A workspace action was recorded."}
                  </p>

                  <p className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                    <Clock3 className="h-3.5 w-3.5" />
                    {item.time ?? "now"}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Link
        href="/activity"
        className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm transition-transform hover:scale-[1.02]"
      >
        Full stream
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default memo(DashboardActivity);