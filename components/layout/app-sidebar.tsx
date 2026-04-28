"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  CloudRain,
  Cpu,
  Droplets,
  Gauge,
  Home,
  LayoutDashboard,
  Leaf,
  Lock,
  Monitor,
  Radio,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  ToggleLeft,
  Waves,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAppState } from "@/components/providers/app-state-provider";
import BrandMark from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

type DeviceExtra = {
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
  lastCommandStatus?: string;
  lastSeenMs?: number;
  power?: string;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

const mainNavigation = [
  {
    label: "Overview",
    subtitle: "Product home",
    href: "/",
    icon: Home,
  },
  {
    label: "Dashboard",
    subtitle: "Live workspace",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Devices",
    subtitle: "Paired units",
    href: "/devices",
    icon: Cpu,
  },
  {
    label: "Automation",
    subtitle: "Irrigation rules",
    href: "/automation",
    icon: SlidersHorizontal,
  },
  {
    label: "Activity",
    subtitle: "System events",
    href: "/activity",
    icon: Activity,
  },
  {
    label: "Settings",
    subtitle: "Workspace control",
    href: "/settings",
    icon: Settings2,
  },
];

function hasTelemetry(device: DeviceExtra & { status?: string; signal?: number }) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    Number(device.signal) > 0
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
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("handled") ||
    lower.includes("seen")
  ) {
    return "live";
  }

  if (
    lower.includes("safe") ||
    lower.includes("protected") ||
    lower.includes("locked") ||
    lower.includes("guarded") ||
    lower.includes("dry-run") ||
    lower.includes("dry run")
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

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked") return "Protected";
  if (lower === "none") return "No command";
  if (lower === "pending") return "Waiting";

  return value;
}

function getSensorStatus(device: DeviceExtra & { status?: string }) {
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

function pluralDeviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
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

function CompactMetric({
  label,
  value,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[20px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : getToneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
      </div>

      <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.5rem,2vw,2rem)] font-semibold leading-none tracking-[-0.05em] text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>
    </div>
  );
}

function HardwareLine({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3",
        getToneClass(tone),
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />

        <span className="truncate text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
          {label}
        </span>
      </span>

      <span className="max-w-[120px] truncate text-sm font-semibold">
        {displayStatus(value)}
      </span>
    </div>
  );
}

function NavLink({
  href,
  label,
  subtitle,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-[21px] border px-4 py-3 transition",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_0_28px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-white/[0.025] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.05] hover:text-[var(--gc-text)]",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
            active
              ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-accent-2)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_80%,transparent)] bg-black/16 text-[var(--gc-soft)] group-hover:text-[var(--gc-text)]",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{label}</span>
          <span className="mt-0.5 block truncate text-xs text-[var(--gc-muted)]">
            {subtitle}
          </span>
        </span>
      </span>

      {active ? (
        <span className="shrink-0 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gc-accent-2)]">
          On
        </span>
      ) : null}
    </Link>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const {
    devices,
    selectedDevice,
    unreadNotifications,
    automation,
    settings,
    openQuickPanel,
    openNotifications,
  } = useAppState();

  const selectedExtra = selectedDevice as typeof selectedDevice & DeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;

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
  const lastCommandStatus = selectedExtra.lastCommandStatus ?? "None";

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Waiting";

  const rawSoilLabel = telemetryReady ? rawLabel(selectedExtra.rawSoil) : "—";

  const signalLabel = telemetryReady
    ? `${selectedDevice.signal}%`
    : "Waiting";

  const soilVoltageValue = voltageLabel(selectedExtra.soilVoltage);

  const protectionLabel =
    safeModeActive || !pumpEnabled ? "Protected" : "Output live";

  const commandLabel = displayStatus(lastCommandStatus);

  return (
    <aside className="relative flex h-full min-h-[calc(100dvh-32px)] max-h-[calc(100dvh-32px)] min-w-0 overflow-hidden rounded-[34px] border border-[color-mix(in_srgb,var(--gc-border)_94%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_84%,black)] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.36),0_0_44px_var(--gc-glow)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_srgb,var(--gc-accent-2)_16%,transparent),transparent_28%),radial-gradient(circle_at_80%_28%,color-mix(in_srgb,var(--gc-accent)_12%,transparent),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_34%)]" />

      <div className="relative z-10 h-full min-h-0 w-full overflow-y-auto overscroll-contain pr-1 gc-scrollbar">
        <div className="space-y-4 pb-4">
          <Link
            href="/"
            className="group block rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_84%,transparent)] p-5 transition hover:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] hover:bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]"
          >
            <BrandMark
              title={settings.workspaceName || "GreenCloud"}
              subtitle="Smart irrigation workspace"
            />

            <p className="mt-5 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
              Pair ESP32 devices, monitor live plant telemetry, and keep pump
              commands protected from one workspace.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill
                label={pluralDeviceLabel(devices.length)}
                tone="pending"
              />
              <StatusPill label="Private sync" tone="safe" />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <CompactMetric
              label="Moisture"
              value={moistureLabel}
              icon={Sprout}
              tone={telemetryReady ? statusTone(sensorStatus) : "pending"}
            />

            <CompactMetric
              label="Signal"
              value={signalLabel}
              icon={Wifi}
              tone={telemetryReady ? "live" : "pending"}
            />
          </div>

          <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--gc-muted)]">
                  Selected device
                </p>

                <h3 className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,2.4vw,2.5rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  {selectedDevice.name}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
                  {selectedDevice.place}
                </p>
              </div>

              <StatusPill
                label={selectedDevice.status}
                tone={statusTone(selectedDevice.status)}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactMetric
                label="Raw"
                value={rawSoilLabel}
                icon={Gauge}
                tone={
                  !telemetryReady
                    ? "pending"
                    : statusTone(sensorStatus) === "warning"
                      ? "warning"
                      : "safe"
                }
              />

              <CompactMetric
                label="Command"
                value={commandLabel}
                icon={Radio}
                tone={statusTone(commandLabel)}
              />
            </div>
          </div>

          <nav className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-3">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--gc-muted)]">
              Workspace
            </p>

            <div className="space-y-2">
              {mainNavigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    active={isActive}
                  />
                );
              })}
            </div>
          </nav>

          <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--gc-muted)]">
                  Protection
                </p>

                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                  {protectionLabel}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
                  Pump output stays guarded while safe-mode is active.
                </p>
              </div>

              <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--gc-accent-2)]" />
            </div>

            <div className="mt-4 grid gap-2">
              <HardwareLine
                label="Relay"
                value={relayState}
                icon={Lock}
                tone={statusTone(relayState)}
              />

              <HardwareLine
                label="Pump"
                value={pumpState}
                icon={Droplets}
                tone={statusTone(pumpState)}
              />

              <HardwareLine
                label="Mode"
                value={automation.mode}
                icon={SlidersHorizontal}
                tone="pending"
              />

              <HardwareLine
                label="Limit"
                value={`${automation.moistureThreshold}%`}
                icon={Gauge}
                tone="safe"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--gc-muted)]">
                  Sensor stack
                </p>

                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
                  Hardware health
                </h3>
              </div>

              <Cpu className="h-5 w-5 shrink-0 text-[var(--gc-accent-2)]" />
            </div>

            <div className="mt-4 grid gap-2">
              <HardwareLine
                label="Soil"
                value={sensorStatus}
                icon={Leaf}
                tone={statusTone(sensorStatus)}
              />

              <HardwareLine
                label="Voltage"
                value={soilVoltageValue}
                icon={Zap}
                tone={soilVoltageValue === "—" ? "pending" : "safe"}
              />

              <HardwareLine
                label="OLED"
                value={oledStatus}
                icon={Monitor}
                tone={statusTone(oledStatus)}
              />

              <HardwareLine
                label="Tank"
                value={waterLevelStatus}
                icon={Waves}
                tone={statusTone(waterLevelStatus)}
              />

              <HardwareLine
                label="Rain"
                value={rainStatus}
                icon={CloudRain}
                tone={statusTone(rainStatus)}
              />

              <HardwareLine
                label="Button"
                value={buttonStatus}
                icon={ToggleLeft}
                tone={statusTone(buttonStatus)}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={openQuickPanel}
              className="premium-btn-secondary flex items-center justify-between gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold"
            >
              <span>Quick controls</span>
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
            </button>

            <button
              type="button"
              onClick={openNotifications}
              className="premium-btn-secondary flex items-center justify-between gap-3 rounded-[22px] px-4 py-3 text-sm font-semibold"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span>Alerts</span>

                {unreadNotifications > 0 ? (
                  <span className="rounded-full bg-[var(--gc-accent)] px-2 py-0.5 text-[10px] font-bold text-[#11160d] shadow-[0_0_18px_var(--gc-glow)]">
                    {unreadNotifications}
                  </span>
                ) : null}
              </span>

              <Bell className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}