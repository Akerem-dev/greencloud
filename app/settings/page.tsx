"use client";

import type { CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CloudRain,
  Cpu,
  Droplets,
  Flame,
  Gauge,
  Leaf,
  Lock,
  Monitor,
  Moon,
  PlugZap,
  Power,
  Radio,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  SunMedium,
  ToggleLeft,
  Umbrella,
  Waves,
  Wifi,
  Wind,
  type LucideIcon,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import {
  type AmbienceMode,
  type Device,
  type NotificationMode,
  type ThemePreset,
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
  rainStatus?: string;
  buttonStatus?: string;
  oledStatus?: string;
  lastSeenMs?: number;
  firmware?: string;
  lastCommandStatus?: string;
  power?: string;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

const themes: Array<{
  label: string;
  value: ThemePreset;
  description: string;
  icon: LucideIcon;
}> = [
  {
    label: "Botanical dark",
    value: "botanical-dark",
    description: "Default premium GreenCloud look.",
    icon: Leaf,
  },
  {
    label: "Forest mist",
    value: "forest-mist",
    description: "Soft green contrast for long usage.",
    icon: Sparkles,
  },
  {
    label: "Aurora gold",
    value: "aurora-gold",
    description: "High-impact golden interface glow.",
    icon: SunMedium,
  },
  {
    label: "Midnight moss",
    value: "midnight-moss",
    description: "Deep dark control-room style.",
    icon: Moon,
  },
  {
    label: "Golden hour",
    value: "golden-hour",
    description: "Warm highlight version.",
    icon: SunMedium,
  },
  {
    label: "Rain glass",
    value: "rain-glass",
    description: "Cool rainy glass interface.",
    icon: Umbrella,
  },
];

const ambiences: Array<{
  label: string;
  value: AmbienceMode;
  icon: LucideIcon;
}> = [
  { label: "Leaves", value: "leaves", icon: Leaf },
  { label: "Rain", value: "rain", icon: Umbrella },
  { label: "Mist", value: "mist", icon: Sparkles },
  { label: "Wind", value: "wind", icon: Wind },
  { label: "Fireflies", value: "fireflies", icon: Flame },
  { label: "Calm", value: "calm", icon: Clock3 },
];

const notificationModes: Array<{
  label: string;
  value: NotificationMode;
  description: string;
}> = [
  {
    label: "Priority only",
    value: "priority",
    description: "Show pump, sensor and safety alerts first.",
  },
  {
    label: "All notifications",
    value: "all",
    description: "Show every workspace event.",
  },
];

function toTitleCase(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function hasTelemetry(device: DeviceExtra) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

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

function statusTone(value: string): Tone {
  const lower = value.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("live") ||
    lower.includes("ready") ||
    lower.includes("active") ||
    lower.includes("healthy") ||
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("handled") ||
    lower.includes("seen")
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
    lower.includes("low") ||
    lower.includes("empty") ||
    lower.includes("detected") ||
    lower.includes("sensor check") ||
    lower.includes("blocked")
  ) {
    return "warning";
  }

  if (
    lower.includes("pending") ||
    lower.includes("idle") ||
    lower.includes("none") ||
    lower.includes("syncing") ||
    lower.includes("waiting")
  ) {
    return "pending";
  }

  return "pending";
}

function getSensorStatus(device: DeviceExtra) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Pending";
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
        "inline-flex max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold",
        getToneClass(tone ?? statusTone(label)),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function ChoiceCard({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description?: string;
  icon?: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-0 rounded-[24px] border p-4 text-left transition duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_18px_40px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06]",
      )}
    >
      <span className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        ) : null}

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--gc-text)]">
            {title}
          </span>

          {description ? (
            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[var(--gc-soft)]">
              {description}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function ToggleRow({
  title,
  subtitle,
  active,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-4 text-left transition hover:bg-white/[0.05]"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-[var(--gc-text)]">
          {title}
        </span>

        <span className="mt-1 line-clamp-2 block text-sm leading-6 text-[var(--gc-soft)]">
          {subtitle}
        </span>
      </span>

      <span
        className={cn(
          "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold",
          active
            ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_15%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]",
        )}
      >
        {active ? "On" : "Off"}
      </span>
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-12 w-full rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 px-4 text-sm text-[var(--gc-text)] outline-none placeholder:text-[var(--gc-muted)] transition focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-white/[0.045]"
      />
    </label>
  );
}

function RangeControl({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
            {label}
          </p>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {description}
          </p>

          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--gc-muted)]">
            {min}
            {suffix} — {max}
            {suffix}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_15%,transparent)] px-4 py-2 text-sm font-semibold text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]">
          {value}
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
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="gc-range-input"
          aria-label={label}
        />
      </div>
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
        {label}
      </span>

      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 h-12 w-full rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 px-4 text-sm text-[var(--gc-text)] outline-none transition focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-white/[0.045]"
      />
    </label>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[26px] border p-5",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : getToneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.55rem,2.2vw,2.45rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </div>
  );
}

function HardwareSettingCard({
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
    <div className={cn("min-w-0 rounded-[24px] border p-5", getToneClass(tone))}>
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

export default function SettingsPage() {
  const {
    settings,
    automation,
    selectedDevice,
    updateSetting,
    updateAutomation,
    resetSettings,
    resetAutomation,
  } = useAppState();

  const selectedExtra = selectedDevice as DeviceExtra;
  const telemetryReady = hasTelemetry(selectedExtra);

  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;
  const physicalPumpLocked = safeModeActive || !pumpEnabled;

  const sensorStatus = getSensorStatus(selectedExtra);

  const relayState =
    selectedExtra.relayState ??
    (safeModeActive || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    selectedExtra.pumpState ??
    (safeModeActive || !pumpEnabled ? "Dry-run" : "Ready");

  const waterLevelStatus = selectedExtra.waterLevelStatus ?? "Pending";
  const rainStatus = selectedExtra.rainStatus ?? "Pending";
  const buttonStatus = selectedExtra.buttonStatus ?? "Pending";
  const oledStatus = selectedExtra.oledStatus ?? "Pending";
  const firmware = selectedExtra.firmware ?? "greencloud-esp32-final";

  const rawSoil = telemetryReady ? rawLabel(selectedExtra.rawSoil) : "—";
  const soilVoltage = telemetryReady
    ? voltageLabel(selectedExtra.soilVoltage)
    : "—";

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Waiting";

  const signalLabel = telemetryReady ? `${selectedDevice.signal}%` : "Waiting";

  const activeThemeLabel =
    themes.find((theme) => theme.value === settings.themePreset)?.label ??
    toTitleCase(settings.themePreset);

  const activeAmbienceLabel =
    ambiences.find((item) => item.value === settings.ambienceMode)?.label ??
    toTitleCase(settings.ambienceMode);

  return (
    <AppShell
      title="GreenCloud Settings"
      subtitle="Project identity, interface polish, automation defaults and protected hardware state."
    >
      <div className="w-full max-w-none space-y-6">
        <GlassCard className="overflow-hidden p-6">
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="min-w-0">
              <SectionBadge>System configuration</SectionBadge>

              <h2 className="mt-5 max-w-[14ch] text-[clamp(2.4rem,4.2vw,4.9rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-[var(--gc-text)]">
                Settings for the final GreenCloud system.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                Manage project identity, interface theme, automation values and
                safe hardware messaging from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <StatusPill label="Firebase Auth ready" tone="live" />
                <StatusPill label="Realtime Database live" tone="live" />
                <StatusPill
                  label={safeModeActive ? "Pump safe-mode" : "Pump output live"}
                  tone={safeModeActive ? "safe" : "warning"}
                />
                <StatusPill
                  label={pumpEnabled ? "PUMP_ENABLED=true" : "PUMP_ENABLED=false"}
                  tone={pumpEnabled ? "warning" : "safe"}
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SummaryTile
                label="Theme"
                value={activeThemeLabel}
                detail="Current visual preset."
                icon={Sparkles}
                tone="safe"
              />

              <SummaryTile
                label="Ambience"
                value={settings.leafAmbience ? activeAmbienceLabel : "Calm"}
                detail="Background effect."
                icon={Leaf}
                tone="pending"
              />

              <SummaryTile
                label="Threshold"
                value={`${automation.moistureThreshold}%`}
                detail="Dry-risk point."
                icon={Gauge}
                tone="live"
              />

              <SummaryTile
                label="Pump safety"
                value={physicalPumpLocked ? "Safe" : "Live"}
                detail={physicalPumpLocked ? "Relay locked." : "Output enabled."}
                icon={Lock}
                tone={physicalPumpLocked ? "safe" : "warning"}
              />
            </div>
          </div>
        </GlassCard>

        <section className="grid items-stretch gap-6 lg:grid-cols-2">
          <GlassCard className="h-full p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SectionBadge>Appearance</SectionBadge>

                <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Interface theme
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                  Pick the visual style used across the workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={resetSettings}
                className="premium-btn-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Reset UI
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {themes.map((theme) => (
                <ChoiceCard
                  key={theme.value}
                  active={settings.themePreset === theme.value}
                  title={theme.label}
                  description={theme.description}
                  icon={theme.icon}
                  onClick={() => updateSetting("themePreset", theme.value)}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ToggleRow
                title="Animations"
                subtitle="Enable transitions and visual motion."
                active={settings.animations}
                onClick={() =>
                  updateSetting("animations", !settings.animations)
                }
              />

              <ToggleRow
                title="Compact mode"
                subtitle="Reduce spacing for smaller laptop screens."
                active={settings.compactMode}
                onClick={() =>
                  updateSetting("compactMode", !settings.compactMode)
                }
              />
            </div>
          </GlassCard>

          <GlassCard className="h-full p-6">
            <SectionBadge>Ambience</SectionBadge>

            <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
              Background effect
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
              Choose a subtle visual layer for the smart irrigation theme.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {ambiences.map((ambience) => {
                const Icon = ambience.icon;
                const active =
                  ambience.value === "calm"
                    ? !settings.leafAmbience || settings.ambienceMode === "calm"
                    : settings.leafAmbience &&
                      settings.ambienceMode === ambience.value;

                return (
                  <button
                    key={ambience.value}
                    type="button"
                    onClick={() => {
                      updateSetting("ambienceMode", ambience.value);
                      updateSetting("leafAmbience", ambience.value !== "calm");
                    }}
                    className={cn(
                      "flex min-w-0 items-center gap-3 rounded-[24px] border p-4 text-left transition duration-300",
                      active
                        ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
                        : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="truncate text-sm font-semibold">
                      {ambience.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <ToggleRow
                title="Ambient layer"
                subtitle="Show the selected background ambience."
                active={settings.leafAmbience}
                onClick={() =>
                  updateSetting("leafAmbience", !settings.leafAmbience)
                }
              />
            </div>
          </GlassCard>
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <GlassCard className="h-full p-6">
            <SectionBadge>Project identity</SectionBadge>

            <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
              Labels across the site
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
              These values appear in the sidebar, dashboard, device cards and
              landing page.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <TextInput
                label="Workspace name"
                value={settings.workspaceName}
                onChange={(value) => updateSetting("workspaceName", value)}
                placeholder="GreenCloud Workspace"
              />

              <TextInput
                label="Project name"
                value={settings.projectName}
                onChange={(value) => updateSetting("projectName", value)}
                placeholder="GreenCloud"
              />

              <TextInput
                label="Owner name"
                value={settings.ownerName}
                onChange={(value) => updateSetting("ownerName", value)}
                placeholder="Operator"
              />

              <TextInput
                label="Main plant label"
                value={settings.mainPlantLabel}
                onChange={(value) => updateSetting("mainPlantLabel", value)}
                placeholder="Main Pot"
              />
            </div>
          </GlassCard>

          <GlassCard className="h-full p-6">
            <SectionBadge>Selected node</SectionBadge>

            <div className="mt-4 min-w-0">
              <h3 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                {selectedDevice.name}
              </h3>

              <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--gc-soft)]">
                {selectedDevice.place}
              </p>

              <div className="mt-4 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/16 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                  Device ID
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-[var(--gc-text)]">
                  {selectedDevice.id}
                </p>
              </div>

              <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
                <SummaryTile
                  label="Status"
                  value={selectedDevice.status}
                  detail={`Seen ${getLastSeenLabel(selectedExtra)}.`}
                  icon={Cpu}
                  tone={
                    selectedDevice.status === "Online"
                      ? "live"
                      : selectedDevice.status === "Offline"
                        ? "offline"
                        : "pending"
                  }
                />

                <SummaryTile
                  label="Moisture"
                  value={moistureLabel}
                  detail={
                    telemetryReady
                      ? "Mapped soil percentage."
                      : "Waiting for ESP32 telemetry."
                  }
                  icon={Droplets}
                  tone={telemetryReady ? "live" : "pending"}
                />

                <SummaryTile
                  label="RAW"
                  value={rawSoil}
                  detail={`ADC reading · ${soilVoltage}`}
                  icon={Radio}
                  tone={
                    !telemetryReady
                      ? "pending"
                      : sensorStatus.toLowerCase().includes("sensor check")
                        ? "warning"
                        : "safe"
                  }
                />

                <SummaryTile
                  label="Signal"
                  value={signalLabel}
                  detail="ESP32 Wi-Fi state."
                  icon={Wifi}
                  tone={telemetryReady ? "live" : "pending"}
                />

                <SummaryTile
                  label="Sensor"
                  value={sensorStatus}
                  detail="Current sensor status."
                  icon={Leaf}
                  tone={statusTone(sensorStatus)}
                />
              </div>
            </div>
          </GlassCard>
        </section>

        <GlassCard className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <SectionBadge>Hardware safety</SectionBadge>

              <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Wiring and protection state
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--gc-soft)]">
                Live parts, safety locks and final wiring fields are shown as
                the ESP32/Firebase schema reports them.
              </p>
            </div>

            <StatusPill
              label={pumpEnabled ? "PUMP_ENABLED=true" : "PUMP_ENABLED=false"}
              tone={pumpEnabled ? "warning" : "safe"}
            />
          </div>

          <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))]">
            <HardwareSettingCard
              title="ESP32 DevKit V1"
              value={
                selectedDevice.status === "Online"
                  ? "Live"
                  : selectedDevice.status
              }
              description="Reads sensors and writes telemetry."
              icon={Cpu}
              tone={
                selectedDevice.status === "Online"
                  ? "live"
                  : selectedDevice.status === "Offline"
                    ? "offline"
                    : "pending"
              }
            />

            <HardwareSettingCard
              title="Soil sensor"
              value={sensorStatus}
              description="AO output is connected to D32."
              icon={Leaf}
              tone={statusTone(sensorStatus)}
            />

            <HardwareSettingCard
              title="OLED display"
              value={oledStatus}
              description="Shows local ESP32/Firebase status."
              icon={Monitor}
              tone={statusTone(oledStatus)}
            />

            <HardwareSettingCard
              title="Relay module"
              value={relayState}
              description="Relay output is firmware-protected."
              icon={Lock}
              tone={statusTone(relayState)}
            />

            <HardwareSettingCard
              title="DC pump"
              value={pumpState}
              description="Physical pump remains dry-run until final wiring."
              icon={Power}
              tone={statusTone(pumpState)}
            />

            <HardwareSettingCard
              title="Float sensor"
              value={waterLevelStatus}
              description="Tank protection field is ready."
              icon={Waves}
              tone={statusTone(waterLevelStatus)}
            />

            <HardwareSettingCard
              title="Rain sensor"
              value={rainStatus}
              description="Rain lockout field is ready."
              icon={CloudRain}
              tone={statusTone(rainStatus)}
            />

            <HardwareSettingCard
              title="KY-004 button"
              value={buttonStatus}
              description="Local manual trigger field is ready."
              icon={ToggleLeft}
              tone={statusTone(buttonStatus)}
            />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <SectionBadge>Automation defaults</SectionBadge>

              <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Irrigation rule values
              </h3>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--gc-soft)]">
                Dashboard and Automation pages use these same values. In
                safe-mode, pump commands are still handled as dry-run.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAutomation}
              className="premium-btn-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Reset rules
            </button>
          </div>

          <div className="mt-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            <RangeControl
              label="Moisture threshold"
              description="Below this percentage, the plant becomes dry-risk."
              value={automation.moistureThreshold}
              min={5}
              max={90}
              suffix="%"
              onChange={(value) =>
                updateAutomation({ moistureThreshold: value })
              }
            />

            <RangeControl
              label="Cooldown window"
              description="Minimum wait time between watering commands."
              value={automation.cooldownMinutes}
              min={1}
              max={120}
              suffix=" min"
              onChange={(value) =>
                updateAutomation({ cooldownMinutes: value })
              }
            />

            <RangeControl
              label="Pump duration"
              description="Runtime sent to ESP32 command path."
              value={automation.pumpDurationSeconds}
              min={1}
              max={60}
              suffix="s"
              onChange={(value) =>
                updateAutomation({ pumpDurationSeconds: value })
              }
            />
          </div>

          <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            <ToggleRow
              title="Automatic irrigation"
              subtitle="Allow threshold logic to request watering."
              active={automation.autoIrrigationEnabled}
              onClick={() =>
                updateAutomation({
                  autoIrrigationEnabled: !automation.autoIrrigationEnabled,
                })
              }
            />

            <ToggleRow
              title="Manual override"
              subtitle="Allow dashboard buttons to send commands."
              active={automation.manualOverrideEnabled}
              onClick={() => {
                const nextValue = !automation.manualOverrideEnabled;

                updateAutomation({
                  manualOverrideEnabled: nextValue,
                  manualOverride: nextValue,
                });
              }}
            />

            <ToggleRow
              title="Quiet hours"
              subtitle="Block automatic watering during selected hours."
              active={automation.quietHoursEnabled}
              onClick={() =>
                updateAutomation({
                  quietHoursEnabled: !automation.quietHoursEnabled,
                })
              }
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TimeInput
              label="Quiet hours start"
              value={automation.quietHoursStart}
              onChange={(value) =>
                updateAutomation({
                  quietHoursStart: value,
                  quietStart: value,
                })
              }
            />

            <TimeInput
              label="Quiet hours end"
              value={automation.quietHoursEnd}
              onChange={(value) =>
                updateAutomation({
                  quietHoursEnd: value,
                  quietEnd: value,
                })
              }
            />
          </div>
        </GlassCard>

        <section className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <GlassCard className="h-full p-6">
            <SectionBadge>Notifications</SectionBadge>

            <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
              Alert behavior
            </h3>

            <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
              Choose how much system feedback appears in the workspace.
            </p>

            <div className="mt-6 grid gap-3">
              {notificationModes.map((mode) => (
                <ChoiceCard
                  key={mode.value}
                  active={settings.notificationMode === mode.value}
                  title={mode.label}
                  description={mode.description}
                  onClick={() => updateSetting("notificationMode", mode.value)}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="h-full p-6">
            <SectionBadge>Readiness checklist</SectionBadge>

            <div className="mt-5 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
              <HardwareSettingCard
                title="Firebase Auth"
                value="Ready"
                description="Each user has a separate UID path."
                icon={ShieldCheck}
                tone="live"
              />

              <HardwareSettingCard
                title="Realtime Database"
                value="Live"
                description="ESP32 writes telemetry and handles commands."
                icon={Wifi}
                tone="live"
              />

              <HardwareSettingCard
                title="Firmware"
                value={firmware}
                description="ESP32 code uses the GreenCloud schema."
                icon={Radio}
                tone="safe"
              />

              <HardwareSettingCard
                title="Power setup"
                value={selectedExtra.power ?? "USB / Adapter"}
                description="Pump power stays separate from ESP32."
                icon={PlugZap}
                tone="safe"
              />

              <HardwareSettingCard
                title="Command result"
                value={selectedExtra.lastCommandStatus ?? "None"}
                description="Latest ESP32 command handling state."
                icon={CheckCircle2}
                tone={statusTone(selectedExtra.lastCommandStatus ?? "None")}
              />

              <HardwareSettingCard
                title="Pump protection"
                value={physicalPumpLocked ? "Safe" : "Live"}
                description={
                  physicalPumpLocked
                    ? "Relay remains locked until final wiring."
                    : "Physical pump output can be enabled."
                }
                icon={AlertTriangle}
                tone={physicalPumpLocked ? "safe" : "warning"}
              />
            </div>
          </GlassCard>
        </section>

        <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--gc-text)]">
              Settings apply instantly.
            </p>

            <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
              The app state provider saves changes automatically and syncs them
              with Firebase when a user is signed in.
            </p>
          </div>

          <span className="premium-btn inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm">
            <Save className="h-4 w-4" />
            Synced
          </span>
        </GlassCard>
      </div>
    </AppShell>
  );
}