"use client";

import {
  Activity,
  ArrowLeft,
  Clock3,
  CloudOff,
  Cpu,
  Database,
  RefreshCw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";

function lastTrustedPacket(device: Device) {
  if (typeof device.lastSeenMs !== "number") {
    return device.updatedAt || "No trusted packet timestamp";
  }

  if (device.lastSeenMs > 1_000_000_000_000) {
    return new Date(device.lastSeenMs).toLocaleString();
  }

  return `${Math.max(1, Math.round(device.lastSeenMs / 1000))}s device runtime`;
}

function cachedPercent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

export default function Gc2OfflineSyncRecovery({
  device,
}: {
  device: Device;
}) {
  const { refreshTelemetry, automation, filteredActivity } = useAppState();
  const syncing = device.status === "Syncing";
  const recentDeviceActivity = filteredActivity
    .filter((item) => !item.deviceId || item.deviceId === device.id)
    .slice(0, 4);

  const recoverySteps = syncing
    ? [
        "Keep this browser connected while the private workspace subscription catches up.",
        "Wait for a new device packet rather than treating the cached values as live.",
        "Open the device inventory if the Syncing state does not clear after the controller reconnects.",
      ]
    : [
        "Confirm the ESP32 has power and remains connected to its configured Wi-Fi network.",
        "Check the router or access point before changing GreenCloud ownership or pairing state.",
        "Request telemetry again only after the controller is reachable; generate no new pairing code for an already trusted device.",
      ];

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker={`${device.place} · connection recovery`}
          title={syncing ? "Workspace synchronization is catching up." : "This trusted device is offline."}
          description="GreenCloud preserves the last accepted record but removes every claim that the cached packet is live. Physical output remains protected until current device evidence returns."
          actions={
            <Gc2LinkButton href="/devices" variant="quiet">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Devices
            </Gc2LinkButton>
          }
        />

        <Gc2Notice
          tone={syncing ? "warning" : "danger"}
          title={syncing ? "Synchronization incomplete" : "Live device link unavailable"}
          icon={syncing ? <Database className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
        >
          {syncing
            ? "Firebase workspace state is present, but GreenCloud has not received enough current evidence to call this node live."
            : "The trusted ownership record still exists, but the ESP32 is not currently reporting a live connection."}
        </Gc2Notice>

        <div className="gc2-grid items-start">
          <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <header className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="gc2-kicker">Last accepted evidence</p>
                  <h2 className="gc2-heading-md mt-2">Cached packet, not live telemetry</h2>
                  <p className="gc2-copy mt-3 max-w-2xl">
                    These values are shown only as the last stored device record. They must not be used as proof of current soil, tank or radio conditions.
                  </p>
                </div>
                <Gc2Status tone={syncing ? "warning" : "danger"}>
                  {syncing ? "Sync pending" : "Offline"}
                </Gc2Status>
              </div>
            </header>

            <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7 xl:grid-cols-4">
              <Gc2Metric label="Stored moisture" value={cachedPercent(device.moisture)} detail="Last accepted value" />
              <Gc2Metric label="Stored signal" value={cachedPercent(device.signal)} detail="Not a current link test" />
              <Gc2Metric label="Device status" value={device.status} detail="Current workspace classification" />
              <Gc2Metric label="Last packet" value={lastTrustedPacket(device)} detail="No newer trusted evidence" />
            </div>

            <div className="grid gap-4 border-t border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-5 sm:grid-cols-3 sm:p-6">
              <div className="flex gap-3">
                <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-ink-muted)]" />
                <div><p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Trusted identity</p><p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{device.name}</p></div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-ink-muted)]" />
                <div><p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Stored update</p><p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">{device.updatedAt || "Unavailable"}</p></div>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
                <div><p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Ownership</p><p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">Preserved; no re-pair required</p></div>
              </div>
            </div>
          </Gc2Surface>

          <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-4">
            <p className="gc2-kicker">Command boundary</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Physical output stays locked</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
              Manual irrigation is not offered from this recovery screen. Current telemetry and device reachability must return before a protected command can be evaluated.
            </p>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--gc2-line)] py-3">
                <span className="text-sm font-bold text-[var(--gc2-ink)]">Manual irrigation</span>
                <Gc2Status tone="danger">Locked</Gc2Status>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-[var(--gc2-line)] py-3">
                <span className="text-sm font-bold text-[var(--gc2-ink)]">Automation policy</span>
                <Gc2Status tone="info">{automation.mode}</Gc2Status>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-bold text-[var(--gc2-ink)]">Ownership mutation</span>
                <Gc2Status tone="neutral">Unchanged</Gc2Status>
              </div>
            </div>

            <Gc2Button
              variant="secondary"
              onClick={() => refreshTelemetry(device.id)}
              className="mt-5 w-full justify-center"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Request telemetry refresh
            </Gc2Button>
          </Gc2Surface>
        </div>

        <div className="gc2-grid items-start">
          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-7">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
              <p className="gc2-kicker">Recovery sequence</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Restore evidence before control</h2>
            </div>
            <ol className="m-0 list-none p-0">
              {recoverySteps.map((step, index) => (
                <li key={step} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 border-b border-[var(--gc2-line)] p-4 last:border-b-0">
                  <span className="gc2-data grid h-10 w-10 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-xs font-bold text-[var(--gc2-ink-muted)]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm leading-6 text-[var(--gc2-ink-soft)]">{step}</span>
                </li>
              ))}
            </ol>
          </Gc2Surface>

          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-5">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
              <p className="gc2-kicker">Recent stored operations</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Audit context remains available</h2>
            </div>
            {recentDeviceActivity.length > 0 ? (
              <div className="divide-y divide-[var(--gc2-line)]">
                {recentDeviceActivity.map((item) => (
                  <div key={item.id} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 p-4">
                    <Activity className="mt-1 h-4 w-4 text-[var(--gc2-ink-muted)]" />
                    <div><p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{item.title}</p><p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{item.description}</p><p className="gc2-data mt-2 text-xs text-[var(--gc2-ink-muted)]">{item.time}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 sm:p-6"><p className="m-0 text-sm leading-6 text-[var(--gc2-ink-soft)]">No stored device-specific operations are available.</p></div>
            )}
          </Gc2Surface>
        </div>

        <div className="flex items-start gap-3 text-xs leading-5 text-[var(--gc2-ink-muted)]">
          <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          GreenCloud does not fabricate a reconnect, change ownership or mark cached telemetry as current from this screen.
        </div>
      </div>
    </Gc2ProtectedShell>
  );
}
