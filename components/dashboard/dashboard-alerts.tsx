"use client";

import { Bell, CheckCircle2, ShieldAlert } from "lucide-react";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type AlertLevel = "Warning" | "Notice" | "Info" | string;

type AlertItemLike = {
  id?: string;
  title?: string;
  description?: string;
  body?: string;
  level?: AlertLevel;
  read?: boolean;
};

type DashboardAlertsProps = {
  items?: AlertItemLike[];
  onMarkAllRead?: () => void;
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

function alertTone(level: AlertLevel): Tone {
  const normalized = level.toLowerCase();

  if (normalized.includes("warning") || normalized.includes("risk")) {
    return "warning";
  }

  if (normalized.includes("notice") || normalized.includes("alert")) {
    return "safe";
  }

  if (normalized.includes("info") || normalized.includes("ok")) {
    return "live";
  }

  return "pending";
}

function AlertIcon({ level }: { level: AlertLevel }) {
  const normalized = level.toLowerCase();

  if (normalized.includes("warning") || normalized.includes("risk")) {
    return <ShieldAlert className="h-4 w-4" />;
  }

  if (normalized.includes("notice") || normalized.includes("alert")) {
    return <Bell className="h-4 w-4" />;
  }

  return <CheckCircle2 className="h-4 w-4" />;
}

function createAlertKey(item: AlertItemLike, index: number) {
  if (item.id) return item.id;

  const titlePart = item.title
    ? item.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")
    : "workspace-notice";

  const levelPart = item.level
    ? item.level.toLowerCase().replace(/[^a-z0-9]+/gi, "-")
    : "info";

  return `alert-${titlePart}-${levelPart}-${index}`;
}

export default function DashboardAlerts({
  items = [],
  onMarkAllRead,
}: DashboardAlertsProps) {
  const safeItems: AlertItemLike[] = items.length
    ? items
    : [
        {
          id: "alert-system-ready",
          title: "System ready",
          description: "GreenCloud workspace loaded successfully.",
          level: "Info",
          read: true,
        },
      ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SectionBadge>Alerts</SectionBadge>

          <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
            Status feed
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--gc-soft)]">
            Priority warnings, sensor notices and workspace messages stay
            grouped in one clean feed.
          </p>
        </div>

        {onMarkAllRead ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="premium-btn-secondary shrink-0 rounded-full px-4 py-2 text-sm"
          >
            Mark read
          </button>
        ) : null}
      </div>

      <div className="gc-scrollbar mt-6 max-h-[440px] space-y-4 overflow-y-auto pr-2">
        {safeItems.map((item, index) => {
          const level = item.level ?? "Info";
          const message =
            item.description ?? item.body ?? "A monitoring update is available.";
          const tone = alertTone(level);

          return (
            <article
              key={createAlertKey(item, index)}
              className="min-w-0 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5 transition hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.045]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                    toneClass(tone),
                  )}
                >
                  <AlertIcon level={level} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                        {item.title ?? "Workspace notice"}
                      </h4>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {item.read === false ? (
                        <span className="rounded-full bg-[var(--gc-accent)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#111708]">
                          New
                        </span>
                      ) : null}

                      <span
                        className={cn(
                          "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                          toneClass(tone),
                        )}
                      >
                        <span className="truncate">{level}</span>
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                    {message}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </GlassCard>
  );
}