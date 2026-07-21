"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  Droplets,
  Gauge,
  Leaf,
  Power,
  Radio,
  RefreshCw,
  ShieldCheck,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type DeckTone = "live" | "safe" | "pending" | "warning" | "offline";

type SignalCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: DeckTone;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toneClass(tone: DeckTone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_10%,transparent)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,transparent)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_68%,transparent)] bg-black/20";
}

function SignalCard({ label, value, detail, icon: Icon, tone }: SignalCardProps) {
  return (
    <div className={cn("rounded-[20px] border p-4", toneClass(tone))}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[var(--gc-accent-2)]" />
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
        {detail}
      </p>
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: DeckTone;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_60%,transparent)] bg-black/15 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            toneClass(tone),
          )}
        >
          <Icon className="h-4 w-4 text-[var(--gc-accent-2)]" />
        </span>
        <span className="truncate text-sm font-medium text-[var(--gc-soft)]">
          {label}
        </span>
      </div>
      <span className="max-w-[48%] truncate text-right text-sm font-semibold text-[var(--gc-text)]">
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  children,
  icon: Icon,
  onClick,
  disabled,
  primary = false,
}: {
  children: ReactNode;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45",
        primary ? "premium-btn" : "premium-btn-secondary",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

export default function LiveOperationsDeck() {
  const {
    devices,
    selectedDevice,
    activityFeed,
    automation,
    unreadNotifications,
    startIrrigation,
    refreshTelemetry,
    simulateThresholdEvent,
  } = useAppState();

  const [open, setOpen] = useState(true);
  const [lastAction, setLastAction] = useState("Operations deck ready.");

  const hasDevice = devices.length > 0;
  const moisture = clampPercent(selectedDevice.moisture);
  const signal = clampPercent(selectedDevice.signal);
  const protectedOutput =
    selectedDevice.safeMode ?? !(selectedDevice.pumpEnabled ?? false);
  const online = hasDevice && selectedDevice.status === "Online";
  const syncing = hasDevice && selectedDevice.status === "Syncing";
  const telemetryReady = hasDevice && (online || syncing || signal > 0);

  const recentEvent = useMemo(() => {
    return (
      activityFeed.find((item) => item.deviceId === selectedDevice.id) ??
      activityFeed[0] ??
      null
    );
  }, [activityFeed, selectedDevice.id]);

  const moistureTone: DeckTone = !telemetryReady
    ? "pending"
    : moisture <= automation.moistureThreshold
      ? "warning"
      : "live";

  const deviceTone: DeckTone = !hasDevice
    ? "pending"
    : selectedDevice.status === "Online"
      ? "live"
      : selectedDevice.status === "Offline"
        ? "offline"
        : "pending";

  const runAction = (label: string, action: () => void) => {
    action();
    setLastAction(label);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex w-[min(430px,calc(100vw-2rem))] flex-col items-end gap-3">
      {open ? (
        <aside className="premium-noise pointer-events-auto max-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--gc-bg)_96%,black),color-mix(in_srgb,var(--gc-surface)_90%,black))] shadow-[0_28px_90px_rgba(0,0,0,0.56),0_0_40px_var(--gc-glow)] backdrop-blur-2xl">
          <div className="relative overflow-hidden border-b border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--gc-accent)_18%,transparent),transparent_48%),radial-gradient(circle_at_95%_90%,color-mix(in_srgb,var(--gc-accent-2)_13%,transparent),transparent_42%)]" />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--gc-accent)] shadow-[0_0_16px_var(--gc-glow-strong)]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gc-accent-2)]">
                    Live operations
                  </p>
                </div>
                <h2 className="mt-3 truncate text-3xl font-semibold tracking-[-0.065em] text-[var(--gc-text)]">
                  {hasDevice ? selectedDevice.name : "Pairing required"}
                </h2>
                <p className="mt-1 truncate text-sm text-[var(--gc-soft)]">
                  {hasDevice ? selectedDevice.place : "Connect an ESP32 to unlock live control."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="premium-btn-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                aria-label="Close live operations deck"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="gc-scrollbar max-h-[calc(100vh-9rem)] overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
              <div
                className="relative flex aspect-square items-center justify-center rounded-full p-[10px]"
                style={{
                  background: `conic-gradient(var(--gc-accent) ${moisture * 3.6}deg, color-mix(in srgb, var(--gc-border) 46%, transparent) 0deg)`,
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_96%,black)] shadow-[inset_0_0_30px_rgba(0,0,0,0.45)]">
                  <Droplets className="h-5 w-5 text-[var(--gc-accent-2)]" />
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.08em] text-[var(--gc-text)]">
                    {telemetryReady ? `${moisture}%` : "—"}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                    Soil moisture
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <SignalCard
                  label="Controller"
                  value={hasDevice ? selectedDevice.status : "Standby"}
                  detail={hasDevice ? "Private device workspace." : "No paired node yet."}
                  icon={Radio}
                  tone={deviceTone}
                />
                <SignalCard
                  label="Protection"
                  value={protectedOutput ? "Guarded" : "Enabled"}
                  detail={protectedOutput ? "Relay output remains protected." : "Pump output is enabled."}
                  icon={ShieldCheck}
                  tone={protectedOutput ? "safe" : "warning"}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SignalCard
                label="Wi-Fi signal"
                value={telemetryReady ? `${signal}%` : "Waiting"}
                detail="Latest device telemetry link."
                icon={Wifi}
                tone={telemetryReady ? "live" : "pending"}
              />
              <SignalCard
                label="Dry threshold"
                value={`${automation.moistureThreshold}%`}
                detail={`${automation.pumpDurationSeconds}s protected command window.`}
                icon={Gauge}
                tone={moistureTone}
              />
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
                  Protection matrix
                </p>
                <span className="rounded-full border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-black/15 px-3 py-1 text-[10px] font-semibold text-[var(--gc-soft)]">
                  {unreadNotifications} alerts
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                <StatusRow
                  icon={Power}
                  label="Pump output"
                  value={selectedDevice.pumpState ?? (protectedOutput ? "Protected" : "Ready")}
                  tone={protectedOutput ? "safe" : "warning"}
                />
                <StatusRow
                  icon={Leaf}
                  label="Soil sensor"
                  value={selectedDevice.sensorStatus ?? (telemetryReady ? "Live" : "Waiting")}
                  tone={moistureTone}
                />
                <StatusRow
                  icon={Zap}
                  label="Last command"
                  value={selectedDevice.lastCommandStatus ?? "Ready"}
                  tone={selectedDevice.lastCommandStatus === "Blocked" ? "warning" : "pending"}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ActionButton
                icon={Droplets}
                disabled={!hasDevice}
                primary
                onClick={() =>
                  runAction("Protected watering command sent.", () =>
                    startIrrigation(selectedDevice.id),
                  )
                }
              >
                Safe run
              </ActionButton>
              <ActionButton
                icon={RefreshCw}
                disabled={!hasDevice}
                onClick={() =>
                  runAction("Telemetry refresh requested.", () =>
                    refreshTelemetry(selectedDevice.id),
                  )
                }
              >
                Refresh
              </ActionButton>
              <ActionButton
                icon={Activity}
                disabled={!hasDevice}
                onClick={() =>
                  runAction("Moisture rule evaluated.", () =>
                    simulateThresholdEvent(selectedDevice.id),
                  )
                }
              >
                Evaluate
              </ActionButton>
            </div>

            <div className="mt-5 rounded-[20px] border border-[color-mix(in_srgb,var(--gc-accent-2)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_7%,transparent)] p-4">
              <div className="flex items-start gap-3">
                {recentEvent ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc-accent)]" />
                ) : (
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc-accent-2)]" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--gc-text)]">
                    {recentEvent?.title ?? "No device activity yet"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--gc-soft)]">
                    {recentEvent?.description ?? lastAction}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="premium-noise pointer-events-auto group relative overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-bg)_94%,black),color-mix(in_srgb,var(--gc-accent)_10%,black))] px-4 py-3 text-left shadow-[0_18px_52px_rgba(0,0,0,0.44),0_0_28px_var(--gc-glow)] backdrop-blur-xl transition hover:-translate-y-0.5"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_20px_var(--gc-glow)]">
              <Radio className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                Dashboard upgrade
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-[var(--gc-text)]">
                Live operations · {hasDevice ? selectedDevice.status : "standby"}
              </span>
            </span>
            {unreadNotifications > 0 ? (
              <span className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--gc-accent)] px-1.5 text-[10px] font-bold text-[#11160d]">
                <Bell className="mr-1 h-3 w-3" />
                {unreadNotifications}
              </span>
            ) : null}
          </span>
        </button>
      )}
    </div>
  );
}
