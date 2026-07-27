"use client";

import {
  Activity,
  ArrowRight,
  ChartNoAxesCombined,
  Command,
  Cpu,
  Inbox,
  LayoutDashboard,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Status } from "@/components/ui/gc2-status";

type CommandGroup = "Navigate" | "Device" | "Activity";

type CommandItem = {
  id: string;
  label: string;
  description: string;
  group: CommandGroup;
  href: string;
  keywords: string;
  deviceId?: string;
  activityQuery?: string;
};

const routeCommands: CommandItem[] = [
  {
    id: "route-dashboard",
    label: "Overview",
    description: "Open the current GreenCloud workspace dashboard.",
    group: "Navigate",
    href: "/dashboard",
    keywords: "dashboard overview workspace field status",
  },
  {
    id: "route-devices",
    label: "Devices",
    description: "Review trusted controllers and device state.",
    group: "Navigate",
    href: "/devices",
    keywords: "devices controllers esp32 hardware inventory",
  },
  {
    id: "route-automation",
    label: "Automation",
    description: "Open protected irrigation policy and rule settings.",
    group: "Navigate",
    href: "/automation",
    keywords: "automation irrigation rules threshold cooldown",
  },
  {
    id: "route-activity",
    label: "Activity",
    description: "Open the stored workspace operations ledger.",
    group: "Navigate",
    href: "/activity",
    keywords: "activity operations ledger history audit",
  },
  {
    id: "route-analytics",
    label: "Analytics",
    description: "Review stored environmental and hardware evidence.",
    group: "Navigate",
    href: "/analytics",
    keywords: "analytics history moisture signal water timeline",
  },
  {
    id: "route-settings",
    label: "Settings",
    description: "Manage workspace and interface preferences.",
    group: "Navigate",
    href: "/settings",
    keywords: "settings preferences notification appearance workspace",
  },
  {
    id: "route-profile",
    label: "Profile",
    description: "Review authenticated identity and session state.",
    group: "Navigate",
    href: "/profile",
    keywords: "profile account identity session security",
  },
];

function commandIcon(group: CommandGroup, label: string): ReactNode {
  if (group === "Device") return <Cpu aria-hidden="true" className="h-4 w-4" />;
  if (group === "Activity") return <Activity aria-hidden="true" className="h-4 w-4" />;
  if (label === "Overview") return <LayoutDashboard aria-hidden="true" className="h-4 w-4" />;
  if (label === "Devices") return <Cpu aria-hidden="true" className="h-4 w-4" />;
  if (label === "Automation") return <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />;
  if (label === "Activity") return <Activity aria-hidden="true" className="h-4 w-4" />;
  if (label === "Analytics") return <ChartNoAxesCombined aria-hidden="true" className="h-4 w-4" />;
  if (label === "Settings") return <Settings aria-hidden="true" className="h-4 w-4" />;
  if (label === "Profile") return <UserRound aria-hidden="true" className="h-4 w-4" />;
  return <Command aria-hidden="true" className="h-4 w-4" />;
}

function commandText(item: CommandItem) {
  return `${item.label} ${item.description} ${item.group} ${item.keywords}`.toLowerCase();
}

export default function Gc2GlobalCommandPalette() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const {
    devices,
    activityFeed,
    quickPanelOpen,
    openQuickPanel,
    closeQuickPanel,
    toggleQuickPanel,
    selectDevice,
    updateSearchQuery,
  } = useAppState();

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleQuickPanel();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [toggleQuickPanel]);

  useEffect(() => {
    if (!quickPanelOpen) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [quickPanelOpen]);

  const deviceCommands = useMemo<CommandItem[]>(
    () =>
      devices
        .filter((device) => device.id !== "device-waiting")
        .map((device) => ({
          id: `device-${device.id}`,
          label: device.name,
          description: `${device.place} · ${device.status} · ${device.sensorStatus}`,
          group: "Device",
          href: `/devices/${encodeURIComponent(device.id)}`,
          keywords: `${device.place} ${device.location ?? ""} ${device.status} ${device.sensorStatus}`,
          deviceId: device.id,
        })),
    [devices],
  );

  const activityCommands = useMemo<CommandItem[]>(
    () =>
      activityFeed.slice(0, 20).map((item) => ({
        id: `activity-${item.id}`,
        label: item.title,
        description: item.description,
        group: "Activity",
        href: "/activity",
        keywords: `${item.body ?? ""} ${item.status} ${item.time}`,
        activityQuery: item.title,
      })),
    [activityFeed],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const commands = useMemo(() => {
    const allCommands = [...routeCommands, ...deviceCommands, ...activityCommands];

    if (!normalizedQuery) {
      return [
        ...routeCommands,
        ...deviceCommands.slice(0, 3),
        ...activityCommands.slice(0, 3),
      ];
    }

    return allCommands
      .filter((item) => commandText(item).includes(normalizedQuery))
      .slice(0, 14);
  }, [activityCommands, deviceCommands, normalizedQuery]);

  const runCommand = (item: CommandItem) => {
    if (item.deviceId) selectDevice(item.deviceId);

    if (item.activityQuery) {
      updateSearchQuery(item.activityQuery);
    } else if (item.href !== "/activity") {
      updateSearchQuery("");
    }

    closeQuickPanel();
    router.push(item.href);
  };

  const searchActivity = () => {
    const safeQuery = query.trim();
    if (!safeQuery) return;

    updateSearchQuery(safeQuery);
    closeQuickPanel();
    router.push("/activity");
  };

  return (
    <>
      <Gc2Button
        variant="quiet"
        aria-label="Open global search and command palette"
        aria-haspopup="dialog"
        aria-expanded={quickPanelOpen}
        onClick={openQuickPanel}
        className="hidden gap-2 sm:inline-flex"
      >
        <Search aria-hidden="true" className="h-4 w-4" />
        <span className="hidden lg:inline">Search</span>
        <kbd className="gc2-data rounded border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] px-1.5 py-0.5 text-[10px] text-[var(--gc2-ink-muted)]">
          Ctrl K
        </kbd>
      </Gc2Button>

      <Gc2Dialog
        open={quickPanelOpen}
        onClose={closeQuickPanel}
        title="Global search"
        description="Navigate the protected workspace, open a trusted device or search stored activity evidence. Hardware commands are not available in this palette."
        closeLabel="Close global search"
        className="w-[min(760px,calc(100vw-2rem))]"
      >
        <div className="grid gap-5">
          <Gc2Input
            ref={inputRef}
            label="Search workspace"
            value={query}
            onChange={(event) => setQuery(event.target.value.slice(0, 120))}
            placeholder="Route, device, place or stored activity"
            autoComplete="off"
            spellCheck={false}
            hint="Press Ctrl+K or Command+K from any protected screen to open or close this palette."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--gc2-line)] py-3">
            <p aria-live="polite" className="m-0 text-sm text-[var(--gc2-ink-soft)]">
              {commands.length} matching workspace command{commands.length === 1 ? "" : "s"}
            </p>
            <Gc2Status tone="info">Navigation and read-only search</Gc2Status>
          </div>

          {commands.length > 0 ? (
            <div className="divide-y divide-[var(--gc2-line)] border-y border-[var(--gc2-line)]">
              {commands.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => runCommand(item)}
                  className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 bg-transparent px-1 py-4 text-left hover:bg-[var(--gc2-canvas-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gc2-focus)]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-moss-strong)]">
                    {commandIcon(item.group, item.label)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-[var(--gc2-ink)]">{item.label}</strong>
                      <span className="gc2-kicker">{item.group}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 text-[var(--gc2-ink-muted)]" />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center border-y border-[var(--gc2-line)] py-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-ink-muted)]">
                  <Inbox aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="gc2-kicker mt-4">No direct match</p>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  No route, trusted device or stored activity record matches this query.
                </p>
              </div>
            </div>
          )}

          {query.trim() ? (
            <Gc2Button variant="secondary" onClick={searchActivity} className="w-full justify-between">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="truncate">Search Activity for “{query.trim()}”</span>
              </span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Gc2Button>
          ) : null}

          <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            This palette cannot start irrigation, change automation, rename or remove a device, pair hardware, clear a safety guard or write directly to Firebase.
          </p>
        </div>
      </Gc2Dialog>
    </>
  );
}
