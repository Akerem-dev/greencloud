import type { ReactNode } from "react";

import AutomationSafetyBoundary from "@/components/automation/automation-safety-boundary";

export default function AutomationLayout({ children }: { children: ReactNode }) {
  return <AutomationSafetyBoundary>{children}</AutomationSafetyBoundary>;
}
