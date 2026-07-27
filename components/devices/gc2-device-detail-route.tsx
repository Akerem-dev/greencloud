"use client";

import Gc2DeviceDetail from "@/components/devices/gc2-device-detail";
import Gc2OfflineSyncRecovery from "@/components/devices/gc2-offline-sync-recovery";
import { useAppState } from "@/components/providers/app-state-provider";
import Gc2HardwareSafetyLockout from "@/components/safety/gc2-hardware-safety-lockout";
import { getHardwareSafetyLockout } from "@/lib/hardware-safety-lockout.mjs";

export default function Gc2DeviceDetailRoute({
  deviceId,
}: {
  deviceId: string;
}) {
  const { devices, isBootLoading } = useAppState();
  const device = devices.find((item) => item.id === deviceId);
  const needsConnectionRecovery =
    !isBootLoading &&
    Boolean(device) &&
    (device?.status === "Offline" || device?.status === "Syncing");
  const hardwareLockout = device
    ? getHardwareSafetyLockout(device)
    : { locked: false, incidents: [] };

  if (needsConnectionRecovery && device) {
    return <Gc2OfflineSyncRecovery device={device} />;
  }

  if (!isBootLoading && device && hardwareLockout.locked) {
    return <Gc2HardwareSafetyLockout device={device} surface="device" />;
  }

  return <Gc2DeviceDetail deviceId={deviceId} />;
}
