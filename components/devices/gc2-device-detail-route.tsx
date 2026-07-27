"use client";

import Gc2DeviceDetail from "@/components/devices/gc2-device-detail";
import Gc2OfflineSyncRecovery from "@/components/devices/gc2-offline-sync-recovery";
import { useAppState } from "@/components/providers/app-state-provider";

export default function Gc2DeviceDetailRoute({
  deviceId,
}: {
  deviceId: string;
}) {
  const { devices, isBootLoading } = useAppState();
  const device = devices.find((item) => item.id === deviceId);
  const needsRecovery =
    !isBootLoading &&
    Boolean(device) &&
    (device?.status === "Offline" || device?.status === "Syncing");

  if (needsRecovery && device) {
    return <Gc2OfflineSyncRecovery device={device} />;
  }

  return <Gc2DeviceDetail deviceId={deviceId} />;
}
