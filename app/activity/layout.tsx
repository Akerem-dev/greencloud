import type { ReactNode } from "react";

import OperationsTimelineDeck from "@/components/activity/operations-timeline-deck";

export default function ActivityLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <OperationsTimelineDeck />
    </>
  );
}
