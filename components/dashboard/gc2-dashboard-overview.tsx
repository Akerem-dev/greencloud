"use client";

import {
  Activity,
  ArrowRight,
  Cpu,
  Droplets,
  Leaf,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Wifi,
  Zap,
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
import { Gc2LedgerRow, Gc2Table } from "@/components/ui/gc2-table";


type DashboardDevice = Device & {
  rawSoil?: number;
  soilVoltage?: number;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  lastSeenMs?: number;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: string;
  pumpState?: string;
  rainStatus?: string;
  waterLevel?: number;
  waterLevelStatus?: string;
  lastCommandStatus?: string;
  firmware?: string;
};

function hasTelemetry(device: DashboardDevice) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function displayStatus(value: string) {
  const normalized = value.trim().toLowerCase();

  if (normalized === "dry-run") return "Protected";
  if (normalized === "locked") return "Protected";
  if (normalized === "none" || normalized === "pending") return "Ready";
  if (normalized === "handled") return "Completed";
  if (normalized === "sensor check") return "Calibrating";
  if (normalized === "ok") return "Safe";
  if (normalized === "idle") return "Standby";

  return value;
}

function statusTone(value: string): Gc2StatusTone {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("online") ||
    normalized.includes("active") ||
    normalized.includes("clear") ||
    normalized.includes("handled") ||
    normalized.includes("completed") ||
    normalized.includes("ok") ||
    normalized.includes("ready")
  ) {
    return "success";
  }

  if (
    normalized.includes("offline") ||
    normalized.includes("no signal") ||
    normalized.includes("blocked") ||
    normalized.includes("empty")
  ) {
    return "danger";
  }

  if (
    normalized.includes("low") ||
    normalized.includes("detected") ||
    normalized.includes("sensor check") ||
    normalized.includes("calibrating")
  ) {
    return "warning";
  }

  if (
    normalized.includes("protected") ||
    normalized.includes("locked") ||
    normalized.includes("dry-run") ||
    normalized.includes("syncing")
  ) {
    return "info";
  }

  return "neutral";
}

function lastSeenLabel(device: DashboardDevice) {
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

function percentLabel(value: unknown, ready: boolean) {
  return ready && typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function temperatureLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(1)}°C`
    : "—";
}

function rawLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "—";
}

function voltageLabel(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(2)}V`
    : "—";
}

function SafetyRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[var(--gc2-line)] py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{detail}</p>
      </div>
      <Gc2Status tone={statusTone(value)}>{displayStatus(value)}</Gc2Status>
    </div>
  );
}

function SystemTopology({
  telemetryReady,
  connected,
  protectedOutput,
}: {
  telemetryReady: boolean;
  connected: boolean;
  protectedOutput: boolean;
}) {
  const liveStroke = connected ? "var(--gc2-moss)" : "var(--gc2-line-strong)";
  const outputStroke = protectedOutput ? "var(--gc2-warning)" : liveStroke;

  return (
    <div className="border-t border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="gc2-kicker">Live system path</p>
          <p className="mt-1 text-sm text-[var(--gc2-ink-soft)]">
            The diagram reflects current connection and protection state.
          </p>
        </div>
        <Gc2Status tone={connected ? "success" : "neutral"}>
          {connected ? "Workspace connected" : "Awaiting device"}
        </Gc2Status>
      </div>

      <svg
        viewBox="0 0 760 190"
        role="img"
        aria-labelledby="dashboard-topology-title dashboard-topology-description"
        className="h-auto w-full"
      >
        <title id="dashboard-topology-title">GreenCloud live device topology</title>
        <desc id="dashboard-topology-description">
          Soil sensor data passes through the ESP32 and private Firebase workspace before a protected relay and pump command is issued.
        </desc>

        <path d="M150 95 H220" stroke={telemetryReady ? liveStroke : "var(--gc2-line-strong)"} strokeWidth="3" />
        <path d="M370 95 H440" stroke={liveStroke} strokeWidth="3" />
        <path d="M590 95 H660" stroke={outputStroke} strokeWidth="3" strokeDasharray={protectedOutput ? "8 7" : undefined} />

        <g>
          <rect x="20" y="48" width="130" height="94" rx="10" fill="var(--gc2-surface)" stroke="var(--gc2-line-strong)" />
          <text x="40" y="80" fill="var(--gc2-ink-muted)" fontSize="11" fontWeight="700">INPUT</text>
          <text x="40" y="108" fill="var(--gc2-ink)" fontSize="16" fontWeight="700">Soil sensor</text>
          <text x="40" y="128" fill="var(--gc2-ink-soft)" fontSize="11">{telemetryReady ? "Packet received" : "Waiting"}</text>
        </g>

        <g>
          <rect x="220" y="48" width="150" height="94" rx="10" fill="var(--gc2-forest)" stroke="var(--gc2-forest-line)" />
          <text x="240" y="80" fill="rgba(255,255,255,.58)" fontSize="11" fontWeight="700">CONTROLLER</text>
          <text x="240" y="108" fill="var(--gc2-ink-inverse)" fontSize="16" fontWeight="700">ESP32</text>
          <text x="240" y="128" fill="rgba(255,255,255,.7)" fontSize="11">Private device node</text>
        </g>

        <g>
          <rect x="440" y="48" width="150" height="94" rx="10" fill="var(--gc2-surface)" stroke={liveStroke} strokeWidth="2" />
          <text x="460" y="80" fill="var(--gc2-ink-muted)" fontSize="11" fontWeight="700">WORKSPACE</text>
          <text x="460" y="108" fill="var(--gc2-ink)" fontSize="16" fontWeight="700">Firebase sync</text>
          <text x="460" y="128" fill="var(--gc2-ink-soft)" fontSize="11">UID-isolated state</text>
        </g>

        <g>
          <rect x="660" y="48" width="80" height="94" rx="10" fill={protectedOutput ? "var(--gc2-warning-soft)" : "var(--gc2-success-soft)"} stroke={outputStroke} strokeWidth="2" />
          <text x="676" y="80" fill="var(--gc2-ink-muted)" fontSize="10" fontWeight="700">OUTPUT</text>
          <text x="676" y="106" fill="var(--gc2-ink)" fontSize="14" fontWeight="700">Relay</text>
          <text x="676" y="126" fill="var(--gc2-ink-soft)" fontSize="10">{protectedOutput ? "Guarded" : "Ready"}</text>
        </g>
      </svg>
    </div>
  );
}

function DashboardLoading() {
  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-28 animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)]" />
        <div className="gc2-grid">
          <div className="col-span-12 h-[520px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-8" />
          <div className="col-span-12 h-[520px] animate-pulse rounded-[var(--gc2-radius-lg)] bg-[var(--gc2-canvas-muted)] lg:col-span-4" />
        </div>
      </div>
    </Gc2ProtectedShell>
  );
}

export default function Gc2DashboardOverview() {
  const {
    devices,
    selectedDevice,
    filteredActivity,
    unreadNotifications,
    automation,
    settings,
    isBootLoading,
    selectDevice,
    startIrrigation,
    refreshTelemetry,
    simulateThresholdEvent,
  } = useAppState();

  const hasDevice = devices.length > 0 && selectedDevice.id !== "device-waiting";
  const hardware = selectedDevice as DashboardDevice;
  const telemetryReady = hasDevice && hasTelemetry(hardware);
  const connected =
    hasDevice &&
    (selectedDevice.status === "Online" || selectedDevice.status === "Syncing");

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

  const recentActivity = filteredActivity.slice(0, 5);
  const onlineDevices = devices.filter((device) => device.status === "Online").length;

  if (isBootLoading) {
    return <DashboardLoading />;
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker={`${settings.workspaceName} · ${settings.projectName}`}
          title="Garden state at a glance."
          description="Live device state, irrigation protection and the latest auditable operations share one workspace view."
          actions={
            <>
              <Gc2LinkButton href="/devices/add">
                Add device
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Gc2LinkButton>
              <Gc2LinkButton href="/automation" variant="secondary">
                Automation
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              </Gc2LinkButton>
            </>
          }
        />

        {!hasDevice ? (
          <div className="gc2-grid items-start">
            <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
              <div className="p-6 sm:p-8">
                <p className="gc2-kicker">Empty workspace</p>
                <h2 className="gc2-heading-lg mt-3 max-w-[14ch]">
                  Pair the first ESP32 before monitoring begins.
                </h2>
                <p className="gc2-copy mt-4 max-w-2xl">
                  GreenCloud will keep this workspace empty rather than inventing telemetry. Power on the controller, read the six-character OLED code and open the dedicated pairing studio.
                </p>
                <div className="mt-6">
                  <Gc2LinkButton href="/devices/add">
                    Open pairing studio
                    <Wifi aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>
              </div>
              <SystemTopology telemetryReady={false} connected={false} protectedOutput />
            </Gc2Surface>

            <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-4">
              <p className="gc2-kicker">Workspace pulse</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Setup is ready.</h2>
              <div className="mt-5 grid gap-4">
                <Gc2Metric label="Workspace" value={settings.workspaceName} detail="Private Firebase data path" />
                <Gc2Metric label="Primary zone" value={settings.mainPlantLabel} detail="Used across device and activity context" />
                <Gc2Metric label="Notifications" value={unreadNotifications} detail="Unread workspace notices" />
              </div>
              <Gc2Notice tone="info" title="No fabricated plant state" className="mt-6" icon={<ShieldCheck className="h-5 w-5" />}>
                Moisture, signal and watering controls remain unavailable until trusted telemetry arrives.
              </Gc2Notice>
            </Gc2Surface>
          </div>
        ) : (
          <>
            <div className="gc2-grid items-start">
              <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
                <div className="p-5 sm:p-7">
                  <div className="flex flex-col gap-4 border-b border-[var(--gc2-line)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="gc2-kicker">Current field state</p>
                      <h2 className="gc2-heading-md mt-2 truncate">{selectedDevice.name}</h2>
                      <p className="mt-2 text-sm text-[var(--gc2-ink-soft)]">
                        {selectedDevice.place} · {lastSeenLabel(hardware)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Gc2Status tone={statusTone(selectedDevice.status)}>
                        {displayStatus(selectedDevice.status)}
                      </Gc2Status>
                      <Gc2Status tone={protectedOutput ? "info" : "success"}>
                        {protectedOutput ? "Output protected" : "Output ready"}
                      </Gc2Status>
                    </div>
                  </div>

                  <div className="grid gap-5 py-6 sm:grid-cols-2 xl:grid-cols-4">
                    <Gc2Metric
                      label="Soil moisture"
                      value={percentLabel(selectedDevice.moisture, telemetryReady)}
                      detail={telemetryReady ? `RAW ${rawLabel(hardware.rawSoil)} · ${voltageLabel(hardware.soilVoltage)}` : "Waiting for sensor packet"}
                    />
                    <Gc2Metric
                      label="Wi-Fi signal"
                      value={percentLabel(selectedDevice.signal, telemetryReady)}
                      detail={connected ? "Private device link active" : "Connection unavailable"}
                    />
                    <Gc2Metric
                      label="Environment"
                      value={temperatureLabel(hardware.temperature)}
                      detail={typeof hardware.humidity === "number" ? `Humidity ${Math.round(hardware.humidity)}%` : "Optional sensor channel"}
                    />
                    <Gc2Metric
                      label="Automation threshold"
                      value={`${automation.moistureThreshold}%`}
                      detail={`${automation.pumpDurationSeconds}s command · ${automation.cooldownMinutes}m cooldown`}
                    />
                  </div>

                  <div className="grid gap-4 border-t border-[var(--gc2-line)] pt-5 sm:grid-cols-3">
                    <div className="flex items-start gap-3">
                      <Leaf aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                      <div>
                        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Sensor channel</p>
                        <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{displayStatus(hardware.sensorStatus ?? "Pending")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Cpu aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                      <div>
                        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Firmware</p>
                        <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{hardware.firmware ?? "greencloud-esp32"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Activity aria-hidden="true" className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                      <div>
                        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Last command</p>
                        <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{displayStatus(hardware.lastCommandStatus ?? "None")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <SystemTopology
                  telemetryReady={telemetryReady}
                  connected={connected}
                  protectedOutput={protectedOutput}
                />
              </Gc2Surface>

              <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-4">
                <div className="border-b border-[var(--gc2-line)] pb-5">
                  <p className="gc2-kicker">Safety matrix</p>
                  <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                    Irrigation decision boundary
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                    Every command still passes through the existing protected AppState action.
                  </p>
                </div>

                <div>
                  <SafetyRow
                    label="Relay output"
                    value={relayState}
                    detail={safeMode ? "Safe mode keeps the physical relay guarded." : "Firmware reports the relay channel as available."}
                  />
                  <SafetyRow
                    label="Pump state"
                    value={pumpState}
                    detail={pumpEnabled ? "Pump output is enabled by the device profile." : "Commands remain dry-run protected."}
                  />
                  <SafetyRow
                    label="Rain lockout"
                    value={rainStatus}
                    detail="Rain detection can block an irrigation command."
                  />
                  <SafetyRow
                    label="Tank level"
                    value={waterStatus}
                    detail={typeof hardware.waterLevel === "number" ? `Reported level ${Math.round(hardware.waterLevel)}%.` : "Awaiting the water-level sensor."}
                  />
                  <SafetyRow
                    label="Manual override"
                    value={automation.manualOverrideEnabled ? "Ready" : "Blocked"}
                    detail="Manual commands follow the automation safety contract."
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  <Gc2Button
                    type="button"
                    onClick={() => startIrrigation(selectedDevice.id)}
                    disabled={!hasDevice}
                    className="w-full justify-center"
                  >
                    Protected irrigation command
                    <Droplets aria-hidden="true" className="h-4 w-4" />
                  </Gc2Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Gc2Button
                      type="button"
                      variant="secondary"
                      onClick={() => refreshTelemetry(selectedDevice.id)}
                      className="justify-center"
                    >
                      Refresh
                      <RefreshCw aria-hidden="true" className="h-4 w-4" />
                    </Gc2Button>
                    <Gc2Button
                      type="button"
                      variant="quiet"
                      onClick={() => simulateThresholdEvent(selectedDevice.id)}
                      className="justify-center"
                    >
                      Test threshold
                      <Zap aria-hidden="true" className="h-4 w-4" />
                    </Gc2Button>
                  </div>
                </div>
              </Gc2Surface>
            </div>

            <div className="gc2-grid items-start">
              <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-7">
                <div className="flex flex-col gap-3 border-b border-[var(--gc2-line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                  <div>
                    <p className="gc2-kicker">Device roster</p>
                    <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                      {devices.length} paired node{devices.length === 1 ? "" : "s"}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--gc2-ink-soft)]">
                      {onlineDevices} currently online.
                    </p>
                  </div>
                  <Gc2LinkButton href="/devices" variant="quiet">
                    Manage devices
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>

                <Gc2Table caption="Paired GreenCloud devices">
                  <thead>
                    <tr>
                      <th scope="col">Device</th>
                      <th scope="col">Zone</th>
                      <th scope="col">Moisture</th>
                      <th scope="col">Signal</th>
                      <th scope="col">State</th>
                      <th scope="col"><span className="sr-only">Selection</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => {
                      const deviceHardware = device as DashboardDevice;
                      const ready = hasTelemetry(deviceHardware);
                      const selected = device.id === selectedDevice.id;

                      return (
                        <tr key={device.id}>
                          <td>
                            <span className="block font-bold text-[var(--gc2-ink)]">{device.name}</span>
                            <span className="gc2-data mt-1 block text-xs text-[var(--gc2-ink-muted)]">{lastSeenLabel(deviceHardware)}</span>
                          </td>
                          <td>{device.place}</td>
                          <td className="gc2-data">{percentLabel(device.moisture, ready)}</td>
                          <td className="gc2-data">{percentLabel(device.signal, ready)}</td>
                          <td><Gc2Status tone={statusTone(device.status)}>{displayStatus(device.status)}</Gc2Status></td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => selectDevice(device.id)}
                              aria-pressed={selected}
                              className="text-xs font-bold text-[var(--gc2-moss-strong)] underline-offset-4 hover:underline"
                            >
                              {selected ? "Selected" : "Select"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Gc2Table>
              </Gc2Surface>

              <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-5">
                <div className="flex items-end justify-between gap-4 border-b border-[var(--gc2-line)] p-5 sm:p-6">
                  <div>
                    <p className="gc2-kicker">Recent operations</p>
                    <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                      Auditable workspace record
                    </h2>
                  </div>
                  <Gc2Status tone={unreadNotifications > 0 ? "warning" : "success"}>
                    {unreadNotifications} unread
                  </Gc2Status>
                </div>

                {recentActivity.length > 0 ? (
                  <div>
                    {recentActivity.map((item) => (
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
                    <Gc2Notice tone="info" title="No operations recorded" icon={<Activity className="h-5 w-5" />}>
                      Pairing, telemetry refreshes and protected commands will appear here.
                    </Gc2Notice>
                  </div>
                )}

                <div className="border-t border-[var(--gc2-line)] p-4 text-right">
                  <Gc2LinkButton href="/activity" variant="quiet">
                    Open full activity
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>
              </Gc2Surface>
            </div>
          </>
        )}
      </div>
    </Gc2ProtectedShell>
  );
}
