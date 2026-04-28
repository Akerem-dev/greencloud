"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Cpu,
  Droplets,
  Home,
  LayoutDashboard,
  Leaf,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings2,
  SlidersHorizontal,
  UserRound,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useAppState } from "@/components/providers/app-state-provider";
import {
  logoutFromGreenCloud,
  subscribeToAuthState,
  type GreenCloudAuthUser,
} from "@/lib/firebase-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

type DeviceExtra = {
  sensorStatus?: string;
  safeMode?: boolean;
  pumpEnabled?: boolean;
  pumpState?: string;
  relayState?: string;
  lastCommandStatus?: string;
  lastSeenMs?: number;
};

type AppTopbarProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  description?: string;
  onOpenMobileSidebar?: () => void;
};

const navItems: NavItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: Home,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Devices",
    href: "/devices",
    icon: Cpu,
  },
  {
    label: "Automation",
    href: "/automation",
    icon: SlidersHorizontal,
  },
  {
    label: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
  },
];

function statusTone(value: string): Tone {
  const lower = value.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("live") ||
    lower.includes("ready") ||
    lower.includes("active") ||
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("handled") ||
    lower.includes("seen")
  ) {
    return "live";
  }

  if (
    lower.includes("safe") ||
    lower.includes("protected") ||
    lower.includes("guarded") ||
    lower.includes("locked") ||
    lower.includes("dry-run") ||
    lower.includes("dry run")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
  }

  if (
    lower.includes("low") ||
    lower.includes("empty") ||
    lower.includes("detected") ||
    lower.includes("sensor check") ||
    lower.includes("blocked")
  ) {
    return "warning";
  }

  if (
    lower.includes("pending") ||
    lower.includes("idle") ||
    lower.includes("none") ||
    lower.includes("syncing") ||
    lower.includes("waiting")
  ) {
    return "pending";
  }

  return "pending";
}

function statusClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "dry-run" || lower === "locked") return "Protected";
  if (lower === "none") return "No command";
  if (lower === "pending") return "Waiting";

  return value;
}

function getSensorStatus(device: DeviceExtra & { status?: string }) {
  if (device.sensorStatus) return device.sensorStatus;
  if (device.status === "Offline") return "No signal";
  if (device.status === "Syncing") return "Syncing";
  return "Waiting";
}

function TopbarChip({
  label,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        statusClass(tone),
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="truncate">{displayStatus(label)}</span>
    </span>
  );
}

function NavButton({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition 2xl:px-4",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_16px_36px_var(--gc-glow)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
      )}
      title={item.label}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="hidden 2xl:inline">{item.label}</span>
    </Link>
  );
}

export default function AppTopbar({
  title = "Control Center",
  subtitle,
  eyebrow = "GREENCLOUD WORKSPACE",
  description = "Monitor paired devices, live plant telemetry, irrigation rules, alerts, and protected hardware control.",
  onOpenMobileSidebar,
}: AppTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    notifications,
    openNotifications,
    notificationsOpen,
    openQuickPanel,
    quickPanelOpen,
    searchQuery,
    setSearchQuery,
    selectedDevice,
    settings,
  } = useAppState();

  const [authUser, setAuthUser] = useState<GreenCloudAuthUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const selectedExtra = selectedDevice as typeof selectedDevice & DeviceExtra;

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logoutFromGreenCloud();
      router.replace("/auth");
    } finally {
      setIsSigningOut(false);
    }
  }

  const unreadCount = notifications.filter((item) => !item.read).length;
  const finalDescription = subtitle ?? description;

  const accountLabel =
    authUser?.displayName || authUser?.email || "Secure account";

  const sensorStatus = getSensorStatus(selectedExtra);
  const safeModeActive = selectedExtra.safeMode ?? true;
  const pumpEnabled = selectedExtra.pumpEnabled ?? false;

  const physicalPumpLocked = safeModeActive || !pumpEnabled;

  const relayState =
    selectedExtra.relayState ?? (physicalPumpLocked ? "Protected" : "Ready");

  const pumpState =
    selectedExtra.pumpState ?? (physicalPumpLocked ? "Protected" : "Ready");

  const pumpLabel = pumpEnabled ? "Pump live" : displayStatus(pumpState);
  const pumpTone: Tone = pumpEnabled ? "warning" : "safe";

  const commandLabel = displayStatus(selectedExtra.lastCommandStatus ?? "None");

  return (
    <header className="sticky top-4 z-40 w-full">
      <div className="premium-noise relative overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_94%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] shadow-[0_24px_90px_rgba(0,0,0,0.38),0_0_44px_var(--gc-glow)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_srgb,var(--gc-accent)_13%,transparent),transparent_32%),radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--gc-accent-2)_11%,transparent),transparent_30%)]" />

        <div className="relative z-10 flex flex-col gap-5 px-5 py-5 lg:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              {onOpenMobileSidebar ? (
                <button
                  type="button"
                  onClick={onOpenMobileSidebar}
                  className="premium-btn-secondary flex h-12 w-12 shrink-0 items-center justify-center rounded-full xl:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              ) : null}

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--gc-muted)]">
                  {eyebrow}
                </p>

                <h1 className="mt-1 break-words text-3xl font-semibold tracking-[-0.06em] text-[var(--gc-text)] sm:text-4xl">
                  {title}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--gc-soft)] sm:text-base">
                  {finalDescription}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <TopbarChip
                    label={selectedDevice.status}
                    icon={Wifi}
                    tone={statusTone(selectedDevice.status)}
                  />

                  <TopbarChip
                    label={sensorStatus}
                    icon={Leaf}
                    tone={statusTone(sensorStatus)}
                  />

                  <TopbarChip
                    label={relayState}
                    icon={Lock}
                    tone={statusTone(relayState)}
                  />

                  <TopbarChip label={pumpLabel} icon={Droplets} tone={pumpTone} />

                  <TopbarChip
                    label={commandLabel}
                    icon={Cpu}
                    tone={statusTone(commandLabel)}
                  />

                  <TopbarChip
                    label={settings.workspaceName || "GreenCloud"}
                    icon={UserRound}
                    tone="safe"
                  />
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
              <div className="relative min-w-0 sm:w-[320px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gc-muted)]" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search workspace..."
                  className="h-12 w-full rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] pl-11 pr-4 text-sm text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_38%,transparent)] focus:bg-[color-mix(in_srgb,var(--gc-bg)_62%,black)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)]"
                />
              </div>

              <nav className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 xl:flex">
                  {navItems.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <NavButton key={item.href} item={item} active={active} />
                    );
                  })}
                </div>

                <button
                  type="button"
                  aria-label="Open quick controls"
                  onClick={openQuickPanel}
                  className={cn(
                    "relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
                    quickPanelOpen
                      ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_16px_36px_var(--gc-glow)]"
                      : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
                  )}
                >
                  <Settings2 className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Open alerts"
                  onClick={openNotifications}
                  className={cn(
                    "relative inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
                    notificationsOpen
                      ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_16%,transparent)] text-[var(--gc-text)] shadow-[0_16px_36px_var(--gc-glow)]"
                      : "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] hover:bg-white/[0.06] hover:text-[var(--gc-text)]",
                  )}
                >
                  <Bell className="h-4 w-4" />

                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-bg)_80%,black)] bg-[var(--gc-accent)] px-1 text-[10px] font-bold text-[#11160d] shadow-[0_0_22px_var(--gc-glow-strong)]">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>

                <div className="hidden h-11 max-w-[220px] items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] pl-2 pr-3 text-[var(--gc-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] 2xl:flex">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-accent-2)]">
                    <UserRound className="h-4 w-4" />
                  </span>

                  <span className="truncate text-sm font-semibold">
                    {accountLabel}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 text-sm font-semibold text-[var(--gc-soft)] transition hover:border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] hover:text-[var(--gc-text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">
                    {isSigningOut ? "Signing out..." : "Sign out"}
                  </span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}