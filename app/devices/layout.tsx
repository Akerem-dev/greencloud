import type { ReactNode } from "react";

import DeviceMutationBoundary from "@/components/devices/device-mutation-boundary";
import DevicesPairingExperience from "@/components/devices/devices-pairing-experience";

export default function DevicesLayout({ children }: { children: ReactNode }) {
  return (
    <DevicesPairingExperience>
      {children}
      <DeviceMutationBoundary />
    </DevicesPairingExperience>
  );
}
