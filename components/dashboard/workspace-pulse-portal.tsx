"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Bell,
  ChevronRight,
  Cpu,
  Droplets,
  Leaf,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type PulseTone = "live" | "safe" | "warning" | "pending";

type PulseMetricProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: PulseTone;
};

function toneClass(tone: PulseTone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_8%,transparent)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_70%,transparent)] bg-black/15";
}

function PulseMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: PulseMetricProps) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[24px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] transition duration-300 hover:-translate-y-0.5",
        toneClass(tone),
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_42%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
            {label}
          </p>

          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
            <Icon className="h-4 w-4" />
          </span>
        </div>

        <p className="mt-4 truncate text-2xl font-semibold tracking-[-0.055em] text-[var(--gc-text)]">
          {value}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function clampPercent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 0;
}

export default function WorkspacePulsePortal() {
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const {
    devices,
    selectedDevice,
    activityFeed,
    unreadNotifications,
    automation,
    settings,
    refreshTelemetry,
  } = useAppState();

  useEffect(() => {
    let host: HTMLDivElement | null = null;

    const attach = () => {
      const dashboard = document.querySelector<HTMLElement>(".dashboard-page");
      if (!dashboard) return false;

      host = document.createElement("div");
      host.dataset.dashboardWorkspacePulse = "mounted";
      host.className = "dashboard-workspace-pulse-slot";
      dashboard.prepend(host);
      setPortalHost(host);
      return true;
    };

    if (attach()) {
      return () => {
        host?.remove();
      };
    }

    const observer = new MutationObserver(() => {
      if (attach()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      host?.remove();
    };
  }, []);

  const hasDevice = devices.length > 0;
  const onlineDevices = devices.filter((device) => device.status === "Online").length;
  const moisture = hasDevice ? clampPercent(selectedDevice.moisture) : 0;
  const signal = hasDevice ? clampPercent(selectedDevice.signal) : 0;
  const dryRisk = hasDevice && moisture <= automation.moistureThreshold;
  const protectionActive =
    !hasDevice || selectedDevice.safeMode !== false || selectedDevice.pumpEnabled !== true;

  const workspaceName =
    settings.workspaceName || settings.projectName || "GreenCloud workspace";
  const plantLabel =
    settings.mainPlantLabel || settings.plantLabel || selectedDevice.name || "Plant zone";

  const latestActivity = useMemo(() => {
    if (!hasDevice) return activityFeed[0];

    return (
      activityFeed.find((item) => item.deviceId === selectedDevice.id) ??
      activityFeed[0]
    );
  }, [activityFeed, hasDevice, selectedDevice.id]);

  if (!portalHost) return null;

  return createPortal(
    <section
      data-dashboard-workspace-pulse="live"
      className="premium-noise relative overflow-hidden rounded-[32px] border border-[color-mix(in_srgb,var(--gc-accent)_22%,var(--gc-border))] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-bg)_94%,black),color-mix(in_srgb,var(--gc-accent)_7%,var(--gc-bg))_52%,color-mix(in_srgb,var(--gc-accent-3)_8%,black))] p-5 shadow-[0_22px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.035)] sm:p-6 2xl:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_4%,color-mix(in_srgb,var(--gc-accent)_15%,transparent),transparent_32%),radial-gradient(circle_at_92%_88%,color-mix(in_srgb,var(--gc-accent-2)_12%,transparent),transparent_36%)]" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-accent-2)]">
                <Sparkles className="h-3.5 w-3.5" />
                Workspace pulse
              </span>

              <span
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                  hasDevice
                    ? "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] text-[var(--gc-text)]"
                    : "border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)] text-[var(--gc-text)]",
                )}
              >
                {hasDevice ? `${onlineDevices}/${devices.length} online` : "Pairing required"}
              </span>
            </div>

            <h2 className="mt-5 max-w-4xl text-[clamp(2rem,4vw,4.4rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--gc-text)]">
              {workspaceName}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
              {hasDevice
                ? `${selectedDevice.name} · ${selectedDevice.place || plantLabel}`
                : "Pair an ESP32 to unlock live moisture, signal and protected irrigation insight."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!hasDevice}
              onClick={() => refreshTelemetry(selectedDevice.id)}
              className="premium-btn-secondary inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh pulse
            </button>

            <Link
              href="/devices"
              className="premium-btn inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Devices
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <PulseMetric
            label="Fleet"
            value={hasDevice ? `${onlineDevices} live` : "No device"}
            detail={
              hasDevice
                ? `${devices.length} paired controller${devices.length === 1 ? "" : "s"}.`
                : "Secure pairing is the next step."
            }
            icon={Cpu}
            tone={hasDevice && onlineDevices > 0 ? "live" : "pending"}
          />

          <PulseMetric
            label="Soil moisture"
            value={hasDevice ? `${moisture}%` : "Waiting"}
            detail={
              hasDevice
                ? `Dry threshold ${automation.moistureThreshold}% · ${dryRisk ? "attention needed" : "within range"}.`
                : "Live moisture appears after pairing."
            }
            icon={Droplets}
            tone={dryRisk ? "warning" : hasDevice ? "live" : "pending"}
          />

          <PulseMetric
            label="Connectivity"
            value={hasDevice ? `${signal}%` : "Offline"}
            detail={
              hasDevice
                ? `${selectedDevice.status} · ${selectedDevice.updatedAt || "awaiting update"}.`
                : "No private telemetry stream yet."
            }
            icon={hasDevice && signal > 0 ? Wifi : Radio}
            tone={hasDevice && signal > 0 ? "live" : "pending"}
          />

          <PulseMetric
            label="Protection"
            value={protectionActive ? "Guarded" : "Pump live"}
            detail={
              protectionActive
                ? "Safe mode or protected output is active."
                : `${automation.mode} automation can control output.`
            }
            icon={protectionActive ? ShieldCheck : Zap}
            tone={protectionActive ? "safe" : "warning"}
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-start gap-4 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_68%,transparent)] bg-black/15 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)] text-[var(--gc-accent-2)]">
              {latestActivity ? <Activity className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                Latest workspace signal
              </p>
              <p className="mt-2 truncate text-base font-semibold text-[var(--gc-text)]">
                {latestActivity?.title ?? "Workspace ready"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
                {latestActivity?.description ??
                  "Protected device activity and moisture events will appear here."}
              </p>
            </div>
          </div>

          <div className="grid min-w-[220px] grid-cols-2 gap-3">
            <Link
              href="/activity"
              className="premium-tab flex min-h-16 flex-col justify-center rounded-[22px] px-4 py-3"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-[var(--gc-text)]">
                <Activity className="h-4 w-4 text-[var(--gc-accent-2)]" />
                Activity
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gc-muted)]">
                Full history
              </span>
            </Link>

            <Link
              href="/activity"
              className="premium-tab flex min-h-16 flex-col justify-center rounded-[22px] px-4 py-3"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-[var(--gc-text)]">
                <Bell className="h-4 w-4 text-[var(--gc-accent-2)]" />
                Alerts
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--gc-muted)]">
                {unreadNotifications} unread
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>,
    portalHost,
  );
}
