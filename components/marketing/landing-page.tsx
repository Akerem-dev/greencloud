"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CloudRain,
  Cpu,
  Droplets,
  Gauge,
  Leaf,
  Lock,
  Radio,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  UserRound,
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
  updatedAt?: string;
  power?: string;
};

type ProductPillar = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
};

type SystemStep = {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
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

const productPillars: ProductPillar[] = [
  {
    title: "Private pairing",
    description:
      "Pair each ESP32 with an OLED code and keep every device under your private account.",
    icon: ShieldCheck,
    tone: "safe",
  },
  {
    title: "Live telemetry",
    description:
      "Track soil moisture, signal state and device activity from one polished dashboard.",
    icon: Wifi,
    tone: "live",
  },
  {
    title: "Protected irrigation",
    description:
      "Send irrigation commands while relay and pump output stay guarded by default.",
    icon: Lock,
    tone: "safe",
  },
  {
    title: "Expandable hardware",
    description:
      "Add rain, tank level, OLED and button inputs without breaking the workspace flow.",
    icon: CloudRain,
    tone: "pending",
  },
];

const systemSteps: SystemStep[] = [
  {
    label: "01",
    title: "ESP32 reads the plant",
    description: "Soil and hardware states are prepared on the controller.",
    icon: Cpu,
  },
  {
    label: "02",
    title: "Firebase syncs data",
    description: "Device state, user profile and commands stay private.",
    icon: Radio,
  },
  {
    label: "03",
    title: "Dashboard shows health",
    description: "Moisture, signal and protection state become readable.",
    icon: Gauge,
  },
  {
    label: "04",
    title: "Automation decides",
    description: "Threshold, cooldown and duration rules shape irrigation.",
    icon: SlidersHorizontal,
  },
  {
    label: "05",
    title: "Pump stays protected",
    description: "Relay output remains guarded until hardware mode is ready.",
    icon: Lock,
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

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked") return "Protected";
  if (lower === "none" || lower === "pending") return "Ready";
  if (lower === "idle") return "Standby";
  if (lower === "ok") return "Safe";

  return value;
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

  return "pending";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_68%,black)] text-[var(--gc-soft)]";
}

function getSensorStatus(device: LandingDeviceExtra & { status?: string }) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Ready";
}

function getLastSeenLabel(device: LandingDeviceExtra) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Ready for pairing";
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
  icon: Icon,
}: {
  label: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  const visibleLabel = displayStatus(label);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(tone ?? statusTone(visibleLabel)),
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
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
          : "border-[color-mix(in_srgb,var(--gc-border)_76%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
      )}
    >
      {label}
    </button>
  );
}

function SoftPanel({
  children,
  className,
  tone = "pending",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[26px] border p-5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-bg)_70%,black),color-mix(in_srgb,var(--gc-bg)_84%,black))]"
          : toneClass(tone),
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(255,255,255,0.06),transparent_36%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ProductMetric({
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
    <SoftPanel tone={tone} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] opacity-75">
          {label}
        </p>

        <Icon className="h-[18px] w-[18px] shrink-0" />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.45rem,2.4vw,2.2rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </SoftPanel>
  );
}

function ProductPillarCard({
  title,
  description,
  icon: Icon,
  tone,
}: ProductPillar) {
  return (
    <SoftPanel
      tone={tone}
      className="group p-6 transition duration-300 hover:-translate-y-1"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.055em] text-[var(--gc-text)]">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 opacity-80">{description}</p>
    </SoftPanel>
  );
}

function SystemStepCard({ step }: { step: SystemStep }) {
  const Icon = step.icon;

  return (
    <SoftPanel className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)]">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] px-3 py-1 text-xs font-bold text-[var(--gc-accent-2)]">
          {step.label}
        </span>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <h3 className="mt-6 text-2xl font-semibold tracking-[-0.055em] text-[var(--gc-text)]">
        {step.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
        {step.description}
      </p>
    </SoftPanel>
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
          <div className="border-b border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionBadge>Interface</SectionBadge>

                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Display controls
                </h3>

                <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--gc-soft)]">
                  Tune theme, ambience, animation and layout density.
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
            <SoftPanel>
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
            </SoftPanel>

            <SoftPanel>
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
            </SoftPanel>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  updateSetting("animations", !settings.animations)
                }
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
              <SoftPanel className="border-dashed">
                <p className="text-lg font-semibold text-[var(--gc-text)]">
                  No alerts yet.
                </p>

                <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                  Dry-risk, sensor and protection updates will appear here.
                </p>
              </SoftPanel>
            ) : (
              notifications.map((item) => (
                <SoftPanel
                  key={item.id}
                  tone={item.read ? "pending" : "live"}
                  className={item.read ? "" : "shadow-[0_0_28px_var(--gc-glow)]"}
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
                </SoftPanel>
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
    simulateThresholdEvent,
    refreshTelemetry,
    openNotifications,
    openQuickPanel,
  } = useAppState();

  const selectedExtra = selectedDevice as typeof selectedDevice &
    LandingDeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);
  const sensorStatus = getSensorStatus(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;
  const physicalPumpLocked = safeModeActive || !pumpEnabled;

  const pumpState =
    selectedExtra.pumpState ?? (physicalPumpLocked ? "Protected" : "Ready");

  const lastCommandStatus = selectedExtra.lastCommandStatus ?? "Ready";
  const moistureLabel = telemetryReady ? `${selectedDevice.moisture}%` : "—";
  const signalLabel = telemetryReady ? `${selectedDevice.signal}%` : "—";

  const accountLabel =
    session.signedIn && session.userName
      ? session.userName
      : session.signedIn && session.email
        ? session.email
        : "Login";

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const toastCounterRef = useRef(0);

  const chartBars = useMemo(() => {
    if (!telemetryReady) {
      return Array.from({ length: chartPattern.length }, () => 12);
    }

    return chartPattern.map((value, index) =>
      clampPercent(
        value + (selectedDevice.moisture - 50) * 0.25 + index * 0.15,
      ),
    );
  }, [selectedDevice.moisture, telemetryReady]);

  const activeBarValue =
    activeBarIndex === null ? null : chartBars[activeBarIndex] ?? null;

  const heroMetrics = [
    {
      label: "Workspace",
      value: session.signedIn ? "Private" : "Ready",
      detail: "Data stays under your account.",
      icon: ShieldCheck,
      tone: "safe" as Tone,
    },
    {
      label: "Telemetry",
      value: telemetryReady ? "Live" : "Ready",
      detail: telemetryReady
        ? getLastSeenLabel(selectedExtra)
        : "Ready for monitoring.",
      icon: Wifi,
      tone: telemetryReady ? ("live" as Tone) : ("pending" as Tone),
    },
    {
      label: "Irrigation",
      value: physicalPumpLocked ? "Protected" : "Live",
      detail: physicalPumpLocked
        ? "Pump output stays guarded."
        : "Pump output is enabled.",
      icon: Droplets,
      tone: physicalPumpLocked ? ("safe" as Tone) : ("warning" as Tone),
    },
  ];

  const activeDeviceName = selectedDevice.name || "GreenCloud Device";

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

  function handleRuleCheck() {
    simulateThresholdEvent(selectedDevice.id);

    showToast(
      "Automation check created",
      `${activeDeviceName} was checked against the configured moisture threshold.`,
      "warning",
    );
  }

  function handleRefreshTelemetry() {
    refreshTelemetry(selectedDevice.id);

    showToast(
      "Telemetry refreshed",
      "GreenCloud is now showing the latest workspace state.",
      "info",
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
      <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--gc-accent)_13%,transparent),transparent_30%),radial-gradient(circle_at_88%_8%,color-mix(in_srgb,var(--gc-accent-2)_9%,transparent),transparent_28%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

      <AmbientOrbs themePreset={settings.themePreset} />

      {settings.leafAmbience ? (
        <LeafFallOverlay mode={settings.ambienceMode} />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40">
          <GlassCard className="px-4 py-3 shadow-[0_18px_70px_rgba(0,0,0,0.3),0_0_30px_color-mix(in_srgb,var(--gc-glow)_72%,transparent)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="min-w-0 shrink-0">
                <BrandMark
                  title="GreenCloud"
                  subtitle="SMART IRRIGATION WORKSPACE"
                  compact
                  card
                  className="max-w-full"
                />
              </Link>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#overview"
                  className="premium-tab premium-tab-active rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Overview
                </a>

                <a
                  href="#benefits"
                  className="premium-tab rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Benefits
                </a>

                <a
                  href="#system"
                  className="premium-tab rounded-full px-4 py-2 text-sm font-semibold"
                >
                  System
                </a>

                <a
                  href="#control"
                  className="premium-tab rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Control
                </a>

                <Link
                  href={session.signedIn ? "/profile" : "/auth"}
                  className={cn(
                    "premium-btn-secondary inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold",
                    session.signedIn
                      ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)]"
                      : "",
                  )}
                >
                  <UserRound className="h-4 w-4" />
                  <span className="max-w-[126px] truncate">
                    {accountLabel}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={openQuickPanel}
                  className="premium-btn-secondary flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label="Open interface settings"
                >
                  <SlidersHorizontal className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={openNotifications}
                  className="premium-btn-secondary relative flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />

                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--gc-accent)] px-1 text-[10px] font-bold text-[#111708] shadow-[0_0_20px_var(--gc-glow)]">
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
          className="grid gap-5 py-5 xl:grid-cols-[minmax(0,1.07fr)_minmax(380px,0.93fr)] xl:items-stretch"
        >
          <GlassCard className="relative flex min-h-[590px] flex-col justify-between overflow-hidden p-6 sm:p-8 2xl:p-9">
            <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-14 h-64 w-64 rounded-full bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] blur-3xl" />

            <div className="relative z-10">
              <SectionBadge>ESP32 · Firebase · Protected irrigation</SectionBadge>

              <h1 className="mt-7 max-w-5xl text-[clamp(3.8rem,7.4vw,7.45rem)] font-semibold leading-[0.86] tracking-[-0.088em] text-[var(--gc-text)]">
                Premium control for{" "}
                <span className="bg-gradient-to-r from-[var(--gc-accent)] via-[var(--gc-accent-2)] to-[var(--gc-text)] bg-clip-text text-transparent">
                  connected plant irrigation.
                </span>
              </h1>

              <p className="mt-7 max-w-3xl text-base leading-7 text-[var(--gc-soft)] sm:text-lg sm:leading-8">
                Connect your ESP32-powered plant system, monitor soil conditions
                in real time, and manage irrigation safely from one private
                GreenCloud workspace.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <StatusPill label="Private workspace" tone="safe" icon={Lock} />
                <StatusPill
                  label={telemetryReady ? "Telemetry live" : "Ready to pair"}
                  tone={telemetryReady ? "live" : "pending"}
                  icon={Wifi}
                />
                <StatusPill
                  label={physicalPumpLocked ? "Pump protected" : "Pump live"}
                  tone={physicalPumpLocked ? "safe" : "warning"}
                  icon={Droplets}
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/devices"
                  className="premium-btn inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Pair a device
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Open dashboard
                  <Zap className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative z-10 mt-9 grid gap-3 sm:grid-cols-3">
              {heroMetrics.map((item) => (
                <ProductMetric
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  icon={item.icon}
                  tone={item.tone}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard className="relative min-h-[590px] overflow-hidden p-0">
            <div className="relative h-[260px] overflow-hidden rounded-t-[inherit]">
              <Image
                src="/hero-bg.jpg"
                alt="GreenCloud irrigation control surface"
                fill
                priority
                sizes="(max-width: 920px) 100vw, 520px"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[var(--gc-bg)] via-[rgba(0,0,0,0.24)] to-transparent" />

              <div className="absolute left-5 top-5">
                <StatusPill
                  label={selectedDevice.status}
                  tone={statusTone(selectedDevice.status)}
                  icon={Wifi}
                />
              </div>

              <button
                type="button"
                onClick={openNotifications}
                className="premium-btn-secondary absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl"
                aria-label="Open notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6">
                <SectionBadge>Device workspace</SectionBadge>

                <h2 className="mt-4 break-words text-[clamp(2.35rem,4vw,4.1rem)] font-semibold leading-[0.9] tracking-[-0.07em] text-[var(--gc-text)]">
                  {activeDeviceName}
                </h2>

                <p className="mt-2 break-words text-base text-[var(--gc-soft)]">
                  {selectedDevice.place}
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <SoftPanel>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                      Moisture
                    </p>

                    <p className="mt-4 text-6xl font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                      {moistureLabel}
                    </p>
                  </div>

                  <StatusPill
                    label={telemetryReady ? sensorStatus : "Ready"}
                    tone={telemetryReady ? statusTone(sensorStatus) : "pending"}
                  />
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--gc-border)_50%,transparent)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_18px_var(--gc-glow)]"
                    style={{
                      width: `${telemetryReady ? selectedDevice.moisture : 0}%`,
                    }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-[var(--gc-soft)]">
                  {telemetryReady
                    ? `Last report: ${getLastSeenLabel(selectedExtra)}.`
                    : "Pair your ESP32 to unlock live plant telemetry."}
                </p>
              </SoftPanel>

              <SoftPanel>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                      Automation
                    </p>

                    <p className="mt-4 break-words text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                      {automation.mode}
                    </p>
                  </div>

                  <StatusPill
                    label={physicalPumpLocked ? "Protected" : "Live output"}
                    tone={physicalPumpLocked ? "safe" : "warning"}
                  />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Threshold", `${automation.moistureThreshold}%`],
                    ["Command", `${automation.pumpDurationSeconds}s`],
                    ["Signal", signalLabel],
                    ["State", displayStatus(pumpState)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-black/18 p-4"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                        {label}
                      </p>

                      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </SoftPanel>

              <SoftPanel>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
                    Moisture trend
                  </p>

                  <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-white/[0.035] px-4 py-2 text-xs text-[var(--gc-soft)]">
                    {telemetryReady ? "Live pattern" : "Preview mode"}
                  </span>
                </div>

                <div className="relative mt-8 h-32">
                  <div
                    className="absolute left-0 right-0 z-10 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_60%,transparent)]"
                    style={{
                      bottom: `${automation.moistureThreshold}%`,
                    }}
                  />

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
                          : "Preview"}
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
                          telemetryReady ? `${bar}%` : "preview"
                        }`}
                      >
                        <span
                          className={cn(
                            "block w-full rounded-t-2xl transition",
                            telemetryReady
                              ? "bg-gradient-to-t from-[var(--gc-accent)] to-[var(--gc-accent-2)] shadow-[0_0_22px_var(--gc-glow)] hover:brightness-125"
                              : "bg-white/[0.08]",
                          )}
                          style={{
                            height: `${Math.max(12, bar)}%`,
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </SoftPanel>
            </div>
          </GlassCard>
        </section>

        <section id="benefits" className="py-4">
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionBadge>Product benefits</SectionBadge>

                <h2 className="mt-5 max-w-4xl text-[clamp(2.8rem,5vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--gc-text)]">
                  A complete workspace for connected irrigation.
                </h2>
              </div>

              <Link
                href="/devices"
                className="premium-btn-secondary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold"
              >
                View devices
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {productPillars.map((pillar) => (
                <ProductPillarCard key={pillar.title} {...pillar} />
              ))}
            </div>
          </GlassCard>
        </section>

        <section id="system" className="py-4">
          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
              <div>
                <SectionBadge>System flow</SectionBadge>

                <h2 className="mt-5 max-w-xl text-[clamp(2.7rem,4.8vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-[var(--gc-text)]">
                  From plant data to protected irrigation.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                  GreenCloud connects ESP32 telemetry, Firebase storage,
                  automation rules and protected pump commands in one clean
                  workflow.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleRuleCheck}
                    className="premium-btn inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold"
                  >
                    Create rule check
                    <Sparkles className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRefreshTelemetry}
                    className="premium-btn-secondary inline-flex items-center gap-2 rounded-[22px] px-6 py-3 text-sm font-semibold"
                  >
                    Refresh telemetry
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {systemSteps.map((step) => (
                  <SystemStepCard key={step.label} step={step} />
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section
          id="control"
          className="grid gap-5 py-4 lg:grid-cols-[0.92fr_1.08fr]"
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
                <SectionBadge>Control showcase</SectionBadge>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <h2 className="text-[clamp(2.8rem,5vw,5.2rem)] font-semibold leading-[0.95] tracking-[-0.075em] text-[var(--gc-text)]">
                Live dashboard.
                <br />
                Protected pump.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                Monitor the workspace while GreenCloud keeps irrigation commands
                protected by default.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {devices.length > 0 ? (
                  devices.map((device) => (
                    <button
                      type="button"
                      key={device.id}
                      onClick={() => selectDevice(device.id)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        device.id === selectedDevice.id
                          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_22px_var(--gc-glow)]"
                          : "border-[color-mix(in_srgb,var(--gc-border)_76%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
                      )}
                    >
                      {device.name}
                    </button>
                  ))
                ) : (
                  <Link
                    href="/devices"
                    className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    Pair your first device
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <SectionBadge>Automation snapshot</SectionBadge>

                <h2 className="mt-5 text-[clamp(2.4rem,4.4vw,4.4rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)]">
                  Ready for protected watering.
                </h2>

                <p className="mt-5 text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                  Thresholds, cooldown and command duration stay readable before
                  the pump is physically enabled.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Mode", automation.mode, SlidersHorizontal],
                  ["Threshold", `${automation.moistureThreshold}%`, Gauge],
                  ["Cooldown", `${automation.cooldownMinutes} min`, RefreshCw],
                  ["Command", `${automation.pumpDurationSeconds}s`, Zap],
                ].map(([label, value, Icon]) => {
                  const TileIcon = Icon as LucideIcon;

                  return (
                    <ProductMetric
                      key={String(label)}
                      label={String(label)}
                      value={String(value)}
                      detail="Workspace rule."
                      icon={TileIcon}
                      tone="pending"
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProductMetric
                label="Devices"
                value={`${devices.length}`}
                detail="Paired nodes."
                icon={Sprout}
                tone={devices.length > 0 ? "live" : "pending"}
              />

              <ProductMetric
                label="Alerts"
                value={`${unreadNotifications}`}
                detail="Important updates."
                icon={Bell}
                tone={unreadNotifications > 0 ? "warning" : "live"}
              />

              <ProductMetric
                label="Protection"
                value={physicalPumpLocked ? "On" : "Live"}
                detail="Pump guard."
                icon={ShieldCheck}
                tone={physicalPumpLocked ? "safe" : "warning"}
              />

              <ProductMetric
                label="Command"
                value={displayStatus(lastCommandStatus)}
                detail="Latest state."
                icon={CheckCircle2}
                tone={statusTone(displayStatus(lastCommandStatus))}
              />
            </div>
          </GlassCard>
        </section>

        <section className="py-4 pb-8">
          <GlassCard className="relative overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,color-mix(in_srgb,var(--gc-accent)_14%,transparent),transparent_35%)]" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <SectionBadge>Ready to connect</SectionBadge>

                <h2 className="mt-5 max-w-4xl text-[clamp(2.8rem,5.2vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.075em] text-[var(--gc-text)]">
                  Connect your ESP32 and bring your plant zone online.
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                  Use the OLED pairing code to attach your device, then monitor
                  telemetry and manage irrigation from one secure workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/devices"
                  className="premium-btn inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Pair device
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/dashboard"
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-[22px] px-7 py-4 text-base font-semibold"
                >
                  Open dashboard
                  <Zap className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>

      <LandingSettingsPanel />
      <LandingNotificationsPanel />
      <LandingToastStack toasts={toasts} />
    </main>
  );
}