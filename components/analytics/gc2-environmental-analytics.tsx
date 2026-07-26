"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Droplets,
  Gauge,
  Radio,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type ActivityItem,
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Select } from "@/components/ui/gc2-field";
import {
  Gc2Notice,
  Gc2Status,
  type Gc2StatusTone,
} from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";
import { Gc2Table } from "@/components/ui/gc2-table";


type AnalyticsDevice = Device & {
  sensorStatus?: string;
  lastSeenMs?: number;
  rawSoil?: number;
  soilVoltage?: number;
  temperature?: number;
  humidity?: number;
  waterLevel?: number;
  waterLevelStatus?: string;
  rainStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
};

type ActivityLayer = "Telemetry" | "Command" | "Safety" | "Workspace" | "Attention" | "System";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function hasTelemetry(device: AnalyticsDevice) {
  return (
    device.status === "Online" ||
    device.status === "Syncing" ||
    typeof device.lastSeenMs === "number" ||
    device.signal > 0
  );
}

function valuePercent(value: unknown, ready = true) {
  return ready && typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function valueNumber(value: unknown, suffix = "", digits = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value.toFixed(digits)}${suffix}`
    : "—";
}

function deviceTone(status: Device["status"]): Gc2StatusTone {
  if (status === "Online") return "success";
  if (status === "Syncing") return "info";
  if (status === "Offline") return "danger";
  return "neutral";
}

function moistureBand(
  device: AnalyticsDevice,
  threshold: number,
): { label: string; tone: Gc2StatusTone } {
  if (!hasTelemetry(device)) return { label: "No packet", tone: "neutral" };
  if (device.moisture <= threshold) return { label: "At threshold", tone: "warning" };
  if (device.moisture <= threshold + 15) return { label: "Near threshold", tone: "info" };
  return { label: "Above threshold", tone: "success" };
}

function activityLayer(item: ActivityItem): ActivityLayer {
  const text = `${item.title} ${item.description} ${item.body ?? ""} ${item.status}`.toLowerCase();

  if (
    text.includes("warning") ||
    text.includes("blocked") ||
    text.includes("failed") ||
    text.includes("rejected") ||
    text.includes("timeout") ||
    text.includes("risk")
  ) {
    return "Attention";
  }

  if (
    text.includes("watering") ||
    text.includes("irrigation") ||
    text.includes("pump") ||
    text.includes("command")
  ) {
    return "Command";
  }

  if (
    text.includes("protected") ||
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("lock") ||
    text.includes("dry-run")
  ) {
    return "Safety";
  }

  if (
    text.includes("firebase") ||
    text.includes("workspace") ||
    text.includes("pairing") ||
    text.includes("sync")
  ) {
    return "Workspace";
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("soil") ||
    text.includes("sensor") ||
    text.includes("signal")
  ) {
    return "Telemetry";
  }

  return "System";
}

function layerTone(layer: ActivityLayer): Gc2StatusTone {
  if (layer === "Command") return "success";
  if (layer === "Attention") return "warning";
  if (layer === "Telemetry" || layer === "Workspace") return "info";
  return "neutral";
}

function EvidenceRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-3 border-b border-[var(--gc2-line)] py-4 last:border-b-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-moss)]">
        {icon}
      </div>
      <div>
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{children}</p>
      </div>
    </div>
  );
}

export default function Gc2EnvironmentalAnalytics() {
  const {
    devices,
    selectedDevice,
    automation,
    activityFeed,
    filteredActivity,
    searchQuery,
    refreshTelemetry,
  } = useAppState();
  const [deviceScope, setDeviceScope] = useState("all");
  const [feedback, setFeedback] = useState("");

  const globalQuery = searchQuery.trim().toLowerCase();
  const sourceDevices = useMemo(() => {
    if (!globalQuery) return devices;

    return devices.filter((device) =>
      `${device.name} ${device.place} ${device.id} ${device.status}`
        .toLowerCase()
        .includes(globalQuery),
    );
  }, [devices, globalQuery]);

  const scopedDevices = useMemo(
    () =>
      deviceScope === "all"
        ? sourceDevices
        : sourceDevices.filter((device) => device.id === deviceScope),
    [deviceScope, sourceDevices],
  );

  const sourceActivity = globalQuery ? filteredActivity : activityFeed;
  const scopedActivity = useMemo(
    () =>
      deviceScope === "all"
        ? sourceActivity
        : sourceActivity.filter((item) => item.deviceId === deviceScope),
    [deviceScope, sourceActivity],
  );

  const analyticsDevices = scopedDevices as AnalyticsDevice[];
  const telemetryDevices = analyticsDevices.filter(hasTelemetry);
  const onlineCount = analyticsDevices.filter((device) => device.status === "Online").length;
  const averageMoisture = telemetryDevices.length
    ? telemetryDevices.reduce((total, device) => total + device.moisture, 0) /
      telemetryDevices.length
    : null;
  const signalDevices = telemetryDevices.filter((device) => Number.isFinite(device.signal));
  const averageSignal = signalDevices.length
    ? signalDevices.reduce((total, device) => total + device.signal, 0) /
      signalDevices.length
    : null;

  const layerCounts = useMemo(() => {
    const counts = new Map<ActivityLayer, number>();
    for (const item of scopedActivity) {
      const layer = activityLayer(item);
      counts.set(layer, (counts.get(layer) ?? 0) + 1);
    }
    return (["Telemetry", "Command", "Safety", "Workspace", "Attention", "System"] as ActivityLayer[])
      .map((layer) => ({ layer, count: counts.get(layer) ?? 0 }))
      .filter((item) => item.count > 0);
  }, [scopedActivity]);

  const selected = devices.find((device) => device.id === selectedDevice.id) as
    | AnalyticsDevice
    | undefined;

  function refreshSelected() {
    if (!selected) return;
    refreshTelemetry(selected.id);
    setFeedback(`Telemetry refresh requested for ${selected.name}.`);
  }

  const activityTotal = Math.max(1, scopedActivity.length);

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker="Environmental intelligence"
          title="Analytics should explain the evidence, not invent it."
          description="Compare current device packets, policy-relative moisture bands and recorded operation layers. Historical trends remain unavailable until GreenCloud stores a real time series."
          actions={
            <>
              <Gc2LinkButton href="/activity" variant="quiet">
                Operations log
              </Gc2LinkButton>
              <Gc2Button variant="secondary" disabled={!selected} onClick={refreshSelected}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Refresh selected node
              </Gc2Button>
            </>
          }
        />

        {feedback ? (
          <Gc2Notice tone="success" title="Analytics source updated" icon={<CheckCircle2 className="h-5 w-5" />}>
            {feedback}
          </Gc2Notice>
        ) : null}

        <Gc2Surface tone="raised" className="overflow-hidden p-0">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div>
              <p className="gc2-kicker">Current evidence window</p>
              <h2 className="gc2-heading-md mt-2">Fleet snapshot</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Values below are calculated only from current devices with a trustworthy packet. Missing telemetry remains unavailable rather than being estimated.
              </p>
            </div>
            <Gc2Select
              label="Device scope"
              value={deviceScope}
              onChange={(event) => setDeviceScope(event.target.value)}
            >
              <option value="all">All matching devices</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} · {device.place}
                </option>
              ))}
            </Gc2Select>
          </div>

          <div className="grid gap-5 border-t border-[var(--gc2-line)] p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
            <Gc2Metric label="Scoped devices" value={analyticsDevices.length} detail={`${onlineCount} currently online`} />
            <Gc2Metric label="Trusted packets" value={telemetryDevices.length} detail="Devices included in averages" />
            <Gc2Metric label="Average moisture" value={averageMoisture === null ? "—" : `${Math.round(averageMoisture)}%`} detail={`Policy threshold ${automation.moistureThreshold}%`} />
            <Gc2Metric label="Average signal" value={averageSignal === null ? "—" : `${Math.round(averageSignal)}%`} detail="Current packet signal only" />
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
              <p className="gc2-kicker">Current moisture distribution</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Policy-relative device comparison</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Bar lengths come directly from each device&apos;s current moisture value. They are not reconstructed history.
              </p>
            </div>

            {telemetryDevices.length > 0 ? (
              <div className="divide-y divide-[var(--gc2-line)]">
                {telemetryDevices.map((device) => {
                  const band = moistureBand(device, automation.moistureThreshold);
                  return (
                    <div key={device.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(160px,0.75fr)_minmax(220px,1fr)_auto] sm:items-center sm:p-6">
                      <div className="min-w-0">
                        <Link href={`/devices/${encodeURIComponent(device.id)}`} className="font-bold text-[var(--gc2-ink)] underline-offset-4 hover:underline">
                          {device.name}
                        </Link>
                        <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{device.place}</p>
                      </div>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--gc2-canvas-muted)]" aria-label={`${device.name} moisture ${Math.round(device.moisture)} percent`}>
                          <div className="h-full rounded-full bg-[var(--gc2-moss)]" style={{ width: `${clampPercent(device.moisture)}%` }} />
                        </div>
                        <div className="gc2-data mt-2 flex justify-between text-[10px] text-[var(--gc2-ink-muted)]">
                          <span>0%</span>
                          <span>{Math.round(device.moisture)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <Gc2Status tone={band.tone}>{band.label}</Gc2Status>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <Gc2Notice tone="info" title="No trustworthy moisture packets" icon={<Gauge className="h-5 w-5" />}>
                  The selected scope has no current device packet that can support a moisture comparison.
                </Gc2Notice>
              </div>
            )}
          </Gc2Surface>

          <div className="col-span-12 grid gap-5 lg:col-span-4">
            <Gc2Surface className="overflow-hidden p-0">
              <div className="border-b border-[var(--gc2-line)] p-5">
                <p className="gc2-kicker">Recorded event composition</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">Activity layers</h2>
              </div>
              {layerCounts.length > 0 ? (
                <div className="p-5">
                  {layerCounts.map(({ layer, count }) => (
                    <div key={layer} className="border-b border-[var(--gc2-line)] py-4 first:pt-0 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <Gc2Status tone={layerTone(layer)}>{layer}</Gc2Status>
                        <span className="gc2-data text-sm font-bold text-[var(--gc2-ink)]">{count}</span>
                      </div>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--gc2-canvas-muted)]">
                        <div className="h-full rounded-full bg-[var(--gc2-moss)]" style={{ width: `${(count / activityTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  No recorded operations match the current analytics scope.
                </div>
              )}
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <p className="gc2-kicker">Data confidence</p>
              <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">What these results mean</h2>
              <div className="mt-3">
                <EvidenceRow icon={<Radio className="h-4 w-4" />} title="Current snapshot">
                  Device averages use only the latest in-memory packets available through AppState.
                </EvidenceRow>
                <EvidenceRow icon={<Activity className="h-4 w-4" />} title="Recorded context">
                  Event composition comes from the real operations feed, including active global search filtering.
                </EvidenceRow>
                <EvidenceRow icon={<ShieldCheck className="h-4 w-4" />} title="Missing-data policy">
                  GreenCloud displays an em dash when a sensor channel or packet is unavailable.
                </EvidenceRow>
                <EvidenceRow icon={<BarChart3 className="h-4 w-4" />} title="No invented trend line">
                  This screen does not claim hourly, daily or weekly history because no historical series is exposed here.
                </EvidenceRow>
              </div>
            </Gc2Surface>
          </div>
        </div>

        <Gc2Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-[var(--gc2-line)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div>
              <p className="gc2-kicker">Device evidence table</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Current environmental channels</h2>
            </div>
            <Gc2LinkButton href="/devices" variant="quiet">
              Hardware inventory
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2LinkButton>
          </div>

          {analyticsDevices.length > 0 ? (
            <Gc2Table caption="Current GreenCloud environmental analytics by device">
              <thead>
                <tr>
                  <th scope="col">Device</th>
                  <th scope="col">Connection</th>
                  <th scope="col">Moisture</th>
                  <th scope="col">Signal</th>
                  <th scope="col">Temperature</th>
                  <th scope="col">Sensor evidence</th>
                </tr>
              </thead>
              <tbody>
                {analyticsDevices.map((device) => {
                  const ready = hasTelemetry(device);
                  return (
                    <tr key={device.id}>
                      <td>
                        <Link href={`/devices/${encodeURIComponent(device.id)}`} className="font-bold text-[var(--gc2-moss-strong)] underline-offset-4 hover:underline">
                          {device.name}
                        </Link>
                        <span className="mt-1 block text-xs text-[var(--gc2-ink-soft)]">{device.place}</span>
                      </td>
                      <td><Gc2Status tone={deviceTone(device.status)}>{device.status}</Gc2Status></td>
                      <td className="gc2-data">{valuePercent(device.moisture, ready)}</td>
                      <td className="gc2-data">{valuePercent(device.signal, ready)}</td>
                      <td className="gc2-data">{valueNumber(device.temperature, "°C", 1)}</td>
                      <td>
                        <span className="block text-sm font-bold text-[var(--gc2-ink)]">{device.sensorStatus ?? "Pending"}</span>
                        <span className="gc2-data mt-1 block text-xs text-[var(--gc2-ink-muted)]">
                          RAW {valueNumber(device.rawSoil)} · {valueNumber(device.soilVoltage, "V", 2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Gc2Table>
          ) : (
            <div className="p-6 sm:p-8">
              <Gc2Notice tone="warning" title="No devices match this scope" icon={<AlertTriangle className="h-5 w-5" />}>
                Change the device scope or global search. Analytics cannot be calculated without matching workspace hardware.
              </Gc2Notice>
            </div>
          )}
        </Gc2Surface>

        <Gc2Notice tone="info" title="Analytics boundary" icon={<Wifi className="h-5 w-5" />}>
          This screen reads current AppState devices and activity only. It does not query Firebase directly, synthesize missing telemetry or claim a historical trend that the data model does not provide.
        </Gc2Notice>
      </div>
    </Gc2ProtectedShell>
  );
}
