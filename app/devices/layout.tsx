import type { ReactNode } from "react";

import ProtectedPairingStudio from "@/components/devices/protected-pairing-studio";

export default function DevicesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ProtectedPairingStudio />
    </>
  );
}
