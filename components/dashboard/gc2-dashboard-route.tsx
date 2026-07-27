"use client";

import Gc2DashboardOverview from "@/components/dashboard/gc2-dashboard-overview";
import Gc2EmptyWorkspace from "@/components/dashboard/gc2-empty-workspace";
import { useAppState } from "@/components/providers/app-state-provider";

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

  if (isBootLoading || hasRealDevice) {
    return <Gc2DashboardOverview />;
  }

  return (
    <Gc2EmptyWorkspace
      workspaceName={settings.workspaceName}
      projectName={settings.projectName}
      primaryZone={settings.mainPlantLabel}
      unreadNotifications={unreadNotifications}
    />
  );
}
