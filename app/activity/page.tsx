"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
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

const activityFilters: ActivityFilter[] = [
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
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
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

function StatusPill({ status }: { status: ActivityStatus }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(statusTone(status)),
      )}
    >
      <span className="truncate">{status}</span>
    </span>
  );
}

function MiniPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(tone),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function SummaryTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[26px] border p-5",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,3vw,3rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </div>
  );
}

function InfoCard({
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
        "min-w-0 rounded-[22px] border p-4",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <h4 className="truncate text-base font-semibold tracking-[-0.03em] text-[var(--gc-text)]">
            {title}
          </h4>

          <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function normalizeText(
  item: Pick<ActivityLike, "title" | "description" | "status">,
) {
  return `${item.title} ${item.description} ${item.status}`.toLowerCase();
}

function getEventIcon(
  item: Pick<ActivityLike, "title" | "description" | "status">,
) {
  const text = normalizeText(item);

  if (
    text.includes("firebase") ||
    text.includes("sync") ||
    text.includes("uid") ||
    text.includes("workspace")
  ) {
    return Radio;
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("raw") ||
    text.includes("soil") ||
    text.includes("sensor")
  ) {
    return Gauge;
  }

  if (
    text.includes("irrigation") ||
    text.includes("watering") ||
    text.includes("pump") ||
    text.includes("command")
  ) {
    return Droplets;
  }

  if (
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("dry-run") ||
    text.includes("protected")
  ) {
    return Lock;
  }

  if (
    text.includes("warning") ||
    text.includes("threshold") ||
    text.includes("dry") ||
    text.includes("risk") ||
    text.includes("alert")
  ) {
    return ShieldAlert;
  }

  if (item.status === "Completed") return CheckCircle2;
  if (item.status === "Manual") return Droplets;
  if (item.status === "Waiting") return Clock3;

  return Info;
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
    text.includes("raw") ||
    text.includes("soil") ||
    text.includes("sensor")
  ) {
    return "Telemetry";
  }

  if (
    text.includes("irrigation") ||
    text.includes("watering") ||
    text.includes("pump") ||
    text.includes("command")
  ) {
    return "Command";
  }

  if (
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("dry-run") ||
    text.includes("protected")
  ) {
    return "Safety";
  }

  if (
    text.includes("warning") ||
    text.includes("threshold") ||
    text.includes("dry") ||
    text.includes("risk") ||
    text.includes("alert") ||
    text.includes("sensor check")
  ) {
    return "Warning";
  }

  if (item.status === "Manual") return "Manual";
  if (item.status === "Completed") return "Completed";
  if (item.status === "Waiting") return "Waiting";
  if (item.status === "Info") return "Info";

  return "Info";
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
      text.includes("moisture") ||
      text.includes("raw") ||
      text.includes("soil")
    );
  }

  if (filter === "Command") {
    return (
      category === "Command" ||
      text.includes("command") ||
      text.includes("irrigation") ||
      text.includes("watering") ||
      text.includes("pump")
    );
  }

  if (filter === "Safety") {
    return (
      category === "Safety" ||
      text.includes("safe") ||
      text.includes("relay") ||
      text.includes("locked") ||
      text.includes("dry-run") ||
      text.includes("protected")
    );
  }

  if (filter === "Sensor") {
    return (
      text.includes("sensor") ||
      text.includes("soil") ||
      text.includes("rain") ||
      text.includes("water") ||
      text.includes("button") ||
      text.includes("oled")
    );
  }

  if (filter === "Firebase") {
    return (
      category === "Firebase" ||
      text.includes("firebase") ||
      text.includes("sync") ||
      text.includes("uid")
    );
  }

  if (filter === "Warning") {
    return (
      item.status === "Waiting" ||
      category === "Warning" ||
      text.includes("warning") ||
      text.includes("threshold") ||
      text.includes("dry") ||
      text.includes("risk") ||
      text.includes("alert") ||
      text.includes("sensor check")
    );
  }

  return true;
}

function ConfirmClearModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-[8px]">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCancel}
        aria-label="Close clear activity confirmation"
      />

      <div className="absolute inset-x-4 top-4 mx-auto w-full max-w-[620px]">
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <SectionBadge>Confirm clear</SectionBadge>

              <h3 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                Clear activity log?
              </h3>

              <p className="mt-3 text-sm leading-7 text-[var(--gc-soft)]">
                This clears the visible stream only. New telemetry, commands,
                safety checks and pairing events will continue to appear.
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

  const [mode, setMode] = useState<ActivityFilter>("All");
  const [limit, setLimit] = useState(8);
  const [localQuery, setLocalQuery] = useState("");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState("");

  const sourceActivity = searchQuery.trim() ? filteredActivity : activityFeed;

  const visibleItems = useMemo(() => {
    const query = `${searchQuery} ${localQuery}`.trim().toLowerCase();

    const byFilter = sourceActivity.filter((item) =>
      matchesActivityFilter(item, mode),
    );

    const bySearch =
      query.length === 0
        ? byFilter
        : byFilter.filter((item) =>
            `${item.title} ${item.description} ${item.status} ${item.time}`
              .toLowerCase()
              .includes(query),
          );

    return bySearch.slice(0, limit);
  }, [sourceActivity, mode, limit, searchQuery, localQuery]);

  const filteredCount = useMemo(() => {
    const query = `${searchQuery} ${localQuery}`.trim().toLowerCase();

    return sourceActivity.filter((item) => {
      const passFilter = matchesActivityFilter(item, mode);

      const passSearch = query
        ? `${item.title} ${item.description} ${item.status} ${item.time}`
            .toLowerCase()
            .includes(query)
        : true;

      return passFilter && passSearch;
    }).length;
  }, [sourceActivity, mode, searchQuery, localQuery]);

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

    window.setTimeout(() => {
      setToast("");
    }, 2600);
  }

  return (
    <AppShell
      title="GreenCloud Activity"
      subtitle="Live device history, command records, alerts and protected hardware events."
    >
      <div className="space-y-6">
        <GlassCard className="p-6">
          <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
            <div className="min-w-0">
              <SectionBadge>System timeline</SectionBadge>

              <h2 className="mt-5 max-w-[13ch] text-[clamp(2.8rem,4.8vw,5.4rem)] font-semibold leading-[0.9] tracking-[-0.08em] text-[var(--gc-text)]">
                Every event, clearly tracked.
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                GreenCloud records the important system chain: ESP32 telemetry,
                Firebase sync, protected commands, sensor checks and hardware
                safety updates.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {activityFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setLimit(8);
                    }}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold",
                      mode === item
                        ? "premium-tab premium-tab-active"
                        : "premium-tab",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="relative mt-5 max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gc-muted)]" />

                <input
                  value={localQuery}
                  onChange={(event) => {
                    setLocalQuery(event.target.value);
                    setLimit(8);
                  }}
                  placeholder="Search telemetry, command, sensor, Firebase..."
                  className="h-[52px] w-full rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] py-3 pl-11 pr-4 text-sm text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_36%,transparent)] focus:bg-white/[0.045] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)]"
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SummaryTile
                label="Completed"
                value={completedCount}
                detail="Handled system events."
                icon={CheckCircle2}
                tone="live"
              />

              <SummaryTile
                label="Commands"
                value={commandCount}
                detail="Watering and pump actions."
                icon={Droplets}
                tone="safe"
              />

              <SummaryTile
                label="Warnings"
                value={warningCount}
                detail="Dry-risk or sensor checks."
                icon={ShieldAlert}
                tone={warningCount > 0 ? "warning" : "pending"}
              />

              <SummaryTile
                label="Firebase"
                value={firebaseCount}
                detail="Workspace sync records."
                icon={Radio}
                tone="safe"
              />
            </div>
          </div>
        </GlassCard>

        <section className="grid items-start gap-6 2xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
          <div className="min-w-0 space-y-6">
            <GlassCard className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
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

              <div className="gc-scrollbar mt-6 max-h-[360px] space-y-3 overflow-y-auto pr-2">
                {notifications.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                    <p className="text-base font-semibold text-[var(--gc-text)]">
                      No notifications.
                    </p>

                    <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                      Alerts and device notices will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-[22px] border p-4",
                        item.read
                          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
                          : "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] shadow-[0_0_30px_var(--gc-glow)]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="line-clamp-1 text-base font-semibold text-[var(--gc-text)]">
                          {item.title}
                        </p>

                        {!item.read ? (
                          <span className="rounded-full bg-[var(--gc-accent)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#111708]">
                            New
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                        {item.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionBadge>Event layers</SectionBadge>

              <div className="mt-6 grid gap-3">
                <InfoCard
                  icon={Cpu}
                  title="ESP32 telemetry"
                  text="Moisture, RAW value, Wi-Fi signal and live device state."
                  tone="live"
                />

                <InfoCard
                  icon={Lock}
                  title="Protected commands"
                  text="Watering requests are recorded while pump output remains guarded."
                  tone="safe"
                />

                <InfoCard
                  icon={Leaf}
                  title="Sensor checks"
                  text="Unstable readings, dry-risk and missing packets are highlighted."
                  tone="warning"
                />

                <InfoCard
                  icon={Filter}
                  title="Clean filters"
                  text="Inspect command, safety, sensor and Firebase layers separately."
                />
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <SectionBadge>Hardware signals</SectionBadge>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                <InfoCard
                  icon={CloudRain}
                  title="Rain"
                  text="Rain detection can pause watering."
                />

                <InfoCard
                  icon={Waves}
                  title="Water tank"
                  text="Tank state protects the pump."
                />

                <InfoCard
                  icon={ToggleLeft}
                  title="Button"
                  text="Local manual input can be tracked."
                />

                <InfoCard
                  icon={Monitor}
                  title="OLED"
                  text="On-device display state is visible."
                />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="min-w-0 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <SectionBadge>Current timeline</SectionBadge>

                <h3 className="mt-4 text-[clamp(2.2rem,3vw,3.7rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Event stream
                </h3>

                <p className="mt-2 text-sm leading-7 text-[var(--gc-soft)]">
                  Showing {visibleItems.length} of {filteredCount} matching
                  events.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLimit((prev) => prev + 6)}
                  disabled={visibleItems.length >= filteredCount}
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

            <div className="gc-scrollbar mt-6 max-h-[780px] space-y-4 overflow-y-auto pr-2">
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
                visibleItems.map((item, index) => {
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
                    <div
                      key={item.id}
                      className="relative grid gap-4 rounded-[26px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5 md:grid-cols-[76px_48px_minmax(0,1fr)_auto]"
                    >
                      {index < visibleItems.length - 1 ? (
                        <div className="pointer-events-none absolute left-[110px] top-[72px] hidden h-[calc(100%-44px)] w-px bg-[color-mix(in_srgb,var(--gc-border)_88%,transparent)] md:block" />
                      ) : null}

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                          Time
                        </p>

                        <p className="mt-3 text-sm font-medium text-[var(--gc-soft)]">
                          {item.time}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_10%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_24px_var(--gc-glow)]">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <MiniPill label={category} tone={categoryTone} />
                          <StatusPill status={item.status} />
                        </div>

                        <h4 className="mt-3 break-words text-xl font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                          {item.title}
                        </h4>

                        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--gc-soft)]">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-start md:justify-end">
                        <div className="hidden rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-3 py-1.5 text-xs text-[var(--gc-muted)] lg:block">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  );
                })
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