"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  Bell,
  Cpu,
  Droplets,
  Gauge,
  Home,
  LayoutDashboard,
  Lock,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  Wifi,
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
  pumpState?: string;
  lastCommandStatus?: string;
  lastSeenMs?: number;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

type NavigationItem = {
  label: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
};

const mainNavigation: NavigationItem[] = [
  { label: "Overview", subtitle: "Product home", href: "/", icon: Home },
  {
    label: "Dashboard",
    subtitle: "Live telemetry",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Devices",
    subtitle: "Pairing and nodes",
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
    subtitle: "Workspace setup",
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

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked" || lower === "safe") {
    return "Protected";
  }

  if (lower === "none" || lower === "pending") {
    return "Ready";
  }

  if (lower === "idle") {
    return "Standby";
  }

  if (lower === "sensor check") {
    return "Calibrating";
  }

  if (lower === "handled") {
    return "Completed";
  }

  return value;
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
    lower.includes("blocked") ||
    lower.includes("calibrating")
  ) {
    return "warning";
  }

  return "pending";
}

function toneDotClass(tone: Tone) {
  if (tone === "live") return "bg-[var(--gc-accent)]";
  if (tone === "safe") {
    return "bg-[color-mix(in_srgb,var(--gc-accent-2)_78%,white_22%)]";
  }
  if (tone === "warning") return "bg-[var(--gc-warn)]";
  if (tone === "offline") return "bg-[var(--gc-danger)]";
  return "bg-[var(--gc-muted)]";
}

function tonePillClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_9%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_9%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-[color-mix(in_srgb,var(--gc-panel)_64%,transparent)] text-[var(--gc-soft)]";
}

function metricToneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_20%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-accent)_7%,transparent),rgba(255,255,255,0.014))]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_22%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-accent-2)_8%,transparent),rgba(255,255,255,0.014))]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_22%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-warn)_8%,transparent),rgba(255,255,255,0.014))]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_20%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-danger)_8%,transparent),rgba(255,255,255,0.014))]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_56%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.012))]";
}

function getSensorStatus(device: DeviceExtra & { status?: string }) {
  if (device.sensorStatus) return displayStatus(device.sensorStatus);
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Ready";
}

function pluralDeviceLabel(count: number) {
  return count === 1 ? "1 device" : `${count} devices`;
}

function SidebarPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.034),rgba(255,255,255,0.014))] shadow-[inset_0_1px_0_rgba(255,255,255,0.018),0_16px_36px_rgba(0,0,0,0.14)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,color-mix(in_srgb,var(--gc-accent)_7%,transparent),transparent_38%),radial-gradient(circle_at_92%_14%,rgba(255,255,255,0.026),transparent_30%)]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="truncate text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
      {children}
    </p>
  );
}

function StatusPill({ label, tone }: { label: string; tone?: Tone }) {
  const visibleLabel = displayStatus(label);
  const currentTone = tone ?? statusTone(visibleLabel);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
        tonePillClass(currentTone),
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.08)]",
          toneDotClass(currentTone),
        )}
      />
      <span className="truncate">{visibleLabel}</span>
    </span>
  );
}

function SnapshotMetric({
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
        "group relative min-h-[88px] min-w-0 overflow-hidden rounded-[20px] border p-3.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.14)]",
        metricToneClass(tone),
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(255,255,255,0.045),transparent_34%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[8px] font-semibold uppercase tracking-[0.18em] text-[var(--gc-muted)]">
          {label}
        </p>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-black/14 text-[var(--gc-text)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>

      <p className="relative mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[1.08rem] font-semibold leading-none tracking-[-0.05em] text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center justify-between gap-3 overflow-hidden rounded-[20px] border px-3 py-2.5 transition duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_12%,transparent),rgba(255,255,255,0.032))] text-[var(--gc-text)] shadow-[0_12px_28px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.028)]"
          : "border-transparent bg-white/[0.024] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] hover:bg-white/[0.04] hover:text-[var(--gc-text)]",
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--gc-accent)_7%,transparent),transparent_38%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <span className="relative flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[15px] border transition duration-300",
            active
              ? "border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]"
              : "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)] bg-black/14 text-[var(--gc-soft)] group-hover:text-[var(--gc-text)]",
          )}
        >
          <Icon className="h-[17px] w-[17px]" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold tracking-[-0.025em]">
            {label}
          </span>

          <span className="mt-0.5 block truncate text-[10.5px] text-[var(--gc-muted)]">
            {subtitle}
          </span>
        </span>
      </span>

      {active ? (
        <span className="relative shrink-0 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--gc-text)]">
          On
        </span>
      ) : null}
    </Link>
  );
}

function ActionButton({
  onClick,
  label,
  icon: Icon,
  badge,
  accent = false,
}: {
  onClick: () => void;
  label: string;
  icon: LucideIcon;
  badge?: number;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-between gap-3 overflow-hidden rounded-[20px] border px-3.5 py-3 text-[13px] font-semibold transition duration-300",
        accent
          ? "border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_12%,transparent),rgba(255,255,255,0.026))] text-[var(--gc-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.026),0_12px_24px_rgba(0,0,0,0.12)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))] text-[var(--gc-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_12px_24px_rgba(0,0,0,0.12)] hover:text-[var(--gc-text)]",
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--gc-accent)_7%,transparent),transparent_40%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <span className="relative flex min-w-0 items-center gap-2">
        <span className="truncate">{label}</span>

        {typeof badge === "number" && badge > 0 ? (
          <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] px-2 py-0.5 text-[9px] font-bold text-[var(--gc-text)] shadow-[0_0_16px_var(--gc-glow)]">
            {badge}
          </span>
        ) : null}
      </span>

      <Icon className="relative h-4 w-4 shrink-0" />
    </button>
  );
}

function MiniStatusCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.012))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]">
      <span className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-white/10 bg-black/14 text-[var(--gc-text)]">
        <Icon className="h-4 w-4" />
      </span>

      <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--gc-muted)]">
        {label}
      </p>

      <p className="mt-1 truncate text-[13px] font-semibold text-[var(--gc-text)]">
        {displayStatus(value)}
      </p>
    </div>
  );
}

export default function AppSidebar() {
  const pathname = usePathname();

  const {
    devices,
    selectedDevice,
    unreadNotifications,
    automation,
    openQuickPanel,
    openNotifications,
  } = useAppState();

  const selectedExtra = selectedDevice as typeof selectedDevice & DeviceExtra;

  const telemetryReady = hasTelemetry(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;

  const sensorStatus = getSensorStatus(selectedExtra);

  const pumpState =
    selectedExtra.pumpState ??
    (safeModeActive || !pumpEnabled ? "Protected" : "Ready");

  const lastCommandStatus = selectedExtra.lastCommandStatus ?? "Ready";

  const moistureLabel = telemetryReady
    ? `${selectedDevice.moisture}%`
    : "Ready";

  const signalLabel = telemetryReady ? `${selectedDevice.signal}%` : "Ready";

  const protectionLabel =
    safeModeActive || !pumpEnabled ? "Protected" : "Pump live";

  const commandLabel = displayStatus(lastCommandStatus);

  return (
    <div className="relative flex h-full min-h-[calc(100dvh-32px)] max-h-[calc(100dvh-32px)] min-w-0 overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-bg)_76%,black),color-mix(in_srgb,var(--gc-bg)_90%,black))] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.024)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--gc-accent)_9%,transparent),transparent_36%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.024),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 h-full min-h-0 w-full overflow-y-auto overscroll-contain pr-1 gc-scrollbar">
        <div className="space-y-3 pb-3">
          <Link href="/" className="block">
            <div className="relative overflow-hidden rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.018))] px-3.5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.028),0_16px_32px_rgba(0,0,0,0.14)]">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <BrandMark
                title="GreenCloud"
                subtitle="SMART IRRIGATION WORKSPACE"
                compact
                className="w-full"
              />
            </div>
          </Link>

          <SidebarPanel className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SectionLabel>Selected device</SectionLabel>

                <h3 className="mt-2.5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[1.28rem] font-semibold leading-none tracking-[-0.055em] text-[var(--gc-text)]">
                  {selectedDevice.name}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
                  {selectedDevice.place}
                </p>
              </div>

              <StatusPill
                label={selectedDevice.status}
                tone={statusTone(selectedDevice.status)}
              />
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <SnapshotMetric
                label="Moisture"
                value={moistureLabel}
                icon={Sprout}
                tone={telemetryReady ? statusTone(sensorStatus) : "pending"}
              />

              <SnapshotMetric
                label="Signal"
                value={signalLabel}
                icon={Wifi}
                tone={telemetryReady ? "live" : "pending"}
              />

              <SnapshotMetric
                label="Protect"
                value={protectionLabel}
                icon={ShieldCheck}
                tone={safeModeActive || !pumpEnabled ? "safe" : "warning"}
              />

              <SnapshotMetric
                label="Command"
                value={commandLabel}
                icon={Gauge}
                tone={statusTone(commandLabel)}
              />
            </div>
          </SidebarPanel>

          <SidebarPanel className="p-2.5">
            <div className="px-2 pb-2">
              <SectionLabel>Workspace</SectionLabel>
            </div>

            <nav className="space-y-1.5">
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
            </nav>
          </SidebarPanel>

          <SidebarPanel className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SectionLabel>Workspace status</SectionLabel>

                <h3 className="mt-2.5 text-[1.24rem] font-semibold leading-none tracking-[-0.055em] text-[var(--gc-text)]">
                  {pluralDeviceLabel(devices.length)}
                </h3>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
                  {automation.mode} mode · threshold{" "}
                  {automation.moistureThreshold}% · command{" "}
                  {automation.pumpDurationSeconds}s.
                </p>
              </div>

              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              <StatusPill label={protectionLabel} tone="safe" />
              <StatusPill label={displayStatus(pumpState)} tone="safe" />
            </div>
          </SidebarPanel>

          <div className="grid gap-2.5">
            <ActionButton
              onClick={openQuickPanel}
              label="Quick controls"
              icon={SlidersHorizontal}
              accent
            />

            <ActionButton
              onClick={openNotifications}
              label="Alerts"
              icon={Bell}
              badge={unreadNotifications}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <MiniStatusCard
              label="Pump"
              value={displayStatus(pumpState)}
              icon={Droplets}
            />

            <MiniStatusCard
              label="Guard"
              value={safeModeActive ? "Active" : "Ready"}
              icon={ShieldCheck}
            />
          </div>
        </div>
      </div>
    </div>
  );
}