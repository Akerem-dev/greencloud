"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCircle2,
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
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  ToggleLeft,
  Umbrella,
  UserRound,
  Waves,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  type AmbienceMode,
  type ThemePreset,
  useAppState,
} from "@/components/providers/app-state-provider";
import AmbientOrbs from "@/components/effects/ambient-orbs";
import LeafFallOverlay from "@/components/effects/leaf-fall-overlay";
import BrandMark from "@/components/shared/brand-mark";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning";

type ToastItem = {
  id: number;
  title: string;
  description: string;
  tone: ToastTone;
};

type Capability = {
  id: string;
  kicker: string;
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

type LandingDeviceExtra = {
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
  firmware?: string;
  lastSeenMs?: number;
  lastCommandStatus?: string;
  power?: string;
};

const themes: Array<{ label: string; value: ThemePreset }> = [
  { label: "Botanical dark", value: "botanical-dark" },
  { label: "Forest mist", value: "forest-mist" },
  { label: "Aurora gold", value: "aurora-gold" },
  { label: "Midnight moss", value: "midnight-moss" },
  { label: "Golden hour", value: "golden-hour" },
  { label: "Rain glass", value: "rain-glass" },
];

const ambiences: Array<{ label: string; value: AmbienceMode }> = [
  { label: "Leaves", value: "leaves" },
  { label: "Rain", value: "rain" },
  { label: "Mist", value: "mist" },
  { label: "Wind", value: "wind" },
  { label: "Fireflies", value: "fireflies" },
  { label: "Calm", value: "calm" },
];

const capabilities: Capability[] = [
  {
    id: "esp32",
    kicker: "ESP32 live node",
    title: "Plant zone sends real telemetry.",
    description:
      "ESP32 reads the soil sensor, keeps the OLED updated, and writes live plant data into the GreenCloud Firebase workspace.",
    points: [
      "Capacitive soil sensor AO value is mapped into moisture percentage.",
      "OLED can show Wi-Fi, Firebase, RAW and moisture state.",
      "Dashboard, devices and landing page read the same selected device.",
    ],
    icon: Cpu,
  },
  {
    id: "firebase",
    kicker: "Private Firebase workspace",
    title: "Every user keeps a separated device workspace.",
    description:
      "Authentication and Realtime Database keep GreenCloud device data under the signed-in account instead of mixing workspaces.",
    points: [
      "Login/register protects the control dashboard.",
      "Devices are stored per user workspace.",
      "Paired ESP32 nodes stay attached to the correct account.",
    ],
    icon: Radio,
  },
  {
    id: "automation",
    kicker: "Rule engine",
    title: "Moisture threshold controls irrigation decisions.",
    description:
      "Automation settings define the dry-risk point, cooldown window and pump command duration while the firmware still protects physical output.",
    points: [
      "Moisture threshold marks dry-risk state.",
      "Cooldown prevents repeated watering commands.",
      "Pump duration is sent as a command, not forced blindly.",
    ],
    icon: Gauge,
  },
  {
    id: "safety",
    kicker: "Pump protection",
    title: "Commands can be tested without unsafe actuation.",
    description:
      "GreenCloud can send irrigation commands while the firmware keeps relay and pump output protected until hardware wiring is safe.",
    points: [
      "Protected commands verify the full software chain.",
      "Relay output stays guarded while safe-mode is active.",
      "Pump can remain dry-run until final wiring is confirmed.",
    ],
    icon: Lock,
  },
  {
    id: "sensors",
    kicker: "Expandable protection sensors",
    title: "Rain, tank and button states are ready.",
    description:
      "The interface already models rain detection, float water-level protection and local button input for the completed hardware stage.",
    points: [
      "Rain sensor can block unnecessary watering.",
      "Float sensor can prevent dry pump operation.",
      "KY-004 button can trigger local manual events.",
    ],
    icon: CloudRain,
  },
];

const chartPattern = [46, 52, 50, 55, 58, 47, 43, 49, 54, 57, 55, 59];

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hasTelemetry(device: {
  status?: string;
  signal?: number;
  lastSeenMs?: number;
}) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    Number(device.signal) > 0
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
    lower.includes("blocked") ||
    lower.includes("risk")
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

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked") return "Protected";
  if (lower === "none") return "No command";
  if (lower === "pending") return "Waiting";

  return value;
}

function getSensorStatus(device: LandingDeviceExtra & { status?: string }) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Pending";
}

function getLastSeenLabel(device: {
  lastSeenMs?: number;
  updatedAt?: string;
}) {
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
  const visibleLabel = displayStatus(label);

  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold",
        getToneClass(tone ?? statusTone(visibleLabel)),
      )}
    >
      <span className="truncate">{visibleLabel}</span>
    </span>
  );
}

function ChoiceButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_24px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_90%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
      )}
    >
      {label}
    </button>
  );
}

function MiniStatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[24px] border p-5",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : getToneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] opacity-75">
          {label}
        </p>
        <Icon className="h-[18px] w-[18px] shrink-0" />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.85rem,3vw,2.75rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-75">
        {description}
      </p>
    </div>
  );
}

function HardwareCard({
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
            {displayStatus(value)}
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

function LandingSettingsPanel() {
  const {
    settings,
    updateSetting,
    resetSettings,
    quickPanelOpen,
    closeQuickPanel,
  } = useAppState();

  useEffect(() => {
    document.body.style.overflow = quickPanelOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [quickPanelOpen]);

  if (!quickPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={closeQuickPanel}
        aria-label="Close landing settings"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[760px]">
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionBadge>Landing settings</SectionBadge>
                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Interface controls
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--gc-soft)]">
                  Theme, ambience, animation and density controls for the
                  landing page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetSettings}
                  className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
                  aria-label="Reset settings"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={closeQuickPanel}
                  className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="gc-scrollbar max-h-[76vh] space-y-5 overflow-y-auto p-6">
            <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
              <p className="text-sm font-semibold text-[var(--gc-text)]">
                Theme preset
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <ChoiceButton
                    key={theme.value}
                    label={theme.label}
                    active={settings.themePreset === theme.value}
                    onClick={() => updateSetting("themePreset", theme.value)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
              <p className="text-sm font-semibold text-[var(--gc-text)]">
                Ambience mode
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {ambiences.map((ambience) => (
                  <ChoiceButton
                    key={ambience.value}
                    label={ambience.label}
                    active={
                      ambience.value === "calm"
                        ? !settings.leafAmbience ||
                          settings.ambienceMode === "calm"
                        : settings.leafAmbience &&
                          settings.ambienceMode === ambience.value
                    }
                    onClick={() => {
                      updateSetting("ambienceMode", ambience.value);
                      updateSetting("leafAmbience", ambience.value !== "calm");
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => updateSetting("animations", !settings.animations)}
                className="premium-btn-secondary rounded-[24px] px-4 py-4 text-left"
              >
                <span className="block text-sm font-semibold text-[var(--gc-text)]">
                  Animations
                </span>
                <span className="mt-2 block text-sm text-[var(--gc-soft)]">
                  {settings.animations ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateSetting("leafAmbience", !settings.leafAmbience)
                }
                className="premium-btn-secondary rounded-[24px] px-4 py-4 text-left"
              >
                <span className="block text-sm font-semibold text-[var(--gc-text)]">
                  Ambient layer
                </span>
                <span className="mt-2 block text-sm text-[var(--gc-soft)]">
                  {settings.leafAmbience ? "On" : "Off"}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateSetting("compactMode", !settings.compactMode)
                }
                className="premium-btn-secondary rounded-[24px] px-4 py-4 text-left"
              >
                <span className="block text-sm font-semibold text-[var(--gc-text)]">
                  Compact mode
                </span>
                <span className="mt-2 block text-sm text-[var(--gc-soft)]">
                  {settings.compactMode ? "On" : "Off"}
                </span>
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function LandingNotificationsPanel() {
  const {
    notificationsOpen,
    closeNotifications,
    notifications,
    markAllNotificationsRead,
  } = useAppState();

  useEffect(() => {
    document.body.style.overflow = notificationsOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [notificationsOpen]);

  if (!notificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={closeNotifications}
        aria-label="Close notifications"
      />

      <div className="absolute right-4 top-4 w-[min(440px,calc(100vw-32px))]">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionBadge>Notifications</SectionBadge>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                System alerts
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="premium-btn-secondary rounded-full px-4 py-2 text-sm"
              >
                Mark read
              </button>

              <button
                type="button"
                onClick={closeNotifications}
                className="premium-btn-secondary flex h-10 w-10 items-center justify-center rounded-full"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="gc-scrollbar mt-5 max-h-[72vh] space-y-3 overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <p className="text-lg font-semibold text-[var(--gc-text)]">
                  No alerts yet.
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                  Dry-risk, sensor and protection events will appear here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[24px] border p-4",
                    item.read
                      ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
                      : "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] shadow-[0_0_28px_var(--gc-glow)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--gc-text)]">
                      {item.title}
                    </p>

                    {!item.read ? (
                      <span className="rounded-full bg-[var(--gc-accent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#111708]">
                        New
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                    {item.description || item.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function LandingToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[130] w-[min(380px,calc(100vw-40px))] space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="gc-toast rounded-[24px] p-4">
          <div className="flex gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-accent-2)]">
              {toast.tone === "warning" ? (
                <Bell className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--gc-text)]">
                {toast.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
                {toast.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
    const {
    selectedDevice,
    devices,
    settings,
    automation,
    session,
    unreadNotifications,
    selectDevice,
    startIrrigation,
    simulateThresholdEvent,
    refreshTelemetry,
    openNotifications,
    openQuickPanel,
  } = useAppState();

    const accountLabel =
    session.signedIn && session.userName
      ? session.userName
      : session.signedIn && session.email
        ? session.email
        : "Login";

  const selectedExtra = selectedDevice as typeof selectedDevice &
    LandingDeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);
  const sensorStatus = getSensorStatus(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;
  const physicalPumpLocked = safeModeActive || !pumpEnabled;

  const rawSoil = telemetryReady ? rawLabel(selectedExtra.rawSoil) : "—";
  const soilVoltage = telemetryReady
    ? voltageLabel(selectedExtra.soilVoltage)
    : "—";

  const relayState =
    selectedExtra.relayState ??
    (physicalPumpLocked ? "Protected" : "Enabled");

  const pumpState =
    selectedExtra.pumpState ?? (physicalPumpLocked ? "Protected" : "Ready");

  const rainStatus = selectedExtra.rainStatus ?? "Pending";
  const waterLevelStatus = selectedExtra.waterLevelStatus ?? "Pending";
  const buttonStatus = selectedExtra.buttonStatus ?? "Pending";
  const oledStatus = selectedExtra.oledStatus ?? "Pending";
  const lastCommandStatus = selectedExtra.lastCommandStatus ?? "None";

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Waiting";

  const signalLabel = telemetryReady
    ? `${selectedDevice.signal}%`
    : "Waiting";

  const [selectedCapabilityId, setSelectedCapabilityId] = useState("esp32");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const toastCounterRef = useRef(0);

  const selectedCapability =
    capabilities.find((item) => item.id === selectedCapabilityId) ??
    capabilities[0];

  const SelectedCapabilityIcon = selectedCapability.icon;

  const chartBars = useMemo(() => {
    if (!telemetryReady) {
      return Array.from({ length: chartPattern.length }, () => 0);
    }

    return chartPattern.map((value, index) =>
      clampPercent(
        value + (selectedDevice.moisture - 50) * 0.25 + index * 0.15,
      ),
    );
  }, [selectedDevice.moisture, telemetryReady]);

  const activeBarValue =
    activeBarIndex === null ? null : chartBars[activeBarIndex] ?? null;

  const deviceStatCards: Array<{
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone: Tone;
  }> = [
    {
      label: "Moisture",
      value: moistureLabel,
      description: telemetryReady ? "Mapped soil value." : "Waiting for device.",
      icon: Droplets,
      tone: telemetryReady ? statusTone(sensorStatus) : "pending",
    },
    {
      label: "RAW",
      value: rawSoil,
      description: `D32 ADC · ${soilVoltage}`,
      icon: Gauge,
      tone:
        !telemetryReady
          ? "pending"
          : statusTone(sensorStatus) === "warning"
            ? "warning"
            : "safe",
    },
    {
      label: "Signal",
      value: signalLabel,
      description: "ESP32 Wi-Fi telemetry.",
      icon: Wifi,
      tone: telemetryReady ? "live" : "pending",
    },
    {
      label: "Safety",
      value: physicalPumpLocked ? "Protected" : "Live",
      description: physicalPumpLocked ? "Relay guarded." : "Output enabled.",
      icon: ShieldCheck,
      tone: physicalPumpLocked ? "safe" : "warning",
    },
  ];

  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  function showToast(
    title: string,
    description: string,
    tone: ToastTone = "success",
  ) {
    toastCounterRef.current += 1;

    setToasts((current) => [
      ...current.slice(-2),
      {
        id: toastCounterRef.current,
        title,
        description,
        tone,
      },
    ]);
  }

  function handleStartIrrigation() {
    startIrrigation(selectedDevice.id);

    showToast(
      physicalPumpLocked ? "Protected command sent" : "Pump command sent",
      physicalPumpLocked
        ? `${selectedDevice.name} received an irrigation command. Relay remains protected by firmware.`
        : `${selectedDevice.name} received a live pump command.`,
      physicalPumpLocked ? "success" : "warning",
    );
  }

  function handleRuleCheck() {
    simulateThresholdEvent(selectedDevice.id);

    showToast(
      "Rule-check event created",
      `${selectedDevice.name} was checked against the configured threshold.`,
      "warning",
    );
  }

  function handleRefreshTelemetry() {
    refreshTelemetry(selectedDevice.id);

    showToast(
      "Telemetry refreshed",
      "Landing page now reflects the latest shared workspace state.",
      "info",
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
      <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

      <AmbientOrbs themePreset={settings.themePreset} />

      {settings.leafAmbience ? (
        <LeafFallOverlay mode={settings.ambienceMode} />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40">
          <GlassCard className="px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="min-w-0">
                <BrandMark
                  title={settings.projectName || "GreenCloud"}
                  subtitle="Smart irrigation workspace"
                  compact
                />
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#overview"
                  className="premium-tab premium-tab-active rounded-full px-5 py-2 text-sm font-semibold"
                >
                  Overview
                </a>

                <a
                  href="#hardware"
                  className="premium-tab rounded-full px-5 py-2 text-sm font-semibold"
                >
                  Hardware
                </a>

                <a
                  href="#capabilities"
                  className="premium-tab rounded-full px-5 py-2 text-sm font-semibold"
                >
                  System
                </a>

                <a
                  href="#control"
                  className="premium-tab rounded-full px-5 py-2 text-sm font-semibold"
                >
                  Control
                </a>

                                <Link
                  href={session.signedIn ? "/profile" : "/auth"}
                  className={cn(
                    "premium-btn-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold",
                    session.signedIn
                      ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_22px_var(--gc-glow)]"
                      : "",
                  )}
                >
                  {session.signedIn ? <UserRound className="h-4 w-4" /> : null}
                  <span className="max-w-[120px] truncate">
                    {session.signedIn ? accountLabel : "Login"}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={openQuickPanel}
                  className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-2xl"
                  aria-label="Open landing settings"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={openNotifications}
                  className="premium-btn-secondary relative flex h-11 w-11 items-center justify-center rounded-2xl"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />

                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--gc-accent)] px-1 text-[11px] font-bold text-[#111708] shadow-[0_0_20px_var(--gc-glow)]">
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </GlassCard>
        </header>

        <section
          id="overview"
          className="grid gap-6 py-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(390px,500px)] lg:items-stretch"
        >
          <GlassCard className="flex min-h-[620px] flex-col justify-between p-6 sm:p-8">
            <div>
              <SectionBadge>
                ESP32 · Firebase · soil telemetry · protected irrigation
              </SectionBadge>

              <h2 className="gc-hero-heading mt-7 max-w-5xl font-semibold text-[var(--gc-text)]">
                GreenCloud turns a plant into a{" "}
                <span className="bg-gradient-to-r from-[var(--gc-accent)] to-[var(--gc-accent-2)] bg-clip-text text-transparent">
                  connected irrigation system.
                </span>
              </h2>

              <p className="mt-7 max-w-3xl text-lg leading-8 text-[var(--gc-soft)] sm:text-xl">
                GreenCloud connects ESP32 plant devices to a private Firebase
                workspace, streams live soil telemetry, separates every account
                by UID, and keeps irrigation commands protected by firmware
                safety controls.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <StatusPill label="Firebase Auth workspace" tone="live" />

                <StatusPill
                  label={
                    telemetryReady ? "Device telemetry seen" : "Waiting telemetry"
                  }
                  tone={telemetryReady ? "live" : "pending"}
                />

                <StatusPill
                  label={physicalPumpLocked ? "Pump protected" : "Pump output live"}
                  tone={physicalPumpLocked ? "safe" : "warning"}
                />

                <StatusPill
                  label={displayStatus(lastCommandStatus)}
                  tone={statusTone(displayStatus(lastCommandStatus))}
                />
              </div>

              <div className="mt-9 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleStartIrrigation}
                  className="premium-btn inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Send protected command
                  <Droplets className="h-4 w-4" />
                </button>

                <Link
                  href="/dashboard"
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Open dashboard
                  <Zap className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {deviceStatCards.map((item) => (
                <MiniStatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  description={item.description}
                  icon={item.icon}
                  tone={item.tone}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="h-full overflow-hidden p-0">
            <div className="relative h-[280px] overflow-hidden rounded-t-[inherit] sm:h-[340px]">
              <Image
                src="/hero-bg.jpg"
                alt="GreenCloud irrigation control surface"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gc-bg)] via-[rgba(0,0,0,0.22)] to-transparent" />

              <div className="absolute left-5 top-5 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-black/38 px-4 py-2 text-sm font-semibold text-[var(--gc-text)] backdrop-blur-xl">
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[var(--gc-accent)] shadow-[0_0_16px_var(--gc-glow)]" />
                {selectedDevice.status}
              </div>

              <button
                type="button"
                onClick={openNotifications}
                className="premium-btn-secondary absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                aria-label="Open notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="absolute bottom-7 left-7 right-7">
                <SectionBadge>Selected device</SectionBadge>
                <h3 className="mt-4 break-words text-5xl font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                  {selectedDevice.name}
                </h3>
                <p className="mt-2 break-words text-base text-[var(--gc-soft)]">
                  {selectedDevice.place}
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] p-5 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                  Current moisture
                </p>

                <p className="mt-5 text-6xl font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                  {telemetryReady ? selectedDevice.moisture : "—"}
                  <span className="text-2xl text-[var(--gc-accent-2)]">
                    {telemetryReady ? "%" : ""}
                  </span>
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--gc-border)_50%,transparent)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_18px_var(--gc-glow)]"
                    style={{
                      width: `${telemetryReady ? selectedDevice.moisture : 0}%`,
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-2 text-sm text-[var(--gc-soft)]">
                    RAW {rawSoil}
                  </span>

                  <span className="text-sm text-[var(--gc-muted)]">
                    {getLastSeenLabel(selectedExtra)}
                  </span>
                </div>
              </div>

              <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                      Protected automation
                    </p>

                    <p className="mt-5 break-words text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                      {automation.mode}
                    </p>

                    <p className="mt-4 text-base leading-7 text-[var(--gc-soft)]">
                      Threshold {automation.moistureThreshold}% · Pump{" "}
                      {automation.pumpDurationSeconds}s · protection{" "}
                      {safeModeActive ? "on" : "off"}
                    </p>
                  </div>

                  <StatusPill
                    label={physicalPumpLocked ? "Protected" : "Pump live"}
                    tone={physicalPumpLocked ? "safe" : "warning"}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Signal", signalLabel],
                    ["Voltage", soilVoltage],
                    ["Relay", relayState],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 p-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                        {label}
                      </p>
                      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                        {displayStatus(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <div className="relative rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                    Moisture pattern
                  </p>

                  <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-2 text-xs text-[var(--gc-soft)]">
                    {telemetryReady ? "Live trend" : "Waiting data"}
                  </span>
                </div>

                <div className="relative mt-8 h-40">
                  <div
                    className="absolute left-0 right-0 z-10 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_70%,transparent)]"
                    style={{
                      bottom: `${automation.moistureThreshold}%`,
                    }}
                  >
                    <span className="absolute -top-4 left-4 rounded-full border border-[color-mix(in_srgb,var(--gc-warn)_35%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-warn)]">
                      Threshold {automation.moistureThreshold}%
                    </span>
                  </div>

                  {activeBarIndex !== null && activeBarValue !== null ? (
                    <div
                      className="pointer-events-none absolute top-0 z-30 min-w-[118px] -translate-x-1/2 rounded-[16px] border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_86%,black)] px-3 py-2 text-sm shadow-[0_18px_42px_rgba(0,0,0,0.34),0_0_26px_var(--gc-glow)] backdrop-blur-xl"
                      style={{
                        left: `${
                          ((activeBarIndex + 0.5) / chartBars.length) * 100
                        }%`,
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                        Sample {activeBarIndex + 1}
                      </p>
                      <p className="mt-1 font-semibold text-[var(--gc-text)]">
                        {telemetryReady
                          ? `${activeBarValue}% moisture`
                          : "Waiting"}
                      </p>
                    </div>
                  ) : null}

                  <div className="absolute inset-0 flex items-end gap-3">
                    {chartBars.map((bar, index) => (
                      <button
                        type="button"
                        key={`${bar}-${index}`}
                        onMouseEnter={() => setActiveBarIndex(index)}
                        onMouseLeave={() => setActiveBarIndex(null)}
                        onFocus={() => setActiveBarIndex(index)}
                        onBlur={() => setActiveBarIndex(null)}
                        className="flex h-full flex-1 items-end rounded-t-2xl outline-none"
                        aria-label={`Moisture sample ${index + 1}: ${
                          telemetryReady ? `${bar}%` : "waiting"
                        }`}
                      >
                        <span
                          className={cn(
                            "block w-full rounded-t-2xl transition",
                            telemetryReady
                              ? "bg-gradient-to-t from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_22px_var(--gc-glow)] hover:brightness-125"
                              : "bg-white/[0.06]",
                          )}
                          style={{
                            height: `${
                              telemetryReady ? Math.max(18, bar) : 8
                            }%`,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section id="hardware" className="py-6">
          <GlassCard className="p-6 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionBadge>Hardware stack</SectionBadge>
                <h2 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)] sm:text-6xl">
                  Built around connected irrigation hardware.
                </h2>
              </div>

              <Link
                href="/devices"
                className="premium-btn-secondary inline-flex items-center justify-center rounded-[20px] px-5 py-3 text-sm font-semibold"
              >
                View devices
              </Link>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <HardwareCard
                title="ESP32 DevKit V1"
                value={selectedDevice.status}
                description="Main controller for sensors and Firebase sync."
                icon={Cpu}
                tone={
                  selectedDevice.status === "Online"
                    ? "live"
                    : selectedDevice.status === "Offline"
                      ? "offline"
                      : "pending"
                }
              />

              <HardwareCard
                title="Soil moisture"
                value={sensorStatus}
                description="Capacitive sensor AO is connected to D32."
                icon={Leaf}
                tone={statusTone(sensorStatus)}
              />

              <HardwareCard
                title="OLED display"
                value={oledStatus}
                description="Shows local device status when reported."
                icon={Monitor}
                tone={statusTone(oledStatus)}
              />

              <HardwareCard
                title="Relay module"
                value={relayState}
                description="Pump output is firmware-protected."
                icon={Lock}
                tone={statusTone(relayState)}
              />

              <HardwareCard
                title="DC pump"
                value={pumpState}
                description="Physical pumping stays protected by firmware controls."
                icon={Power}
                tone={statusTone(pumpState)}
              />

              <HardwareCard
                title="Float sensor"
                value={waterLevelStatus}
                description="Tank protection field is ready."
                icon={Waves}
                tone={statusTone(waterLevelStatus)}
              />

              <HardwareCard
                title="Rain sensor"
                value={rainStatus}
                description="Rain lockout field is ready."
                icon={Umbrella}
                tone={statusTone(rainStatus)}
              />

              <HardwareCard
                title="Local button"
                value={buttonStatus}
                description="KY-004 manual trigger field is ready."
                icon={ToggleLeft}
                tone={statusTone(buttonStatus)}
              />
            </div>
          </GlassCard>
        </section>

        <section
          id="capabilities"
          className="grid gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <GlassCard className="p-6 sm:p-7">
            <SectionBadge>System layers</SectionBadge>

            <h2 className="mt-6 max-w-xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)] sm:text-6xl">
              One system, five clear layers.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--gc-soft)]">
              This section explains the complete chain from device telemetry to
              secure command handling.
            </p>

            <div className="mt-7 space-y-3">
              {capabilities.map((item) => {
                const Icon = item.icon;
                const active = selectedCapabilityId === item.id;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedCapabilityId(item.id)}
                    className={cn(
                      "w-full rounded-[24px] border p-5 text-left transition",
                      active
                        ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] shadow-[0_0_36px_var(--gc-glow)]"
                        : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.03] hover:bg-white/[0.055]",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 text-[var(--gc-accent-2)]">
                        <Icon className="h-5 w-5" />
                      </span>

                      <span>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                          {item.kicker}
                        </span>
                        <span className="mt-3 block text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                          {item.title}
                        </span>
                        <span className="mt-3 line-clamp-2 block text-base leading-7 text-[var(--gc-soft)]">
                          {item.description}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <SectionBadge>Selected layer</SectionBadge>
              <SelectedCapabilityIcon className="h-6 w-6 text-[var(--gc-accent-2)]" />
            </div>

            <h3 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)] sm:text-6xl">
              {selectedCapability.title}
            </h3>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--gc-soft)]">
              {selectedCapability.description}
            </p>

            <div className="mt-8 space-y-3">
              {selectedCapability.points.map((point) => (
                <div
                  key={point}
                  className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] px-5 py-4 text-base font-semibold text-[var(--gc-text)]"
                >
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleStartIrrigation}
                className="premium-btn rounded-[20px] px-5 py-4 text-sm font-semibold"
              >
                Send command
              </button>

              <button
                type="button"
                onClick={handleRuleCheck}
                className="premium-btn-secondary rounded-[20px] px-5 py-4 text-sm font-semibold"
              >
                Create rule-check
              </button>

              <button
                type="button"
                onClick={handleRefreshTelemetry}
                className="premium-btn-secondary rounded-[20px] px-5 py-4 text-sm font-semibold"
              >
                Refresh telemetry
              </button>
            </div>
          </GlassCard>
        </section>

        <section
          id="control"
          className="grid gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <GlassCard className="overflow-hidden p-0">
            <div className="relative h-64 overflow-hidden rounded-t-[inherit]">
              <Image
                src="/hero-bg.jpg"
                alt="GreenCloud control visual"
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gc-bg)] via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5">
                <SectionBadge>Control surface</SectionBadge>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)] sm:text-6xl">
                Live site,
                <br />
                protected pump.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--gc-soft)]">
                The software chain is active now. Physical pump actuation stays
                protected until relay and pump wiring are secured.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {devices.map((device) => (
                  <button
                    type="button"
                    key={device.id}
                    onClick={() => selectDevice(device.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      device.id === selectedDevice.id
                        ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_22px_var(--gc-glow)]"
                        : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
                    )}
                  >
                    {device.name}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <div className="grid gap-6">
            <GlassCard className="p-6">
              <SectionBadge>Rule snapshot</SectionBadge>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Mode", automation.mode],
                  ["Threshold", `${automation.moistureThreshold}%`],
                  ["Cooldown", `${automation.cooldownMinutes} min`],
                  ["Pump command", `${automation.pumpDurationSeconds}s`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--gc-muted)]">
                      {label}
                    </p>
                    <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionBadge>System readiness</SectionBadge>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniStatCard
                  label="Devices"
                  value={`${devices.length}`}
                  description="Workspace nodes."
                  icon={Sprout}
                  tone="pending"
                />

                <MiniStatCard
                  label="Alerts"
                  value={`${unreadNotifications}`}
                  description="Unread events."
                  icon={Bell}
                  tone={unreadNotifications > 0 ? "warning" : "live"}
                />

                <MiniStatCard
                  label="Power"
                  value={selectedExtra.power ?? "USB / Adapter"}
                  description="Device and pump power stay separated."
                  icon={Power}
                  tone="safe"
                />

                <MiniStatCard
                  label="Firebase"
                  value="UID"
                  description="Private user path."
                  icon={ShieldCheck}
                  tone="safe"
                />

                <MiniStatCard
                  label="Firmware"
                  value={selectedExtra.firmware ?? "GreenCloud"}
                  description="Device firmware profile."
                  icon={Radio}
                  tone="safe"
                />

                <MiniStatCard
                  label="Last command"
                  value={displayStatus(lastCommandStatus)}
                  description="Device response state."
                  icon={CheckCircle2}
                  tone={statusTone(displayStatus(lastCommandStatus))}
                />
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      <LandingSettingsPanel />
      <LandingNotificationsPanel />
      <LandingToastStack toasts={toasts} />
    </main>
  );
}