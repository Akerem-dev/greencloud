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

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "pending" || lower === "none") return "Ready";
  if (lower === "idle") return "Standby";
  if (lower === "dry-run" || lower.includes("dry-run")) return "Protected";
  if (lower === "locked" || lower === "safe") return "Protected";
  if (lower === "handled") return "Completed";
  if (lower === "sensor check") return "Calibrating";
  if (lower === "ok") return "Safe";

  return value;
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_68%,transparent)] text-[var(--gc-soft)]";
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
    lower.includes("seen") ||
    lower.includes("completed")
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
    lower.includes("blocked") ||
    lower.includes("calibrating")
  ) {
    return "warning";
  }

  return "pending";
}

function getSensorStatus(device: ShellDeviceExtra & { status?: string }) {
  if (device.sensorStatus) return displayStatus(device.sensorStatus);
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Ready";
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
    : "Ready";
}

function pressureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)} hPa`
    : "Ready";
}

function getLastSeenLabel(device: ShellDeviceExtra) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Ready";
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

function StatusPill({ label, tone }: { label: string; tone?: Tone }) {
  const visibleLabel = displayStatus(label);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(tone ?? statusTone(visibleLabel)),
      )}
    >
      <span className="truncate">{visibleLabel}</span>
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
    <div className="min-w-0 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_76%,transparent)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]">
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
              ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-text)] shadow-[0_0_18px_var(--gc-glow)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_64%,transparent)] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.035] hover:text-[var(--gc-text)]",
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
          ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-text)] shadow-[0_0_18px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_60%,transparent)] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.035] hover:text-[var(--gc-text)]",
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
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.012)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_76%,transparent)]"
          : toneClass(tone),
      )}
    >
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
        {label}
      </p>

      <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.6rem,2.4vw,2.35rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {displayStatus(String(value))}
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
    (safeModeActive || !pumpEnabled ? "Protected" : "Enabled");

  const pumpState =
    selectedExtra.pumpState ??
    (safeModeActive || !pumpEnabled ? "Protected" : "Ready");

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Ready";

  const signalLabel = telemetryReady ? `${selectedDevice.signal}%` : "Ready";

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
        <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_11%,transparent),transparent_32%),radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--gc-accent-2)_7%,transparent),transparent_28%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

        <AmbientOrbs themePreset={settings.themePreset} />

        <div className="fixed inset-0 -z-30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-accent)_4%,transparent),transparent_24%,color-mix(in_srgb,var(--gc-accent-2)_3%,transparent)_74%,transparent)]" />

        {!isBootLoading && settings.leafAmbience ? (
          <LeafFallOverlay mode={settings.ambienceMode} />
        ) : null}

        <div className={cn("relative z-10 w-full", shellPad)}>
          <div className="mx-auto grid w-full max-w-[1840px] grid-cols-1 gap-5 xl:grid-cols-[290px_minmax(0,1fr)] 2xl:grid-cols-[310px_minmax(0,1fr)]">
            <div className="hidden min-w-0 xl:block">
              <div className="sticky top-4 h-[calc(100dvh-32px)] min-h-0 overflow-hidden">
                <AppSidebar />
              </div>
            </div>

            <section className="min-w-0">
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
                      Showing GreenCloud workspace results for{" "}
                      <span className="font-semibold text-[var(--gc-text)]">
                        {searchQuery}
                      </span>
                    </p>
                  </GlassCard>
                </div>
              ) : null}

              <div className="mt-5 min-w-0">{children}</div>
            </section>
          </div>
        </div>

        {mobileSidebarOpen ? (
          <div className="fixed inset-0 z-[95] bg-black/62 backdrop-blur-[7px] xl:hidden">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation"
            />

            <div className="absolute bottom-3 left-3 top-3 w-[min(92vw,360px)]">
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
          <div className="fixed inset-0 z-[100] overflow-hidden bg-black/62 backdrop-blur-[8px]">
            <button
              type="button"
              className="fixed inset-0 z-0"
              onClick={closeNotifications}
              aria-label="Close notifications"
            />

            <section
              className={cn(
                "fixed bottom-3 right-3 top-3 z-20 flex w-[min(520px,calc(100vw-24px))] min-h-0 flex-col overflow-hidden rounded-[34px] border",
                "border-[color-mix(in_srgb,var(--gc-border)_60%,transparent)]",
                "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-bg)_82%,black),color-mix(in_srgb,var(--gc-bg)_92%,black))]",
                "shadow-[0_34px_100px_rgba(0,0,0,0.52),0_0_42px_color-mix(in_srgb,var(--gc-glow)_28%,transparent),inset_0_1px_0_rgba(255,255,255,0.024)]",
                "backdrop-blur-2xl",
              )}
              onWheel={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--gc-accent)_9%,transparent),transparent_38%),radial-gradient(circle_at_92%_8%,color-mix(in_srgb,var(--gc-accent-2)_7%,transparent),transparent_34%)]" />

              <div className="relative z-10 shrink-0 border-b border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <SectionBadge>Alerts center</SectionBadge>

                    <h3 className="mt-4 text-[clamp(2.25rem,5vw,3.8rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                      GreenCloud events
                    </h3>

                    <p className="mt-3 max-w-md text-sm leading-6 text-[var(--gc-soft)]">
                      Device sync, sensor checks, protected commands and
                      workspace updates appear here.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="premium-btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={`${unreadCount} unread`}
                    tone={unreadCount > 0 ? "warning" : "live"}
                  />

                  <StatusPill
                    label={`${notifications.length} total`}
                    tone="pending"
                  />

                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="premium-btn-secondary rounded-full px-4 py-2 text-sm"
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              <div
                className="modal-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 pr-3 sm:p-5 sm:pr-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {notifications.length === 0 ? (
                  <div className="flex h-full min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_70%,transparent)] p-6 text-center">
                    <div className="max-w-xs">
                      <SectionBadge>No alerts</SectionBadge>

                      <h4 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-semibold leading-none tracking-[-0.07em] text-[var(--gc-text)]">
                        All clear.
                      </h4>

                      <p className="mt-3 text-sm leading-6 text-[var(--gc-soft)]">
                        Commands, pairing events, sensor checks and Firebase
                        sync messages will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((item, index) => {
                      const isUnread = !item.read;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group relative min-w-0 overflow-hidden rounded-[26px] border p-4 transition duration-300",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.018),0_16px_34px_rgba(0,0,0,0.14)]",
                            isUnread
                              ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_12%,transparent),rgba(255,255,255,0.022))]"
                              : "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))]",
                          )}
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_srgb,var(--gc-accent)_7%,transparent),transparent_40%)] opacity-0 transition duration-300 group-hover:opacity-100" />

                          <div className="relative z-10 flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border text-sm font-bold",
                                isUnread
                                  ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)] shadow-[0_0_18px_var(--gc-glow)]"
                                  : "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-black/14 text-[var(--gc-soft)]",
                              )}
                            >
                              #{index + 1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-base font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                                    {item.title}
                                  </p>

                                  <p className="mt-1 text-xs font-medium text-[var(--gc-muted)]">
                                    {item.createdAt}
                                  </p>
                                </div>

                                {isUnread ? (
                                  <span className="shrink-0 rounded-full bg-[var(--gc-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#11160d] shadow-[0_0_16px_var(--gc-glow)]">
                                    New
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-black/14 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--gc-muted)]">
                                    Read
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--gc-soft)]">
                                {item.description || item.body}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="relative z-10 shrink-0 border-t border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-black/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--gc-text)]">
                      Alert stream is synced.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--gc-muted)]">
                      Firebase, ESP32 events and protected command results are
                      listed here.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeNotifications}
                    className="premium-btn inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5 text-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {quickPanelOpen ? (
          <div className="fixed inset-0 z-[110] overflow-hidden bg-black/62 backdrop-blur-[10px]">
            <button
              type="button"
              className="fixed inset-0 z-0"
              onClick={closeQuickPanel}
              aria-label="Close quick settings"
            />

            <section
              className={cn(
                "fixed bottom-3 left-1/2 top-3 z-20 flex w-[min(1120px,calc(100vw-24px))] min-h-0 -translate-x-1/2 flex-col overflow-hidden rounded-[34px] border",
                "border-[color-mix(in_srgb,var(--gc-border)_60%,transparent)]",
                "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-bg)_82%,black),color-mix(in_srgb,var(--gc-bg)_92%,black))]",
                "shadow-[0_34px_100px_rgba(0,0,0,0.52),0_0_46px_color-mix(in_srgb,var(--gc-glow)_32%,transparent),inset_0_1px_0_rgba(255,255,255,0.024)]",
                "backdrop-blur-2xl",
              )}
              onWheel={(event) => event.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,color-mix(in_srgb,var(--gc-accent)_9%,transparent),transparent_38%),radial-gradient(circle_at_90%_0%,color-mix(in_srgb,var(--gc-accent-2)_9%,transparent),transparent_36%)]" />

              <div className="relative z-10 shrink-0 border-b border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] p-5 md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <SectionBadge>Quick controls</SectionBadge>

                    <h3 className="mt-4 text-[clamp(2.35rem,5vw,4.2rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                      GreenCloud workspace
                    </h3>

                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                      Fast controls for theme, ambience, layout density and live
                      device state.
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

              <div
                className="modal-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-5 pr-3 md:p-6 md:pr-4"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="grid min-h-0 items-start gap-6 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
                  <div className="min-w-0 rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_76%,transparent)] p-5">
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

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <StateTile
                        label="Moisture"
                        value={moistureLabel}
                        tone={
                          telemetryReady
                            ? statusTone(sensorStatus)
                            : "pending"
                        }
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
                        value={displayStatus(
                          selectedExtra.lastCommandStatus ?? "Ready",
                        )}
                        tone={statusTone(
                          selectedExtra.lastCommandStatus ?? "Ready",
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
                          updateSetting("leafAmbience", !settings.leafAmbience)
                        }
                      />

                      <div className="min-w-0 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_76%,transparent)] p-4">
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
              </div>

              <div className="relative z-10 shrink-0 border-t border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-black/10 p-4 md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gc-text)]">
                      <Sparkles className="h-4 w-4 text-[var(--gc-accent-2)]" />
                      Quick controls apply instantly
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                      Theme, ambience and density changes are saved immediately.
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
            </section>
          </div>
        ) : null}
      </main>
    </AuthGate>
  );
}