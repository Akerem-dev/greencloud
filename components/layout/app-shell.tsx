"use client";

import { useMemo, useState, type ReactNode } from "react";
import { RotateCcw, Save, Sparkles, X } from "lucide-react";
import AuthGate from "@/components/auth/auth-gate";
import AmbientOrbs from "@/components/effects/ambient-orbs";
import LeafFallOverlay from "@/components/effects/leaf-fall-overlay";
import AppSidebar from "@/components/layout/app-sidebar";
import AppTopbar from "@/components/layout/app-topbar";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import {
  type AmbienceMode,
  type ThemePreset,
  useAppState,
} from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

type ShellDeviceExtra = {
  rawSoil?: number;
  soilVoltage?: number;
  temperature?: number;
  temp?: number;
  pressure?: number;
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: string;
  pumpState?: string;
  rainStatus?: string;
  waterLevelStatus?: string;
  buttonStatus?: string;
  oledStatus?: string;
  firmware?: string;
  lastSeenMs?: number;
  lastCommandStatus?: string;
  updatedAt?: string;
  signal?: number;
  status?: string;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

const themeChoices: Array<{ label: string; value: ThemePreset }> = [
  { label: "Botanical dark", value: "botanical-dark" },
  { label: "Forest mist", value: "forest-mist" },
  { label: "Aurora gold", value: "aurora-gold" },
  { label: "Midnight moss", value: "midnight-moss" },
  { label: "Golden hour", value: "golden-hour" },
  { label: "Rain glass", value: "rain-glass" },
];

const ambienceChoices: Array<{ label: string; value: AmbienceMode }> = [
  { label: "Leaves", value: "leaves" },
  { label: "Rain", value: "rain" },
  { label: "Mist", value: "mist" },
  { label: "Wind", value: "wind" },
  { label: "Fireflies", value: "fireflies" },
  { label: "Calm", value: "calm" },
];

function hasTelemetry(
  device: ShellDeviceExtra & { status?: string; signal?: number },
) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    Number(device.signal) > 0
  );
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
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_12%,transparent)] text-[var(--gc-text)]";
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

function getSensorStatus(device: ShellDeviceExtra & { status?: string }) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Pending";
}

function numberLabel(value: unknown, fallback = "—") {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : fallback;
}

function rawLabel(value: unknown) {
  return numberLabel(value, "—");
}

function voltageLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)}V`
    : "—";
}

function temperatureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)}°C`
    : "Pending";
}

function pressureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)} hPa`
    : "Pending";
}

function getLastSeenLabel(device: ShellDeviceExtra) {
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
        toneClass(tone ?? statusTone(label)),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function SettingRow({
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
    <div className="min-w-0 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--gc-text)]">
            {title}
          </p>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onClick}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
            active
              ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
          )}
        >
          {active ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "max-w-full rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
      )}
    >
      <span className="block truncate">{children}</span>
    </button>
  );
}

function StateTile({
  label,
  value,
  tone = "pending",
}: {
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)]"
          : toneClass(tone),
      )}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
        {label}
      </p>

      <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>
    </div>
  );
}

export default function AppShell({
  title,
  subtitle,
  children,
}: AppShellProps) {
  const {
    notificationsOpen,
    quickPanelOpen,
    closeNotifications,
    closeQuickPanel,
    notifications,
    markAllNotificationsRead,
    settings,
    updateSetting,
    resetSettings,
    searchQuery,
    isBootLoading,
    selectedDevice,
    automation,
  } = useAppState();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const selectedExtra = selectedDevice as typeof selectedDevice &
    ShellDeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);

  const rawSoil = telemetryReady ? rawLabel(selectedExtra.rawSoil) : "—";
  const soilVoltage = telemetryReady
    ? voltageLabel(selectedExtra.soilVoltage)
    : "—";

  const temperatureSource =
    typeof selectedExtra.temperature === "number"
      ? selectedExtra.temperature
      : selectedExtra.temp;

  const temperature = temperatureLabel(temperatureSource);
  const pressure = pressureLabel(selectedExtra.pressure);

  const temperatureReady =
    typeof temperatureSource === "number" && Number.isFinite(temperatureSource);

  const pressureReady =
    typeof selectedExtra.pressure === "number" &&
    Number.isFinite(selectedExtra.pressure);

  const sensorStatus = getSensorStatus(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;

  const relayState =
    selectedExtra.relayState ??
    (safeModeActive || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    selectedExtra.pumpState ??
    (safeModeActive || !pumpEnabled ? "Dry-run" : "Ready");

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Waiting";

  const signalLabel = telemetryReady
    ? `${selectedDevice.signal}%`
    : "Waiting";

  const currentAmbience = settings.leafAmbience
    ? settings.ambienceMode
    : "calm";

  const shellPad = settings.compactMode
    ? "px-3 py-3 sm:px-4 lg:px-5"
    : "px-3 py-4 sm:px-5 lg:px-6";

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const applyAmbienceMode = (value: AmbienceMode) => {
    updateSetting("ambienceMode", value);
    updateSetting("leafAmbience", value !== "calm");
  };

  return (
    <AuthGate>
      <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
        <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_15%,transparent),transparent_32%),radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--gc-accent-2)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

        <AmbientOrbs themePreset={settings.themePreset} />

        <div className="fixed inset-0 -z-30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-accent)_8%,transparent),transparent_24%,color-mix(in_srgb,var(--gc-accent-2)_6%,transparent)_74%,transparent)]" />

        {!isBootLoading && settings.leafAmbience ? (
          <LeafFallOverlay mode={settings.ambienceMode} />
        ) : null}

        <div
          className={cn(
            "relative z-10 mx-auto w-full max-w-[1680px]",
            shellPad,
          )}
        >
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
            <div className="hidden self-start xl:block">
              <div className="sticky top-4 h-[calc(100dvh-32px)] min-h-[calc(100dvh-32px)]">
                <AppSidebar />
              </div>
            </div>

            <div className="min-w-0">
              <AppTopbar
                title={title}
                subtitle={subtitle}
                onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              />

              {searchQuery ? (
                <div className="mt-4">
                  <GlassCard className="px-4 py-3">
                    <SectionBadge>Workspace search</SectionBadge>

                    <p className="mt-3 text-sm text-[var(--gc-soft)]">
                      Filtering GreenCloud workspace for{" "}
                      <span className="font-semibold text-[var(--gc-text)]">
                        {searchQuery}
                      </span>
                    </p>
                  </GlassCard>
                </div>
              ) : null}

              <div className="mt-6 min-w-0">{children}</div>
            </div>
          </div>
        </div>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-[95] bg-black/65 backdrop-blur-[6px] xl:hidden">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation"
            />

            <div className="absolute bottom-3 left-3 top-3 w-[min(92vw,390px)]">
              <div className="relative h-full">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="premium-btn-secondary absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label="Close navigation"
                >
                  <X className="h-4 w-4" />
                </button>

                <AppSidebar />
              </div>
            </div>
          </div>
        ) : null}

        {notificationsOpen ? (
          <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[6px]">
            <button
              type="button"
              className="absolute inset-0"
              onClick={closeNotifications}
              aria-label="Close notifications"
            />

            <div className="absolute inset-x-3 top-3 mx-auto w-[min(460px,calc(100vw-24px))] sm:inset-x-auto sm:right-4 sm:mx-0">
              <GlassCard className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <SectionBadge>Alerts</SectionBadge>

                    <h3 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                      GreenCloud events
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                      Device sync, sensor readings, protected commands and
                      safety messages.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="premium-btn-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={`${unreadCount} unread`}
                    tone={unreadCount > 0 ? "warning" : "live"}
                  />

                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="premium-btn-secondary rounded-full px-4 py-2 text-sm"
                  >
                    Mark read
                  </button>
                </div>

                <div className="gc-scrollbar mt-5 max-h-[72vh] space-y-3 overflow-y-auto pr-2">
                  {notifications.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] p-5">
                      <p className="text-lg font-semibold text-[var(--gc-text)]">
                        No alerts yet.
                      </p>

                      <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                        Commands, threshold warnings, sensor checks and sync
                        events will appear here.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "gc-panel-hover min-w-0 rounded-[22px] border p-4",
                          item.read
                            ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)]"
                            : "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-semibold text-[var(--gc-text)]">
                            {item.title}
                          </p>

                          {!item.read ? (
                            <span className="shrink-0 rounded-full bg-[var(--gc-accent)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#11160d] shadow-[0_0_16px_var(--gc-glow)]">
                              New
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                          {item.description || item.body}
                        </p>

                        <p className="mt-2 text-xs text-[var(--gc-muted)]">
                          {item.createdAt}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        ) : null}

        {quickPanelOpen ? (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[8px]">
            <button
              type="button"
              className="absolute inset-0"
              onClick={closeQuickPanel}
              aria-label="Close quick settings"
            />

            <div className="absolute inset-x-3 top-3 mx-auto w-[min(1120px,calc(100vw-24px))]">
              <GlassCard className="overflow-hidden p-0">
                <div className="border-b border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] p-5 md:p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <SectionBadge>Quick controls</SectionBadge>

                      <h3 className="mt-4 text-[clamp(2.4rem,5vw,4.4rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                        GreenCloud workspace
                      </h3>

                      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                        Fast controls for theme, ambience, layout density and
                        live device state.
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={resetSettings}
                        className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </button>

                      <button
                        type="button"
                        onClick={closeQuickPanel}
                        className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
                        aria-label="Close quick settings"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="gc-scrollbar max-h-[76vh] overflow-y-auto p-5 md:p-6">
                  <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
                    <div className="min-w-0 rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] p-5">
                      <SectionBadge>Live device state</SectionBadge>

                      <h4 className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                        {selectedDevice.name}
                      </h4>

                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-[var(--gc-soft)]">
                        {selectedDevice.place}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <StatusPill
                          label={selectedDevice.status}
                          tone={statusTone(selectedDevice.status)}
                        />
                        <StatusPill
                          label={sensorStatus}
                          tone={statusTone(sensorStatus)}
                        />
                        <StatusPill
                          label={pumpEnabled ? "Pump live" : pumpState}
                          tone={pumpEnabled ? "warning" : "safe"}
                        />
                        <StatusPill
                          label={relayState}
                          tone={statusTone(relayState)}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                        <StateTile
                          label="Moisture"
                          value={moistureLabel}
                          tone={telemetryReady ? statusTone(sensorStatus) : "pending"}
                        />

                        <StateTile
                          label="Signal"
                          value={signalLabel}
                          tone={telemetryReady ? "live" : "pending"}
                        />

                        <StateTile
                          label="Raw soil"
                          value={rawSoil}
                          tone={
                            !telemetryReady
                              ? "pending"
                              : statusTone(sensorStatus) === "warning"
                                ? "warning"
                                : "safe"
                          }
                        />

                        <StateTile
                          label="Voltage"
                          value={soilVoltage}
                          tone={soilVoltage === "—" ? "pending" : "safe"}
                        />

                        <StateTile
                          label="Temperature"
                          value={temperature}
                          tone={temperatureReady ? "live" : "pending"}
                        />

                        <StateTile
                          label="Pressure"
                          value={pressure}
                          tone={pressureReady ? "safe" : "pending"}
                        />

                        <StateTile
                          label="Seen"
                          value={getLastSeenLabel(selectedExtra)}
                          tone="pending"
                        />

                        <StateTile
                          label="Command"
                          value={selectedExtra.lastCommandStatus ?? "None"}
                          tone={statusTone(
                            selectedExtra.lastCommandStatus ?? "None",
                          )}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-6">
                      <GlassCard className="p-5">
                        <SectionBadge>Theme preset</SectionBadge>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {themeChoices.map((theme) => (
                            <ChoiceButton
                              key={theme.value}
                              active={settings.themePreset === theme.value}
                              onClick={() =>
                                updateSetting("themePreset", theme.value)
                              }
                            >
                              {theme.label}
                            </ChoiceButton>
                          ))}
                        </div>
                      </GlassCard>

                      <GlassCard className="p-5">
                        <SectionBadge>Ambience mode</SectionBadge>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {ambienceChoices.map((ambience) => (
                            <ChoiceButton
                              key={ambience.value}
                              active={currentAmbience === ambience.value}
                              onClick={() => applyAmbienceMode(ambience.value)}
                            >
                              {ambience.label}
                            </ChoiceButton>
                          ))}
                        </div>
                      </GlassCard>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <SettingRow
                          title="Animations"
                          subtitle="Enable smooth transitions."
                          active={settings.animations}
                          onClick={() =>
                            updateSetting("animations", !settings.animations)
                          }
                        />

                        <SettingRow
                          title="Compact mode"
                          subtitle="Use tighter spacing on small screens."
                          active={settings.compactMode}
                          onClick={() =>
                            updateSetting("compactMode", !settings.compactMode)
                          }
                        />

                        <SettingRow
                          title="Ambient layer"
                          subtitle="Show or hide environmental visuals."
                          active={settings.leafAmbience}
                          onClick={() =>
                            updateSetting(
                              "leafAmbience",
                              !settings.leafAmbience,
                            )
                          }
                        />

                        <div className="min-w-0 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] p-4">
                          <p className="text-sm font-semibold text-[var(--gc-text)]">
                            Notification mode
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
                            Choose priority alerts or every workspace event.
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ChoiceButton
                              active={settings.notificationMode === "priority"}
                              onClick={() =>
                                updateSetting("notificationMode", "priority")
                              }
                            >
                              Priority
                            </ChoiceButton>

                            <ChoiceButton
                              active={settings.notificationMode === "all"}
                              onClick={() =>
                                updateSetting("notificationMode", "all")
                              }
                            >
                              All
                            </ChoiceButton>
                          </div>
                        </div>
                      </div>

                      <GlassCard className="p-5">
                        <SectionBadge>Automation snapshot</SectionBadge>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <StateTile
                            label="Mode"
                            value={automation.mode}
                            tone="pending"
                          />

                          <StateTile
                            label="Threshold"
                            value={`${automation.moistureThreshold}%`}
                            tone="safe"
                          />

                          <StateTile
                            label="Command"
                            value={`${automation.pumpDurationSeconds}s`}
                            tone={pumpEnabled ? "warning" : "safe"}
                          />
                        </div>
                      </GlassCard>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_76%,black)] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gc-text)]">
                          <Sparkles className="h-4 w-4 text-[var(--gc-accent-2)]" />
                          Quick controls apply instantly
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                          Use Settings for workspace labels, quiet hours,
                          thresholds and full hardware safety details.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={closeQuickPanel}
                        className="premium-btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm"
                      >
                        <Save className="h-4 w-4" />
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        ) : null}
      </main>
    </AuthGate>
  );
}