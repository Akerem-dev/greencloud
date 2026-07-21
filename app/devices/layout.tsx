import type { ReactNode } from "react";

import DevicesPairingExperience from "@/components/devices/devices-pairing-experience";

export default function DevicesLayout({ children }: { children: ReactNode }) {
  return <DevicesPairingExperience>{children}</DevicesPairingExperience>;
}
