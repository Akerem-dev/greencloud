export type GreenCloudNavigationItem = {
  label: string;
  href: string;
  description: string;
};

export const greenCloudPrimaryNavigation: GreenCloudNavigationItem[] = [
  {
    label: "Overview",
    href: "/dashboard",
    description: "Live garden and irrigation state",
  },
  {
    label: "Devices",
    href: "/devices",
    description: "Paired ESP32 nodes and telemetry",
  },
  {
    label: "Automation",
    href: "/automation",
    description: "Protected irrigation rules",
  },
  {
    label: "Activity",
    href: "/activity",
    description: "Auditable operations ledger",
  },
  {
    label: "Analytics",
    href: "/analytics",
    description: "Historical telemetry and events",
  },
];

export const greenCloudSecondaryNavigation: GreenCloudNavigationItem[] = [
  {
    label: "Settings",
    href: "/settings",
    description: "Workspace and application preferences",
  },
  {
    label: "Profile",
    href: "/profile",
    description: "Identity and session security",
  },
];

export const greenCloudPublicNavigation: GreenCloudNavigationItem[] = [
  {
    label: "Product",
    href: "/#product",
    description: "GreenCloud capabilities",
  },
  {
    label: "Workflow",
    href: "/#workflow",
    description: "Observe, decide, irrigate and audit",
  },
  {
    label: "Security",
    href: "/#security",
    description: "Protected ownership and commands",
  },
];
