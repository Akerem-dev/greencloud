"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  Cpu,
  LayoutDashboard,
  Settings,
  SlidersHorizontal,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";

import AuthGate from "@/components/auth/auth-gate";
import { Gc2AppShell } from "@/components/layout/gc2-shells";
import Gc2NotificationCenterDrawer from "@/components/notifications/gc2-notification-center-drawer";
import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Status } from "@/components/ui/gc2-status";

const primaryNavigation = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Devices", href: "/devices", icon: <Cpu className="h-4 w-4" /> },
  {
    label: "Automation",
    href: "/automation",
    icon: <SlidersHorizontal className="h-4 w-4" />,
  },
  { label: "Activity", href: "/activity", icon: <Activity className="h-4 w-4" /> },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <ChartNoAxesCombined className="h-4 w-4" />,
  },
];

const secondaryNavigation = [
  { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
  { label: "Profile", href: "/profile", icon: <UserRound className="h-4 w-4" /> },
];

export default function Gc2ProtectedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    devices,
    selectedDevice,
    unreadNotifications,
    notificationsOpen,
    openNotifications,
    session,
    settings,
  } = useAppState();

  const hasDevice = devices.length > 0 && selectedDevice.id !== "device-waiting";
  const connected =
    hasDevice &&
    (selectedDevice.status === "Online" || selectedDevice.status === "Syncing");
  const operatorName = session.userName || settings.ownerName || "Operator";

  return (
    <AuthGate>
      <>
        <Gc2AppShell
          primaryNavigation={primaryNavigation}
          secondaryNavigation={secondaryNavigation}
          currentPath={pathname}
          topbar={
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Gc2Status
                tone={connected ? "success" : hasDevice ? "warning" : "neutral"}
                className="gap-2"
              >
                {connected ? (
                  <Wifi aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {connected
                    ? selectedDevice.name
                    : hasDevice
                      ? `${selectedDevice.name} · ${selectedDevice.status}`
                      : "No device paired"}
                </span>
                <span className="sm:hidden">{connected ? "Live" : "Offline"}</span>
              </Gc2Status>

              <Gc2Button
                variant="quiet"
                iconOnly
                aria-label={`${unreadNotifications} unread GreenCloud notifications`}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                onClick={openNotifications}
                className="relative"
              >
                <Bell aria-hidden="true" className="h-4 w-4" />
                {unreadNotifications > 0 ? (
                  <span className="gc2-data absolute -right-1 -top-1 min-w-5 rounded-full bg-[var(--gc2-danger)] px-1 text-center text-[10px] font-bold leading-5 text-white">
                    {Math.min(unreadNotifications, 99)}
                  </span>
                ) : null}
              </Gc2Button>

              <Link
                href="/profile"
                className="inline-flex min-w-0 items-center gap-2 border-l border-[var(--gc2-line)] pl-3 text-sm font-semibold text-[var(--gc2-ink-soft)] no-underline hover:text-[var(--gc2-ink)]"
              >
                <UserRound aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span className="hidden max-w-40 truncate md:block">{operatorName}</span>
              </Link>
            </div>
          }
        >
          {children}
        </Gc2AppShell>

        <Gc2NotificationCenterDrawer />
      </>
    </AuthGate>
  );
}
