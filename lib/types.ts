export type DeviceStatus = "Online" | "Syncing" | "Idle" | "Offline";

export type TimelineStatus =
  | "Completed"
  | "Manual"
  | "Waiting"
  | "Skipped"
  | "Info";

export type ActivityStatus = TimelineStatus;

export type ThemeName =
  | "botanical-dark"
  | "forest-mist"
  | "aurora-gold"
  | "midnight-moss"
  | "golden-hour"
  | "rain-glass";

export type ThemePreset = ThemeName;

export type AmbienceMode =
  | "leaves"
  | "rain"
  | "mist"
  | "wind"
  | "fireflies"
  | "calm";

export type NotificationMode = "priority" | "all";

export type PumpState = "Dry-run" | "Ready" | "Running" | "Stopped" | "Blocked";

export type RelayState = "Locked" | "Enabled" | "Active" | "Off";

export type SensorState =
  | "Pending"
  | "Ready"
  | "Active"
  | "Sensor check"
  | "No signal"
  | "OK"
  | "Clear"
  | "Detected"
  | "Low"
  | "Empty"
  | "Pressed";

export type CommandStatus =
  | "None"
  | "Pending"
  | "Handled"
  | "Dry-run"
  | "Blocked"
  | "Failed";

export type Device = {
  id: string;
  name: string;
  place: string;
  location: string;
  status: DeviceStatus;

  moisture: number;
  rawSoil?: number;
  soilVoltage?: number;

  temperature?: number;
  pressure?: number;

  signal: number;
  power?: "USB / Adapter" | "External adapter" | "Disconnected" | string;

  updatedAt: string;
  lastSeenMs?: number;
  lastWateredAt?: string;

  sensorStatus?: SensorState | string;
  oledStatus?: SensorState | string;

  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: RelayState | string;
  pumpState?: PumpState | string;

  waterLevel?: number;
  waterLevelStatus?: SensorState | string;

  rainDetected?: boolean;
  rainStatus?: SensorState | string;

  buttonPressed?: boolean;
  buttonStatus?: SensorState | string;

  firmware?: string;
  lastCommand?: string;
  lastCommandStatus?: CommandStatus | string;
};

export type ActivityItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  status: TimelineStatus;
};

export type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  description?: string;
  read: boolean;
  createdAt: string;
};

export type AutomationConfig = {
  mode: "Automatic" | "Manual";
  moistureThreshold: number;
  cooldownMinutes: number;
  pumpDurationSeconds: number;

  manualOverride?: boolean;
  manualOverrideEnabled: boolean;

  autoIrrigationEnabled: boolean;

  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  quietStart?: string;
  quietEnd?: string;
};

export type AppSettings = {
  theme?: ThemeName;
  themePreset: ThemePreset;

  notifications?: NotificationMode;
  notificationMode: NotificationMode;

  animations: boolean;
  compactMode: boolean;

  leafFx?: boolean;
  leafAmbience: boolean;
  ambienceMode: AmbienceMode;

  workspaceName: string;
  projectName: string;
  ownerName: string;

  plantLabel?: string;
  mainPlantLabel: string;
};