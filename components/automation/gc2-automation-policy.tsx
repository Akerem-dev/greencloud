"use client";

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Droplets,
  Gauge,
  Lock,
  Power,
  Radio,
  RotateCcw,
  ShieldCheck,
  TimerReset,
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


type AutomationDevice = Device & {
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: string;
  pumpState?: string;
  rainStatus?: string;
  waterLevel?: number;
  waterLevelStatus?: string;
  lastSeenMs?: number;
  lastCommand?: string;
  lastCommandStatus?: string;
  firmware?: string;
};

function hasTelemetry(device: AutomationDevice) {
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
    normalized.includes("ready") ||
    normalized.includes("clear") ||
    normalized.includes("online") ||
    normalized.includes("completed") ||
    normalized.includes("enabled") ||
    normalized.includes("met")
  ) {
    return "success";
  }

  if (
    normalized.includes("blocked") ||
    normalized.includes("offline") ||
    normalized.includes("empty") ||
    normalized.includes("no signal")
  ) {
    return "danger";
  }

  if (
    normalized.includes("low") ||
    normalized.includes("detected") ||
    normalized.includes("waiting") ||
    normalized.includes("review") ||
    normalized.includes("paused")
  ) {
    return "warning";
  }

  if (
    normalized.includes("protected") ||
    normalized.includes("locked") ||
    normalized.includes("monitoring") ||
    normalized.includes("manual")
  ) {
    return "info";
  }

  return "neutral";
}

function percent(value: unknown, ready = true) {
  return ready && typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "—";
}

function PolicyRange({
  label,
  description,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-b border-[var(--gc2-line)] py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{label}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
            {description}
          </p>
        </div>
        <span className="gc2-data shrink-0 text-base font-bold text-[var(--gc2-moss-strong)]">
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-4 h-2 w-full cursor-pointer accent-[var(--gc2-moss)]"
      />

      <div className="gc2-data mt-2 flex justify-between text-[10px] text-[var(--gc2-ink-muted)]">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function PolicyToggle({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[var(--gc2-line)] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
          {description}
        </p>
      </div>
      <Gc2Button
        variant={active ? "primary" : "quiet"}
        aria-pressed={active}
        onClick={onClick}
        className="shrink-0"
      >
        {active ? "Enabled" : "Disabled"}
      </Gc2Button>
    </div>
  );
}

function DecisionRow({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3 border-b border-[var(--gc2-line)] py-4 last:border-b-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-moss)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
          {detail}
        </p>
      </div>
      <Gc2Status tone={statusTone(value)} className="self-start">
        {value}
      </Gc2Status>
    </div>
  );
}

export default function Gc2AutomationPolicy() {
  const {
    automation,
    selectedDevice,
    devices,
    updateAutomation,
    resetAutomation,
    startIrrigation,
  } = useAppState();
  const [resetOpen, setResetOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const activeDevice =
    devices.find((device) => device.id === selectedDevice.id) ?? devices[0];
  const device = activeDevice as AutomationDevice | undefined;

  if (!device) {
    return (
      <Gc2ProtectedShell>
        <div className="gc2-stack">
          <Gc2SectionHeading
            kicker="Control policy"
            title="Automation starts with trusted hardware."
            description="Pair an ESP32 before defining moisture rules, cooldown windows or physical watering commands."
            actions={
              <Gc2LinkButton href="/devices/add">
                Pair first device
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Gc2LinkButton>
            }
          />
          <Gc2Surface tone="raised" className="p-6 sm:p-8">
            <Gc2Notice
              tone="info"
              title="No selected hardware node"
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              The automation editor remains inactive until a real workspace device
              exists. GreenCloud does not create placeholder policies for imaginary
              hardware.
            </Gc2Notice>
          </Gc2Surface>
        </div>
      </Gc2ProtectedShell>
    );
  }

  const telemetryReady = hasTelemetry(device);
  const sensorStatus = device.sensorStatus ??
    (device.status === "Offline" ? "No signal" : "Pending");
  const rainStatus = device.rainStatus ?? "Pending";
  const waterStatus = device.waterLevelStatus ?? "Pending";
  const safeMode = device.safeMode ?? true;
  const pumpEnabled = device.pumpEnabled ?? false;
  const relayState =
    device.relayState ?? (safeMode || !pumpEnabled ? "Locked" : "Enabled");
  const pumpState =
    device.pumpState ?? (safeMode || !pumpEnabled ? "Dry-run" : "Ready");
  const physicalOutputLocked = safeMode || !pumpEnabled;
  const sensorBlocked =
    device.status === "Offline" ||
    sensorStatus.toLowerCase().includes("sensor check") ||
    sensorStatus.toLowerCase().includes("no signal");
  const rainBlocked = rainStatus === "Detected";
  const tankBlocked = waterStatus === "Low" || waterStatus === "Empty";
  const thresholdMet =
    telemetryReady && device.moisture <= automation.moistureThreshold;
  const automaticArmed =
    automation.mode === "Automatic" && automation.autoIrrigationEnabled;

  const blockers = [
    !telemetryReady ? "Telemetry is not ready" : null,
    sensorBlocked ? "Sensor reliability requires review" : null,
    rainBlocked ? "Rain lockout is active" : null,
    tankBlocked ? "Water-level protection is active" : null,
    physicalOutputLocked ? "Physical output remains protected" : null,
  ].filter(Boolean) as string[];

  const decision =
    blockers.length > 0
      ? "Blocked safely"
      : automation.mode === "Manual"
        ? automation.manualOverrideEnabled
          ? "Manual command ready"
          : "Manual hold"
        : !automaticArmed
          ? "Automatic irrigation paused"
          : thresholdMet
            ? "Rule condition met"
            : "Monitoring threshold";

  function resetPolicy() {
    resetAutomation();
    setResetOpen(false);
    setFeedback("Automation policy restored to protected defaults.");
  }

  function sendProtectedCommand() {
    startIrrigation(device.id);
    setFeedback(
      "Command submitted to the existing AppState safety boundary for evaluation.",
    );
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker={`${device.name} · ${device.place}`}
          title="Automation is a policy, not a shortcut."
          description="Define the moisture rule, timing constraints and command permissions while keeping sensor, rain, tank and physical-output protection visible."
          actions={
            <>
              <Gc2LinkButton
                href={`/devices/${encodeURIComponent(device.id)}`}
                variant="quiet"
              >
                Device detail
              </Gc2LinkButton>
              <Gc2Button variant="secondary" onClick={() => setResetOpen(true)}>
                <RotateCcw aria-hidden="true" className="h-4 w-4" />
                Reset policy
              </Gc2Button>
            </>
          }
        />

        {feedback ? (
          <Gc2Notice
            tone="success"
            title="Automation workspace updated"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {feedback}
          </Gc2Notice>
        ) : null}

        <Gc2Surface tone="raised" className="overflow-hidden p-0">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.7fr)] lg:items-end">
            <div>
              <p className="gc2-kicker">Current policy decision</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="gc2-heading-md">{decision}</h2>
                <Gc2Status tone={statusTone(decision)}>{decision}</Gc2Status>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gc2-ink-soft)]">
                {blockers.length > 0
                  ? blockers.join(" · ")
                  : "All visible web-side guards currently allow the configured policy to continue."}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Gc2Metric
                label="Soil moisture"
                value={percent(device.moisture, telemetryReady)}
                detail={`Threshold ${automation.moistureThreshold}%`}
              />
              <Gc2Metric
                label="Mode"
                value={automation.mode}
                detail={automaticArmed ? "Automatic policy armed" : "Controlled policy state"}
              />
              <Gc2Metric
                label="Cooldown"
                value={`${automation.cooldownMinutes} min`}
                detail="Minimum command spacing"
              />
              <Gc2Metric
                label="Pump request"
                value={`${automation.pumpDurationSeconds}s`}
                detail="Requested runtime per command"
              />
            </div>
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <div className="col-span-12 grid gap-5 lg:col-span-8">
            <Gc2Surface className="overflow-hidden p-0">
              <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
                <p className="gc2-kicker">Policy editor</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Rule and timing controls
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  Every change passes through the existing normalized automation
                  adapter before persistence.
                </p>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-3 border-b border-[var(--gc2-line)] pb-5 sm:grid-cols-2">
                  <Gc2Button
                    variant={automation.mode === "Automatic" ? "primary" : "quiet"}
                    aria-pressed={automation.mode === "Automatic"}
                    onClick={() => updateAutomation({ mode: "Automatic" })}
                    className="justify-center"
                  >
                    Automatic policy
                  </Gc2Button>
                  <Gc2Button
                    variant={automation.mode === "Manual" ? "primary" : "quiet"}
                    aria-pressed={automation.mode === "Manual"}
                    onClick={() => updateAutomation({ mode: "Manual" })}
                    className="justify-center"
                  >
                    Manual policy
                  </Gc2Button>
                </div>

                <PolicyRange
                  label="Moisture threshold"
                  description="Marks the selected node as eligible when real soil moisture reaches or falls below this value."
                  value={automation.moistureThreshold}
                  min={15}
                  max={80}
                  suffix="%"
                  onChange={(value) =>
                    updateAutomation({ moistureThreshold: value })
                  }
                />
                <PolicyRange
                  label="Cooldown window"
                  description="Prevents repeated watering requests from being issued too close together."
                  value={automation.cooldownMinutes}
                  min={5}
                  max={120}
                  suffix=" min"
                  onChange={(value) =>
                    updateAutomation({ cooldownMinutes: value })
                  }
                />
                <PolicyRange
                  label="Requested pump duration"
                  description="Controls the requested runtime; firmware and hardware protection remain authoritative."
                  value={automation.pumpDurationSeconds}
                  min={2}
                  max={60}
                  suffix="s"
                  onChange={(value) =>
                    updateAutomation({ pumpDurationSeconds: value })
                  }
                />
              </div>
            </Gc2Surface>

            <Gc2Surface className="overflow-hidden p-0">
              <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
                <p className="gc2-kicker">Permission boundaries</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Command authorization
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <PolicyToggle
                  title="Automatic irrigation"
                  description="Allows the automatic policy to request watering after every visible guard passes."
                  active={automation.autoIrrigationEnabled}
                  onClick={() =>
                    updateAutomation({
                      autoIrrigationEnabled: !automation.autoIrrigationEnabled,
                    })
                  }
                />
                <PolicyToggle
                  title="Manual override"
                  description="Allows protected manual requests from dashboard, device detail and this policy page."
                  active={automation.manualOverrideEnabled}
                  onClick={() => {
                    const next = !automation.manualOverrideEnabled;
                    updateAutomation({
                      manualOverrideEnabled: next,
                      manualOverride: next,
                    });
                  }}
                />
                <PolicyToggle
                  title="Quiet hours"
                  description="Adds a configured overnight boundary to the automatic policy."
                  active={automation.quietHoursEnabled}
                  onClick={() =>
                    updateAutomation({
                      quietHoursEnabled: !automation.quietHoursEnabled,
                    })
                  }
                />

                {automation.quietHoursEnabled ? (
                  <div className="mt-5 grid gap-5 border-t border-[var(--gc2-line)] pt-5 sm:grid-cols-2">
                    <Gc2Input
                      label="Quiet start"
                      type="time"
                      value={automation.quietHoursStart}
                      onChange={(event) =>
                        updateAutomation({
                          quietHoursStart: event.target.value,
                          quietStart: event.target.value,
                        })
                      }
                    />
                    <Gc2Input
                      label="Quiet end"
                      type="time"
                      value={automation.quietHoursEnd}
                      onChange={(event) =>
                        updateAutomation({
                          quietHoursEnd: event.target.value,
                          quietEnd: event.target.value,
                        })
                      }
                    />
                  </div>
                ) : null}
              </div>
            </Gc2Surface>
          </div>

          <aside className="col-span-12 grid gap-5 lg:col-span-4">
            <Gc2Surface className="overflow-hidden p-0">
              <div className="border-b border-[var(--gc2-line)] p-5">
                <p className="gc2-kicker">Decision trace</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                  Why GreenCloud reached this state
                </h2>
              </div>
              <div className="px-5">
                <DecisionRow
                  icon={<Wifi className="h-4 w-4" />}
                  label="Telemetry packet"
                  value={telemetryReady ? "Ready" : "Waiting"}
                  detail="Automation never evaluates invented sensor values."
                />
                <DecisionRow
                  icon={<Gauge className="h-4 w-4" />}
                  label="Moisture rule"
                  value={thresholdMet ? "Condition met" : "Monitoring"}
                  detail={`${percent(device.moisture, telemetryReady)} against ${automation.moistureThreshold}%.`}
                />
                <DecisionRow
                  icon={<Radio className="h-4 w-4" />}
                  label="Sensor reliability"
                  value={sensorBlocked ? "Review required" : sensorStatus}
                  detail="Offline and unreliable sensor states block commands."
                />
                <DecisionRow
                  icon={<Droplets className="h-4 w-4" />}
                  label="Rain lockout"
                  value={rainStatus}
                  detail="Detected rain prevents irrigation requests."
                />
                <DecisionRow
                  icon={<Waves className="h-4 w-4" />}
                  label="Tank protection"
                  value={waterStatus}
                  detail={
                    typeof device.waterLevel === "number"
                      ? `Reported level ${Math.round(device.waterLevel)}%.`
                      : "Waiting for a real tank packet."
                  }
                />
                <DecisionRow
                  icon={<Lock className="h-4 w-4" />}
                  label="Physical output"
                  value={physicalOutputLocked ? "Protected" : "Enabled"}
                  detail={`Relay ${relayState}; pump ${pumpState}.`}
                />
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <p className="gc2-kicker">Protected test</p>
              <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                Evaluate a manual request
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                This button does not bypass blockers. It routes through the existing
                AppState command decision and visible safety boundary.
              </p>
              <Gc2Button
                onClick={sendProtectedCommand}
                className="mt-5 w-full justify-center"
              >
                <Power aria-hidden="true" className="h-4 w-4" />
                Send protected command
              </Gc2Button>
              <div className="mt-5 border-t border-[var(--gc2-line)] pt-4">
                <p className="gc2-kicker">Last command</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Gc2Status
                    tone={statusTone(device.lastCommandStatus ?? "None")}
                  >
                    {device.lastCommandStatus ?? "None"}
                  </Gc2Status>
                  <span className="text-xs text-[var(--gc2-ink-soft)]">
                    {device.lastCommand ?? "No command recorded"}
                  </span>
                </div>
              </div>
            </Gc2Surface>

            {blockers.length > 0 ? (
              <Gc2Notice
                tone="warning"
                title="Automation blockers are active"
                icon={<AlertTriangle className="h-5 w-5" />}
              >
                {blockers.join(" · ")}
              </Gc2Notice>
            ) : (
              <Gc2Notice
                tone="success"
                title="Visible guards are clear"
                icon={<ShieldCheck className="h-5 w-5" />}
              >
                The web-side policy is ready. Firmware and physical safety still
                remain authoritative for output execution.
              </Gc2Notice>
            )}

            <Gc2Surface className="p-5">
              <p className="gc2-kicker">Policy schedule</p>
              <div className="mt-4 flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                <p className="m-0 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  {automation.quietHoursEnabled
                    ? `Quiet hours run from ${automation.quietHoursStart} to ${automation.quietHoursEnd}.`
                    : "Quiet hours are disabled; other safety guards remain active."}
                </p>
              </div>
              <div className="mt-4 flex items-start gap-3 border-t border-[var(--gc2-line)] pt-4">
                <TimerReset className="mt-0.5 h-5 w-5 text-[var(--gc2-moss)]" />
                <p className="m-0 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  Every successful request must respect a {automation.cooldownMinutes}-minute cooldown.
                </p>
              </div>
            </Gc2Surface>
          </aside>
        </div>
      </div>

      {resetOpen ? (
        <Gc2Dialog
          open
          onClose={() => setResetOpen(false)}
          title="Reset automation policy"
          description="Restore the existing protected defaults for mode, threshold, cooldown, runtime and quiet hours."
          footer={
            <>
              <Gc2Button variant="quiet" onClick={() => setResetOpen(false)}>
                Cancel
              </Gc2Button>
              <Gc2Button variant="danger" onClick={resetPolicy}>
                Reset policy
              </Gc2Button>
            </>
          }
        >
          <Gc2Notice
            tone="warning"
            title="Current policy values will be replaced"
            icon={<RotateCcw className="h-5 w-5" />}
          >
            Device ownership, telemetry and activity history are not changed by
            this reset.
          </Gc2Notice>
        </Gc2Dialog>
      ) : null}
    </Gc2ProtectedShell>
  );
}
