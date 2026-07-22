"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cpu,
  Droplets,
  Gauge,
  Radio,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  type ActivityItem,
  useAppState,
} from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type EventKind = "telemetry" | "command" | "safety" | "sync" | "warning" | "info";

type EventVisual = {
  label: string;
  icon: LucideIcon;
  className: string;
};

function activityText(item: ActivityItem) {
  return `${item.title} ${item.description} ${item.status}`.toLowerCase();
}

function classifyEvent(item: ActivityItem): EventKind {
  const text = activityText(item);

  if (
    text.includes("warning") ||
    text.includes("risk") ||
    text.includes("dry") ||
    text.includes("blocked") ||
    text.includes("alert")
  ) {
    return "warning";
  }

  if (
    text.includes("watering") ||
    text.includes("irrigation") ||
    text.includes("pump") ||
    text.includes("command")
  ) {
    return "command";
  }

  if (
    text.includes("protected") ||
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("dry-run")
  ) {
    return "safety";
  }

  if (
    text.includes("firebase") ||
    text.includes("workspace") ||
    text.includes("sync") ||
    text.includes("uid")
  ) {
    return "sync";
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("soil") ||
    text.includes("sensor") ||
    text.includes("raw")
  ) {
    return "telemetry";
  }

  return "info";
}

function eventVisual(kind: EventKind): EventVisual {
  if (kind === "telemetry") {
    return {
      label: "Telemetry",
      icon: Gauge,
      className:
        "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-accent-2)]",
    };
  }

  if (kind === "command") {
    return {
      label: "Command",
      icon: Droplets,
      className:
        "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-accent-2)]",
    };
  }

  if (kind === "safety") {
    return {
      label: "Protection",
      icon: ShieldCheck,
      className:
        "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] text-[var(--gc-text)]",
    };
  }

  if (kind === "sync") {
    return {
      label: "Workspace",
      icon: Radio,
      className:
        "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_8%,transparent)] text-[var(--gc-text)]",
    };
  }

  if (kind === "warning") {
    return {
      label: "Attention",
      icon: AlertTriangle,
      className:
        "border-[color-mix(in_srgb,var(--gc-warn)_40%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]",
    };
  }

  return {
    label: "System",
    icon: Activity,
    className:
      "border-[color-mix(in_srgb,var(--gc-border)_84%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]",
  };
}

function statusLabel(status: ActivityItem["status"]) {
  if (status === "Completed") return "Completed";
  if (status === "Waiting") return "Waiting";
  if (status === "Manual") return "Manual";
  if (status === "Skipped") return "Skipped";
  return "Info";
}

export default function OperationsTimelineDeck() {
  const {
    activityFeed,
    devices,
    selectedDevice,
    notifications,
    refreshTelemetry,
  } = useAppState();

  const [open, setOpen] = useState(true);

  const hasRealDevice = devices.some((device) => device.id === selectedDevice.id);

  const selectedDeviceEvents = useMemo(() => {
    const matching = activityFeed.filter(
      (item) => !item.deviceId || item.deviceId === selectedDevice.id,
    );

    return (matching.length > 0 ? matching : activityFeed).slice(0, 6);
  }, [activityFeed, selectedDevice.id]);

  const commandCount = useMemo(
    () => activityFeed.filter((item) => classifyEvent(item) === "command").length,
    [activityFeed],
  );

  const warningCount = useMemo(
    () => activityFeed.filter((item) => classifyEvent(item) === "warning").length,
    [activityFeed],
  );

  const unreadAlerts = notifications.filter((item) => !item.read).length;
  const latestEvent = selectedDeviceEvents[0];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[95] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)] px-5 py-3 text-left shadow-[0_22px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl transition hover:-translate-y-0.5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-accent-2)]">
          <Activity className="h-5 w-5" />
        </span>

        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
            Activity rail
          </span>
          <span className="block truncate text-sm font-semibold text-[var(--gc-text)]">
            {latestEvent?.title ?? "No events yet"}
          </span>
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--gc-muted)]" />
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 top-4 z-[95] flex w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_88%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_91%,black)] shadow-[0_30px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:bottom-5 sm:right-5 sm:top-5">
      <div className="border-b border-[color-mix(in_srgb,var(--gc-border)_74%,transparent)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gc-accent-2)]">
                Live event rail
              </span>
              <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_78%,transparent)] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gc-muted)]">
                {activityFeed.length} events
              </span>
            </div>

            <h2 className="mt-4 truncate text-3xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
              {hasRealDevice ? selectedDevice.name : "Operations timeline"}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
              {hasRealDevice
                ? `${selectedDevice.place} · recent telemetry, commands and safety decisions.`
                : "Pair an ESP32 to begin a device-specific event stream."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.035] text-[var(--gc-muted)] transition hover:text-[var(--gc-text)]"
            aria-label="Collapse activity operations timeline"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)] p-3">
            <Droplets className="h-4 w-4 text-[var(--gc-accent-2)]" />
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              {commandCount}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gc-muted)]">
              Commands
            </p>
          </div>

          <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_8%,transparent)] p-3">
            <AlertTriangle className="h-4 w-4 text-[var(--gc-warn)]" />
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              {warningCount}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gc-muted)]">
              Attention
            </p>
          </div>

          <div className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_8%,transparent)] p-3">
            <BellRing className="h-4 w-4 text-[var(--gc-accent-2)]" />
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              {unreadAlerts}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gc-muted)]">
              Unread
            </p>
          </div>
        </div>
      </div>

      <div className="gc-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {selectedDeviceEvents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_82%,transparent)] bg-white/[0.02] p-6 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-[var(--gc-muted)]" />
            <p className="mt-4 text-xl font-semibold text-[var(--gc-text)]">
              No operations yet.
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
              Telemetry refreshes, safety checks and protected commands will appear here.
            </p>
          </div>
        ) : (
          <div className="relative space-y-4 before:absolute before:bottom-6 before:left-[21px] before:top-6 before:w-px before:bg-[color-mix(in_srgb,var(--gc-border)_68%,transparent)]">
            {selectedDeviceEvents.map((item) => {
              const visual = eventVisual(classifyEvent(item));
              const Icon = visual.icon;

              return (
                <article
                  key={item.id}
                  className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_78%,transparent)] bg-white/[0.025] p-4 transition hover:bg-white/[0.04]"
                >
                  <div
                    className={cn(
                      "relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border",
                      visual.className,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_76%,transparent)] bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gc-muted)]">
                        {visual.label}
                      </span>
                      <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_76%,transparent)] bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gc-soft)]">
                        {statusLabel(item.status)}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-base font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
                      {item.description}
                    </p>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gc-muted)]">
                      {item.time}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--gc-border)_74%,transparent)] p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={!hasRealDevice}
            onClick={() => refreshTelemetry(selectedDevice.id)}
            className="premium-btn flex min-w-0 items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span className="truncate">Refresh</span>
          </button>

          <Link
            href="/dashboard"
            className="premium-btn-secondary flex min-w-0 items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-xs"
          >
            <Cpu className="h-4 w-4 shrink-0" />
            <span className="truncate">Dashboard</span>
          </Link>

          <Link
            href="/devices"
            className="premium-btn-secondary flex min-w-0 items-center justify-center gap-2 rounded-[18px] px-3 py-3 text-xs"
          >
            <Radio className="h-4 w-4 shrink-0" />
            <span className="truncate">Devices</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
