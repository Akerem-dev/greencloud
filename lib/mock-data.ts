import type {
  ActivityItem,
  AppSettings,
  AutomationConfig,
  Device,
  NotificationItem,
} from "@/lib/types";

export const devices: Device[] = [
  {
    id: "device-main",
    name: "Main Pot",
    place: "GreenCloud main plant zone",
    location: "GreenCloud main plant zone",
    status: "Idle",

    moisture: 0,
    rawSoil: undefined,
    soilVoltage: undefined,

    temperature: undefined,
    pressure: undefined,

    signal: 0,
    power: "USB / Adapter",

    updatedAt: "Waiting for ESP32",
    lastWateredAt: "Not watered yet",

    sensorStatus: "Pending",
    oledStatus: "Pending",

    safeMode: true,
    pumpEnabled: false,
    relayState: "Locked",
    pumpState: "Dry-run",

    waterLevelStatus: "Pending",
    rainDetected: false,
    rainStatus: "Pending",
    buttonPressed: false,
    buttonStatus: "Pending",

    firmware: "greencloud-esp32-final",
    lastCommandStatus: "None",
  },
];

export const overviewStats = [
  {
    label: "ESP32 node",
    value: "Ready",
    detail: "Waiting for the physical ESP32 to publish live telemetry.",
    tone: "from-[#728c38] via-[#a7bf4d] to-[#ddc36a]",
  },
  {
    label: "Firebase route",
    value: "UID",
    detail: "Each user workspace is separated under its own Firebase UID path.",
    tone: "from-[#637b32] via-[#8ea943] to-[#c7c45f]",
  },
  {
    label: "Pump safety",
    value: "Locked",
    detail: "Relay output is protected until final pump wiring is confirmed.",
    tone: "from-[#6b8636] via-[#9eb64a] to-[#d7bd68]",
  },
  {
    label: "Sensor stack",
    value: "Pending",
    detail: "Soil, BME280, rain, tank and button fields are ready for live data.",
    tone: "from-[#829b3e] via-[#b7c758] to-[#dbc16a]",
  },
];

export const moistureBars = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

export const initialActivityFeed: ActivityItem[] = [
  {
    id: "activity-workspace-ready",
    time: "now",
    title: "Workspace initialized",
    description:
      "GreenCloud is ready for ESP32 telemetry, Firebase commands and safe-mode irrigation.",
    status: "Info",
  },
  {
    id: "activity-pump-protection",
    time: "now",
    title: "Pump protection enabled",
    description:
      "Relay output is locked. Commands are recorded safely until final pump wiring is confirmed.",
    status: "Info",
  },
  {
    id: "activity-telemetry-waiting",
    time: "now",
    title: "Waiting for ESP32 telemetry",
    description:
      "Live moisture, RAW soil, temperature, pressure, Wi-Fi signal and hardware states will update after ESP32 writes to Firebase.",
    status: "Waiting",
  },
  {
    id: "activity-device-path-ready",
    time: "now",
    title: "Device path ready",
    description:
      "The selected device slot is prepared for a matching ESP32 DEVICE_ID.",
    status: "Info",
  },
];

export const defaultNotifications: NotificationItem[] = [
  {
    id: "notif-system-initialized",
    title: "System initialized",
    body: "GreenCloud is ready for ESP32 telemetry and Firebase command handling.",
    read: false,
    createdAt: "now",
  },
  {
    id: "notif-safe-mode",
    title: "Pump safe-mode active",
    body: "Relay and pump output remain protected until final wiring is confirmed.",
    read: false,
    createdAt: "now",
  },
  {
    id: "notif-telemetry-waiting",
    title: "Telemetry waiting",
    body: "Live soil, BME280, rain, tank and button values will appear after ESP32 publishes data to Firebase.",
    read: true,
    createdAt: "now",
  },
];

export const defaultSettings: AppSettings = {
  theme: "botanical-dark",
  themePreset: "botanical-dark",

  notifications: "priority",
  notificationMode: "priority",

  animations: true,
  compactMode: false,

  leafFx: true,
  leafAmbience: true,
  ambienceMode: "rain",

  workspaceName: "GreenCloud Workspace",
  projectName: "GreenCloud",
  ownerName: "Operator",

  plantLabel: "Main Pot",
  mainPlantLabel: "Main Pot",
};

export const defaultAutomation: AutomationConfig = {
  mode: "Automatic",
  moistureThreshold: 35,
  cooldownMinutes: 20,
  pumpDurationSeconds: 8,

  manualOverride: true,
  manualOverrideEnabled: true,

  autoIrrigationEnabled: true,

  quietHoursEnabled: false,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",

  quietStart: "23:00",
  quietEnd: "07:00",
};