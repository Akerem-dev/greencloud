"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  CloudRain,
  Cpu,
  Droplets,
  Filter,
  Gauge,
  Info,
  Leaf,
  Lock,
  Monitor,
  Radio,
  Search,
  ShieldAlert,
  Sparkles,
  ToggleLeft,
  Trash2,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

import AppShell from "@/components/layout/app-shell";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import {
  type ActivityStatus,
  useAppState,
} from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type ActivityFilter =
  | "All"
  | "Telemetry"
  | "Command"
  | "Safety"
  | "Sensor"
  | "Firebase"
  | "Warning"
  | "Manual"
  | "Completed"
  | "Waiting"
  | "Info";

type Tone = "live" | "safe" | "pending" | "warning";

type ActivityLike = {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus;
  time: string;
};

const FILTERS: ActivityFilter[] = [
  "All",
  "Telemetry",
  "Command",
  "Safety",
  "Sensor",
  "Firebase",
  "Warning",
];

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function statusTone(status: ActivityStatus): Tone {
  if (status === "Completed") return "live";
  if (status === "Manual") return "safe";
  if (status === "Waiting") return "warning";
  if (status === "Skipped") return "pending";
  return "safe";
}

function normalizeText(
  item: Pick<ActivityLike, "title" | "description" | "status">,
) {
  return `${item.title} ${item.description} ${item.status}`.toLowerCase();
}

function getEventCategory(
  item: Pick<ActivityLike, "title" | "description" | "status">,
): ActivityFilter {
  const text = normalizeText(item);

  if (
    text.includes("firebase") ||
    text.includes("sync") ||
    text.includes("uid") ||
    text.includes("workspace")
  ) {
    return "Firebase";
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("soil") ||
    text.includes("raw") ||
    text.includes("sensor")
  ) {
    return "Telemetry";
  }

  if (
    text.includes("watering") ||
    text.includes("command") ||
    text.includes("irrigation") ||
    text.includes("pump")
  ) {
    return "Command";
  }

  if (
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("protected") ||
    text.includes("dry-run")
  ) {
    return "Safety";
  }

  if (
    text.includes("warning") ||
    text.includes("threshold") ||
    text.includes("dry") ||
    text.includes("risk") ||
    text.includes("alert")
  ) {
    return "Warning";
  }

  if (item.status === "Manual") return "Manual";
  if (item.status === "Completed") return "Completed";
  if (item.status === "Waiting") return "Waiting";
  if (item.status === "Info") return "Info";

  return "Info";
}

function getEventIcon(
  item: Pick<ActivityLike, "title" | "description" | "status">,
) {
  const text = normalizeText(item);

  if (
    text.includes("firebase") ||
    text.includes("sync") ||
    text.includes("workspace")
  ) {
    return Radio;
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("soil") ||
    text.includes("raw") ||
    text.includes("sensor")
  ) {
    return Gauge;
  }

  if (
    text.includes("watering") ||
    text.includes("pump") ||
    text.includes("command") ||
    text.includes("irrigation")
  ) {
    return Droplets;
  }

  if (
    text.includes("safe") ||
    text.includes("protected") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("dry-run")
  ) {
    return Lock;
  }

  if (
    text.includes("warning") ||
    text.includes("dry") ||
    text.includes("risk") ||
    text.includes("alert")
  ) {
    return ShieldAlert;
  }

  if (item.status === "Completed") return CheckCircle2;
  if (item.status === "Waiting") return Clock3;
  if (item.status === "Manual") return Zap;

  return Info;
}

function matchesActivityFilter(
  item: Pick<ActivityLike, "title" | "description" | "status">,
  filter: ActivityFilter,
) {
  const text = normalizeText(item);
  const category = getEventCategory(item);

  if (filter === "All") return true;
  if (filter === "Manual") return item.status === "Manual";
  if (filter === "Completed") return item.status === "Completed";
  if (filter === "Waiting") return item.status === "Waiting";
  if (filter === "Info") return item.status === "Info" || category === "Info";

  if (filter === "Telemetry") {
    return (
      category === "Telemetry" ||
      text.includes("esp32") ||
      text.includes("telemetry") ||
      text.includes("moisture") ||
      text.includes("soil") ||
      text.includes("raw")
    );
  }

  if (filter === "Command") {
    return (
      category === "Command" ||
      text.includes("watering") ||
      text.includes("pump") ||
      text.includes("command") ||
      text.includes("irrigation")
    );
  }

  if (filter === "Safety") {
    return (
      category === "Safety" ||
      text.includes("safe") ||
      text.includes("protected") ||
      text.includes("relay") ||
      text.includes("locked") ||
      text.includes("dry-run")
    );
  }

  if (filter === "Sensor") {
    return (
      text.includes("sensor") ||
      text.includes("soil") ||
      text.includes("rain") ||
      text.includes("water tank") ||
      text.includes("button") ||
      text.includes("oled")
    );
  }

  if (filter === "Firebase") {
    return (
      category === "Firebase" ||
      text.includes("firebase") ||
      text.includes("sync") ||
      text.includes("workspace")
    );
  }

  if (filter === "Warning") {
    return (
      category === "Warning" ||
      item.status === "Waiting" ||
      text.includes("warning") ||
      text.includes("dry") ||
      text.includes("risk") ||
      text.includes("alert") ||
      text.includes("threshold")
    );
  }

  return true;
}

function StatusPill({ status }: { status: ActivityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold",
        toneClass(statusTone(status)),
      )}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}

function MiniPill({
  label,
  tone = "pending",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold",
        toneClass(tone),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "group min-w-0 rounded-[28px] border p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.015))]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">
          {label}
        </p>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 transition group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,3vw,3.2rem)] font-semibold leading-none tracking-[-0.07em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
        {detail}
      </p>
    </div>
  );
}

function SideInfoCard({
  icon: Icon,
  title,
  text,
  tone = "pending",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "group rounded-[22px] border p-4 transition duration-300 hover:-translate-y-1",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-black/18 transition group-hover:scale-105">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h4 className="truncate text-base font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
            {title}
          </h4>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  title,
  description,
  unread,
}: {
  title: string;
  description: string;
  unread: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[22px] border p-4 transition duration-300 hover:-translate-y-1",
        unread
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] shadow-[0_0_28px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="line-clamp-1 text-base font-semibold text-[var(--gc-text)]">
          {title}
        </p>

        {unread ? (
          <span className="rounded-full bg-[var(--gc-accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#111708]">
            New
          </span>
        ) : null}
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
        {description}
      </p>
    </div>
  );
}

function EventRow({
  item,
  index,
}: {
  item: ActivityLike;
  index: number;
}) {
  const Icon = getEventIcon(item);
  const category = getEventCategory(item);

  const categoryTone: Tone =
    category === "Warning"
      ? "warning"
      : category === "Safety" || category === "Command"
        ? "safe"
        : category === "Telemetry" || category === "Firebase"
          ? "live"
          : "pending";

  return (
    <div className="relative grid gap-4 rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-1 md:grid-cols-[80px_54px_minmax(0,1fr)_auto]">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
          Time
        </p>
        <p className="mt-3 text-sm font-medium text-[var(--gc-soft)]">
          {item.time}
        </p>
      </div>

      <div className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_24px_var(--gc-glow)]">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <MiniPill label={category} tone={categoryTone} />
          <StatusPill status={item.status} />
        </div>

        <h4 className="mt-3 break-words text-[1.2rem] font-semibold tracking-[-0.045em] text-[var(--gc-text)] sm:text-[1.35rem]">
          {item.title}
        </h4>

        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
          {item.description}
        </p>
      </div>

      <div className="flex items-start md:justify-end">
        <span className="hidden rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--gc-muted)] lg:inline-flex">
          #{index + 1}
        </span>
      </div>
    </div>
  );
}

function ConfirmClearModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="Close clear activity confirmation"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[640px]">
        <GlassCard className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <SectionBadge>Confirm clear</SectionBadge>

              <h3 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Clear activity log?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                This clears the visible stream only. New telemetry, commands,
                safety checks and sync events will continue to appear.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-end gap-3">
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
              Clear log
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const {
    selectedDevice,
    filteredActivity,
    activityFeed,
    notifications,
    searchQuery,
    markAllNotificationsRead,
    clearActivity,
    simulateThresholdEvent,
    startIrrigation,
  } = useAppState();

  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("All");
  const [localQuery, setLocalQuery] = useState("");
  const [limit, setLimit] = useState(8);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState("");

  const sourceActivity = searchQuery.trim() ? filteredActivity : activityFeed;

  const mergedQuery = `${searchQuery} ${localQuery}`.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return sourceActivity.filter((item) => {
      const filterOk = matchesActivityFilter(item, activeFilter);

      const searchOk = mergedQuery
        ? `${item.title} ${item.description} ${item.status} ${item.time}`
            .toLowerCase()
            .includes(mergedQuery)
        : true;

      return filterOk && searchOk;
    });
  }, [sourceActivity, activeFilter, mergedQuery]);

  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, limit);
  }, [filteredItems, limit]);

  const completedCount = sourceActivity.filter(
    (item) => item.status === "Completed",
  ).length;

  const commandCount = sourceActivity.filter((item) =>
    matchesActivityFilter(item, "Command"),
  ).length;

  const warningCount = sourceActivity.filter((item) =>
    matchesActivityFilter(item, "Warning"),
  ).length;

  const firebaseCount = sourceActivity.filter((item) =>
    matchesActivityFilter(item, "Firebase"),
  ).length;

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  function showToast(message: string) {
    setToast(message);
  }

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 2600);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  return (
    <AppShell
      title="GreenCloud Activity"
      subtitle="Live device history, command records, alerts and protected hardware events."
    >
      <div className="w-full space-y-6">
        <GlassCard className="overflow-hidden p-5 sm:p-6 lg:p-7">
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
            <div className="min-w-0">
              <SectionBadge>System timeline</SectionBadge>

              <h2 className="mt-5 max-w-[13ch] text-[clamp(3rem,5.4vw,6.2rem)] font-semibold leading-[0.88] tracking-[-0.09em] text-[var(--gc-text)]">
                Every event, clearly tracked.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                GreenCloud records the full system chain: ESP32 telemetry,
                Firebase sync, protected commands, sensor checks and hardware
                safety updates.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter);
                      setLimit(8);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      activeFilter === filter
                        ? "premium-tab premium-tab-active"
                        : "premium-tab",
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="relative mt-5 max-w-3xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gc-muted)]" />
                <input
                  value={localQuery}
                  onChange={(event) => {
                    setLocalQuery(event.target.value);
                    setLimit(8);
                  }}
                  placeholder="Search telemetry, command, sensor, Firebase..."
                  className="h-[56px] w-full rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] py-3 pl-11 pr-4 text-sm text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_36%,transparent)] focus:bg-white/[0.045] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <MiniPill label="Live device history" tone="live" />
                <MiniPill label="Protected command chain" tone="safe" />
                <MiniPill label="Sensor awareness" tone="warning" />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <MetricCard
                label="Completed"
                value={completedCount}
                detail="Handled system events."
                icon={CheckCircle2}
                tone="live"
              />

              <MetricCard
                label="Commands"
                value={commandCount}
                detail="Watering and pump actions."
                icon={Droplets}
                tone="safe"
              />

              <MetricCard
                label="Warnings"
                value={warningCount}
                detail="Dry-risk and sensor checks."
                icon={ShieldAlert}
                tone={warningCount > 0 ? "warning" : "pending"}
              />

              <MetricCard
                label="Firebase"
                value={firebaseCount}
                detail="Workspace sync records."
                icon={Radio}
                tone="safe"
              />
            </div>
          </div>
        </GlassCard>

        <section className="grid items-start gap-6 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="min-w-0 space-y-6">
            <GlassCard className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionBadge>Notifications</SectionBadge>

                <button
                  type="button"
                  onClick={() => {
                    markAllNotificationsRead();
                    showToast("Notifications marked as read.");
                  }}
                  className="premium-btn-secondary rounded-full px-4 py-2 text-sm"
                >
                  Mark all read
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <MiniPill
                  label={`${unreadNotifications} unread`}
                  tone={unreadNotifications > 0 ? "warning" : "live"}
                />
                <MiniPill label="Workspace alerts" tone="safe" />
              </div>

              <div className="gc-scrollbar mt-6 max-h-[340px] space-y-3 overflow-y-auto pr-2">
                {notifications.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                    <p className="text-base font-semibold text-[var(--gc-text)]">
                      No notifications.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                      Alerts and workspace notices will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((item) => (
                    <NotificationItem
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      unread={!item.read}
                    />
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6">
              <SectionBadge>Event layers</SectionBadge>

              <div className="mt-5 grid gap-3">
                <SideInfoCard
                  icon={Cpu}
                  title="ESP32 telemetry"
                  text="Moisture, RAW value, Wi-Fi signal and live device state."
                  tone="live"
                />

                <SideInfoCard
                  icon={Lock}
                  title="Protected commands"
                  text="Watering requests are logged while pump output remains guarded."
                  tone="safe"
                />

                <SideInfoCard
                  icon={Leaf}
                  title="Sensor checks"
                  text="Unstable readings, dry-risk and missing packets are highlighted."
                  tone="warning"
                />

                <SideInfoCard
                  icon={Filter}
                  title="Clean filters"
                  text="Inspect command, safety, sensor and Firebase layers separately."
                  tone="pending"
                />
              </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6">
              <SectionBadge>Hardware signals</SectionBadge>

              <div className="mt-5 grid gap-3">
                <SideInfoCard
                  icon={CloudRain}
                  title="Rain"
                  text="Rain detection can pause watering."
                />
                <SideInfoCard
                  icon={Waves}
                  title="Water tank"
                  text="Tank state protects the pump."
                />
                <SideInfoCard
                  icon={ToggleLeft}
                  title="Button"
                  text="Local manual input can be tracked."
                />
                <SideInfoCard
                  icon={Monitor}
                  title="OLED"
                  text="On-device display state is visible."
                />
              </div>
            </GlassCard>
          </div>

          <div className="min-w-0 space-y-6">
            <GlassCard className="p-5 sm:p-6 lg:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <SectionBadge>Current timeline</SectionBadge>

                  <h3 className="mt-4 text-[clamp(2.6rem,4vw,4.5rem)] font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                    Event stream
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                    Showing {visibleItems.length} of {filteredItems.length} matching
                    events.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLimit((prev) => prev + 6)}
                    disabled={visibleItems.length >= filteredItems.length}
                    className="premium-btn-secondary rounded-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Show more
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <MiniPill label={selectedDevice.name} tone="safe" />
                <MiniPill label={selectedDevice.status} tone="live" />
                <MiniPill label={`${selectedDevice.moisture}% moisture`} tone="pending" />
              </div>

              <div className="gc-scrollbar mt-6 max-h-[880px] space-y-4 overflow-y-auto pr-2">
                {visibleItems.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-6">
                    <SectionBadge>No matching events</SectionBadge>

                    <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                      Nothing matches this filter.
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--gc-soft)]">
                      Change the filter, clear the search, or create a controlled
                      rule-check event.
                    </p>
                  </div>
                ) : (
                  visibleItems.map((item, index) => (
                    <EventRow key={item.id} item={item} index={index} />
                  ))
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm"
                >
                  Dashboard
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    simulateThresholdEvent(selectedDevice.id);
                    showToast("Rule-check event created.");
                  }}
                  className="premium-btn-secondary inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm"
                >
                  Create rule check
                  <ShieldAlert className="h-[18px] w-[18px]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    startIrrigation(selectedDevice.id);
                    showToast("Protected watering command sent.");
                  }}
                  className="premium-btn inline-flex items-center gap-2 rounded-[20px] px-5 py-3 text-sm font-semibold"
                >
                  Send command
                  <Droplets className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-6 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--gc-text)]">
                  <Sparkles className="h-4 w-4 text-[var(--gc-accent-2)]" />
                  GreenCloud event history
                </p>

                <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                  This stream connects the full product flow: dashboard command,
                  Firebase state, ESP32 handling, protected output and sensor
                  response.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <SectionBadge>Live insight</SectionBadge>
                  <h3 className="mt-4 text-[clamp(2rem,3vw,3.4rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                    System confidence
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                    High-level readout of the current activity health state.
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] px-4 py-2">
                  <BellRing className="h-4 w-4 text-[var(--gc-accent-2)]" />
                  <span className="text-sm font-semibold text-[var(--gc-text)]">
                    Live monitoring
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Workspace"
                  value="Ready"
                  detail="Core event ingestion is active."
                  icon={CheckCircle2}
                  tone="live"
                />
                <MetricCard
                  label="Protection"
                  value="Guarded"
                  detail="Protected output stays under control."
                  icon={Lock}
                  tone="safe"
                />
                <MetricCard
                  label="Dry risk"
                  value={warningCount > 0 ? "Watch" : "Stable"}
                  detail="Sensor and safety checks remain visible."
                  icon={ShieldAlert}
                  tone={warningCount > 0 ? "warning" : "pending"}
                />
              </div>
            </GlassCard>
          </div>
        </section>

        {confirmClearOpen ? (
          <ConfirmClearModal
            onCancel={() => setConfirmClearOpen(false)}
            onConfirm={() => {
              clearActivity();
              setConfirmClearOpen(false);
              setLimit(8);
              showToast("Activity stream cleared.");
            }}
          />
        ) : null}

        {toast ? (
          <div className="fixed bottom-5 right-5 z-[140] w-[min(420px,calc(100vw-40px))]">
            <div className="gc-toast rounded-[22px] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-[var(--gc-accent-2)]" />
                {toast}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}