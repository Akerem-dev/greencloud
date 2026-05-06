"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CloudRain,
  Cpu,
  Droplets,
  Gauge,
  KeyRound,
  Leaf,
  Lock,
  Monitor,
  Power,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  ToggleLeft,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import {
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type DeviceExtra = Device & {
  rawSoil?: number;
  soilVoltage?: number;
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: string;
  pumpState?: string;
  waterLevelStatus?: string;
  rainDetected?: boolean;
  rainStatus?: string;
  buttonPressed?: boolean;
  buttonStatus?: string;
  oledStatus?: string;
  firmware?: string;
  lastSeenMs?: number;
  lastCommand?: string;
  lastCommandStatus?: string;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

function hasTelemetry(device: DeviceExtra) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

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

function getSensorStatus(device: DeviceExtra) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Pending";
}

function getLastSeenLabel(device: DeviceExtra) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Waiting";
  }

  if (device.lastSeenMs > 1_000_000_000_000) {
    const diffSeconds = Math.max(
      0,
      Math.round((Date.now() - device.lastSeenMs) / 1000),
    );

    if (diffSeconds < 10) return "Live now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;

    return `${Math.round(diffSeconds / 60)}m ago`;
  }

  return `${Math.max(1, Math.round(device.lastSeenMs / 1000))}s runtime`;
}

function statusTone(value: string): Tone {
  const lower = value.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("healthy") ||
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("active") ||
    lower.includes("ready") ||
    lower.includes("handled") ||
    lower.includes("seen") ||
    lower.includes("balanced")
  ) {
    return "live";
  }

  if (
    lower.includes("safe") ||
    lower.includes("locked") ||
    lower.includes("dry-run") ||
    lower.includes("dry run") ||
    lower.includes("protected") ||
    lower.includes("guarded")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
  }

  if (
    lower.includes("detected") ||
    lower.includes("low") ||
    lower.includes("empty") ||
    lower.includes("blocked") ||
    lower.includes("sensor check") ||
    lower.includes("sensor review") ||
    lower.includes("dry risk") ||
    lower.includes("rain pause") ||
    lower.includes("tank guard")
  ) {
    return "warning";
  }

  if (
    lower.includes("pending") ||
    lower.includes("idle") ||
    lower.includes("none") ||
    lower.includes("syncing") ||
    lower.includes("waiting") ||
    lower.includes("awaiting") ||
    lower.includes("manual hold")
  ) {
    return "pending";
  }

  return "pending";
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

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(tone ?? statusTone(label)),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function ModePill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-5 py-3 text-sm font-semibold transition",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_15%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
      )}
    >
      {label}
    </button>
  );
}

function SummaryTile({
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
    <div className={cn("min-w-0 rounded-[26px] border p-5", toneClass(tone))}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.7rem,2.3vw,2.65rem)] font-semibold leading-none tracking-[-0.06em]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </div>
  );
}

function RangeControl({
  label,
  detail,
  value,
  min,
  max,
  suffix,
  icon: Icon,
  onChange,
}: {
  label: string;
  detail: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  icon: LucideIcon;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
            {label}
          </p>

          <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
            {detail}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)] shadow-[0_0_24px_var(--gc-glow)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_15%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]">
          {value}
          {suffix}
        </span>

        <span className="text-xs uppercase tracking-[0.2em] text-[var(--gc-muted)]">
          {min}
          {suffix} — {max}
          {suffix}
        </span>
      </div>

      <div
        className="gc-range-shell mt-5"
        style={
          {
            "--gc-range-progress": `${progress}%`,
          } as CSSProperties
        }
      >
        <div className="gc-range-track">
          <div className="gc-range-fill" />
        </div>

        <div className="gc-range-thumb-visual" />

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="gc-range-input"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function SwitchCard({
  title,
  description,
  active,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
            {title}
          </p>

          <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={cn(
          "mt-5 rounded-full border px-5 py-3 text-sm font-semibold transition",
          active
            ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_15%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:bg-white/[0.06]",
        )}
      >
        {active ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}

function SafetyCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <div className={cn("min-w-0 rounded-[24px] border p-5", toneClass(tone))}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
            {title}
          </p>

          <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-semibold tracking-[-0.04em]">
            {value}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function TimeControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
        {label}
      </span>

      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-14 w-full rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-5 text-base text-[var(--gc-text)] outline-none transition focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-white/[0.055] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]"
      />
    </label>
  );
}

function PreviewRow({
  label,
  value,
  tone = "pending",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="grid gap-3 rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/14 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <span className="min-w-0 truncate text-sm text-[var(--gc-soft)]">
        {label}
      </span>

      <div className="min-w-0 sm:max-w-[240px]">
        <StatusPill label={value} tone={tone} />
      </div>
    </div>
  );
}

function EmptyAutomationState() {
  return (
    <div className="mx-auto w-full max-w-[1480px] min-w-0">
      <GlassCard className="p-6 sm:p-7 xl:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
          <div className="min-w-0">
            <SectionBadge>Automation unavailable</SectionBadge>

            <h2 className="mt-5 text-[clamp(2.6rem,5vw,4.8rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--gc-text)]">
              Pair a device first.
            </h2>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
              Automation depends on a selected GreenCloud node. First pair your
              ESP32 from the Devices page, then come back here to manage rule
              thresholds, cooldown windows and protected watering commands.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/devices"
                className="premium-btn inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold"
              >
                <KeyRound className="h-4 w-4" />
                Go to Devices
              </Link>

              <span className="premium-tab rounded-full px-4 py-2 text-sm">
                No selected node
              </span>
            </div>
          </div>

          <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] p-5">
            <ShieldCheck className="h-6 w-6 text-[var(--gc-accent-2)]" />

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
              Protected state
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
              Waiting for paired hardware
            </p>

            <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
              The automation layer stays visible but inactive until a device is
              paired and selected.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default function AutomationPage() {
  const {
    automation,
    selectedDevice,
    devices,
    updateAutomation,
    resetAutomation,
    startIrrigation,
  } = useAppState();

  const activeDevice = selectedDevice ?? devices?.[0];

  if (!activeDevice) {
    return (
      <AppShell
        title="GreenCloud Automation"
        subtitle="Smart watering logic, protected commands, and real ESP32 state."
      >
        <EmptyAutomationState />
      </AppShell>
    );
  }

  const selectedExtra = activeDevice as DeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);

  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;
  const physicalPumpLocked = safeModeActive || !pumpEnabled;

  const sensorStatus = getSensorStatus(selectedExtra);
  const rawSoil = telemetryReady ? rawLabel(selectedExtra.rawSoil) : "—";
  const soilVoltage = telemetryReady
    ? voltageLabel(selectedExtra.soilVoltage)
    : "—";

  const relayState =
    selectedExtra.relayState ??
    (safeModeActive || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    selectedExtra.pumpState ??
    (safeModeActive || !pumpEnabled ? "Dry-run" : "Ready");

  const rainStatus = selectedExtra.rainStatus ?? "Pending";
  const waterLevelStatus = selectedExtra.waterLevelStatus ?? "Pending";
  const buttonStatus = selectedExtra.buttonStatus ?? "Pending";
  const oledStatus = selectedExtra.oledStatus ?? "Pending";
  const lastCommandStatus = selectedExtra.lastCommandStatus ?? "None";

  const canWaterByThreshold =
    telemetryReady && activeDevice.moisture <= automation.moistureThreshold;

  const automaticArmed =
    automation.mode === "Automatic" && automation.autoIrrigationEnabled;

  const sensorBlocked =
    activeDevice.status === "Offline" ||
    sensorStatus.toLowerCase().includes("sensor check") ||
    sensorStatus.toLowerCase().includes("no signal");

  const rainBlocked = rainStatus === "Detected";
  const tankBlocked =
    waterLevelStatus === "Low" || waterLevelStatus === "Empty";

  const decision = !telemetryReady
    ? "Awaiting signal"
    : sensorBlocked
      ? "Sensor review"
      : rainBlocked
        ? "Rain pause"
        : tankBlocked
          ? "Tank guard"
          : !automaticArmed
            ? "Manual hold"
            : canWaterByThreshold
              ? "Dry risk"
              : "Balanced";

  const decisionTone: Tone =
    decision === "Dry risk" ||
    decision === "Rain pause" ||
    decision === "Tank guard" ||
    decision === "Sensor review"
      ? "warning"
      : decision === "Awaiting signal" || decision === "Manual hold"
        ? "pending"
        : "live";

  const commandResult = physicalPumpLocked
    ? "Protected"
    : rainBlocked || tankBlocked || sensorBlocked || !telemetryReady
      ? "Blocked"
      : "Ready";

  const commandTone: Tone =
    commandResult === "Protected"
      ? "safe"
      : commandResult === "Blocked"
        ? "warning"
        : "live";

  const moistureLabel = telemetryReady ? `${activeDevice.moisture}%` : "Waiting";

  return (
    <AppShell
      title="GreenCloud Automation"
      subtitle="Smart watering logic, protected commands, and real ESP32 state."
    >
      <div className="mx-auto w-full max-w-[1680px] min-w-0 space-y-5">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative p-5 sm:p-6 xl:p-7 2xl:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,color-mix(in_srgb,var(--gc-accent)_10%,transparent),transparent_34%),radial-gradient(circle_at_85%_78%,color-mix(in_srgb,var(--gc-accent-2)_8%,transparent),transparent_30%)]" />

            <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.9fr)] xl:items-start">
              <div className="min-w-0">
                <SectionBadge>Smart irrigation layer</SectionBadge>

                <h2 className="mt-5 max-w-[12ch] text-[clamp(2.8rem,4.4vw,5rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-[var(--gc-text)]">
                  Rules decide. Hardware stays safe.
                </h2>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                  GreenCloud watches the selected ESP32 node, evaluates
                  watering rules, and keeps the pump channel protected until
                  the hardware layer is ready.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <StatusPill label={activeDevice.name} tone="live" />
                  <StatusPill label="Live rule engine" tone="live" />
                  <StatusPill
                    label={safeModeActive ? "Protected pump" : "Pump enabled"}
                    tone={safeModeActive ? "safe" : "warning"}
                  />
                  <StatusPill label={relayState} />
                  <StatusPill label={lastCommandStatus} />
                </div>
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <SummaryTile
                  label="Mode"
                  value={automation.mode}
                  detail={
                    automaticArmed
                      ? "Automatic rules are active."
                      : "Manual control is active."
                  }
                  icon={SlidersHorizontal}
                  tone={automaticArmed ? "live" : "pending"}
                />

                <SummaryTile
                  label="Decision"
                  value={decision}
                  detail={
                    telemetryReady
                      ? `${activeDevice.moisture}% soil moisture against ${automation.moistureThreshold}% limit.`
                      : "Waiting for the next device signal."
                  }
                  icon={Gauge}
                  tone={decisionTone}
                />

                <SummaryTile
                  label="Output"
                  value={commandResult}
                  detail={
                    physicalPumpLocked
                      ? "Command is recorded without pump output."
                      : "Pump channel is available."
                  }
                  icon={Droplets}
                  tone={commandTone}
                />

                <SummaryTile
                  label="Cooldown"
                  value={`${automation.cooldownMinutes}m`}
                  detail="Minimum pause between cycles."
                  icon={TimerReset}
                  tone="safe"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.12fr)_360px] 2xl:grid-cols-[minmax(0,1.18fr)_390px]">
          <div className="min-w-0 space-y-5">
            <GlassCard className="min-w-0 p-5 sm:p-6 xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <SectionBadge>Rule editor</SectionBadge>

                  <h3 className="mt-4 text-[clamp(2rem,2.8vw,3.1rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                    Tune watering behavior
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={resetAutomation}
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset rules
                </button>
              </div>

              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
                        Automation mode
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                        Automatic mode follows live telemetry. Manual mode keeps
                        watering under direct control.
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3">
                      <ModePill
                        active={automation.mode === "Automatic"}
                        label="Automatic"
                        onClick={() => updateAutomation({ mode: "Automatic" })}
                      />

                      <ModePill
                        active={automation.mode === "Manual"}
                        label="Manual"
                        onClick={() => updateAutomation({ mode: "Manual" })}
                      />
                    </div>
                  </div>
                </div>

                <RangeControl
                  label="Moisture threshold"
                  detail="When soil moisture drops below this value, GreenCloud marks the device as dry-risk."
                  value={automation.moistureThreshold}
                  min={15}
                  max={80}
                  suffix="%"
                  icon={Gauge}
                  onChange={(value) =>
                    updateAutomation({ moistureThreshold: value })
                  }
                />

                <RangeControl
                  label="Cooldown window"
                  detail="Prevents repeated watering commands from running too close together."
                  value={automation.cooldownMinutes}
                  min={5}
                  max={120}
                  suffix=" min"
                  icon={TimerReset}
                  onChange={(value) =>
                    updateAutomation({ cooldownMinutes: value })
                  }
                />

                <RangeControl
                  label="Watering duration"
                  detail="Sets the requested pump runtime for each watering command."
                  value={automation.pumpDurationSeconds}
                  min={2}
                  max={60}
                  suffix="s"
                  icon={Droplets}
                  onChange={(value) =>
                    updateAutomation({ pumpDurationSeconds: value })
                  }
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <SwitchCard
                    title="Manual override"
                    description="Allows dashboard controls to send a protected watering command."
                    active={automation.manualOverrideEnabled}
                    icon={ShieldCheck}
                    onClick={() => {
                      const nextValue = !automation.manualOverrideEnabled;

                      updateAutomation({
                        manualOverrideEnabled: nextValue,
                        manualOverride: nextValue,
                      });
                    }}
                  />

                  <SwitchCard
                    title="Automatic irrigation"
                    description="Allows GreenCloud to request watering when the rule condition is met."
                    active={automation.autoIrrigationEnabled}
                    icon={Power}
                    onClick={() =>
                      updateAutomation({
                        autoIrrigationEnabled:
                          !automation.autoIrrigationEnabled,
                      })
                    }
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(160px,1fr)_minmax(160px,1fr)]">
                  <SwitchCard
                    title="Quiet hours"
                    description="Pauses automatic watering during the selected time window."
                    active={automation.quietHoursEnabled}
                    icon={Clock3}
                    onClick={() =>
                      updateAutomation({
                        quietHoursEnabled: !automation.quietHoursEnabled,
                      })
                    }
                  />

                  <TimeControl
                    label="Quiet start"
                    value={automation.quietHoursStart}
                    onChange={(value) =>
                      updateAutomation({
                        quietHoursStart: value,
                        quietStart: value,
                      })
                    }
                  />

                  <TimeControl
                    label="Quiet end"
                    value={automation.quietHoursEnd}
                    onChange={(value) =>
                      updateAutomation({
                        quietHoursEnd: value,
                        quietEnd: value,
                      })
                    }
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 xl:p-7">
              <div className="grid gap-5">
                <div className="min-w-0">
                  <SectionBadge>Automation summary</SectionBadge>

                  <h3 className="mt-4 text-[clamp(2rem,2.8vw,3rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-[var(--gc-text)]">
                    Smart rules are ready. Hardware output stays protected.
                  </h3>

                  <p className="mt-4 max-w-4xl text-sm leading-7 text-[var(--gc-soft)]">
                    Threshold, cooldown, duration, manual override and quiet
                    hours are active in the GreenCloud control layer. Rain,
                    tank and local button states remain visible for the
                    completed hardware stage.
                  </p>
                </div>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                  <SummaryTile
                    label="ESP32"
                    value={telemetryReady ? "Seen" : "Waiting"}
                    detail={
                      telemetryReady
                        ? "Latest telemetry is available."
                        : "Waiting for device signal."
                    }
                    icon={Cpu}
                    tone={telemetryReady ? "live" : "pending"}
                  />

                  <SummaryTile
                    label="Command scope"
                    value="Paired"
                    detail="Commands target the selected device."
                    icon={Radio}
                    tone="safe"
                  />

                  <SummaryTile
                    label="Pump safety"
                    value={physicalPumpLocked ? "Guarded" : "Live"}
                    detail={
                      physicalPumpLocked
                        ? "Output remains protected."
                        : "Physical output is enabled."
                    }
                    icon={AlertTriangle}
                    tone={physicalPumpLocked ? "safe" : "warning"}
                  />

                  <SummaryTile
                    label="Rule sync"
                    value="Ready"
                    detail="Automation state is saved."
                    icon={CheckCircle2}
                    tone="live"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-6">
            <GlassCard className="p-5 sm:p-6">
              <SectionBadge>Node preview</SectionBadge>

              <h3 className="mt-5 text-[clamp(1.85rem,2.5vw,2.7rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Current device state
              </h3>

              <div className="mt-6 space-y-3">
                <PreviewRow
                  label="Device"
                  value={activeDevice.name}
                  tone="live"
                />

                <PreviewRow
                  label="Moisture"
                  value={moistureLabel}
                  tone={
                    !telemetryReady
                      ? "pending"
                      : canWaterByThreshold
                        ? "warning"
                        : "live"
                  }
                />

                <PreviewRow
                  label="Sensor"
                  value={sensorStatus}
                  tone={sensorBlocked ? "warning" : statusTone(sensorStatus)}
                />

                <PreviewRow
                  label="Soil signal"
                  value={`${rawSoil} / ${soilVoltage}`}
                  tone={
                    !telemetryReady
                      ? "pending"
                      : sensorBlocked
                        ? "warning"
                        : "safe"
                  }
                />

                <PreviewRow
                  label="Rule result"
                  value={decision}
                  tone={decisionTone}
                />

                <PreviewRow
                  label="Pump channel"
                  value={physicalPumpLocked ? "Protected" : "Enabled"}
                  tone={physicalPumpLocked ? "safe" : "warning"}
                />
              </div>

              <button
                type="button"
                onClick={() => startIrrigation(activeDevice.id)}
                className="premium-btn mt-6 w-full rounded-[20px] px-5 py-4 text-base font-semibold"
              >
                {physicalPumpLocked
                  ? "Send protected command"
                  : "Start watering command"}
              </button>

              <p className="mt-4 text-sm leading-7 text-[var(--gc-soft)]">
                The command is sent to the selected device and reported back
                after the ESP32 handles it.
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6">
              <SectionBadge>Secure command channel</SectionBadge>

              <div className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] p-5">
                <KeyRound className="h-5 w-5 text-[var(--gc-accent-2)]" />

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                  Selected device
                </p>

                <p className="mt-2 break-all text-sm font-semibold text-[var(--gc-text)]">
                  {activeDevice.id}
                </p>

                <p className="mt-4 text-sm leading-7 text-[var(--gc-soft)]">
                  GreenCloud sends commands only to the active paired node, then
                  waits for the device response.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6">
              <SectionBadge>Protection stack</SectionBadge>

              <div className="mt-5 grid gap-3">
                <SafetyCard
                  title="ESP32"
                  value={activeDevice.status}
                  description={`Last signal: ${getLastSeenLabel(selectedExtra)}.`}
                  icon={Cpu}
                  tone={
                    activeDevice.status === "Online"
                      ? "live"
                      : activeDevice.status === "Offline"
                        ? "offline"
                        : "pending"
                  }
                />

                <SafetyCard
                  title="Soil sensor"
                  value={sensorStatus}
                  description={`Raw ${rawSoil} · ${soilVoltage}.`}
                  icon={Leaf}
                  tone={
                    sensorBlocked
                      ? "warning"
                      : sensorStatus === "Pending"
                        ? "pending"
                        : "live"
                  }
                />

                <SafetyCard
                  title="Relay"
                  value={relayState}
                  description="Output remains guarded until hardware mode is enabled."
                  icon={Lock}
                  tone={physicalPumpLocked ? "safe" : "warning"}
                />

                <SafetyCard
                  title="Pump"
                  value={pumpState}
                  description="Watering commands stay protected while safe-mode is active."
                  icon={Zap}
                  tone={physicalPumpLocked ? "safe" : "warning"}
                />

                <SafetyCard
                  title="Water tank"
                  value={waterLevelStatus}
                  description="Tank status is checked before watering."
                  icon={Waves}
                  tone={statusTone(waterLevelStatus)}
                />

                <SafetyCard
                  title="Rain sensor"
                  value={rainStatus}
                  description="Rain detection pauses irrigation."
                  icon={CloudRain}
                  tone={statusTone(rainStatus)}
                />

                <SafetyCard
                  title="Button"
                  value={buttonStatus}
                  description="Local manual input state."
                  icon={ToggleLeft}
                  tone={statusTone(buttonStatus)}
                />

                <SafetyCard
                  title="OLED"
                  value={oledStatus}
                  description="On-device display status."
                  icon={Monitor}
                  tone={statusTone(oledStatus)}
                />
              </div>
            </GlassCard>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}