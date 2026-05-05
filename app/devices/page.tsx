"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Copy,
  Cpu,
  Droplets,
  Gauge,
  KeyRound,
  Leaf,
  Lock,
  Monitor,
  Pencil,
  Power,
  Radio,
  RefreshCw,
  ShieldCheck,
  ToggleLeft,
  Trash2,
  Waves,
  Wifi,
  X,
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
  power?: string;
  sensorStatus?: string;
  lastWateredAt?: string;
  lastSeenMs?: number;
  relayState?: string;
  pumpState?: string;
  waterLevel?: number;
  waterLevelStatus?: string;
  rainDetected?: boolean;
  rainStatus?: string;
  buttonPressed?: boolean;
  buttonStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  oledStatus?: string;
  firmware?: string;
  lastCommand?: string;
  lastCommandStatus?: string;
  pairingCode?: string;
};

type DeviceFilter = "All" | Device["status"];
type Tone = "live" | "safe" | "pending" | "warning" | "offline";

const filterOptions: DeviceFilter[] = [
  "All",
  "Online",
  "Syncing",
  "Idle",
  "Offline",
];

const DEFAULT_DEVICE_NAME = "GreenCloud Device";
const DEFAULT_DEVICE_PLACE = "Plant zone";

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

function hasTelemetry(device: DeviceExtra) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
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
    lower.includes("ok") ||
    lower.includes("clear") ||
    lower.includes("active") ||
    lower.includes("ready") ||
    lower.includes("handled")
  ) {
    return "live";
  }

  if (
    lower.includes("locked") ||
    lower.includes("dry-run") ||
    lower.includes("safe") ||
    lower.includes("protected")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
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

  return "warning";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning" || tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function StatusDot({ status }: { status: Device["status"] }) {
  const className =
    status === "Online"
      ? "bg-[var(--gc-accent)] shadow-[0_0_18px_var(--gc-glow-strong)]"
      : status === "Syncing"
        ? "bg-[var(--gc-accent-2)] shadow-[0_0_18px_var(--gc-glow)]"
        : status === "Offline"
          ? "bg-[var(--gc-warn)] shadow-[0_0_18px_rgba(217,154,117,0.45)]"
          : "bg-[var(--gc-muted)]";

  return (
    <span className={cn("inline-block h-2.5 w-2.5 rounded-full", className)} />
  );
}

function StatusPill({ status }: { status: Device["status"] | string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(statusTone(status)),
      )}
    >
      {status === "Online" ||
      status === "Syncing" ||
      status === "Idle" ||
      status === "Offline" ? (
        <StatusDot status={status as Device["status"]} />
      ) : null}

      <span className="truncate">{status}</span>
    </span>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "live",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[22px] border p-4",
        tone === "warning" || tone === "offline"
          ? "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)]"
          : tone === "safe"
            ? "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
          {label}
        </p>

        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            tone === "warning" || tone === "offline"
              ? "text-[var(--gc-warn)]"
              : "text-[var(--gc-accent-2)]",
          )}
        />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.65rem,2.3vw,2.6rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>

      {detail ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone = "live",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[26px] border p-5",
        tone === "safe"
          ? "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)]"
          : tone === "warning" || tone === "offline"
            ? "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)]"
            : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,3vw,3.3rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>
    </div>
  );
}

function HardwarePartCard({
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
    <div className={cn("min-w-0 rounded-[22px] border p-4", toneClass(tone))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75">
            {title}
          </p>

          <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold leading-tight tracking-[-0.04em]">
            {value}
          </p>

          <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-75">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/16">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function CopyChip({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          void navigator.clipboard.writeText(value);
        }

        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 px-3 py-1.5 text-xs font-semibold text-[var(--gc-soft)] transition hover:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] hover:text-[var(--gc-text)]"
      title={label}
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Copy className="h-3.5 w-3.5 shrink-0" />
      )}

      <span className="truncate">{value}</span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  maxLength,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          {label}
        </span>
      ) : null}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={cn(
          "w-full rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-5 text-base text-[var(--gc-text)] outline-none transition",
          label ? "mt-3 h-12" : "h-14",
          "placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-white/[0.055] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]",
        )}
      />
    </label>
  );
}

function DeviceEditorModal({
  device,
  onSave,
  onCancel,
}: {
  device: Device;
  onSave: (nextName: string, nextPlace: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(device.name);
  const [place, setPlace] = useState(device.place);
  const [error, setError] = useState("");

  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="Close edit device modal"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[720px]">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionBadge>Edit device</SectionBadge>

              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Update device label
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--gc-soft)]">
                Rename the device and its plant zone without changing the
                hardware identity.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <TextField
              label="Device name"
              value={name}
              placeholder="Balcony Plant"
              onChange={(value) => {
                setName(value);
                if (error) setError("");
              }}
            />

            <TextField
              label="Plant zone"
              value={place}
              placeholder="Balcony shelf"
              onChange={(value) => {
                setPlace(value);
                if (error) setError("");
              }}
            />

            <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/16 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                Device ID
              </p>

              <p className="mt-2 break-all text-sm text-[var(--gc-soft)]">
                {device.id}
              </p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-[var(--gc-warn)]">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="premium-btn-secondary rounded-[18px] px-5 py-3 text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                const safeName = name.trim();
                const safePlace = place.trim();

                if (!safeName || !safePlace) {
                  setError("Name and plant zone are required.");
                  return;
                }

                onSave(safeName, safePlace);
              }}
              className="premium-btn rounded-[18px] px-5 py-3 text-sm font-semibold"
            >
              Save changes
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  device,
  onCancel,
  onConfirm,
}: {
  device: Device;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="Close delete confirmation"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[620px]">
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <SectionBadge>Remove device</SectionBadge>

              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Disconnect this device?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                <span className="font-semibold text-[var(--gc-text)]">
                  {device.name}
                </span>{" "}
                will be removed from this workspace. The ESP32 can be paired
                again with a fresh OLED code.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="premium-btn-secondary rounded-[18px] px-5 py-3 text-sm"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="rounded-[18px] border border-[color-mix(in_srgb,var(--gc-warn)_42%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_16%,transparent)] px-5 py-3 text-sm font-semibold text-[var(--gc-text)] shadow-[0_0_28px_rgba(217,154,117,0.16)]"
            >
              Remove device
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function PairingPanel({
  code,
  setCode,
  name,
  setName,
  place,
  setPlace,
  onPair,
  isPairing,
}: {
  code: string;
  setCode: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  place: string;
  setPlace: (value: string) => void;
  onPair: () => void;
  isPairing: boolean;
}) {
  return (
    <GlassCard className="overflow-hidden p-6">
      <div className="grid gap-6 2xl:grid-cols-[1fr_0.82fr]">
        <div>
          <SectionBadge>Pairing</SectionBadge>

          <h3 className="mt-4 max-w-[14ch] text-[clamp(2.4rem,4.2vw,4.6rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--gc-text)]">
            Connect your ESP32.
          </h3>

          <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--gc-soft)]">
            Use the 7-character code shown on the OLED display to attach the
            physical GreenCloud node to this workspace.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <TextField
              label="OLED code"
              value={code}
              placeholder="A7K9Q2M"
              maxLength={7}
              autoFocus
              onChange={(value) =>
                setCode(value.replace(/[^A-Za-z0-9]/g, "").slice(0, 7))
              }
            />

            <TextField
              label="Device name"
              value={name}
              placeholder="Balcony Plant"
              onChange={setName}
            />

            <div className="lg:col-span-2">
              <TextField
                label="Plant zone"
                value={place}
                placeholder="Balcony shelf"
                onChange={setPlace}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onPair}
            disabled={isPairing}
            className="premium-btn mt-5 inline-flex items-center justify-center gap-2 rounded-[20px] px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-[18px] w-[18px]" />
            {isPairing ? "Pairing..." : "Pair device"}
          </button>
        </div>

        <div className="rounded-[30px] border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] p-6">
          <KeyRound className="h-6 w-6 text-[var(--gc-accent-2)]" />

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
            Secure pairing flow
          </p>

          <div className="mt-5 space-y-4">
            {[
              "Power on the ESP32.",
              "Read the OLED pairing code.",
              "Enter the code while signed in.",
              "GreenCloud links the real device to this workspace.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex gap-3 rounded-[22px] border border-white/10 bg-black/16 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-xs font-bold text-[var(--gc-accent-2)]">
                  {index + 1}
                </span>

                <p className="text-sm leading-6 text-[var(--gc-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function DeviceCard({
  device,
  active,
  onEdit,
  onSelect,
  onRemove,
  onIrrigate,
  onRefresh,
}: {
  device: Device;
  active: boolean;
  onEdit: () => void;
  onSelect: () => void;
  onRemove: () => void;
  onIrrigate: () => void;
  onRefresh: () => void;
}) {
  const extra = device as DeviceExtra;
  const telemetryReady = hasTelemetry(extra);
  const sensorStatus = getSensorStatus(extra);
  const safeMode = extra.safeMode ?? true;
  const pumpEnabled = extra.pumpEnabled ?? false;
  const sensorFault =
    sensorStatus.toLowerCase().includes("sensor check") ||
    sensorStatus.toLowerCase().includes("no signal") ||
    device.status === "Offline";

  const moistureValue = telemetryReady ? `${device.moisture}%` : "Waiting";
  const rawValue = telemetryReady ? rawLabel(extra.rawSoil) : "—";
  const signalValue = telemetryReady ? `${device.signal}%` : "Waiting";
  const voltageValue = telemetryReady ? voltageLabel(extra.soilVoltage) : "—";

  const relayState =
    extra.relayState ?? (safeMode || !pumpEnabled ? "Locked" : "Enabled");

  const pumpState =
    extra.pumpState ?? (safeMode || !pumpEnabled ? "Dry-run" : "Ready");

  const hardwareParts = [
    {
      title: "ESP32",
      value: device.status,
      description: `Sync · ${getLastSeenLabel(extra)}`,
      icon: Cpu,
      tone:
        device.status === "Online"
          ? "live"
          : device.status === "Offline"
            ? "offline"
            : "pending",
    },
    {
      title: "Soil sensor",
      value: sensorStatus,
      description: `RAW ${rawValue} · ${voltageValue}`,
      icon: Leaf,
      tone: sensorFault
        ? "warning"
        : sensorStatus === "Pending"
          ? "pending"
          : "live",
    },
    {
      title: "OLED",
      value: extra.oledStatus ?? "Pending",
      description: "Display state.",
      icon: Monitor,
      tone:
        extra.oledStatus === "Active"
          ? "live"
          : extra.oledStatus === "Off"
            ? "offline"
            : "pending",
    },
    {
      title: "Relay",
      value: relayState,
      description: safeMode ? "Output protected." : "Output available.",
      icon: Lock,
      tone: safeMode || !pumpEnabled ? "safe" : "warning",
    },
    {
      title: "Pump",
      value: pumpState,
      description: pumpEnabled ? "Hardware output enabled." : "Protected mode.",
      icon: Power,
      tone: pumpEnabled ? "warning" : "safe",
    },
    {
      title: "Water level",
      value: extra.waterLevelStatus ?? "Pending",
      description: "Tank status.",
      icon: Waves,
      tone:
        extra.waterLevelStatus === "OK"
          ? "live"
          : extra.waterLevelStatus === "Low" ||
              extra.waterLevelStatus === "Empty"
            ? "warning"
            : "pending",
    },
    {
      title: "Rain",
      value: extra.rainStatus ?? "Pending",
      description: "Rain lockout.",
      icon: CloudRain,
      tone:
        extra.rainStatus === "Clear"
          ? "live"
          : extra.rainStatus === "Detected"
            ? "warning"
            : "pending",
    },
    {
      title: "Button",
      value: extra.buttonStatus ?? "Pending",
      description: "Local input.",
      icon: ToggleLeft,
      tone:
        extra.buttonStatus === "Ready" || extra.buttonStatus === "Pressed"
          ? "live"
          : "pending",
    },
  ] satisfies Array<{
    title: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone: Tone;
  }>;

  return (
    <div
      className={cn(
        "rounded-[30px] border p-5 transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] shadow-[0_22px_52px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] hover:border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] hover:bg-white/[0.045]",
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={device.status} />
            <StatusPill status={safeMode ? "Protected" : "Pump live"} />
            <StatusPill status={extra.lastCommandStatus ?? "None"} />

            {active ? (
              <span className="premium-tab premium-tab-active rounded-full px-3 py-1.5 text-xs">
                Selected
              </span>
            ) : null}
          </div>

          <h3 className="mt-4 max-w-[28ch] overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,3vw,3.4rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--gc-text)]">
            {device.name}
          </h3>

          <p className="mt-2 max-w-3xl overflow-hidden text-ellipsis whitespace-nowrap text-base leading-7 text-[var(--gc-soft)]">
            {device.place}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <CopyChip value={device.id} label="Copy device ID" />

            {extra.pairingCode ? (
              <CopyChip value={extra.pairingCode} label="Copy pairing code" />
            ) : null}

            <span className="premium-tab max-w-full truncate rounded-full px-3 py-1.5 text-xs">
              {extra.firmware ?? "greencloud-esp32"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
            title="Edit device"
          >
            <Pencil className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              active ? "premium-tab premium-tab-active" : "premium-tab",
            )}
          >
            {active ? "Selected" : "Select"}
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="premium-btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
            title="Remove device"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Moisture"
          value={moistureValue}
          detail={telemetryReady ? "Soil moisture." : "Waiting for device."}
          icon={Droplets}
          tone={sensorFault ? "warning" : telemetryReady ? "live" : "pending"}
        />

        <MetricTile
          label="Raw soil"
          value={rawValue}
          detail={telemetryReady ? "ADC reading." : "No packet yet."}
          icon={Radio}
          tone={sensorFault ? "warning" : telemetryReady ? "safe" : "pending"}
        />

        <MetricTile
          label="Signal"
          value={signalValue}
          detail={telemetryReady ? "Wi-Fi strength." : "Waiting for connection."}
          icon={Wifi}
          tone={telemetryReady ? "live" : "pending"}
        />

        <MetricTile
          label="Safety"
          value={safeMode || !pumpEnabled ? "Protected" : "Live"}
          detail={safeMode || !pumpEnabled ? "Relay locked." : "Output enabled."}
          icon={ShieldCheck}
          tone={safeMode || !pumpEnabled ? "safe" : "warning"}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="ADC voltage"
          value={voltageValue}
          detail={telemetryReady ? "Calculated voltage." : "Waiting for device."}
          icon={Gauge}
          tone={telemetryReady ? "safe" : "pending"}
        />

        <MetricTile
          label="Power"
          value={extra.power ?? "USB / Adapter"}
          detail="Power profile."
          icon={Power}
          tone="safe"
        />

        <MetricTile
          label="Last seen"
          value={getLastSeenLabel(extra)}
          detail="Latest update."
          icon={RefreshCw}
          tone={telemetryReady ? "live" : "pending"}
        />

        <MetricTile
          label="Command"
          value={extra.lastCommandStatus ?? "None"}
          detail="Latest command."
          icon={CheckCircle2}
          tone={statusTone(extra.lastCommandStatus ?? "None")}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {hardwareParts.map((part) => (
          <HardwarePartCard
            key={part.title}
            title={part.title}
            value={part.value}
            description={part.description}
            icon={part.icon}
            tone={part.tone}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onIrrigate}
          className="premium-btn rounded-[20px] px-5 py-3 text-sm font-semibold"
        >
          Send command
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="premium-btn-secondary inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm"
        >
          Refresh telemetry
          <RefreshCw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="premium-btn-secondary rounded-[20px] px-5 py-3 text-sm"
        >
          Keep in focus
        </button>

        <span className="premium-tab rounded-full px-4 py-2 text-sm">
          Updated {device.updatedAt ?? "Waiting"}
        </span>
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const {
    devices,
    selectedDevice,
    searchQuery,
    pairDeviceByCode,
    updateDevice,
    selectDevice,
    removeDevice,
    startIrrigation,
    refreshTelemetry,
  } = useAppState();

  const [pairCode, setPairCode] = useState("");
  const [pairName, setPairName] = useState(DEFAULT_DEVICE_NAME);
  const [pairPlace, setPairPlace] = useState(DEFAULT_DEVICE_PLACE);
  const [isPairing, setIsPairing] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [statusFilter, setStatusFilter] = useState<DeviceFilter>("All");

  const visibleDevices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesStatus =
        statusFilter === "All" ? true : device.status === statusFilter;

      const extra = device as DeviceExtra;

      const text = [
        device.id,
        device.name,
        device.place,
        device.status,
        extra.sensorStatus,
        extra.power,
        extra.rainStatus,
        extra.waterLevelStatus,
        extra.buttonStatus,
        extra.firmware,
        extra.pairingCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = query ? text.includes(query) : true;

      return matchesStatus && matchesSearch;
    });
  }, [devices, searchQuery, statusFilter]);

  const connectedCount = devices.length;
  const onlineCount = devices.filter((item) => item.status === "Online").length;

  const safeModeCount = devices.filter(
    (item) =>
      ((item as DeviceExtra).safeMode ?? true) ||
      !((item as DeviceExtra).pumpEnabled ?? false),
  ).length;

  const liveSensorCount = devices.filter((item) => {
    const device = item as DeviceExtra;
    const sensor = getSensorStatus(device).toLowerCase();

    return (
      hasTelemetry(device) &&
      !sensor.includes("sensor check") &&
      !sensor.includes("pending") &&
      item.status !== "Offline"
    );
  }).length;

  const newestLabel = devices[0]?.name ?? "No device";

    const handlePairDevice = async () => {
    const cleanCode = pairCode.trim();

    if (cleanCode.length !== 7) {
      setError("Enter the 7-character OLED code.");
      setFeedback("");
      return;
    }

    setIsPairing(true);
    setError("");
    setFeedback("");

    try {
      const paired = await pairDeviceByCode(
        cleanCode,
        pairName.trim() || DEFAULT_DEVICE_NAME,
        pairPlace.trim() || DEFAULT_DEVICE_PLACE,
      );

      if (!paired) {
        setError("Pairing failed. Check the OLED code and try again.");
        return;
      }

      setPairCode("");
      setPairName(DEFAULT_DEVICE_NAME);
      setPairPlace(DEFAULT_DEVICE_PLACE);
      setFeedback(`${paired.name} paired successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pairing failed.");
    } finally {
      setIsPairing(false);
    }
  };
  
  const confirmRemoveDevice = () => {
    if (!deleteTarget) return;

    removeDevice(deleteTarget.id);
    setFeedback(`${deleteTarget.name} removed from workspace.`);
    setDeleteTarget(null);
  };

  return (
    <AppShell
      title="GreenCloud Devices"
      subtitle="Pair ESP32 hardware, monitor live telemetry, and manage protected irrigation nodes."
    >
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <SectionBadge>Device workspace</SectionBadge>

              <h2 className="mt-5 max-w-[14ch] text-[clamp(2.7rem,4.6vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--gc-text)]">
                Pair, rename, monitor.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                Connect each ESP32 through its OLED pairing code, then manage
                device labels, sensor state, and protected irrigation commands
                from one workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {filterOptions.map((filter) => (
                  <button
                    key={String(filter)}
                    type="button"
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      statusFilter === filter
                        ? "premium-tab premium-tab-active"
                        : "premium-tab",
                    )}
                  >
                    {String(filter)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryTile label="Devices" value={connectedCount} icon={Cpu} />

              <SummaryTile
                label="Online"
                value={onlineCount}
                icon={Wifi}
                tone={onlineCount > 0 ? "live" : "pending"}
              />

              <SummaryTile
                label="Protected"
                value={safeModeCount}
                icon={Lock}
                tone="safe"
              />

              <SummaryTile
                label="Live sensors"
                value={liveSensorCount}
                icon={Leaf}
                tone={liveSensorCount > 0 ? "live" : "pending"}
              />
            </div>
          </div>
        </GlassCard>

        <PairingPanel
          code={pairCode}
          setCode={(value) => {
            setPairCode(value);
            if (error) setError("");
          }}
          name={pairName}
          setName={setPairName}
          place={pairPlace}
          setPlace={setPairPlace}
          onPair={handlePairDevice}
          isPairing={isPairing}
        />

        <section className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
          <GlassCard className="p-6">
            <SectionBadge>Selected device</SectionBadge>

            <div className="mt-5 min-w-0">
              <h3 className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.2rem,3.6vw,4rem)] font-semibold leading-none tracking-[-0.08em] text-[var(--gc-text)]">
                {selectedDevice.name}
              </h3>

              <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-7 text-[var(--gc-soft)]">
                {selectedDevice.place}
              </p>

              <div className="mt-4 max-w-full">
                <CopyChip value={selectedDevice.id} label="Copy device ID" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Moisture"
                value={
                  hasTelemetry(selectedDevice as DeviceExtra)
                    ? `${selectedDevice.moisture}%`
                    : "Waiting"
                }
                icon={Droplets}
                tone={
                  hasTelemetry(selectedDevice as DeviceExtra)
                    ? "live"
                    : "pending"
                }
              />

              <MetricTile
                label="Sensor raw"
                value={
                  hasTelemetry(selectedDevice as DeviceExtra)
                    ? rawLabel((selectedDevice as DeviceExtra).rawSoil)
                    : "—"
                }
                icon={Gauge}
                tone={
                  hasTelemetry(selectedDevice as DeviceExtra)
                    ? "safe"
                    : "pending"
                }
              />

              <MetricTile
                label="Status"
                value={selectedDevice.status}
                icon={CheckCircle2}
                tone={statusTone(selectedDevice.status)}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <SectionBadge>Connection status</SectionBadge>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
              <div>
                <h3 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Real hardware pairing is active.
                </h3>

                <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                  GreenCloud only links devices that publish a valid OLED code
                  from the ESP32 firmware.
                </p>
              </div>

              <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] p-5">
                <KeyRound className="h-5 w-5 text-[var(--gc-accent-2)]" />

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                  OLED code
                </p>

                <p className="mt-2 text-sm font-semibold text-[var(--gc-text)]">
                  Enter code above
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/16 p-5">
              <p className="text-sm leading-7 text-[var(--gc-soft)]">
                Device flow: power on ESP32 → read OLED code → pair in
                GreenCloud → monitor telemetry and protected commands.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="premium-tab rounded-full px-4 py-2 text-sm">
                Filter: {String(statusFilter)}
              </span>

              <span className="premium-tab max-w-full truncate rounded-full px-4 py-2 text-sm">
                Latest: {newestLabel}
              </span>

              {error ? (
                <span className="text-sm text-[var(--gc-warn)]">{error}</span>
              ) : null}

              {!error && feedback ? (
                <span className="text-sm text-[var(--gc-accent-2)]">
                  {feedback}
                </span>
              ) : null}
            </div>
          </GlassCard>
        </section>

        {devices.length === 0 ? (
          <GlassCard className="p-6">
            <SectionBadge>No devices yet</SectionBadge>

            <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              Pair your first GreenCloud device.
            </h3>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--gc-soft)]">
              Power on the ESP32, read the OLED code, and enter it in the
              pairing panel above.
            </p>
          </GlassCard>
        ) : visibleDevices.length === 0 ? (
          <GlassCard className="p-6">
            <SectionBadge>Empty filter</SectionBadge>

            <h3 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              No device matches this view.
            </h3>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--gc-soft)]">
              Change the search or status filter.
            </p>
          </GlassCard>
        ) : (
          <div className="grid gap-5">
            {visibleDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                active={selectedDevice.id === device.id}
                onEdit={() => setEditingDevice(device)}
                onSelect={() => selectDevice(device.id)}
                onRemove={() => setDeleteTarget(device)}
                onIrrigate={() => {
                  selectDevice(device.id);
                  startIrrigation(device.id);
                }}
                onRefresh={() => {
                  selectDevice(device.id);
                  refreshTelemetry(device.id);
                }}
              />
            ))}
          </div>
        )}

        {editingDevice ? (
          <DeviceEditorModal
            device={editingDevice}
            onCancel={() => setEditingDevice(null)}
            onSave={(nextName, nextPlace) => {
              updateDevice(editingDevice.id, {
                name: nextName,
                place: nextPlace,
                location: nextPlace,
              });
              setFeedback(`${nextName} updated.`);
              setEditingDevice(null);
            }}
          />
        ) : null}

        {deleteTarget ? (
          <ConfirmDeleteModal
            device={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmRemoveDevice}
          />
        ) : null}
      </div>
    </AppShell>
  );
}