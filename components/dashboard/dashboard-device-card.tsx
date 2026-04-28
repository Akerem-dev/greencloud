"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  Droplets,
  Gauge,
  Leaf,
  Power,
  Radio,
  Thermometer,
  Wifi,
} from "lucide-react";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type DeviceLike = {
  id?: string;
  name?: string;
  place?: string;
  location?: string;
  status?: "Online" | "Syncing" | "Idle" | "Offline" | string;
  moisture?: number;
  signal?: number;
  temp?: number;
  temperature?: number;
  humidity?: number;
  rawSoil?: number;
  soilVoltage?: number;
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  updatedAt?: string;
  lastWatered?: string;
  lastWateredAt?: string;
};

type DashboardDeviceCardProps = {
  device?: DeviceLike;
  onStartIrrigation?: () => void;
  onSelectDevice?: () => void;
  [key: string]: unknown;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning" || tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function statusTone(status: string): Tone {
  const normalized = status.toLowerCase();

  if (normalized === "online") return "live";
  if (normalized === "syncing") return "safe";
  if (normalized === "offline") return "offline";

  return "pending";
}

function StatusDot({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const className =
    normalized === "online"
      ? "bg-[var(--gc-accent)] shadow-[0_0_18px_var(--gc-glow-strong)]"
      : normalized === "syncing"
        ? "bg-[var(--gc-accent-2)] shadow-[0_0_18px_var(--gc-glow)]"
        : normalized === "offline"
          ? "bg-[var(--gc-warn)] shadow-[0_0_18px_rgba(217,154,117,0.55)]"
          : "bg-[var(--gc-muted)]";

  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", className)} />
  );
}

function Readout({
  label,
  value,
  helper,
  icon,
  tone = "pending",
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className={cn("min-w-0 rounded-[24px] border p-5", toneClass(tone))}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">
          {label}
        </p>

        <div className="shrink-0">{icon}</div>
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.8rem,3vw,2.7rem)] font-semibold leading-none tracking-[-0.06em]">
        {value}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-75">
        {helper}
      </p>
    </div>
  );
}

export default function DashboardDeviceCard({
  device,
  onStartIrrigation,
  onSelectDevice,
}: DashboardDeviceCardProps) {
  const current = device ?? {};

  const name = current.name ?? "Main Pot";
  const place =
    current.place ?? current.location ?? "GreenCloud main plant zone";
  const status = current.status ?? "Idle";

  const moisture = clampPercent(safeNumber(current.moisture, 0));
  const signal = clampPercent(safeNumber(current.signal, 0));

  const temp = safeNumber(current.temp ?? current.temperature, 0);
  const humidity = clampPercent(safeNumber(current.humidity, 0));

  const rawSoil = safeNumber(current.rawSoil, 0);
  const soilVoltage =
    typeof current.soilVoltage === "number" && Number.isFinite(current.soilVoltage)
      ? current.soilVoltage
      : undefined;

  const updatedAt = current.updatedAt ?? "Waiting for ESP32";
  const lastWatered =
    current.lastWatered ?? current.lastWateredAt ?? "Not watered yet";

  const hasTelemetry =
    status === "Online" ||
    status === "Syncing" ||
    signal > 0 ||
    moisture > 0;

  const sensorStatus = current.sensorStatus ?? (hasTelemetry ? "Live" : "Waiting");
  const safeMode = current.safeMode ?? true;
  const pumpEnabled = current.pumpEnabled ?? false;

  const moistureLabel = hasTelemetry ? `${moisture}%` : "Waiting";
  const signalLabel = hasTelemetry ? `${signal}%` : "Waiting";
  const climateLabel =
    hasTelemetry && temp !== 0 ? `${temp}°C · ${humidity}%` : "Waiting";
  const rawLabel = hasTelemetry ? String(rawSoil) : "—";
  const voltageLabel =
    hasTelemetry && typeof soilVoltage === "number"
      ? `${soilVoltage.toFixed(2)}V`
      : "—";

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="relative overflow-hidden border-b border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] p-6 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(201,215,105,0.14),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(127,154,75,0.12),transparent_34%)]" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <SectionBadge>Selected device</SectionBadge>

            <h3 className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.2rem,4vw,4rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
              {name}
            </h3>

            <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--gc-soft)]">
              {place}
            </p>
          </div>

          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold",
              toneClass(statusTone(status)),
            )}
          >
            <StatusDot status={status} />
            {status}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="min-w-0 rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                Moisture
              </p>

              <Droplets className="h-4 w-4 text-[var(--gc-accent-2)]" />
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-[clamp(4rem,7vw,6rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                {hasTelemetry ? moisture : "—"}
              </span>

              {hasTelemetry ? (
                <span className="mb-3 text-2xl text-[var(--gc-accent-2)]">
                  %
                </span>
              ) : null}
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--gc-accent),var(--gc-accent-2))] shadow-[0_0_22px_var(--gc-glow)]"
                style={{
                  width: `${hasTelemetry ? Math.max(8, moisture) : 0}%`,
                }}
              />
            </div>

            <p className="mt-5 text-sm leading-7 text-[var(--gc-soft)]">
              Root-zone reading remains visible and ready for automation
              decisions.
            </p>
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Readout
              label="Signal"
              value={signalLabel}
              helper={
                hasTelemetry
                  ? "Stable wireless path."
                  : "Waiting for Wi-Fi telemetry."
              }
              icon={<Wifi className="h-4 w-4" />}
              tone={hasTelemetry ? "live" : "pending"}
            />

            <Readout
              label="Climate"
              value={climateLabel}
              helper={
                hasTelemetry && temp !== 0
                  ? "Temperature and humidity grouped."
                  : "Climate data appears after publish."
              }
              icon={<Thermometer className="h-4 w-4" />}
              tone={hasTelemetry && temp !== 0 ? "safe" : "pending"}
            />

            <Readout
              label="Raw soil"
              value={rawLabel}
              helper={`ADC voltage ${voltageLabel}.`}
              icon={<Radio className="h-4 w-4" />}
              tone={hasTelemetry ? "safe" : "pending"}
            />

            <Readout
              label="Sensor"
              value={sensorStatus}
              helper="Current soil sensor state."
              icon={<Gauge className="h-4 w-4" />}
              tone={sensorStatus.toLowerCase().includes("sensor") ? "warning" : hasTelemetry ? "live" : "pending"}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStartIrrigation}
            className="premium-btn inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm font-semibold"
          >
            {safeMode || !pumpEnabled ? "Send dry-run command" : "Start pump"}
            <Droplets className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onSelectDevice}
            className="premium-btn-secondary inline-flex items-center justify-center gap-2 rounded-[20px] px-5 py-4 text-sm font-semibold"
          >
            Keep in focus
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                Module health
              </p>

              <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--gc-soft)]">
                Last watered: {lastWatered}. Updated {updatedAt}.
              </p>
            </div>

            {safeMode || !pumpEnabled ? (
              <Power className="h-5 w-5 shrink-0 text-[var(--gc-accent-2)]" />
            ) : (
              <Leaf className="h-5 w-5 shrink-0 text-[var(--gc-accent-2)]" />
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}