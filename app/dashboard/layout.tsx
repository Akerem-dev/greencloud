import type { ReactNode } from "react";

import LiveOperationsDeck from "@/components/dashboard/live-operations-deck";
import WorkspacePulsePortal from "@/components/dashboard/workspace-pulse-portal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WorkspacePulsePortal />
      <LiveOperationsDeck />
    </>
  );
}
