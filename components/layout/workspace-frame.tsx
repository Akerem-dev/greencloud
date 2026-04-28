"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

export { default as GlassCard } from "@/components/shared/glass-card";
export { default as SectionBadge } from "@/components/shared/section-badge";

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

type WorkspacePage =
  | "landing"
  | "dashboard"
  | "devices"
  | "activity"
  | "automation"
  | "settings";

type WorkspaceFrameProps = {
  activePage?: WorkspacePage;
  title: string;
  subtitle: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

function getToneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function getStatusTone(status: string): Tone {
  const lower = status.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("completed") ||
    lower.includes("ready") ||
    lower.includes("active") ||
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("handled") ||
    lower.includes("seen")
  ) {
    return "live";
  }

  if (
    lower.includes("manual") ||
    lower.includes("safe") ||
    lower.includes("protected") ||
    lower.includes("guarded") ||
    lower.includes("locked") ||
    lower.includes("dry-run") ||
    lower.includes("dry run")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
  }

  if (
    lower.includes("sensor check") ||
    lower.includes("blocked") ||
    lower.includes("detected") ||
    lower.includes("low") ||
    lower.includes("empty") ||
    lower.includes("warning") ||
    lower.includes("risk")
  ) {
    return "warning";
  }

  if (
    lower.includes("waiting") ||
    lower.includes("idle") ||
    lower.includes("pending") ||
    lower.includes("syncing") ||
    lower.includes("none")
  ) {
    return "pending";
  }

  return "pending";
}

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked") return "Protected";
  if (lower === "none") return "No command";
  if (lower === "pending") return "Waiting";

  return value;
}

export function StatusPill({ status }: { status: string }) {
  const visibleStatus = displayStatus(status);

  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold",
        getToneClass(getStatusTone(visibleStatus)),
      )}
    >
      <span className="truncate">{visibleStatus}</span>
    </span>
  );
}

export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "pending",
  className,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : getToneClass(tone),
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
        ) : null}
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.9rem,3vw,3rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="h-[260px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />
          <div className="h-[360px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />
        </div>

        <div className="space-y-6">
          <div className="h-[240px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[240px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />
            <div className="h-[240px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />
          </div>

          <div className="h-[320px] animate-pulse rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceFrame({
  title,
  subtitle,
  children,
}: WorkspaceFrameProps) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
}