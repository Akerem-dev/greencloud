"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Cpu,
  Droplets,
  Lock,
  Radio,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type ActivityItem,
  type ActivityStatus,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input, Gc2Select } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status, type Gc2StatusTone } from "@/components/ui/gc2-status";
import { Gc2Metric, Gc2SectionHeading, Gc2Surface } from "@/components/ui/gc2-surface";
import { Gc2Table } from "@/components/ui/gc2-table";


type EventKind =
  | "telemetry"
  | "command"
  | "safety"
  | "workspace"
  | "attention"
  | "system";

type EventFilter =
  | "All"
  | "Telemetry"
  | "Command"
  | "Safety"
  | "Workspace"
  | "Attention"
  | "Manual";

const FILTERS: EventFilter[] = [
  "All",
  "Telemetry",
  "Command",
  "Safety",
  "Workspace",
  "Attention",
  "Manual",
];

function activityText(item: ActivityItem) {
  return `${item.title} ${item.description} ${item.body ?? ""} ${item.status}`.toLowerCase();
}

function eventKind(item: ActivityItem): EventKind {
  const text = activityText(item);

  if (
    text.includes("warning") ||
    text.includes("risk") ||
    text.includes("blocked") ||
    text.includes("alert") ||
    text.includes("failed") ||
    text.includes("rejected") ||
    text.includes("timeout")
  ) {
    return "attention";
  }

  if (
    text.includes("watering") ||
    text.includes("irrigation") ||
    text.includes("pump") ||
    text.includes("command")
  ) {
    return "command";
  }

  if (
    text.includes("protected") ||
    text.includes("safe") ||
    text.includes("relay") ||
    text.includes("locked") ||
    text.includes("dry-run")
  ) {
    return "safety";
  }

  if (
    text.includes("firebase") ||
    text.includes("workspace") ||
    text.includes("sync") ||
    text.includes("uid") ||
    text.includes("pairing")
  ) {
    return "workspace";
  }

  if (
    text.includes("telemetry") ||
    text.includes("moisture") ||
    text.includes("soil") ||
    text.includes("sensor") ||
    text.includes("raw") ||
    text.includes("signal")
  ) {
    return "telemetry";
  }

  return "system";
}

function kindLabel(kind: EventKind) {
  if (kind === "telemetry") return "Telemetry";
  if (kind === "command") return "Command";
  if (kind === "safety") return "Safety";
  if (kind === "workspace") return "Workspace";
  if (kind === "attention") return "Attention";
  return "System";
}

function kindTone(kind: EventKind): Gc2StatusTone {
  if (kind === "telemetry" || kind === "workspace") return "info";
  if (kind === "command") return "success";
  if (kind === "safety") return "neutral";
  if (kind === "attention") return "warning";
  return "neutral";
}

function statusTone(status: ActivityStatus): Gc2StatusTone {
  if (status === "Completed") return "success";
  if (status === "Waiting") return "warning";
  if (status === "Manual") return "info";
  if (status === "Skipped") return "neutral";
  return "neutral";
}

function matchesFilter(item: ActivityItem, filter: EventFilter) {
  if (filter === "All") return true;
  if (filter === "Manual") return item.status === "Manual";
  return kindLabel(eventKind(item)) === filter;
}

function BoundaryRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 border-b border-[var(--gc2-line)] py-4 last:border-b-0">
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

export default function Gc2ActivityLog() {
  const {
    activityFeed,
    filteredActivity,
    devices,
    selectedDevice,
    notifications,
    searchQuery,
    markAllNotificationsRead,
    clearActivity,
    simulateThresholdEvent,
  } = useAppState();

  const [activeFilter, setActiveFilter] = useState<EventFilter>("All");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [localQuery, setLocalQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const [clearOpen, setClearOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const sourceActivity = searchQuery.trim() ? filteredActivity : activityFeed;
  const hasRealDevice = devices.some((device) => device.id === selectedDevice.id);

  const deviceById = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices],
  );

  const filteredItems = useMemo(() => {
    const query = localQuery.trim().toLowerCase();

    return sourceActivity.filter((item) => {
      const device = item.deviceId ? deviceById.get(item.deviceId) : undefined;
      const matchesDevice = deviceFilter === "all" || item.deviceId === deviceFilter;
      const matchesKind = matchesFilter(item, activeFilter);
      const searchable = `${item.title} ${item.description} ${item.body ?? ""} ${item.status} ${item.time} ${item.deviceId ?? ""} ${device?.name ?? ""} ${device?.place ?? ""}`.toLowerCase();
      const matchesQuery = query ? searchable.includes(query) : true;

      return matchesDevice && matchesKind && matchesQuery;
    });
  }, [activeFilter, deviceById, deviceFilter, localQuery, sourceActivity]);

  const visibleItems = filteredItems.slice(0, limit);
  const commandCount = sourceActivity.filter((item) => eventKind(item) === "command").length;
  const attentionCount = sourceActivity.filter((item) => eventKind(item) === "attention").length;
  const unreadCount = notifications.filter((item) => !item.read).length;

  function resetResults() {
    setLimit(12);
  }

  function createRuleCheck() {
    if (!hasRealDevice) return;
    simulateThresholdEvent(selectedDevice.id);
    setFeedback(`Rule-check event created for ${selectedDevice.name}.`);
  }

  function confirmClear() {
    clearActivity();
    setClearOpen(false);
    setLimit(12);
    setFeedback("Workspace activity history cleared.");
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker="Audit and operations"
          title="Every trusted operation, in one record."
          description="Review device telemetry, protected commands, workspace synchronization and safety decisions without inventing events that were never recorded."
          actions={
            <>
              <Gc2LinkButton href="/dashboard" variant="quiet">
                Dashboard
              </Gc2LinkButton>
              <Gc2LinkButton href="/devices" variant="secondary">
                Devices
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Gc2LinkButton>
            </>
          }
        />

        {feedback ? (
          <Gc2Notice tone="success" title="Operations record updated" icon={<CheckCircle2 className="h-5 w-5" />}>
            {feedback}
          </Gc2Notice>
        ) : null}

        <Gc2Surface tone="raised" className="overflow-hidden p-0">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)] lg:items-end">
            <div>
              <p className="gc2-kicker">Workspace record</p>
              <h2 className="gc2-heading-md mt-2">Operations ledger</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Global search is respected, while local event and device filters narrow this page only.
              </p>

              <div className="mt-5 flex flex-wrap gap-2" aria-label="Activity event filters">
                {FILTERS.map((filter) => (
                  <Gc2Button
                    key={filter}
                    variant={activeFilter === filter ? "primary" : "quiet"}
                    aria-pressed={activeFilter === filter}
                    onClick={() => {
                      setActiveFilter(filter);
                      resetResults();
                    }}
                  >
                    {filter}
                  </Gc2Button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Gc2Metric label="Recorded events" value={sourceActivity.length} detail="Actual AppState records" />
              <Gc2Metric label="Commands" value={commandCount} detail="Irrigation and pump actions" />
              <Gc2Metric label="Attention" value={attentionCount} detail="Blocked, failed or warning events" />
              <Gc2Metric label="Unread" value={unreadCount} detail="Workspace notifications" />
            </div>
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <Gc2Surface className="col-span-12 overflow-hidden p-0 lg:col-span-9">
            <div className="grid gap-4 border-b border-[var(--gc2-line)] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-end">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute bottom-3.5 left-3.5 h-4 w-4 text-[var(--gc2-ink-muted)]" />
                <Gc2Input
                  label="Search records"
                  value={localQuery}
                  onChange={(event) => {
                    setLocalQuery(event.target.value);
                    resetResults();
                  }}
                  placeholder="Event, device, status or description"
                  className="pl-10"
                />
              </div>

              <Gc2Select
                label="Device scope"
                value={deviceFilter}
                onChange={(event) => {
                  setDeviceFilter(event.target.value);
                  resetResults();
                }}
              >
                <option value="all">All workspace records</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} · {device.place}
                  </option>
                ))}
              </Gc2Select>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Gc2Button
                  variant="secondary"
                  disabled={!hasRealDevice}
                  onClick={createRuleCheck}
                >
                  Create rule check
                </Gc2Button>
                <Gc2Button
                  variant="danger"
                  disabled={activityFeed.length === 0}
                  onClick={() => setClearOpen(true)}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Clear log
                </Gc2Button>
              </div>
            </div>

            {visibleItems.length > 0 ? (
              <>
                <Gc2Table caption="GreenCloud auditable operations ledger">
                  <thead>
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Operation</th>
                      <th scope="col">Device</th>
                      <th scope="col">Layer</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => {
                      const kind = eventKind(item);
                      const device = item.deviceId ? deviceById.get(item.deviceId) : undefined;

                      return (
                        <tr key={item.id}>
                          <td className="gc2-data whitespace-nowrap text-xs">{item.time}</td>
                          <td>
                            <span className="block font-bold text-[var(--gc2-ink)]">{item.title}</span>
                            <span className="mt-1 block max-w-xl text-xs leading-5 text-[var(--gc2-ink-soft)]">
                              {item.description}
                            </span>
                          </td>
                          <td>
                            {device ? (
                              <Link
                                href={`/devices/${encodeURIComponent(device.id)}`}
                                className="font-bold text-[var(--gc2-moss-strong)] underline-offset-4 hover:underline"
                              >
                                {device.name}
                              </Link>
                            ) : item.deviceId ? (
                              <span className="gc2-data text-xs text-[var(--gc2-ink-muted)]">{item.deviceId}</span>
                            ) : (
                              <span className="text-sm text-[var(--gc2-ink-soft)]">Workspace</span>
                            )}
                          </td>
                          <td><Gc2Status tone={kindTone(kind)}>{kindLabel(kind)}</Gc2Status></td>
                          <td><Gc2Status tone={statusTone(item.status)}>{item.status}</Gc2Status></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Gc2Table>

                <div className="flex flex-col gap-3 border-t border-[var(--gc2-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="m-0 text-xs text-[var(--gc2-ink-muted)]">
                    Showing {visibleItems.length} of {filteredItems.length} matching records.
                  </p>
                  <Gc2Button
                    variant="quiet"
                    disabled={visibleItems.length >= filteredItems.length}
                    onClick={() => setLimit((current) => current + 12)}
                  >
                    Show more
                  </Gc2Button>
                </div>
              </>
            ) : (
              <div className="p-6 sm:p-8">
                <Gc2Notice tone="info" title="No matching operations" icon={<Clock3 className="h-5 w-5" />}>
                  Change the local filters or wait for a real telemetry, pairing, safety or command event. GreenCloud does not fabricate placeholder history.
                </Gc2Notice>
              </div>
            )}
          </Gc2Surface>

          <div className="col-span-12 grid gap-5 lg:col-span-3">
            <Gc2Surface className="overflow-hidden p-0">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--gc2-line)] p-5">
                <div>
                  <p className="gc2-kicker">Notifications</p>
                  <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">Workspace alerts</h2>
                </div>
                <Gc2Status tone={unreadCount > 0 ? "warning" : "success"}>{unreadCount} unread</Gc2Status>
              </div>

              {notifications.length > 0 ? (
                <div>
                  {notifications.slice(0, 5).map((item) => (
                    <div key={item.id} className="border-b border-[var(--gc2-line)] p-5 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <BellRing aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-moss)]" />
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 text-sm leading-6 text-[var(--gc2-ink-soft)]">No notifications recorded.</div>
              )}

              <div className="border-t border-[var(--gc2-line)] p-4">
                <Gc2Button
                  variant="quiet"
                  className="w-full justify-center"
                  disabled={unreadCount === 0}
                  onClick={() => {
                    markAllNotificationsRead();
                    setFeedback("All workspace notifications marked as read.");
                  }}
                >
                  Mark all read
                </Gc2Button>
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <p className="gc2-kicker">Audit boundaries</p>
              <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">What this ledger guarantees</h2>
              <div className="mt-3">
                <BoundaryRow icon={<Cpu className="h-4 w-4" />} title="Device attribution">
                  Device-linked records resolve to the paired node and its detail route.
                </BoundaryRow>
                <BoundaryRow icon={<Lock className="h-4 w-4" />} title="Protected commands">
                  Commands remain inside the existing AppState and Firebase safety boundary.
                </BoundaryRow>
                <BoundaryRow icon={<Radio className="h-4 w-4" />} title="Workspace scope">
                  Records without a device ID are shown as workspace operations, not fake devices.
                </BoundaryRow>
                <BoundaryRow icon={<ShieldCheck className="h-4 w-4" />} title="No fabricated history">
                  Empty results stay empty until a real application event is recorded.
                </BoundaryRow>
              </div>
            </Gc2Surface>

            {attentionCount > 0 ? (
              <Gc2Notice tone="warning" title="Attention records present" icon={<AlertTriangle className="h-5 w-5" />}>
                Review blocked, failed or warning events before issuing additional physical commands.
              </Gc2Notice>
            ) : (
              <Gc2Notice tone="success" title="No attention records" icon={<Activity className="h-5 w-5" />}>
                The current filtered workspace record contains no warning-classified operations.
              </Gc2Notice>
            )}
          </div>
        </div>
      </div>

      {clearOpen ? (
        <Gc2Dialog
          open
          onClose={() => setClearOpen(false)}
          title="Clear workspace activity"
          description="This removes the visible activity history through the existing AppState action. It does not detach devices or bypass Firebase ownership."
          footer={
            <>
              <Gc2Button variant="quiet" onClick={() => setClearOpen(false)}>Cancel</Gc2Button>
              <Gc2Button variant="danger" onClick={confirmClear}>Clear activity</Gc2Button>
            </>
          }
        >
          <Gc2Notice tone="danger" title="Audit history will be removed" icon={<Trash2 className="h-5 w-5" />}>
            New telemetry, protected commands and workspace events will begin a fresh record after this action.
          </Gc2Notice>
        </Gc2Dialog>
      ) : null}
    </Gc2ProtectedShell>
  );
}
