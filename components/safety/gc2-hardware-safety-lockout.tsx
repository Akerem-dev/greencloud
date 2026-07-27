"use client";

import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Droplets,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Wrench,
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
import { getHardwareSafetyLockout } from "@/lib/hardware-safety-lockout.mjs";

type LockoutSurface = "dashboard" | "device";

function severityTone(severity: string) {
  if (severity === "danger") return "danger" as const;
  if (severity === "warning") return "warning" as const;
  return "info" as const;
}

function displayValue(value: unknown, fallback = "Not reported") {
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

export default function Gc2HardwareSafetyLockout({
  device,
  surface,
}: {
  device: Device;
  surface: LockoutSurface;
}) {
  const { refreshTelemetry, filteredActivity, automation } = useAppState();
  const lockout = getHardwareSafetyLockout(device);
  const recentSafetyActivity = filteredActivity
    .filter((item) => !item.deviceId || item.deviceId === device.id)
    .slice(0, 5);

  const primaryIncident = lockout.incidents[0];
  const detailHref = `/devices/${encodeURIComponent(device.id)}`;

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker={`${device.place} · safety incident`}
          title="Hardware protection has locked irrigation output."
          description="GreenCloud has current evidence that at least one field, sensor or output guard is active. No watering success is assumed while the incident remains unresolved."
          actions={
            <>
              <Gc2LinkButton href={surface === "dashboard" ? "/devices" : "/dashboard"} variant="quiet">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                {surface === "dashboard" ? "Devices" : "Dashboard"}
              </Gc2LinkButton>
              {surface === "dashboard" ? (
                <Gc2LinkButton href={detailHref} variant="secondary">
                  Open device incident
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Gc2LinkButton>
              ) : null}
            </>
          }
        />

        <Gc2Notice
          tone="danger"
          title="Fail-closed safety lockout"
          icon={<AlertOctagon className="h-5 w-5" />}
        >
          {primaryIncident?.failed ||
            "The selected device cannot provide a safe irrigation path."}
          {" "}
          The browser cannot clear a hardware guard, force the relay or bypass the protected command decision.
        </Gc2Notice>

        <div className="gc2-grid items-start">
          <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <header className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="gc2-kicker">Active incident register</p>
                  <h2 className="gc2-heading-md mt-2">
                    {lockout.incidents.length} protection guard{lockout.incidents.length === 1 ? "" : "s"} active
                  </h2>
                  <p className="gc2-copy mt-3 max-w-2xl">
                    Every row separates the reported failure from the prevented action and the next physical inspection step.
                  </p>
                </div>
                <Gc2Status tone="danger">Irrigation locked</Gc2Status>
              </div>
            </header>

            <div className="divide-y divide-[var(--gc2-line)]">
              {lockout.incidents.map((item: {
                id: string;
                severity: string;
                title: string;
                failed: string;
                prevented: string;
                safeState: string;
                inspectNext: string;
              }) => (
                <article key={item.id} className="grid gap-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-danger)] bg-[var(--gc2-danger-soft)] text-[var(--gc2-danger)]">
                        <ShieldAlert aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="gc2-kicker">{item.id.replaceAll("-", " ")}</p>
                        <h3 className="mt-1 text-lg font-bold text-[var(--gc2-ink)]">{item.title}</h3>
                      </div>
                    </div>
                    <Gc2Status tone={severityTone(item.severity)}>{item.severity}</Gc2Status>
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
                      <dt className="gc2-kicker">What failed</dt>
                      <dd className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">{item.failed}</dd>
                    </div>
                    <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
                      <dt className="gc2-kicker">Action prevented</dt>
                      <dd className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">{item.prevented}</dd>
                    </div>
                    <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
                      <dt className="gc2-kicker">Garden safety</dt>
                      <dd className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">{item.safeState}</dd>
                    </div>
                    <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
                      <dt className="gc2-kicker">Inspect next</dt>
                      <dd className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">{item.inspectNext}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </Gc2Surface>

          <aside className="col-span-12 grid gap-5 lg:col-span-4">
            <Gc2Surface className="p-5 sm:p-6">
              <p className="gc2-kicker">Safety assessment</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                Output-safe, field inspection required
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                GreenCloud is preventing unintended irrigation. That does not prove the plant has enough water; the active incident must be checked at the controller and field hardware.
              </p>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--gc2-line)] py-3">
                  <span className="text-sm font-bold text-[var(--gc2-ink)]">Manual irrigation</span>
                  <Gc2Status tone="danger">Prevented</Gc2Status>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--gc2-line)] py-3">
                  <span className="text-sm font-bold text-[var(--gc2-ink)]">Automatic mode</span>
                  <Gc2Status tone="info">{automation.mode}</Gc2Status>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="text-sm font-bold text-[var(--gc2-ink)]">Relay bypass</span>
                  <Gc2Status tone="neutral">Unavailable</Gc2Status>
                </div>
              </div>
              <Gc2Button
                variant="secondary"
                onClick={() => refreshTelemetry(device.id)}
                className="mt-5 w-full justify-center"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Request fresh hardware evidence
              </Gc2Button>
            </Gc2Surface>

            <Gc2Surface className="p-5 sm:p-6">
              <p className="gc2-kicker">Current device record</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex gap-3"><Cpu className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-ink-muted)]" /><div><p className="m-0 font-bold text-[var(--gc2-ink)]">Controller</p><p className="mt-1 text-[var(--gc2-ink-soft)]">{device.name} · {device.status}</p></div></div>
                <div className="flex gap-3"><Gauge className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-ink-muted)]" /><div><p className="m-0 font-bold text-[var(--gc2-ink)]">Sensor</p><p className="mt-1 text-[var(--gc2-ink-soft)]">{displayValue(device.sensorStatus)}</p></div></div>
                <div className="flex gap-3"><Droplets className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-ink-muted)]" /><div><p className="m-0 font-bold text-[var(--gc2-ink)]">Water protection</p><p className="mt-1 text-[var(--gc2-ink-soft)]">{displayValue(device.waterLevelStatus)}</p></div></div>
                <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-ink-muted)]" /><div><p className="m-0 font-bold text-[var(--gc2-ink)]">Command result</p><p className="mt-1 text-[var(--gc2-ink-soft)]">{displayValue(device.lastCommandStatus, "No command result")}</p></div></div>
              </div>
            </Gc2Surface>
          </aside>
        </div>

        <Gc2Surface className="overflow-hidden p-0">
          <div className="flex flex-col gap-4 border-b border-[var(--gc2-line)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="gc2-kicker">Incident evidence</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">Recent stored operations</h2>
            </div>
            <Gc2LinkButton href="/activity" variant="quiet">
              Open full activity ledger
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2LinkButton>
          </div>

          {recentSafetyActivity.length > 0 ? (
            <div className="divide-y divide-[var(--gc2-line)]">
              {recentSafetyActivity.map((item) => (
                <div key={item.id} className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 p-4 sm:p-5">
                  <Activity aria-hidden="true" className="mt-1 h-4 w-4 text-[var(--gc2-ink-muted)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{item.description}</p>
                  </div>
                  <span className="gc2-data text-xs text-[var(--gc2-ink-muted)]">{item.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <p className="m-0 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                No stored device-specific operation is available. Inspect the physical controller before assuming the incident has cleared.
              </p>
            </div>
          )}
        </Gc2Surface>

        <div className="flex items-start gap-3 text-xs leading-5 text-[var(--gc2-ink-muted)]">
          <Wrench aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          Hardware lockouts clear only after the ESP32 reports safe current evidence. Refreshing this screen does not override firmware, relay or pump protection.
        </div>
      </div>
    </Gc2ProtectedShell>
  );
}
