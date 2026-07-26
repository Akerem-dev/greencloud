import type { ReactNode } from "react";

import DeviceMutationBoundary from "@/components/devices/device-mutation-boundary";

export default function DevicesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DeviceMutationBoundary />
    </>
  );
}
