"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Droplets,
  Gauge,
  Leaf,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type DeviceLike = {
  id?: string;
  name?: string;
  place?: string;
  location?: string;
  moisture?: number;
  signal?: number;
  temperature?: number;
  temp?: number;
  humidity?: number;
  status?: string;
  updatedAt?: string;
  moistureHistory?: number[];
  history?: number[];
  safeMode?: boolean;
  pumpEnabled?: boolean;
};

type AutomationLike = {
  mode?: string;
  moistureThreshold?: number;
  threshold?: number;
  cooldownMinutes?: number;
  cooldown?: number;
  pumpDurationSeconds?: number;
  pumpDuration?: number;
};

type DashboardHeroProps = {
  device?: DeviceLike;
  selectedDevice?: DeviceLike;
  automation?: AutomationLike;
  moistureHistory?: number[];
  heroImageSrc?: string;
  onIrrigate?: () => void;
  onRefresh?: () => void;
  className?: string;
};

const fallbackDevice: DeviceLike = {
  name: "Main Pot",
  place: "GreenCloud main plant zone",
  location: "GreenCloud main plant zone",
  status: "Idle",
  moisture: 0,
  signal: 0,
  temperature: undefined,
  humidity: undefined,
  updatedAt: "Waiting for ESP32",
};

const fallbackHistory: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "online") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (normalized === "syncing") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (normalized === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.04] text-[var(--gc-soft)]";
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="min-w-0 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.7rem,2.6vw,2.5rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>
    </div>
  );
}

export default function DashboardHero({
  device,
  selectedDevice,
  automation,
  moistureHistory,
  heroImageSrc = "/hero-bg.jpg",
  onIrrigate,
  onRefresh,
  className,
}: DashboardHeroProps) {
  const activeDevice: DeviceLike = device ?? selectedDevice ?? fallbackDevice;

  const name = activeDevice.name ?? fallbackDevice.name ?? "Main Pot";

  const place =
    activeDevice.place ??
    activeDevice.location ??
    fallbackDevice.place ??
    "GreenCloud main plant zone";

  const status = activeDevice.status ?? fallbackDevice.status ?? "Idle";

  const moisture = clampPercent(
    normalizeNumber(activeDevice.moisture, fallbackDevice.moisture ?? 0),
  );

  const signal = clampPercent(
    normalizeNumber(activeDevice.signal, fallbackDevice.signal ?? 0),
  );

  const rawTemperature = activeDevice.temperature ?? activeDevice.temp;

  const hasTemperature =
    typeof rawTemperature === "number" && Number.isFinite(rawTemperature);

  const hasHumidity =
    typeof activeDevice.humidity === "number" &&
    Number.isFinite(activeDevice.humidity);

  const temperature = hasTemperature ? Math.round(rawTemperature as number) : 0;
  const humidity = hasHumidity
    ? clampPercent(activeDevice.humidity as number)
    : 0;

  const updatedAt =
    activeDevice.updatedAt ?? fallbackDevice.updatedAt ?? "Waiting for ESP32";

  const threshold = clampPercent(
    Math.round(automation?.moistureThreshold ?? automation?.threshold ?? 35),
  );

  const mode = automation?.mode ?? "Automatic";

  const safeMode = activeDevice.safeMode ?? true;
  const pumpEnabled = activeDevice.pumpEnabled ?? false;
  const protectedMode = safeMode || !pumpEnabled;

  const telemetryReady =
    status === "Online" ||
    status === "Syncing" ||
    signal > 0 ||
    moisture > 0;

  const bars: number[] =
    Array.isArray(moistureHistory) && moistureHistory.length > 0
      ? moistureHistory.map(clampPercent)
      : Array.isArray(activeDevice.moistureHistory) &&
          activeDevice.moistureHistory.length > 0
        ? activeDevice.moistureHistory.map(clampPercent)
        : Array.isArray(activeDevice.history) && activeDevice.history.length > 0
          ? activeDevice.history.map(clampPercent)
          : fallbackHistory;

  const moistureLabel = telemetryReady ? `${moisture}%` : "Waiting";
  const signalLabel = telemetryReady ? `${signal}%` : "Waiting";
  const temperatureLabel =
    telemetryReady && hasTemperature ? `${temperature}°C` : "Waiting";
  const humidityLabel =
    telemetryReady && hasHumidity ? `${humidity}%` : "Waiting";

  return (
    <GlassCard className={cn("overflow-hidden", className)}>
      <div className="grid min-h-[560px] 2xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
        <div className="relative flex min-w-0 flex-col justify-between p-7 sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(211,205,112,0.12),transparent_32%),radial-gradient(circle_at_80%_100%,rgba(127,154,75,0.12),transparent_36%)]" />

          <div className="relative z-10 min-w-0">
            <SectionBadge>Overview</SectionBadge>

            <h2 className="mt-6 max-w-[780px] text-[clamp(3rem,6vw,5.3rem)] font-semibold leading-[0.92] tracking-[-0.085em] text-[var(--gc-text)]">
              A focused dashboard for{" "}
              <span className="bg-[linear-gradient(90deg,var(--gc-accent),var(--gc-accent-2))] bg-clip-text text-transparent">
                live irrigation
              </span>{" "}
              control.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
              Device state, moisture rhythm, command response and recent
              activity stay inside one readable GreenCloud workspace.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {[name, telemetryReady ? "Telemetry seen" : "Waiting telemetry", mode].map(
                (item) => (
                  <span
                    key={item}
                    className="max-w-full rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-[var(--gc-text)]"
                  >
                    <span className="block truncate">{item}</span>
                  </span>
                ),
              )}

              <span
                className={cn(
                  "rounded-full border px-5 py-2.5 text-sm font-medium",
                  protectedMode
                    ? "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]"
                    : "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]",
                )}
              >
                {protectedMode ? "Pump protected" : "Pump live"}
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniMetric
              label="Moisture"
              value={moistureLabel}
              icon={Droplets}
            />

            <MiniMetric label="Signal" value={signalLabel} icon={Wifi} />

            <MiniMetric
              label="Temp"
              value={temperatureLabel}
              icon={Thermometer}
            />

            <MiniMetric
              label="Humidity"
              value={humidityLabel}
              icon={SlidersHorizontal}
            />
          </div>
        </div>

        <div className="relative min-w-0 border-t border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] 2xl:border-l 2xl:border-t-0">
          <div className="relative h-[320px] overflow-hidden 2xl:h-[360px]">
            <Image
              src={heroImageSrc}
              alt="GreenCloud live irrigation surface"
              fill
              priority
              sizes="(min-width: 1536px) 46vw, 100vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(4,7,5,0.72)),radial-gradient(circle_at_50%_0%,rgba(229,206,105,0.22),transparent_45%)]" />

            <div
              className={cn(
                "absolute left-6 top-6 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-xl",
                statusTone(status),
              )}
            >
              {status}
            </div>

            <div className="absolute bottom-7 left-7 right-7 min-w-0">
              <SectionBadge>Live control</SectionBadge>

              <h3 className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.5rem,5vw,4.5rem)] font-semibold tracking-[-0.08em] text-[var(--gc-text)]">
                {name}
              </h3>

              <p className="mt-2 line-clamp-2 text-base text-[var(--gc-soft)]">
                {place}
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-6 xl:grid-cols-2">
            <div className="min-w-0 rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.045] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--gc-muted)]">
                Current moisture
              </p>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-[clamp(4rem,8vw,6rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                  {telemetryReady ? moisture : "—"}
                </span>

                {telemetryReady ? (
                  <span className="mb-3 text-2xl text-[var(--gc-accent-2)]">
                    %
                  </span>
                ) : null}
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--gc-accent),var(--gc-accent-2))] shadow-[0_0_22px_var(--gc-glow)]"
                  style={{ width: `${telemetryReady ? moisture : 0}%` }}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 px-4 py-2 text-sm text-[var(--gc-soft)]">
                  {telemetryReady ? "Live state" : "Waiting"}
                </span>

                <span className="text-sm text-[var(--gc-muted)]">
                  {updatedAt}
                </span>
              </div>
            </div>

            <div className="min-w-0 rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.045] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--gc-muted)]">
                Automation
              </p>

              <h4 className="mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.4rem,4vw,3.8rem)] font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                {mode}
              </h4>

              <p className="mt-5 text-base leading-7 text-[var(--gc-soft)]">
                Threshold {threshold}% active. Live telemetry stays inside one
                focused control surface.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <MiniMetric label="Safety" value={protectedMode ? "Safe" : "Live"} icon={ShieldCheck} />
                <MiniMetric label="Threshold" value={`${threshold}%`} icon={Gauge} />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/16 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--gc-muted)]">
                  Recent moisture pattern
                </p>

                <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-2 text-xs text-[var(--gc-soft)]">
                  Last {bars.length} cycles
                </span>
              </div>

              <div className="relative mt-7 h-[170px] overflow-hidden rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 p-4">
                <div
                  className="absolute left-4 right-4 border-t border-dashed border-[color-mix(in_srgb,var(--gc-warn)_72%,transparent)]"
                  style={{ bottom: `${threshold}%` }}
                >
                  <span className="absolute -top-3 left-0 rounded-full border border-[color-mix(in_srgb,var(--gc-warn)_30%,transparent)] bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--gc-warn)]">
                    Threshold {threshold}%
                  </span>
                </div>

                <div className="relative z-10 flex h-full items-end gap-2">
                  {bars.map((bar, index) => {
                    const height = Math.max(12, Math.min(100, bar));

                    return (
                      <div
                        key={`${bar}-${index}`}
                        className="group relative flex-1 rounded-t-2xl bg-[linear-gradient(180deg,var(--gc-accent-2),var(--gc-accent),color-mix(in_srgb,var(--gc-accent)_45%,black))] shadow-[0_0_20px_var(--gc-glow)]"
                        style={{
                          height: `${height}%`,
                          opacity: telemetryReady ? 1 : 0.35,
                        }}
                      >
                        <span className="pointer-events-none absolute -top-10 left-1/2 z-20 hidden -translate-x-1/2 rounded-full border border-white/10 bg-[#111611] px-3 py-1.5 text-xs text-[var(--gc-text)] shadow-xl group-hover:block">
                          {bar}% moisture
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onIrrigate}
                  className="premium-btn inline-flex items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold"
                >
                  Send command
                  <Droplets className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onRefresh}
                  className="premium-btn-secondary inline-flex items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold"
                >
                  Refresh telemetry
                  <RefreshCw className="h-4 w-4" />
                </button>

                <Link
                  href="/automation"
                  className="premium-btn-secondary inline-flex items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold"
                >
                  Edit automation
                  <SlidersHorizontal className="h-4 w-4" />
                </Link>

                <Link
                  href="/devices"
                  className="premium-btn-secondary inline-flex items-center justify-center gap-2 rounded-[22px] px-6 py-4 text-sm font-semibold"
                >
                  Manage devices
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
} 