"use client";

import Gc2DashboardOverview from "@/components/dashboard/gc2-dashboard-overview";
import Gc2EmptyWorkspace from "@/components/dashboard/gc2-empty-workspace";
import { useAppState } from "@/components/providers/app-state-provider";
import Gc2HardwareSafetyLockout from "@/components/safety/gc2-hardware-safety-lockout";
import { getHardwareSafetyLockout } from "@/lib/hardware-safety-lockout.mjs";

export default function Gc2DashboardRoute() {
  const {
    devices,
    selectedDevice,
    settings,
    unreadNotifications,
    isBootLoading,
  } = useAppState();

  const hasRealDevice =
    devices.length > 0 && selectedDevice.id !== "device-waiting";
  const hardwareLockout = hasRealDevice
    ? getHardwareSafetyLockout(selectedDevice)
    : { locked: false, incidents: [] };

  if (isBootLoading) {
    return <Gc2DashboardOverview />;
  }

  if (!hasRealDevice) {
    return (
      <Gc2EmptyWorkspace
        workspaceName={settings.workspaceName}
        projectName={settings.projectName}
        primaryZone={settings.mainPlantLabel}
        unreadNotifications={unreadNotifications}
      />
    );
  }

  if (hardwareLockout.locked) {
    return (
      <Gc2HardwareSafetyLockout
        device={selectedDevice}
        surface="dashboard"
      />
    );
  }

  return <Gc2DashboardOverview />;
}
