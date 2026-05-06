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
  Sparkles,
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
  return "Ready";
}

function getLastSeenLabel(device: DashboardDevice) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Ready";
  }

  const now = Date.now();
  const value = device.lastSeenMs;

  if (value > 1_000_000_000_000) {
    const diffSeconds = Math.max(0, Math.round((now - value) / 1000));

    if (diffSeconds < 10) return "Live now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    return `${Math.round(diffSeconds / 60)}m ago`;
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
  if (lower === "pending" || lower.includes("pending")) return "Ready";
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
    lower.includes("awaiting") ||
    lower.includes("standby")
  ) {
    return "pending";
  }

  return "warning";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/[0.18] text-[var(--gc-soft)]";
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
        "inline-flex max-w-full shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(statusTone(String(status))),
      )}
    >
      <span className="truncate">{visibleStatus}</span>
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <AppShell
      title="GreenCloud Dashboard"
      subtitle="Loading your private irrigation workspace."
    >
      <div className="space-y-6">
        <div className="h-72 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-white/[0.025]" />

        <div className="grid gap-6 2xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-white/[0.025]" />
          <div className="h-80 animate-pulse rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-white/[0.025]" />
        </div>
      </div>
    </AppShell>
  );
}

function CompactMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
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
        "group relative min-w-0 overflow-hidden rounded-[24px] border p-5 transition duration-300 hover:-translate-y-0.5",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.075),transparent_38%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
            {label}
          </p>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>

        <p className="mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-3xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-4xl">
          {value}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
          {detail}
        </p>
      </div>
    </div>
  );
}

function HeroSignalCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
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
        "min-w-0 rounded-[24px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
            {label}
          </p>

          <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
            {value}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {detail}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
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
        "group relative min-w-0 overflow-hidden rounded-[24px] border p-5 transition duration-300 hover:-translate-y-0.5",
        tone === "live"
          ? "border-[color-mix(in_srgb,var(--gc-accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_8%,transparent)]"
          : tone === "safe"
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)]"
            : tone === "warning"
              ? "border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)]"
              : tone === "offline"
                ? "border-[color-mix(in_srgb,var(--gc-danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_8%,transparent)]"
                : "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.075),transparent_38%)] opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10 flex h-full min-h-[132px] flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
              {title}
            </p>

            <h4 className="mt-3 truncate text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              {value}
            </h4>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--gc-soft)]">
          {detail}
        </p>
      </div>
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
    "group flex min-h-[126px] items-center justify-between gap-4 rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-0.5",
    primary
      ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_22%,transparent),color-mix(in_srgb,var(--gc-accent-2)_12%,transparent))] text-[var(--gc-text)] shadow-[0_22px_64px_var(--gc-glow)]"
      : "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] text-[var(--gc-text)] hover:border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] hover:bg-white/[0.04]",
  );

  const content = (
    <>
      <span className="min-w-0">
        <span className="block text-xl font-semibold tracking-[-0.04em]">
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
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_24px_var(--gc-glow)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18 text-[var(--gc-accent-2)]",
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
    <div className="relative mt-5 h-[230px] overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_84%,black)] p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--gc-accent)_10%,transparent),transparent_32%),radial-gradient(circle_at_80%_88%,color-mix(in_srgb,var(--gc-accent-3)_8%,transparent),transparent_34%)]" />

      <div
        className="absolute left-5 right-5 z-10 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_56%,transparent)]"
        style={{ bottom: `${Math.min(170, Math.max(44, threshold * 1.55))}px` }}
      />

      <span
        className="absolute left-5 z-20 rounded-full border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--gc-warn)]"
        style={{
          bottom: `${Math.min(178, Math.max(54, threshold * 1.55 + 10))}px`,
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
              className="w-full rounded-t-[18px] bg-gradient-to-t from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_20px_var(--gc-glow)]"
              style={{
                height: `${Math.max(6, Math.min(160, value * 1.55))}px`,
                opacity: telemetryReady ? 1 : 0.34,
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute right-5 top-5 z-20 rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)] px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
          Current
        </p>

        <p className="mt-2 text-xl font-semibold text-[var(--gc-text)]">
          {telemetryReady ? `${latestValue}%` : "Ready"}
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
        "min-w-0 rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-0.5",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] shadow-[0_18px_48px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.04]",
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

  const recentItems = filteredActivity.slice(0, 4);
  const unreadAlerts = notifications.filter((item) => !item.read).length;

  const safeModeActive = selectedHardware.safeMode ?? true;
  const pumpEnabled = selectedHardware.pumpEnabled ?? false;

  const relayState =
    selectedHardware.relayState ??
    (safeModeActive || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    selectedHardware.pumpState ??
    (safeModeActive || !pumpEnabled ? "Dry-run" : "Ready");

  const lastCommandStatus = selectedHardware.lastCommandStatus ?? "Ready";

  const sensorStatus = getSensorStatus(selectedHardware);
  const sensorFault =
    sensorStatus.toLowerCase().includes("sensor check") ||
    sensorStatus.toLowerCase().includes("no signal") ||
    selectedDevice.status === "Offline";

  const moistureValue = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Ready";

  const rawValue = telemetryReady ? rawLabel(selectedHardware.rawSoil) : "—";
  const signalValue = telemetryReady ? `${selectedDevice.signal}%` : "Ready";

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
    selectedHardware.waterLevelStatus ?? "Ready",
  );

  const displayedRainStatus = displayStatus(
    selectedHardware.rainStatus ?? "Ready",
  );

  const displayedButtonStatus = displayStatus(
    selectedHardware.buttonStatus ?? "Ready",
  );

  const displayedOledStatus = displayStatus(
    selectedHardware.oledStatus ?? "Ready",
  );

  const hasRealDevice = devices.length > 0;
  const deviceTitle = hasRealDevice ? selectedDevice.name : "Ready to pair";

  const devicePlace = hasRealDevice
    ? selectedDevice.place
    : "Power on the ESP32 and enter the OLED pairing code.";

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
      detail: `Private workspace link · ${getLastSeenLabel(selectedHardware)}`,
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
        ? `Moisture packet received · RAW ${rawValue} · ${voltageValue}`
        : "Ready for the first soil moisture packet.",
      icon: Leaf,
      tone: sensorFault
        ? "warning"
        : sensorStatus === "Ready"
          ? "pending"
          : "live",
    },
    {
      title: "Environment",
      value: bmeReady ? "Live" : "Ready",
      detail: bmeReady
        ? `Temperature ${temperatureValue} · Pressure ${pressureValue}`
        : "Environment sensor can be added later.",
      icon: Thermometer,
      tone: bmeReady ? "live" : "pending",
    },
    {
      title: "OLED display",
      value: displayedOledStatus,
      detail: "Pairing code and device state are shown locally on the ESP32.",
      icon: Monitor,
      tone:
        selectedHardware.oledStatus === "Active"
          ? "live"
          : selectedHardware.oledStatus === "Off"
            ? "offline"
            : "pending",
    },
    {
      title: "Relay output",
      value: displayedRelayState,
      detail: safeModeActive
        ? "Pump relay remains locked while protection mode is active."
        : pumpEnabled
          ? "Relay output is available for irrigation."
          : "Relay remains locked until pump output is enabled.",
      icon: Lock,
      tone: safeModeActive || !pumpEnabled ? "safe" : "warning",
    },
    {
      title: "Pump control",
      value: displayedPumpState,
      detail: pumpEnabled
        ? "Pump output can run after final wiring approval."
        : "Watering commands stay safely protected by firmware.",
      icon: Power,
      tone: pumpEnabled ? "warning" : "safe",
    },
    {
      title: "Tank level",
      value: displayedWaterStatus,
      detail: "Float sensor status for water-level protection.",
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
      title: "Rain lockout",
      value: displayedRainStatus,
      detail: "Irrigation can stay protected when rain is detected.",
      icon: CloudRain,
      tone:
        selectedHardware.rainStatus === "Clear"
          ? "live"
          : selectedHardware.rainStatus === "Detected"
            ? "warning"
            : "pending",
    },
    {
      title: "Manual input",
      value: displayedButtonStatus,
      detail: "Local button input for protected manual control.",
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
      title="GreenCloud Dashboard"
      subtitle="Live telemetry, private device data and protected irrigation control."
    >
      <div className="dashboard-page w-full min-w-0 space-y-6">
        <GlassCard className="relative overflow-hidden p-6 sm:p-8 2xl:p-9">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,color-mix(in_srgb,var(--gc-accent)_13%,transparent),transparent_34%),radial-gradient(circle_at_92%_84%,color-mix(in_srgb,var(--gc-accent-3)_10%,transparent),transparent_34%)]" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SectionBadge>Command center</SectionBadge>

              <div className="flex flex-wrap gap-2">
                <StatusPill status={selectedDevice.status} />
                <StatusPill
                  status={safeModeActive || !pumpEnabled ? "Protected" : "Pump live"}
                />
                <StatusPill status={lastCommandStatus} />
              </div>
            </div>

            <h2 className="mt-8 max-w-6xl text-[clamp(3.2rem,6.4vw,7.8rem)] font-semibold leading-[0.9] tracking-[-0.085em] text-[var(--gc-text)]">
              <span className="block">Monitor plants.</span>
              <span className="block text-[var(--gc-accent-2)] drop-shadow-[0_0_22px_var(--gc-glow)]">
                Protect irrigation.
              </span>
            </h2>

            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
              GreenCloud turns your ESP32 node into a private irrigation control
              center with live plant telemetry, protected commands and clear
              device health.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/devices"
                className="premium-btn inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                Pair a device
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href="/automation"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm"
              >
                Automation
                <SlidersHorizontal className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              <HeroSignalCard
                label="Moisture"
                value={moistureValue}
                detail={telemetryReady ? "Live soil moisture." : "Ready for sensor data."}
                icon={Droplets}
                tone={sensorFault ? "warning" : telemetryReady ? "live" : "pending"}
              />

              <HeroSignalCard
                label="Telemetry"
                value={signalValue}
                detail={telemetryReady ? "Device Wi-Fi strength." : "Ready for connection."}
                icon={Wifi}
                tone={telemetryReady ? "live" : "pending"}
              />

              <HeroSignalCard
                label="Protection"
                value={safeModeActive || !pumpEnabled ? "On" : "Live"}
                detail={
                  safeModeActive || !pumpEnabled
                    ? "Relay output is guarded."
                    : "Pump output is enabled."
                }
                icon={ShieldCheck}
                tone={safeModeActive || !pumpEnabled ? "safe" : "warning"}
              />
            </div>
          </div>
        </GlassCard>

        <div className="grid w-full min-w-0 items-start gap-6 2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="min-w-0 space-y-6">
            <GlassCard className="overflow-hidden p-0">
              <div
                className="min-h-[270px] bg-cover bg-center"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(6,8,6,0.08) 0%, rgba(6,8,6,0.45) 52%, rgba(6,8,6,0.94) 100%), url('/hero-bg.jpg')",
                }}
              >
                <div className="flex min-h-[270px] flex-col justify-between p-6">
                  <div className="flex items-center justify-between gap-3">
                    <StatusPill status={selectedDevice.status} />

                    <span className="premium-tab rounded-full px-4 py-2 text-sm">
                      {getLastSeenLabel(selectedHardware)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--gc-accent-2)]">
                      Selected device
                    </p>

                    <h3 className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] 2xl:text-5xl">
                      {deviceTitle}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-base leading-7 text-[var(--gc-soft)]">
                      {devicePlace}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent-2)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
                      <Lock className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                        Protection-first irrigation
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                        Commands can be tested from the dashboard while pump
                        output stays protected by default.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CompactMetric
                    label="Threshold"
                    value={`${automation.moistureThreshold}%`}
                    detail="Dry-risk limit."
                    icon={Gauge}
                    tone="safe"
                  />

                  <CompactMetric
                    label="Duration"
                    value={`${automation.pumpDurationSeconds}s`}
                    detail="Command window."
                    icon={Zap}
                    tone="safe"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => startIrrigation(selectedDevice.id)}
                    className="premium-btn flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm font-semibold"
                  >
                    Safe run
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
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionBadge>Automation control</SectionBadge>

                  <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                    Protected output
                  </h3>
                </div>

                <StatusPill
                  status={safeModeActive || !pumpEnabled ? "Protected" : "Pump live"}
                />
              </div>

              <p className="mt-4 text-base leading-8 text-[var(--gc-soft)]">
                Irrigation commands stay readable in Firebase while the physical
                relay remains guarded until the hardware is ready.
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <CompactMetric
                  label="Mode"
                  value={automation.mode}
                  detail="Current automation mode."
                  icon={SlidersHorizontal}
                  tone="pending"
                />

                <CompactMetric
                  label="Cooldown"
                  value={`${automation.cooldownMinutes}m`}
                  detail="Minimum time between cycles."
                  icon={RefreshCw}
                  tone="safe"
                />

                <CompactMetric
                  label="Command"
                  value={`${automation.pumpDurationSeconds}s`}
                  detail="Protected command duration."
                  icon={Zap}
                  tone="safe"
                />

                <CompactMetric
                  label="State"
                  value={displayedPumpState}
                  detail="Current pump output mode."
                  icon={Power}
                  tone={safeModeActive || !pumpEnabled ? "safe" : "warning"}
                />
              </div>
            </GlassCard>

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

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <QuickAction
                  title="Start protected watering"
                  detail="Send a safe watering command to the selected ESP32."
                  icon={Droplets}
                  onClick={() => startIrrigation(selectedDevice.id)}
                  primary
                />

                <QuickAction
                  title="Run moisture check"
                  detail="Refresh telemetry and evaluate the moisture rule."
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
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionBadge>Activity history</SectionBadge>

                  <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                    Recent events.
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

              <div className="gc-scrollbar mt-6 max-h-[360px] space-y-4 overflow-y-auto pr-2">
                {recentItems.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] p-6">
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
                      className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="truncate text-xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                            {item.title}
                          </h4>

                          <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
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
          </div>

          <div className="min-w-0 space-y-6">
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionBadge>Live telemetry</SectionBadge>

                  <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                    Soil moisture
                  </h3>
                </div>

                <StatusPill status={telemetryReady ? "Live" : "Ready"} />
              </div>

              <MoistureChart
                values={chartValues}
                threshold={automation.moistureThreshold}
                telemetryReady={telemetryReady}
              />

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <HeroSignalCard
                  label="Sensor RAW"
                  value={rawValue}
                  detail={
                    telemetryReady
                      ? "Direct sensor reading."
                      : "Ready for sensor packet."
                  }
                  icon={Gauge}
                  tone={sensorFault ? "warning" : telemetryReady ? "safe" : "pending"}
                />

                <HeroSignalCard
                  label="Voltage"
                  value={voltageValue}
                  detail="Calculated sensor voltage."
                  icon={Radio}
                  tone={telemetryReady ? "safe" : "pending"}
                />

                <HeroSignalCard
                  label="Last signal"
                  value={getLastSeenLabel(selectedHardware)}
                  detail="Latest device update."
                  icon={RefreshCw}
                  tone={telemetryReady ? "live" : "pending"}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionBadge>Hardware status</SectionBadge>

                  <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                    Device health.
                  </h3>
                </div>

                <span className="premium-tab rounded-full px-4 py-2 text-sm">
                  Private device link
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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

            <GlassCard className="p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <SectionBadge>Workspace overview</SectionBadge>

                  <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                    Devices.
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

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <CompactMetric
                  label="Devices"
                  value={`${devices.length}`}
                  detail="Paired nodes."
                  icon={Cpu}
                />

                <CompactMetric
                  label="Online"
                  value={`${onlineDevices}`}
                  detail="Currently active."
                  icon={Wifi}
                  tone={onlineDevices > 0 ? "live" : "pending"}
                />

                <CompactMetric
                  label="Alerts"
                  value={`${unreadNotifications}`}
                  detail="Important notices."
                  icon={Bell}
                  tone={unreadNotifications > 0 ? "warning" : "live"}
                />
              </div>

              {devices.length > 0 ? (
                <div className="mt-6 grid gap-4">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      active={device.id === selectedDevice.id}
                      onSelect={() => selectDevice(device.id)}
                    />
                  ))}
                </div>
              ) : null}
            </GlassCard>

            <GlassCard className="p-6">
              <SectionBadge>System readiness</SectionBadge>

              <h3 className="mt-5 text-4xl font-semibold leading-none tracking-tighter text-[var(--gc-text)] sm:text-5xl">
                Ready for protected irrigation.
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--gc-soft)]">
                GreenCloud is connected to your private workspace, tracking
                device health and keeping pump control protected until final
                hardware mode is enabled.
              </p>

              <div className="mt-6 grid gap-4">
                <CompactMetric
                  label="Theme"
                  value={settings.themePreset}
                  detail="Current visual preset."
                  icon={Radio}
                  tone="pending"
                />

                <CompactMetric
                  label="Firmware"
                  value={selectedHardware.firmware ?? "GreenCloud"}
                  detail="Device firmware profile."
                  icon={Cpu}
                  tone="safe"
                />

                <CompactMetric
                  label="Command"
                  value={displayStatus(lastCommandStatus)}
                  detail="Latest response state."
                  icon={Sparkles}
                  tone={statusTone(lastCommandStatus)}
                />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
