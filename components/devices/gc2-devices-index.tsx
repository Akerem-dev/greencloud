"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Cpu,
  Droplets,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Notice, Gc2Status, type Gc2StatusTone } from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";
import { Gc2Table } from "@/components/ui/gc2-table";


type DeviceFilter = "All" | Device["status"];
type DeviceTelemetry = Device & {
  lastSeenMs?: number;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  rainStatus?: string;
  waterLevelStatus?: string;
  firmware?: string;
};

const filters: DeviceFilter[] = ["All", "Online", "Syncing", "Idle", "Offline"];

function hasTelemetry(device: DeviceTelemetry) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function statusTone(value: string): Gc2StatusTone {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("online") ||
    normalized.includes("ready") ||
    normalized.includes("safe") ||
    normalized.includes("clear")
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
    normalized.includes("syncing") ||
    normalized.includes("low") ||
    normalized.includes("detected")
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

function percent(value: unknown, ready: boolean) {
  return ready && typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function lastSeen(device: DeviceTelemetry) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "Waiting for telemetry";
  }

  if (device.lastSeenMs > 1_000_000_000_000) {
    const seconds = Math.max(0, Math.round((Date.now() - device.lastSeenMs) / 1000));
    if (seconds < 10) return "Live now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.round(seconds / 60)}m ago`;
  }

  return `${Math.max(1, Math.round(device.lastSeenMs / 1000))}s runtime`;
}

function safetyLabel(device: DeviceTelemetry) {
  return (device.safeMode ?? true) || !(device.pumpEnabled ?? false)
    ? "Protected"
    : "Output ready";
}

export default function Gc2DevicesIndex() {
  const {
    devices,
    selectedDevice,
    searchQuery,
    selectDevice,
    refreshTelemetry,
    startIrrigation,
    isBootLoading,
  } = useAppState();
  const [filter, setFilter] = useState<DeviceFilter>("All");

  const visibleDevices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesFilter = filter === "All" || device.status === filter;
      const telemetry = device as DeviceTelemetry;
      const searchable = [
        device.id,
        device.name,
        device.place,
        device.status,
        telemetry.firmware,
        telemetry.rainStatus,
        telemetry.waterLevelStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [devices, filter, searchQuery]);

  const onlineCount = devices.filter((device) => device.status === "Online").length;
  const protectedCount = devices.filter(
    (device) => safetyLabel(device as DeviceTelemetry) === "Protected",
  ).length;
  const selected = selectedDevice as DeviceTelemetry;
  const selectedReady = devices.length > 0 && hasTelemetry(selected);

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker="Hardware inventory"
          title="Devices and trusted field nodes."
          description="Review ownership, connection, telemetry readiness and output protection without mixing pairing or maintenance into the roster."
          actions={
            <Gc2LinkButton href="/devices/add">
              Pair an ESP32
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2LinkButton>
          }
        />

        {isBootLoading ? (
          <div className="gc2-grid" aria-busy="true" aria-label="Loading devices">
            <div className="col-span-12 h-[480px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-8" />
            <div className="col-span-12 h-[480px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-4" />
          </div>
        ) : devices.length === 0 ? (
          <Gc2Surface tone="raised" className="overflow-hidden p-0">
            <div className="gc2-grid items-stretch">
              <div className="col-span-12 p-6 sm:p-8 lg:col-span-8">
                <p className="gc2-kicker">Empty inventory</p>
                <h2 className="gc2-heading-lg mt-3 max-w-[15ch]">
                  No trusted hardware is attached yet.
                </h2>
                <p className="gc2-copy mt-4 max-w-2xl">
                  Power on the ESP32, read the six-character OLED code and complete the dedicated protected pairing flow. GreenCloud will not create a placeholder device or fabricate telemetry.
                </p>
                <div className="mt-6">
                  <Gc2LinkButton href="/devices/add">
                    Open pairing studio
                    <Wifi aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>
              </div>
              <div className="col-span-12 border-t border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-6 lg:col-span-4 lg:border-l lg:border-t-0">
                <Gc2Notice
                  tone="info"
                  title="Device-first trust"
                  icon={<ShieldCheck className="h-5 w-5" />}
                >
                  Ownership is finalized only after the verified hardware actor approves the user-scoped claim.
                </Gc2Notice>
              </div>
            </div>
          </Gc2Surface>
        ) : (
          <>
            <Gc2Surface className="p-5 sm:p-6">
              <div className="grid gap-5 sm:grid-cols-3">
                <Gc2Metric label="Paired nodes" value={devices.length} detail="Owned by this Firebase workspace" />
                <Gc2Metric label="Online now" value={onlineCount} detail="Reporting an active connection" />
                <Gc2Metric label="Protected outputs" value={protectedCount} detail="Safe mode or pump output disabled" />
              </div>
            </Gc2Surface>

            <div className="gc2-grid items-start">
              <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-8">
                <div className="flex flex-col gap-4 border-b border-[var(--gc2-line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                  <div>
                    <p className="gc2-kicker">Device roster</p>
                    <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                      {visibleDevices.length} visible node{visibleDevices.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--gc2-ink-soft)]">
                      The global search also filters IDs, zones, firmware and safety state.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2" aria-label="Filter devices by status">
                    {filters.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={filter === option}
                        onClick={() => setFilter(option)}
                        className={`gc2-button ${
                          filter === option ? "gc2-button-secondary" : "gc2-button-quiet"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {visibleDevices.length > 0 ? (
                  <Gc2Table caption="GreenCloud device inventory">
                    <thead>
                      <tr>
                        <th scope="col">Device</th>
                        <th scope="col">Zone</th>
                        <th scope="col">Moisture</th>
                        <th scope="col">Signal</th>
                        <th scope="col">Connection</th>
                        <th scope="col">Output</th>
                        <th scope="col"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleDevices.map((device) => {
                        const telemetry = device as DeviceTelemetry;
                        const ready = hasTelemetry(telemetry);
                        const active = device.id === selectedDevice.id;
                        const safety = safetyLabel(telemetry);

                        return (
                          <tr key={device.id}>
                            <td>
                              <span className="block font-bold text-[var(--gc2-ink)]">{device.name}</span>
                              <span className="gc2-data mt-1 block text-xs text-[var(--gc2-ink-muted)]">{lastSeen(telemetry)}</span>
                            </td>
                            <td>{device.place}</td>
                            <td className="gc2-data">{percent(device.moisture, ready)}</td>
                            <td className="gc2-data">{percent(device.signal, ready)}</td>
                            <td><Gc2Status tone={statusTone(device.status)}>{device.status}</Gc2Status></td>
                            <td><Gc2Status tone={statusTone(safety)}>{safety}</Gc2Status></td>
                            <td>
                              <div className="flex justify-end gap-2">
                                <Gc2Button
                                  variant="quiet"
                                  onClick={() => selectDevice(device.id)}
                                  aria-pressed={active}
                                >
                                  {active ? "Selected" : "Select"}
                                </Gc2Button>
                                <Gc2LinkButton
                                  href={`/devices/${encodeURIComponent(device.id)}`}
                                  variant="secondary"
                                >
                                  Details
                                </Gc2LinkButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Gc2Table>
                ) : (
                  <div className="p-6">
                    <Gc2Notice tone="warning" title="No devices match this view">
                      Change the status filter or clear the global search query.
                    </Gc2Notice>
                  </div>
                )}
              </Gc2Surface>

              <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-4">
                <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
                  <p className="gc2-kicker">Selected node</p>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-[var(--gc2-ink)]">{selectedDevice.name}</h2>
                      <p className="mt-1 truncate text-sm text-[var(--gc2-ink-soft)]">{selectedDevice.place}</p>
                    </div>
                    <Gc2Status tone={statusTone(selectedDevice.status)}>{selectedDevice.status}</Gc2Status>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Gc2Metric label="Moisture" value={percent(selectedDevice.moisture, selectedReady)} />
                    <Gc2Metric label="Signal" value={percent(selectedDevice.signal, selectedReady)} />
                  </div>

                  <div className="grid gap-3 border-y border-[var(--gc2-line)] py-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink)]">
                        {selectedDevice.status === "Online" ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                        Connection
                      </span>
                      <Gc2Status tone={statusTone(selectedDevice.status)}>{selectedDevice.status}</Gc2Status>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink)]">
                        <ShieldCheck className="h-4 w-4" />
                        Irrigation output
                      </span>
                      <Gc2Status tone={statusTone(safetyLabel(selected))}>{safetyLabel(selected)}</Gc2Status>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Gc2LinkButton href={`/devices/${encodeURIComponent(selectedDevice.id)}`} className="justify-center">
                      Open device workspace
                      <Cpu aria-hidden="true" className="h-4 w-4" />
                    </Gc2LinkButton>
                    <div className="grid grid-cols-2 gap-3">
                      <Gc2Button
                        variant="secondary"
                        onClick={() => refreshTelemetry(selectedDevice.id)}
                        className="justify-center"
                      >
                        Refresh
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
                      </Gc2Button>
                      <Gc2Button
                        variant="quiet"
                        onClick={() => startIrrigation(selectedDevice.id)}
                        className="justify-center"
                      >
                        Command
                        <Droplets aria-hidden="true" className="h-4 w-4" />
                      </Gc2Button>
                    </div>
                  </div>
                </div>
              </Gc2Surface>
            </div>
          </>
        )}
      </div>
    </Gc2ProtectedShell>
  );
}
