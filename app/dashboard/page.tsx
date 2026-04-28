"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  Bell,
  ChevronRight,
  CloudRain,
  Cpu,
  Droplets,
  Gauge,
  Leaf,
  Lock,
  Monitor,
  Power,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  ToggleLeft,
  Waves,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import {
  type ActivityStatus,
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

type DashboardDevice = Device & {
  rawSoil?: number;
  soilVoltage?: number;

  temperature?: number;
  pressure?: number;

  lastSeenMs?: number;
  lastCommand?: string;
  lastCommandStatus?: string;

  relayState?: string;
  pumpState?: string;

  waterLevel?: number;
  waterLevelStatus?: string;

  rainDetected?: boolean;
  rainStatus?: string;

  buttonStatus?: string;

  safeMode?: boolean;
  pumpEnabled?: boolean;

  oledStatus?: string;
  firmware?: string;
};

function rawLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "—";
}

function voltageLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)}V`
    : "—";
}

function temperatureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)}°C`
    : "—";
}

function pressureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)} hPa`
    : "—";
}

function getSensorStatus(device: DashboardDevice) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Pending";
}

function getLastSeenLabel(device: DashboardDevice) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Awaiting signal";
  }

  const now = Date.now();
  const value = device.lastSeenMs;

  if (value > 1_000_000_000_000) {
    const diffSeconds = Math.max(0, Math.round((now - value) / 1000));

    if (diffSeconds < 10) return "Live signal";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    const diffMinutes = Math.round(diffSeconds / 60);
    return `${diffMinutes}m ago`;
  }

  return `${Math.max(1, Math.round(value / 1000))}s runtime`;
}

function hasTelemetry(device: DashboardDevice) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function displayStatus(status: string) {
  const lower = status.toLowerCase();

  if (lower === "dry-run" || lower.includes("dry-run")) return "Protected";
  if (lower === "pending" || lower.includes("pending")) return "Awaiting data";
  if (lower === "sensor check") return "Calibrating";
  if (lower === "no signal") return "No signal";
  if (lower === "none") return "Ready";
  if (lower === "handled") return "Completed";
  if (lower === "blocked") return "Blocked";
  if (lower === "locked") return "Protected";
  if (lower === "safe") return "Protected";
  if (lower === "syncing") return "Syncing";
  if (lower === "idle") return "Standby";
  if (lower === "online") return "Online";
  if (lower === "offline") return "Offline";
  if (lower === "active") return "Active";
  if (lower === "ready") return "Ready";
  if (lower === "clear") return "Clear";
  if (lower === "ok") return "Safe";
  if (lower === "low") return "Low";
  if (lower === "empty") return "Empty";
  if (lower === "detected") return "Detected";

  return status;
}

function statusTone(status: string): Tone {
  const lower = status.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("completed") ||
    lower.includes("healthy") ||
    lower.includes("clear") ||
    lower.includes("active") ||
    lower.includes("ok") ||
    lower.includes("ready") ||
    lower.includes("handled") ||
    lower.includes("safe")
  ) {
    return "live";
  }

  if (
    lower.includes("manual") ||
    lower.includes("dry-run") ||
    lower.includes("locked") ||
    lower.includes("protected")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
  }

  if (
    lower.includes("waiting") ||
    lower.includes("idle") ||
    lower.includes("pending") ||
    lower.includes("none") ||
    lower.includes("syncing") ||
    lower.includes("awaiting")
  ) {
    return "pending";
  }

  return "warning";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)]";
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

function StatusPill({
  status,
}: {
  status: ActivityStatus | Device["status"] | string;
}) {
  const visibleStatus = displayStatus(String(status));

  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 truncate rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(statusTone(status)),
      )}
    >
      {visibleStatus}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <AppShell
      title="GreenCloud Control Center"
      subtitle="Preparing your private irrigation workspace."
    >
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035]" />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] xl:col-span-2" />
          <div className="h-80 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035]" />
        </div>
      </div>
    </AppShell>
  );
}
function HeroStatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "live",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[28px] border px-5 py-5",
        tone === "warning"
          ? "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)]"
          : tone === "safe"
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]"
            : tone === "offline"
              ? "border-[color-mix(in_srgb,var(--gc-danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_8%,transparent)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          {label}
        </p>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_90%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 truncate text-4xl font-semibold leading-none tracking-[-0.07em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
        {detail}
      </p>
    </div>
  );
}
function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "live",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[26px] border p-5 transition hover:translate-y-[-1px]",
        tone === "warning"
          ? "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)]"
          : tone === "safe"
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]"
            : tone === "offline"
              ? "border-[color-mix(in_srgb,var(--gc-danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_8%,transparent)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
          {label}
        </p>

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border bg-black/18",
            tone === "warning"
              ? "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] text-[var(--gc-warn)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_90%,transparent)] text-[var(--gc-accent-2)]",
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>

      <p className="mt-5 break-words text-[clamp(2rem,3.2vw,3.5rem)] font-semibold leading-none tracking-[-0.07em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-3 text-sm leading-6 text-[var(--gc-soft)]">{detail}</p>
    </div>
  );
}

function HardwareTile({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[24px] border p-5 transition hover:translate-y-[-1px]",
        tone === "live"
          ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]"
          : tone === "safe"
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]"
            : tone === "warning"
              ? "border-[color-mix(in_srgb,var(--gc-warn)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)]"
              : tone === "offline"
                ? "border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_8%,transparent)]"
                : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
            {title}
          </p>

          <h4 className="mt-3 break-words text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
            {value}
          </h4>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--gc-soft)]">{detail}</p>
    </div>
  );
}

function QuickAction({
  title,
  detail,
  icon: Icon,
  onClick,
  href,
  primary = false,
}: {
  title: string;
  detail: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
}) {
  const className = cn(
    "group flex min-h-[112px] items-center justify-between gap-4 rounded-[26px] border p-5 text-left transition",
    primary
      ? "border-[color-mix(in_srgb,var(--gc-accent)_40%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_28%,transparent),color-mix(in_srgb,var(--gc-accent-2)_16%,transparent))] text-[var(--gc-text)] shadow-[0_24px_70px_var(--gc-glow)] hover:shadow-[0_28px_86px_var(--gc-glow-strong)]"
      : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] text-[var(--gc-text)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.05]",
  );

  const content = (
    <>
      <span className="min-w-0">
        <span className="block text-lg font-semibold tracking-[-0.04em]">
          {title}
        </span>

        <span className="mt-2 block text-sm leading-6 text-[var(--gc-soft)]">
          {detail}
        </span>
      </span>

      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition group-hover:scale-[1.03]",
          primary
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_18%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_28px_var(--gc-glow)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_90%,transparent)] bg-black/18 text-[var(--gc-accent-2)]",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function MoistureChart({
  values,
  threshold,
  telemetryReady,
}: {
  values: number[];
  threshold: number;
  telemetryReady: boolean;
}) {
  const latestValue = values[values.length - 1] ?? 0;

  return (
    <div className="relative mt-5 h-[240px] overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_78%,black)] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--gc-accent)_12%,transparent),transparent_32%),radial-gradient(circle_at_80%_88%,color-mix(in_srgb,var(--gc-accent-3)_10%,transparent),transparent_34%)]" />

      <div
        className="absolute left-5 right-5 z-10 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_62%,transparent)]"
        style={{ bottom: `${Math.min(190, Math.max(44, threshold * 1.75))}px` }}
      />

      <span
        className="absolute left-5 z-20 rounded-full border border-[color-mix(in_srgb,var(--gc-warn)_42%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_84%,black)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--gc-warn)]"
        style={{
          bottom: `${Math.min(198, Math.max(54, threshold * 1.75 + 10))}px`,
        }}
      >
        Limit {threshold}%
      </span>

      <div className="relative z-10 flex h-full items-end gap-3 pt-12">
        {values.map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="flex h-full flex-1 items-end"
            aria-label={`Moisture snapshot ${index + 1}: ${value}%`}
          >
            <div
              className="w-full rounded-t-[18px] bg-gradient-to-t from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_24px_var(--gc-glow)]"
              style={{
                height: `${Math.max(6, Math.min(190, value * 1.8))}px`,
                opacity: telemetryReady ? 1 : 0.38,
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_84%,black)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
          Current
        </p>

        <p className="mt-2 text-xl font-semibold text-[var(--gc-text)]">
          {telemetryReady ? `${latestValue}%` : "Awaiting"}
        </p>
      </div>
    </div>
  );
}

function DeviceCard({
  device,
  active,
  onSelect,
}: {
  device: Device;
  active: boolean;
  onSelect: () => void;
}) {
  const hardware = device as DashboardDevice;
  const telemetryReady = hasTelemetry(hardware);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-w-0 rounded-[26px] border p-5 text-left transition",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] shadow-[0_18px_52px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.05]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
            {device.name}
          </p>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {device.place}
          </p>
        </div>

        <StatusPill status={device.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
            Moisture
          </p>

          <p className="mt-1 text-xl font-semibold text-[var(--gc-text)]">
            {telemetryReady ? `${device.moisture}%` : "—"}
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
            RAW
          </p>

          <p className="mt-1 text-xl font-semibold text-[var(--gc-text)]">
            {telemetryReady ? rawLabel(hardware.rawSoil) : "—"}
          </p>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
            Signal
          </p>

          <p className="mt-1 text-xl font-semibold text-[var(--gc-text)]">
            {telemetryReady ? `${device.signal}%` : "—"}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const {
    devices,
    selectedDevice,
    filteredActivity,
    notifications,
    unreadNotifications,
    automation,
    settings,
    isBootLoading,
    selectDevice,
    openNotifications,
    startIrrigation,
    refreshTelemetry,
    simulateThresholdEvent,
  } = useAppState();

  const selectedHardware = selectedDevice as DashboardDevice;
  const telemetryReady = hasTelemetry(selectedHardware);

  const onlineDevices = devices.filter(
    (device) => device.status === "Online",
  ).length;

  const recentItems = filteredActivity.slice(0, 5);
  const unreadAlerts = notifications.filter((item) => !item.read).length;

  const safeModeActive = selectedHardware.safeMode ?? true;
  const pumpEnabled = selectedHardware.pumpEnabled ?? false;

  const relayState =
    selectedHardware.relayState ??
    (safeModeActive || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    selectedHardware.pumpState ??
    (safeModeActive || !pumpEnabled ? "Dry-run" : "Ready");

  const lastCommandStatus = selectedHardware.lastCommandStatus ?? "None";

  const sensorStatus = getSensorStatus(selectedHardware);
  const sensorFault =
    sensorStatus.toLowerCase().includes("sensor check") ||
    sensorStatus.toLowerCase().includes("no signal") ||
    selectedDevice.status === "Offline";

  const moistureValue = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Awaiting";
  const rawValue = telemetryReady ? rawLabel(selectedHardware.rawSoil) : "—";
  const signalValue = telemetryReady
    ? `${selectedDevice.signal}%`
    : "Awaiting";
  const voltageValue = telemetryReady
    ? voltageLabel(selectedHardware.soilVoltage)
    : "—";

  const temperatureValue = telemetryReady
    ? temperatureLabel(selectedHardware.temperature)
    : "—";

  const pressureValue = telemetryReady
    ? pressureLabel(selectedHardware.pressure)
    : "—";

  const bmeReady =
    typeof selectedHardware.temperature === "number" ||
    typeof selectedHardware.pressure === "number";

  const chartValues = useMemo(() => {
    if (!telemetryReady) {
      return Array.from({ length: 12 }, () => 0);
    }

    return Array.from({ length: 12 }, () => selectedDevice.moisture);
  }, [selectedDevice.moisture, telemetryReady]);

  const displayedSensorStatus = displayStatus(sensorStatus);
  const displayedRelayState = displayStatus(relayState);
  const displayedPumpState = displayStatus(pumpState);
  const displayedWaterStatus = displayStatus(
    selectedHardware.waterLevelStatus ?? "Pending",
  );
  const displayedRainStatus = displayStatus(
    selectedHardware.rainStatus ?? "Pending",
  );
  const displayedButtonStatus = displayStatus(
    selectedHardware.buttonStatus ?? "Pending",
  );
  const displayedOledStatus = displayStatus(
    selectedHardware.oledStatus ?? "Pending",
  );

  const hardwareItems: Array<{
    title: string;
    value: string;
    detail: string;
    icon: LucideIcon;
    tone: Tone;
  }> = [
    {
      title: "Controller",
      value: displayStatus(selectedDevice.status),
      detail: `Private workspace active · ${getLastSeenLabel(selectedHardware)}`,
      icon: Cpu,
      tone:
        selectedDevice.status === "Online"
          ? "live"
          : selectedDevice.status === "Offline"
            ? "offline"
            : "pending",
    },
    {
      title: "Soil sensor",
      value: displayedSensorStatus,
      detail: telemetryReady
        ? `Live reading · RAW ${rawValue} · ${voltageValue}`
        : "Awaiting first soil moisture reading.",
      icon: Leaf,
      tone: sensorFault
        ? "warning"
        : sensorStatus === "Pending"
          ? "pending"
          : "live",
    },
    {
      title: "Environment",
      value: bmeReady ? "Live" : "Awaiting data",
      detail: bmeReady
        ? `Temperature ${temperatureValue} · Pressure ${pressureValue}`
        : "Temperature and pressure sensor not connected yet.",
      icon: Thermometer,
      tone: bmeReady ? "live" : "pending",
    },
    {
      title: "Display",
      value: displayedOledStatus,
      detail: "OLED pairing display is reporting from the device.",
      icon: Monitor,
      tone:
        selectedHardware.oledStatus === "Active"
          ? "live"
          : selectedHardware.oledStatus === "Off"
            ? "offline"
            : "pending",
    },
    {
      title: "Relay",
      value: displayedRelayState,
      detail: safeModeActive
        ? "Pump relay is locked by protection mode."
        : pumpEnabled
          ? "Relay output is available for irrigation."
          : "Relay remains locked until pump output is enabled.",
      icon: Lock,
      tone: safeModeActive || !pumpEnabled ? "safe" : "warning",
    },
    {
      title: "Pump",
      value: displayedPumpState,
      detail: pumpEnabled
        ? "Pump output can run after final wiring approval."
        : "Watering commands are safely simulated.",
      icon: Power,
      tone: pumpEnabled ? "warning" : "safe",
    },
    {
      title: "Water level",
      value: displayedWaterStatus,
      detail: "Tank protection status from the float sensor.",
      icon: Waves,
      tone:
        selectedHardware.waterLevelStatus === "OK"
          ? "live"
          : selectedHardware.waterLevelStatus === "Low" ||
              selectedHardware.waterLevelStatus === "Empty"
            ? "warning"
            : "pending",
    },
    {
      title: "Rain sensor",
      value: displayedRainStatus,
      detail: "Irrigation stays protected when rain is detected.",
      icon: CloudRain,
      tone:
        selectedHardware.rainStatus === "Clear"
          ? "live"
          : selectedHardware.rainStatus === "Detected"
            ? "warning"
            : "pending",
    },
    {
      title: "Manual button",
      value: displayedButtonStatus,
      detail: "Local device input for protected manual control.",
      icon: ToggleLeft,
      tone:
        selectedHardware.buttonStatus === "Ready" ||
        selectedHardware.buttonStatus === "Pressed"
          ? "live"
          : "pending",
    },
  ];

  if (isBootLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <AppShell
      title="GreenCloud Control Center"
      subtitle="Private irrigation workspace with live device telemetry and protected pump control."
    >
      <div className="dashboard-page w-full min-w-0 space-y-6">
        <GlassCard className="overflow-hidden p-0">
          <div className="grid gap-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr))]">
            <div className="relative p-6 sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,color-mix(in_srgb,var(--gc-accent)_14%,transparent),transparent_30%),radial-gradient(circle_at_92%_84%,color-mix(in_srgb,var(--gc-accent-3)_12%,transparent),transparent_32%)]" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <SectionBadge>Live workspace</SectionBadge>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill status={selectedDevice.status} />
                    <StatusPill
                      status={
                        safeModeActive || !pumpEnabled ? "Protected" : "Pump live"
                      }
                    />
                    <StatusPill status={lastCommandStatus} />
                  </div>
                </div>

                <div className="mt-7 grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
                  <div className="min-w-0">
                    <h2 className="max-w-[12ch] text-[clamp(3rem,5.2vw,6rem)] font-semibold leading-[0.88] tracking-[-0.09em] text-[var(--gc-text)]">
                      Irrigation control, protected and live.
                    </h2>

                    <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                      GreenCloud monitors your irrigation node in real time and
                      keeps pump control protected until hardware mode is
                      enabled.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <span className="premium-tab premium-tab-active max-w-full truncate rounded-full px-4 py-2 text-sm">
                        {selectedDevice.name}
                      </span>

                      <span className="premium-tab rounded-full px-4 py-2 text-sm">
                        {getLastSeenLabel(selectedHardware)}
                      </span>

                      <span className="premium-tab rounded-full px-4 py-2 text-sm">
                        {selectedHardware.firmware ?? "GreenCloud firmware"}
                      </span>
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
                    <HeroStatCard
                      label="Moisture"
                      value={moistureValue}
                      detail={
                        telemetryReady
                          ? "Live soil moisture."
                          : "Awaiting device telemetry."
                      }
                      icon={Droplets}
                      tone={
                        sensorFault
                          ? "warning"
                          : telemetryReady
                            ? "live"
                            : "pending"
                      }
                    />

                    <HeroStatCard
                      label="Sensor RAW"
                      value={rawValue}
                      detail={
                        telemetryReady
                          ? "Direct sensor reading."
                          : "Awaiting sensor packet."
                      }
                      icon={Gauge}
                      tone={
                        sensorFault
                          ? "warning"
                          : telemetryReady
                            ? "safe"
                            : "pending"
                      }
                    />

                    <HeroStatCard
                      label="Signal"
                      value={signalValue}
                      detail={
                        telemetryReady
                          ? "Device Wi-Fi strength."
                          : "Awaiting connection."
                      }
                      icon={Wifi}
                      tone={telemetryReady ? "live" : "pending"}
                    />

                    <HeroStatCard
                      label="Pump mode"
                      value={safeModeActive || !pumpEnabled ? "Protected" : "Live"}
                      detail={
                        safeModeActive || !pumpEnabled
                          ? "Relay output is locked."
                          : "Pump output is enabled."
                      }
                      icon={ShieldCheck}
                      tone={safeModeActive || !pumpEnabled ? "safe" : "warning"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] p-6 sm:p-7 lg:p-8 min-[1500px]:border-l min-[1500px]:border-t-0">
              <div className="relative overflow-hidden rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_78%,black)]">
                <div
                  className="min-h-[240px] bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "linear-gradient(180deg, rgba(6,8,6,0.05) 0%, rgba(6,8,6,0.45) 55%, rgba(6,8,6,0.92) 100%), url('/hero-bg.jpg')",
                  }}
                >
                  <div className="flex min-h-[240px] flex-col justify-between p-6">
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill status={selectedDevice.status} />

                      <span className="premium-tab rounded-full px-4 py-2 text-sm">
                        {selectedDevice.updatedAt}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--gc-accent-2)]">
                        Selected device
                      </p>

                      <h3 className="mt-3 break-words text-[clamp(2.3rem,4vw,3.4rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                        {selectedDevice.name}
                      </h3>

                      <p className="mt-2 text-base leading-7 text-[var(--gc-soft)]">
                        {selectedDevice.place}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5">
                  <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
                        <Lock className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                          Pump protection active
                        </p>

                        <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                          Manual watering commands are received safely while
                          hardware protection is enabled.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
                    <MetricCard
                      label="Threshold"
                      value={`${automation.moistureThreshold}%`}
                      detail="Dry-risk limit."
                      icon={Gauge}
                      tone="safe"
                    />

                    <MetricCard
                      label="Duration"
                      value={`${automation.pumpDurationSeconds}s`}
                      detail="Protected command time."
                      icon={Zap}
                      tone="safe"
                    />
                  </div>

                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
                    <button
                      type="button"
                      onClick={() => startIrrigation(selectedDevice.id)}
                      className="premium-btn flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm font-semibold"
                    >
                      Start safe run
                      <Droplets className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => refreshTelemetry(selectedDevice.id)}
                      className="premium-btn-secondary flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm"
                    >
                      Refresh
                      <RefreshCw className="h-4 w-4" />
                    </button>

                    <Link
                      href="/automation"
                      className="premium-btn-secondary flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm"
                    >
                      Rules
                      <SlidersHorizontal className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionBadge>Hardware status</SectionBadge>

              <h3 className="mt-5 text-[clamp(2.4rem,3.6vw,4.2rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                Live device health
              </h3>
            </div>

            <span className="premium-tab rounded-full px-4 py-2 text-sm">
              Private device link
            </span>
          </div>

          <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
            {hardwareItems.map((item) => (
              <HardwareTile
                key={item.title}
                title={item.title}
                value={item.value}
                detail={item.detail}
                icon={item.icon}
                tone={item.tone}
              />
            ))}
          </div>
        </GlassCard>

        <section className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between gap-4">
              <SectionBadge>Quick actions</SectionBadge>

              <button
                type="button"
                onClick={openNotifications}
                className="premium-btn-secondary rounded-full px-4 py-2 text-sm"
              >
                Alerts
                {unreadAlerts > 0 ? (
                  <span className="ml-2 rounded-full bg-[var(--gc-accent)] px-2 py-0.5 text-[10px] font-bold text-[#11160d]">
                    {unreadAlerts}
                  </span>
                ) : null}
              </button>
            </div>

            <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
              <QuickAction
                title="Start protected watering"
                detail="Send a safe watering command to the connected device."
                icon={Droplets}
                onClick={() => startIrrigation(selectedDevice.id)}
                primary
              />

              <QuickAction
                title="Run moisture check"
                detail="Refresh the latest reading and evaluate the moisture rule."
                icon={Activity}
                onClick={() => simulateThresholdEvent(selectedDevice.id)}
              />

              <QuickAction
                title="Edit automation"
                detail="Adjust threshold, cooldown, duration and override."
                icon={Settings2}
                href="/automation"
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionBadge>Telemetry snapshot</SectionBadge>

            <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
              <MetricCard
                label="Sensor voltage"
                value={voltageValue}
                detail={
                  telemetryReady
                    ? "Calculated soil sensor voltage."
                    : "Awaiting calibrated sensor voltage."
                }
                icon={Radio}
                tone={telemetryReady ? "safe" : "pending"}
              />

              <MetricCard
                label="Environment"
                value={bmeReady ? temperatureValue : "Awaiting"}
                detail={
                  bmeReady
                    ? `Pressure ${pressureValue}.`
                    : "Connect BME280 to show temperature and pressure."
                }
                icon={Thermometer}
                tone={bmeReady ? "live" : "pending"}
              />

              <MetricCard
                label="Pressure"
                value={pressureValue}
                detail={
                  bmeReady
                    ? "Environmental pressure reading."
                    : "Awaiting environment sensor."
                }
                icon={Gauge}
                tone={bmeReady ? "live" : "pending"}
              />

              <MetricCard
                label="Last signal"
                value={getLastSeenLabel(selectedHardware)}
                detail="Latest device update received."
                icon={RefreshCw}
                tone={telemetryReady ? "live" : "pending"}
              />
            </div>
          </GlassCard>
        </section>

        <section className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionBadge>Moisture trend</SectionBadge>

                <h3 className="mt-5 text-[clamp(2.2rem,3.2vw,3.8rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                  Soil moisture
                </h3>
              </div>

              <span className="premium-tab rounded-full px-4 py-2 text-sm">
                Live value
              </span>
            </div>

            <MoistureChart
              values={chartValues}
              threshold={automation.moistureThreshold}
              telemetryReady={telemetryReady}
            />
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionBadge>Workspace overview</SectionBadge>

                <h3 className="mt-5 text-[clamp(2.2rem,3.2vw,3.8rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                  Device overview
                </h3>
              </div>

              <Link
                href="/devices"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              >
                Manage
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))]">
              <MetricCard
                label="Devices"
                value={`${devices.length}`}
                detail="Connected nodes."
                icon={Cpu}
              />

              <MetricCard
                label="Online"
                value={`${onlineDevices}`}
                detail="Currently active."
                icon={Wifi}
                tone={onlineDevices > 0 ? "live" : "pending"}
              />

              <MetricCard
                label="Alerts"
                value={`${unreadNotifications}`}
                detail="Pending notices."
                icon={Bell}
                tone={unreadNotifications > 0 ? "warning" : "live"}
              />
            </div>

            <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  active={device.id === selectedDevice.id}
                  onSelect={() => selectDevice(device.id)}
                />
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr))]">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <SectionBadge>Activity history</SectionBadge>

                <h3 className="mt-5 text-[clamp(2.2rem,3vw,3.6rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                  Recent events
                </h3>
              </div>

              <Link
                href="/activity"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
              >
                Full history
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="gc-scrollbar mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-2">
              {recentItems.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-6">
                  <p className="text-2xl font-semibold text-[var(--gc-text)]">
                    No activity yet.
                  </p>

                  <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                    Device updates and protected watering commands will appear
                    here.
                  </p>
                </div>
              ) : (
                recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="truncate text-xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                          {item.title}
                        </h4>

                        <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                          {item.description}
                        </p>

                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                          {item.time}
                        </p>
                      </div>

                      <StatusPill status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
              <div className="min-w-0">
                <SectionBadge>System readiness</SectionBadge>

                <h3 className="mt-5 text-[clamp(2.2rem,3.2vw,3.8rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                  System ready for live irrigation.
                </h3>

                <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--gc-soft)]">
                  GreenCloud is connected to your private workspace, receiving
                  device telemetry, tracking sensor health and keeping pump
                  control protected until the final hardware mode is enabled.
                </p>
              </div>

              <div className="grid min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
                <MetricCard
                  label="Mode"
                  value={automation.mode}
                  detail="Current automation mode."
                  icon={SlidersHorizontal}
                />

                <MetricCard
                  label="Cooldown"
                  value={`${automation.cooldownMinutes}m`}
                  detail="Minimum time between cycles."
                  icon={RefreshCw}
                  tone="safe"
                />

                <MetricCard
                  label="Theme"
                  value={settings.themePreset}
                  detail="Current visual preset."
                  icon={Radio}
                  tone="pending"
                />
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </AppShell>
  );
}