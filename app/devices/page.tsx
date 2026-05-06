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
  Plus,
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
    lower.includes("protected") ||
    lower.includes("guarded")
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
    lower.includes("waiting") ||
    lower.includes("standby")
  ) {
    return "pending";
  }

  return "warning";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/[0.18] text-[var(--gc-soft)]";
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
  const value = displayStatus(String(status));

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(statusTone(String(status))),
      )}
    >
      {status === "Online" ||
      status === "Syncing" ||
      status === "Idle" ||
      status === "Offline" ? (
        <StatusDot status={status as Device["status"]} />
      ) : null}

      <span className="truncate">{value}</span>
    </span>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_84%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
      </div>

      <p className="mt-3 text-[clamp(1.8rem,2.4vw,2.55rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
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
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.014)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
          {label}
        </p>

        <Icon className="h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.5rem,1.9vw,2.1rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
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
    <div
      className={cn(
        "min-w-0 rounded-[22px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.014)]",
        toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75">
            {title}
          </p>

          <p className="mt-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xl font-semibold leading-tight tracking-[-0.04em]">
            {displayStatus(value)}
          </p>

          <p className="mt-2 line-clamp-2 text-xs leading-5 opacity-75">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18">
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
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/18 px-3 py-1.5 text-xs font-semibold text-[var(--gc-soft)] transition hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:text-[var(--gc-text)]"
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
    <label className="block min-w-0">
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
          "w-full rounded-[20px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/18 px-5 text-base text-[var(--gc-text)] outline-none transition",
          label ? "mt-3 h-12" : "h-14",
          "placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] focus:bg-white/[0.045] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]",
        )}
      />
    </label>
  );
}

function PairingForm({
  code,
  setCode,
  name,
  setName,
  place,
  setPlace,
  onPair,
  isPairing,
  error,
  feedback,
  compact = false,
}: {
  code: string;
  setCode: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  place: string;
  setPlace: (value: string) => void;
  onPair: () => void;
  isPairing: boolean;
  error: string;
  feedback: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <SectionBadge>{compact ? "Add node" : "Pairing"}</SectionBadge>

      <h3
        className={cn(
          "mt-4 font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)]",
          compact
            ? "text-[clamp(2rem,3vw,3rem)]"
            : "text-[clamp(2.4rem,4vw,4rem)]",
        )}
      >
        {compact ? "Add another ESP32." : "Connect ESP32."}
      </h3>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
        Enter the 7-character OLED code from the ESP32 display.
      </p>

      <div className="mt-5 grid gap-4">
        <TextField
          label="OLED code"
          value={code}
          placeholder="A7K9Q2M"
          maxLength={7}
          autoFocus={!compact}
          onChange={(value) =>
            setCode(value.replace(/[^A-Za-z0-9]/g, "").slice(0, 7))
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Device name"
            value={name}
            placeholder="Balcony Plant"
            onChange={setName}
          />

          <TextField
            label="Plant zone"
            value={place}
            placeholder="Balcony shelf"
            onChange={setPlace}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm leading-6 text-[var(--gc-warn)]">
          {error}
        </p>
      ) : null}

      {!error && feedback ? (
        <p className="mt-4 text-sm leading-6 text-[var(--gc-accent-2)]">
          {feedback}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onPair}
        disabled={isPairing}
        className="premium-btn mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        <KeyRound className="h-[18px] w-[18px]" />
        {isPairing ? "Pairing..." : "Pair device"}
      </button>

      {!compact ? (
        <div className="mt-5 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent-2)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
            Flow
          </p>

          <div className="mt-3 grid gap-2">
            {[
              "Power on ESP32",
              "Read OLED code",
              "Enter code here",
              "Monitor telemetry",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[16px] border border-[color-mix(in_srgb,var(--gc-border)_56%,transparent)] bg-black/16 px-3 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/18 text-xs font-bold text-[var(--gc-accent-2)]">
                  {index + 1}
                </span>

                <p className="text-xs leading-5 text-[var(--gc-soft)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
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
            <div className="min-w-0">
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
              className="premium-btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
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

            <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/16 p-4">
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

function PairingModal({
  code,
  setCode,
  name,
  setName,
  place,
  setPlace,
  onPair,
  isPairing,
  error,
  feedback,
  onClose,
}: {
  code: string;
  setCode: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  place: string;
  setPlace: (value: string) => void;
  onPair: () => void;
  isPairing: boolean;
  error: string;
  feedback: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close pairing modal"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[760px]">
        <GlassCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <SectionBadge>Add ESP32</SectionBadge>

              <h3 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--gc-text)]">
                Pair another node.
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="premium-btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2">
            <PairingForm
              compact
              code={code}
              setCode={setCode}
              name={name}
              setName={setName}
              place={place}
              setPlace={setPlace}
              onPair={onPair}
              isPairing={isPairing}
              error={error}
              feedback={feedback}
            />
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
    <GlassCard
      className={cn(
        "p-5",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)]"
          : "",
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

          <h3 className="mt-4 max-w-[28ch] overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,2.5vw,2.8rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--gc-text)]">
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
          detail={
            telemetryReady ? "Wi-Fi strength." : "Waiting for connection."
          }
          icon={Wifi}
          tone={telemetryReady ? "live" : "pending"}
        />

        <MetricTile
          label="Safety"
          value={safeMode || !pumpEnabled ? "Protected" : "Live"}
          detail={
            safeMode || !pumpEnabled ? "Relay locked." : "Output enabled."
          }
          icon={ShieldCheck}
          tone={safeMode || !pumpEnabled ? "safe" : "warning"}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    </GlassCard>
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
  const [pairingModalOpen, setPairingModalOpen] = useState(false);

  const hasDevices = devices.length > 0;

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
      setPairingModalOpen(false);
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
      <div className="devices-page w-full min-w-0 space-y-5">
        <GlassCard className="overflow-hidden p-0">
          <div className="relative p-5 sm:p-6 2xl:p-7">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,color-mix(in_srgb,var(--gc-accent)_12%,transparent),transparent_34%),radial-gradient(circle_at_82%_78%,color-mix(in_srgb,var(--gc-accent-2)_8%,transparent),transparent_30%)]" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <SectionBadge>Device workspace</SectionBadge>

                <div className="flex flex-wrap gap-2">
                  <StatusPill status={`${connectedCount} devices`} />
                  <StatusPill
                    status={safeModeCount > 0 ? "Protected" : "Ready"}
                  />
                  <StatusPill status={onlineCount > 0 ? "Online" : "Standby"} />
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.7fr)] xl:items-center">
                <div className="min-w-0">
                  <h2 className="max-w-[13ch] text-[clamp(2.7rem,4.2vw,5.1rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--gc-text)]">
                    Pair, rename, monitor.
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                    Connect each ESP32 through its OLED pairing code, manage
                    labels and keep protected irrigation telemetry in one
                    polished workspace.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {filterOptions.map((filter) => (
                      <button
                        key={String(filter)}
                        type="button"
                        onClick={() => setStatusFilter(filter)}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-sm font-semibold",
                          statusFilter === filter
                            ? "premium-tab premium-tab-active"
                            : "premium-tab",
                        )}
                      >
                        {String(filter)}
                      </button>
                    ))}

                    {hasDevices ? (
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setFeedback("");
                          setPairingModalOpen(true);
                        }}
                        className="premium-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        <Plus className="h-4 w-4" />
                        Add ESP32
                      </button>
                    ) : null}
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

              <div className="mt-6 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_64%,transparent)] bg-black/16 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="premium-tab rounded-full px-3.5 py-2 text-sm">
                    Filter: {String(statusFilter)}
                  </span>

                  <span className="premium-tab max-w-full truncate rounded-full px-3.5 py-2 text-sm">
                    Latest: {newestLabel}
                  </span>

                  <span className="premium-tab rounded-full px-3.5 py-2 text-sm">
                    Search: {searchQuery.trim() ? searchQuery : "Workspace"}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--gc-soft)]">
                  {hasDevices
                    ? "Device workspace is ready. Add another node with the Add ESP32 button or manage the selected device below."
                    : "No paired device yet. Use the pairing panel below to connect your first ESP32 and unlock live hardware telemetry."}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {!hasDevices ? (
          <GlassCard className="p-5 sm:p-6 2xl:p-7">
            <PairingForm
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
              error={error}
              feedback={feedback}
            />
          </GlassCard>
        ) : null}

        {devices.length > 0 && visibleDevices.length === 0 ? (
          <GlassCard className="p-6 sm:p-7">
            <SectionBadge>Empty filter</SectionBadge>

            <h3 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[var(--gc-text)]">
              No device matches this view.
            </h3>

            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--gc-soft)]">
              Change the search or status filter to show paired devices.
            </p>
          </GlassCard>
        ) : null}

        {visibleDevices.length > 0 ? (
          <section className="grid gap-5">
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
          </section>
        ) : !hasDevices ? (
          <GlassCard className="p-5 sm:p-6">
            <SectionBadge>No devices yet</SectionBadge>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
              <div className="min-w-0">
                <h3 className="text-[clamp(2.2rem,4vw,4rem)] font-semibold leading-[0.92] tracking-[-0.08em] text-[var(--gc-text)]">
                  Pair your first GreenCloud device.
                </h3>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                  Power on the ESP32, read the OLED code on the display, and
                  enter it above. After pairing, this area becomes a live device
                  command center.
                </p>
              </div>

              <div className="rounded-[26px] border border-[color-mix(in_srgb,var(--gc-accent-2)_26%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_8%,transparent)] p-5">
                <KeyRound className="h-6 w-6 text-[var(--gc-accent-2)]" />

                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                  Pairing ready
                </p>

                <p className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                  Waiting for OLED code
                </p>
              </div>
            </div>
          </GlassCard>
        ) : null}

        {pairingModalOpen ? (
          <PairingModal
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
            error={error}
            feedback={feedback}
            onClose={() => setPairingModalOpen(false)}
          />
        ) : null}

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