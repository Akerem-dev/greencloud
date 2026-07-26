"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  Droplets,
  Gauge,
  Pencil,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Trash2,
  Waves,
  Wifi,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2LedgerRow } from "@/components/ui/gc2-table";
import { Gc2Notice, Gc2Status, type Gc2StatusTone } from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";
import { validateDeviceIdentityInput } from "@/lib/device-mutation-safety.mjs";


type DeviceDetail = Device & {
  rawSoil?: number;
  soilVoltage?: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  lastSeenMs?: number;
  lastWateredAt?: string;
  power?: string;
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: string;
  pumpState?: string;
  rainDetected?: boolean;
  rainStatus?: string;
  waterLevel?: number;
  waterLevelStatus?: string;
  buttonPressed?: boolean;
  buttonStatus?: string;
  oledStatus?: string;
  firmware?: string;
  lastCommand?: string;
  lastCommandStatus?: string;
  pairingCode?: string;
  pairedAt?: string;
  ownerUid?: string;
};

function statusTone(value: string): Gc2StatusTone {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("online") ||
    normalized.includes("ready") ||
    normalized.includes("clear") ||
    normalized.includes("handled") ||
    normalized.includes("completed") ||
    normalized.includes("ok")
  ) {
    return "success";
  }

  if (
    normalized.includes("offline") ||
    normalized.includes("blocked") ||
    normalized.includes("empty") ||
    normalized.includes("no signal")
  ) {
    return "danger";
  }

  if (
    normalized.includes("low") ||
    normalized.includes("detected") ||
    normalized.includes("sensor check") ||
    normalized.includes("syncing")
  ) {
    return "warning";
  }

  if (
    normalized.includes("protected") ||
    normalized.includes("locked") ||
    normalized.includes("dry-run")
  ) {
    return "info";
  }

  return "neutral";
}

function displayStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "locked") return "Protected";
  if (normalized === "none" || normalized === "pending") return "Ready";
  if (normalized === "handled") return "Completed";
  if (normalized === "sensor check") return "Calibrating";
  if (normalized === "ok") return "Safe";
  if (normalized === "idle") return "Standby";
  return value;
}

function hasTelemetry(device: DeviceDetail) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function percent(value: unknown, ready = true) {
  return ready && typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function numeric(value: unknown, suffix = "", digits = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(digits)}${suffix}`
    : "—";
}

function lastSeen(device: DeviceDetail) {
  if (typeof device.lastSeenMs !== "number") return device.updatedAt || "Waiting";

  if (device.lastSeenMs > 1_000_000_000_000) {
    const seconds = Math.max(0, Math.round((Date.now() - device.lastSeenMs) / 1000));
    if (seconds < 10) return "Live now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.round(seconds / 60)}m ago`;
  }

  return `${Math.max(1, Math.round(device.lastSeenMs / 1000))}s runtime`;
}

function DetailRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[var(--gc2-line)] py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{label}</p>
        {detail ? <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{detail}</p> : null}
      </div>
      <Gc2Status tone={statusTone(value)}>{displayStatus(value)}</Gc2Status>
    </div>
  );
}

export default function Gc2DeviceDetail({ deviceId }: { deviceId: string }) {
  const {
    devices,
    selectedDevice,
    filteredActivity,
    automation,
    selectDevice,
    updateDevice,
    removeDevice,
    refreshTelemetry,
    startIrrigation,
    isBootLoading,
  } = useAppState();

  const device = useMemo(
    () => devices.find((item) => item.id === deviceId),
    [deviceId, devices],
  );
  const hardware = device as DeviceDetail | undefined;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [editError, setEditError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (device && selectedDevice.id !== device.id) {
      selectDevice(device.id);
    }
  }, [device, selectDevice, selectedDevice.id]);

  const deviceActivity = useMemo(
    () => filteredActivity.filter((item) => !item.deviceId || item.deviceId === deviceId).slice(0, 6),
    [deviceId, filteredActivity],
  );

  if (isBootLoading) {
    return (
      <Gc2ProtectedShell>
        <div className="gc2-stack" aria-busy="true" aria-label="Loading device details">
          <div className="h-28 animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)]" />
          <div className="gc2-grid">
            <div className="col-span-12 h-[540px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-8" />
            <div className="col-span-12 h-[540px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-4" />
          </div>
        </div>
      </Gc2ProtectedShell>
    );
  }

  if (!device || !hardware) {
    return (
      <Gc2ProtectedShell>
        <div className="gc2-stack">
          <Gc2SectionHeading
            kicker="Device lookup"
            title="This device is not in the workspace."
            description="The requested identifier is not attached to the signed-in Firebase user."
            actions={
              <Gc2LinkButton href="/devices" variant="quiet">
                <ArrowLeft className="h-4 w-4" />
                Back to devices
              </Gc2LinkButton>
            }
          />
          <Gc2Notice tone="warning" title="Device unavailable" icon={<ShieldAlert className="h-5 w-5" />}>
            The node may have been securely removed, the route may be stale, or ownership belongs to another workspace.
          </Gc2Notice>
        </div>
      </Gc2ProtectedShell>
    );
  }

  const telemetryReady = hasTelemetry(hardware);
  const safeMode = hardware.safeMode ?? true;
  const pumpEnabled = hardware.pumpEnabled ?? false;
  const relayState = hardware.relayState ?? (safeMode || !pumpEnabled ? "Locked" : "Enabled");
  const pumpState = hardware.pumpState ?? (safeMode || !pumpEnabled ? "Dry-run" : "Ready");
  const rainStatus = hardware.rainStatus ?? "Pending";
  const waterStatus = hardware.waterLevelStatus ?? "Pending";
  const protectedOutput =
    safeMode ||
    !pumpEnabled ||
    rainStatus === "Detected" ||
    waterStatus === "Low" ||
    waterStatus === "Empty";

  function openEdit() {
    setName(device.name);
    setPlace(device.place);
    setEditError("");
    setEditOpen(true);
  }

  function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditError("");

    try {
      const normalized = validateDeviceIdentityInput(name, place);
      updateDevice(device.id, normalized);
      setFeedback(`${normalized.name} identity saved.`);
      setEditOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Device identity was blocked safely.");
    }
  }

  function confirmRemove() {
    if (!deleteTarget) return;
    removeDevice(deleteTarget.id);
    setFeedback(`${deleteTarget.name} removed from workspace.`);
    setDeleteTarget(null);
  }

  function copyDeviceId() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(device.id);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker={`${device.place} · ${lastSeen(hardware)}`}
          title={device.name}
          description="Inspect live telemetry, hardware protection, identity and trusted maintenance actions for this field node."
          actions={
            <>
              <Gc2LinkButton href="/devices" variant="quiet">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Devices
              </Gc2LinkButton>
              <Gc2Button variant="secondary" onClick={openEdit}>
                <Pencil aria-hidden="true" className="h-4 w-4" />
                Rename
              </Gc2Button>
            </>
          }
        />

        {feedback ? (
          <Gc2Notice tone="success" title="Device workspace updated" icon={<Check className="h-5 w-5" />}>
            {feedback}
          </Gc2Notice>
        ) : null}

        <div className="gc2-grid items-start">
          <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="gc2-kicker">Live telemetry</p>
                  <h2 className="gc2-heading-md mt-2">Current field packet</h2>
                  <p className="mt-2 text-sm text-[var(--gc2-ink-soft)]">
                    Values remain unavailable until the trusted device reports a real packet.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Gc2Status tone={statusTone(device.status)}>{device.status}</Gc2Status>
                  <Gc2Status tone={protectedOutput ? "info" : "success"}>
                    {protectedOutput ? "Output protected" : "Output ready"}
                  </Gc2Status>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
              <Gc2Metric
                label="Soil moisture"
                value={percent(device.moisture, telemetryReady)}
                detail={telemetryReady ? `RAW ${numeric(hardware.rawSoil)} · ${numeric(hardware.soilVoltage, "V", 2)}` : "Waiting for sensor packet"}
              />
              <Gc2Metric
                label="Wi-Fi signal"
                value={percent(device.signal, telemetryReady)}
                detail={device.status === "Online" ? "Private device link active" : "Connection unavailable"}
              />
              <Gc2Metric
                label="Temperature"
                value={numeric(hardware.temperature, "°C", 1)}
                detail={typeof hardware.humidity === "number" ? `Humidity ${Math.round(hardware.humidity)}%` : "Optional environmental channel"}
              />
              <Gc2Metric
                label="Tank level"
                value={percent(hardware.waterLevel, typeof hardware.waterLevel === "number")}
                detail={displayStatus(waterStatus)}
              />
            </div>

            <div className="grid gap-4 border-t border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-5 sm:grid-cols-3 sm:p-6">
              <div className="flex gap-3">
                <Cpu className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                <div>
                  <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Firmware</p>
                  <p className="gc2-data mt-1 text-xs text-[var(--gc2-ink-soft)]">{hardware.firmware ?? "greencloud-esp32"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Gauge className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                <div>
                  <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Sensor state</p>
                  <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{displayStatus(hardware.sensorStatus ?? "Pending")}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Activity className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                <div>
                  <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Last command</p>
                  <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{displayStatus(hardware.lastCommandStatus ?? "None")}</p>
                </div>
              </div>
            </div>
          </Gc2Surface>

          <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-4">
            <div className="border-b border-[var(--gc2-line)] pb-5">
              <p className="gc2-kicker">Safety matrix</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Physical output boundary</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Manual commands still pass through the protected AppState safety decision.
              </p>
            </div>

            <div>
              <DetailRow label="Relay output" value={relayState} detail={safeMode ? "Safe mode guards the physical relay." : "Firmware reports the relay channel available."} />
              <DetailRow label="Pump state" value={pumpState} detail={pumpEnabled ? "Pump output is enabled by the device profile." : "Commands remain dry-run protected."} />
              <DetailRow label="Rain lockout" value={rainStatus} detail="Detected rain can block irrigation." />
              <DetailRow label="Water level" value={waterStatus} detail={typeof hardware.waterLevel === "number" ? `Reported level ${Math.round(hardware.waterLevel)}%.` : "Waiting for tank telemetry."} />
              <DetailRow label="Manual override" value={automation.manualOverrideEnabled ? "Ready" : "Blocked"} detail="Workspace automation policy remains authoritative." />
            </div>

            <div className="mt-5 grid gap-3">
              <Gc2Button onClick={() => startIrrigation(device.id)} className="w-full justify-center">
                Protected irrigation command
                <Droplets aria-hidden="true" className="h-4 w-4" />
              </Gc2Button>
              <Gc2Button variant="secondary" onClick={() => refreshTelemetry(device.id)} className="w-full justify-center">
                Refresh telemetry
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              </Gc2Button>
            </div>
          </Gc2Surface>
        </div>

        <div className="gc2-grid items-start">
          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-7">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
              <p className="gc2-kicker">Hardware identity</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Trusted node record</h2>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div>
                <p className="gc2-kicker">Device ID</p>
                <button
                  type="button"
                  title="Copy device ID"
                  onClick={copyDeviceId}
                  className="gc2-data mt-2 inline-flex max-w-full items-center gap-2 break-all text-left text-sm font-bold text-[var(--gc2-moss-strong)]"
                >
                  {device.id}
                  {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
                </button>
              </div>
              <div>
                <p className="gc2-kicker">Ownership</p>
                <p className="gc2-data mt-2 break-all text-sm font-bold text-[var(--gc2-ink)]">{hardware.ownerUid ?? "Current Firebase user"}</p>
              </div>
              <div>
                <p className="gc2-kicker">Pairing code</p>
                <p className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">{hardware.pairingCode ?? "Not retained"}</p>
              </div>
              <div>
                <p className="gc2-kicker">Paired at</p>
                <p className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">{hardware.pairedAt ?? "Trusted workspace record"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--gc2-line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <p className="m-0 max-w-2xl text-xs leading-5 text-[var(--gc2-ink-muted)]">
                Removing a device verifies ownership through the trusted callable and queues its factory-reset command.
              </p>
              <Gc2Button
                variant="danger"
                title="Remove device"
                onClick={() => setDeleteTarget(device)}
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove device
              </Gc2Button>
            </div>
          </Gc2Surface>

          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-5">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
              <p className="gc2-kicker">Recent operations</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Device audit trail</h2>
            </div>
            {deviceActivity.length > 0 ? (
              <div>
                {deviceActivity.map((item) => (
                  <Gc2LedgerRow
                    key={item.id}
                    time={item.time}
                    title={item.title}
                    detail={item.description}
                    status={<Gc2Status tone={statusTone(item.status)}>{displayStatus(item.status)}</Gc2Status>}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <Gc2Notice tone="info" title="No device operations recorded">
                  Pairing, telemetry refreshes and protected commands will appear here.
                </Gc2Notice>
              </div>
            )}
          </Gc2Surface>
        </div>
      </div>

      <Gc2Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        closeLabel="Close edit device modal"
        title="Rename device"
        description="Update only the human-readable device and zone labels. Hardware ownership is unchanged."
        footer={
          <>
            <Gc2Button variant="quiet" onClick={() => setEditOpen(false)}>Cancel</Gc2Button>
            <Gc2Button type="submit" form="gc2-device-identity-form">Save changes</Gc2Button>
          </>
        }
      >
        <form id="gc2-device-identity-form" onSubmit={saveIdentity} className="grid gap-5">
          <Gc2Input
            label="Device name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
          />
          <Gc2Input
            label="Plant zone or location"
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            maxLength={80}
            required
            error={editError || undefined}
          />
        </form>
      </Gc2Dialog>

      <Gc2Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        closeLabel="Close delete confirmation"
        title="Remove trusted device"
        description="This action verifies ownership on the server before detaching the device and queuing a factory reset."
        footer={
          <>
            <Gc2Button variant="quiet" onClick={() => setDeleteTarget(null)}>Cancel</Gc2Button>
            <Gc2Button variant="danger" onClick={confirmRemove}>Remove device</Gc2Button>
          </>
        }
      >
        <Gc2Notice tone="danger" title="Trusted removal required" icon={<ShieldAlert className="h-5 w-5" />}>
          {deleteTarget?.name ?? "This device"} will stop reporting to this workspace. The callable remains idempotent and queues the hardware factory-reset command.
        </Gc2Notice>
      </Gc2Dialog>
    </Gc2ProtectedShell>
  );
}
