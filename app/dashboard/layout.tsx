import type { ReactNode } from "react";

import LiveOperationsDeck from "@/components/dashboard/live-operations-deck";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <LiveOperationsDeck />
    </>
  );
}
