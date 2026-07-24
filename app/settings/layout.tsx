import type { ReactNode } from "react";

import SettingsPreferenceSafetyBoundary from "@/components/settings/settings-preference-safety-boundary";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsPreferenceSafetyBoundary>
      {children}
    </SettingsPreferenceSafetyBoundary>
  );
}
