"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearActivityFeedInFirebase,
  markAllNotificationsReadInFirebase,
  pairDeviceToUserInFirebase,
  patchAutomationInFirebase,
  patchDeviceInFirebase,
  patchSettingsInFirebase,
  pushActivityToFirebase,
  pushNotificationToFirebase,
  removeDeviceFromFirebase,
  seedGreenCloudIfEmpty,
  subscribeToGreenCloudState,
  writeAutomationToFirebase,
  writeIrrigationCommandToFirebase,
  writeSelectedDeviceIdToFirebase,
  writeSettingsToFirebase,
} from "@/lib/firebase-greencloud";
import {
  subscribeToAuthState,
  updateCurrentUserDisplayName,
  type GreenCloudAuthUser,
} from "@/lib/firebase-auth";

export type DeviceStatus = "Online" | "Idle" | "Syncing" | "Offline";

export type ActivityStatus =
  | "Completed"
  | "Manual"
  | "Waiting"
  | "Skipped"
  | "Info";

export type ThemePreset =
  | "botanical-dark"
  | "forest-mist"
  | "aurora-gold"
  | "midnight-moss"
  | "golden-hour"
  | "rain-glass";

export type NotificationMode = "priority" | "all";

export type AmbienceMode =
  | "leaves"
  | "rain"
  | "mist"
  | "wind"
  | "fireflies"
  | "calm";

export type AutomationMode = "Automatic" | "Manual";

export type RelayState = "Locked" | "Enabled" | "Off" | "On" | "Pending";

export type PumpState =
  | "Dry-run"
  | "Ready"
  | "Running"
  | "Stopped"
  | "Blocked";

export type RainStatus = "Pending" | "Clear" | "Detected" | "Sensor check";

export type WaterLevelStatus =
  | "Pending"
  | "OK"
  | "Low"
  | "Empty"
  | "Sensor check";

export type ButtonStatus = "Pending" | "Ready" | "Pressed" | "Released";

export type OledStatus = "Active" | "Pending" | "Off";

export type CommandStatus =
  | "None"
  | "Pending"
  | "Handled"
  | "Dry-run"
  | "Blocked";

export type SensorStatus =
  | "Sensor check"
  | "Dry risk"
  | "No signal"
  | "Syncing"
  | "Pending"
  | "OK"
  | string;

export type Device = {
  id: string;
  name: string;
  place: string;
  location?: string;

  moisture: number;
  rawSoil?: number;
  soilVoltage?: number;

  signal: number;

  temperature?: number;
  pressure?: number;
  humidity?: number;

  status: DeviceStatus;
  updatedAt: string;
  lastWateredAt?: string;
  lastSeenMs?: number;

  power?: string;
  sensorStatus?: SensorStatus;

  safeMode?: boolean;
  pumpEnabled?: boolean;
  relayState?: RelayState;
  pumpState?: PumpState;

  rainDetected?: boolean;
  rainStatus?: RainStatus;

  waterLevel?: number;
  waterLevelStatus?: WaterLevelStatus;

  buttonPressed?: boolean;
  buttonStatus?: ButtonStatus;

  oledStatus?: OledStatus;
  firmware?: string;

  lastCommand?: string;
  lastCommandStatus?: CommandStatus;

  pairingCode?: string;
  pairedAt?: string;
  ownerUid?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  body?: string;
  status: ActivityStatus;
  time: string;
  deviceId?: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  description: string;
  read: boolean;
  createdAt: string;
};

export type AutomationState = {
  mode: AutomationMode;
  moistureThreshold: number;
  cooldownMinutes: number;
  pumpDurationSeconds: number;

  manualOverrideEnabled: boolean;
  manualOverride: boolean;

  autoIrrigationEnabled: boolean;

  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;

  quietStart: string;
  quietEnd: string;
};

export type SettingsState = {
  themePreset: ThemePreset;
  theme: ThemePreset;

  notificationMode: NotificationMode;
  notifications: NotificationMode;

  animations: boolean;
  compactMode: boolean;

  leafAmbience: boolean;
  leafFx: boolean;
  ambienceMode: AmbienceMode;

  workspaceName: string;
  projectName: string;
  ownerName: string;

  mainPlantLabel: string;
  plantLabel: string;
};

export type SessionState = {
  signedIn: boolean;
  userName: string;
  email: string;
};

type WorkspaceIdentityPayload = {
  workspaceName: string;
  projectName: string;
  ownerName: string;
  mainPlantLabel: string;
};

type PersistedState = {
  devices: Device[];
  selectedDeviceId: string;
  activityFeed: ActivityItem[];
  notifications: NotificationItem[];
  automation: AutomationState;
  settings: SettingsState;
  session: SessionState;
  searchQuery: string;
};

export type AppStateContextValue = {
  devices: Device[];
  selectedDevice: Device;
  selectedDeviceId: string;

  activityFeed: ActivityItem[];
  filteredActivity: ActivityItem[];

  notifications: NotificationItem[];
  unreadNotifications: number;

  automation: AutomationState;
  settings: SettingsState;
  session: SessionState;

  searchQuery: string;
  notificationsOpen: boolean;
  quickPanelOpen: boolean;
  isBootLoading: boolean;

  selectDevice: (deviceId: string) => void;

  addDevice: (name: string, place: string) => void;
  pairDeviceByCode: (
    code: string,
    name?: string,
    place?: string,
  ) => Promise<Device | null>;
  createDevicePairingCode: (deviceId?: string) => Promise<string | null>;

  updateDevice: (deviceId: string, patch: Partial<Device>) => void;
  removeDevice: (deviceId: string) => void;

  startIrrigation: (deviceId?: string) => void;
  simulateThresholdEvent: (deviceId?: string) => void;
  refreshTelemetry: (deviceId?: string) => void;

  updateAutomation: {
    (patch: Partial<AutomationState>): void;
    <K extends keyof AutomationState>(key: K, value: AutomationState[K]): void;
  };
  resetAutomation: () => void;

  updateSettings: (patch: Partial<SettingsState>) => void;
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => void;
  resetSettings: () => void;
  saveWorkspaceIdentity: (payload: WorkspaceIdentityPayload) => void;

  setSearchQuery: (query: string) => void;
  updateSearchQuery: (query: string) => void;

  openNotifications: () => void;
  closeNotifications: () => void;
  markAllNotificationsRead: () => void;

  openQuickPanel: () => void;
  closeQuickPanel: () => void;
  toggleQuickPanel: () => void;

  clearActivity: () => void;

  loginToWorkspace: (name: string, email: string) => void;
  updateProfileName: (displayName: string) => Promise<void>;
  logoutFromWorkspace: () => void;
};

const STORAGE_KEY = "greencloud-app-state-v11";

let idCounter = 1;

function createId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nowTimeLabel() {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "now";
  }
}

function normalizeOptionalNumber(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return clamp(value, min, max);
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePairingCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function normalizeTheme(value: unknown): ThemePreset {
  if (value === "forest-mist" || value === "Forest mist") return "forest-mist";
  if (value === "aurora-gold" || value === "Aurora gold") return "aurora-gold";
  if (value === "midnight-moss" || value === "Midnight moss") {
    return "midnight-moss";
  }
  if (value === "golden-hour" || value === "Golden hour") return "golden-hour";
  if (value === "rain-glass" || value === "Rain glass") return "rain-glass";
  return "botanical-dark";
}

function normalizeNotificationMode(value: unknown): NotificationMode {
  if (value === "all" || value === "All notifications") return "all";
  return "priority";
}

function normalizeAmbience(value: unknown): AmbienceMode {
  if (value === "rain") return "rain";
  if (value === "mist") return "mist";
  if (value === "wind") return "wind";
  if (value === "fireflies") return "fireflies";
  if (value === "calm") return "calm";
  return "leaves";
}

function normalizeRelayState(
  value: unknown,
  safeMode: boolean,
  pumpEnabled: boolean,
): RelayState {
  if (
    value === "Locked" ||
    value === "Enabled" ||
    value === "Off" ||
    value === "On" ||
    value === "Pending"
  ) {
    return value;
  }

  return safeMode || !pumpEnabled ? "Locked" : "Enabled";
}

function normalizePumpState(
  value: unknown,
  safeMode: boolean,
  pumpEnabled: boolean,
): PumpState {
  if (
    value === "Dry-run" ||
    value === "Ready" ||
    value === "Running" ||
    value === "Stopped" ||
    value === "Blocked"
  ) {
    return value;
  }

  return safeMode || !pumpEnabled ? "Dry-run" : "Ready";
}

function normalizeRainStatus(value: unknown): RainStatus {
  if (
    value === "Pending" ||
    value === "Clear" ||
    value === "Detected" ||
    value === "Sensor check"
  ) {
    return value;
  }

  return "Pending";
}

function normalizeWaterLevelStatus(value: unknown): WaterLevelStatus {
  if (
    value === "Pending" ||
    value === "OK" ||
    value === "Low" ||
    value === "Empty" ||
    value === "Sensor check"
  ) {
    return value;
  }

  return "Pending";
}

function normalizeButtonStatus(value: unknown): ButtonStatus {
  if (
    value === "Pending" ||
    value === "Ready" ||
    value === "Pressed" ||
    value === "Released"
  ) {
    return value;
  }

  return "Pending";
}

function normalizeOledStatus(value: unknown): OledStatus {
  if (value === "Active" || value === "Pending" || value === "Off") {
    return value;
  }

  return "Pending";
}

function normalizeCommandStatus(value: unknown): CommandStatus {
  if (
    value === "None" ||
    value === "Pending" ||
    value === "Handled" ||
    value === "Dry-run" ||
    value === "Blocked"
  ) {
    return value;
  }

  return "None";
}

function normalizeDevice(device: Partial<Device>, index: number): Device {
  const fallbackName = index === 0 ? "New device" : `Device ${index + 1}`;
  const fallbackPlace = "Unassigned plant zone";

  const signal =
    typeof device.signal === "number" ? clamp(device.signal, 0, 100) : 0;

  const moisture =
    typeof device.moisture === "number" ? clamp(device.moisture, 0, 100) : 0;

  const status =
    device.status === "Idle" ||
    device.status === "Syncing" ||
    device.status === "Offline" ||
    device.status === "Online"
      ? device.status
      : "Idle";

  const safeMode = normalizeBoolean(device.safeMode, true);
  const pumpEnabled = normalizeBoolean(device.pumpEnabled, false);

  const sensorStatus =
    typeof device.sensorStatus === "string"
      ? device.sensorStatus
      : status === "Offline"
        ? "No signal"
        : status === "Syncing"
          ? "Syncing"
          : "Pending";

  return {
    id: typeof device.id === "string" ? device.id : createId("device"),
    name: typeof device.name === "string" ? device.name : fallbackName,
    place:
      typeof device.place === "string"
        ? device.place
        : typeof device.location === "string"
          ? device.location
          : fallbackPlace,
    location:
      typeof device.location === "string"
        ? device.location
        : typeof device.place === "string"
          ? device.place
          : fallbackPlace,

    moisture,
    rawSoil: normalizeOptionalNumber(device.rawSoil, 0, 4095),
    soilVoltage: normalizeOptionalNumber(device.soilVoltage, 0, 3.3),

    signal,

    temperature: normalizeOptionalNumber(device.temperature, -20, 80),
    pressure: normalizeOptionalNumber(device.pressure, 300, 1200),
    humidity: normalizeOptionalNumber(device.humidity, 0, 100),

    status,
    updatedAt:
      typeof device.updatedAt === "string"
        ? device.updatedAt
        : "Waiting for device",
    lastWateredAt:
      typeof device.lastWateredAt === "string"
        ? device.lastWateredAt
        : "Not watered yet",
    lastSeenMs: normalizeOptionalNumber(device.lastSeenMs, 0, Date.now()),

    power:
      typeof device.power === "string"
        ? device.power
        : status === "Offline"
          ? "Disconnected"
          : "USB / Adapter",

    sensorStatus,

    safeMode,
    pumpEnabled,
    relayState: normalizeRelayState(device.relayState, safeMode, pumpEnabled),
    pumpState: normalizePumpState(device.pumpState, safeMode, pumpEnabled),

    rainDetected: normalizeBoolean(device.rainDetected, false),
    rainStatus: normalizeRainStatus(device.rainStatus),

    waterLevel: normalizeOptionalNumber(device.waterLevel, 0, 100),
    waterLevelStatus: normalizeWaterLevelStatus(device.waterLevelStatus),

    buttonPressed: normalizeBoolean(device.buttonPressed, false),
    buttonStatus: normalizeButtonStatus(device.buttonStatus),

    oledStatus: normalizeOledStatus(device.oledStatus),
    firmware:
      typeof device.firmware === "string"
        ? device.firmware
        : "greencloud-esp32",

    lastCommand:
      typeof device.lastCommand === "string" ? device.lastCommand : "None",
    lastCommandStatus: normalizeCommandStatus(device.lastCommandStatus),

    pairingCode:
      typeof device.pairingCode === "string" ? device.pairingCode : undefined,
    pairedAt: typeof device.pairedAt === "string" ? device.pairedAt : undefined,
    ownerUid: typeof device.ownerUid === "string" ? device.ownerUid : undefined,
  };
}

function normalizeActivity(
  item: Partial<ActivityItem>,
  index: number,
): ActivityItem {
  return {
    id: typeof item.id === "string" ? item.id : createId("activity"),
    title:
      typeof item.title === "string"
        ? item.title
        : index === 0
          ? "Workspace initialized"
          : "Activity item",
    description:
      typeof item.description === "string"
        ? item.description
        : typeof item.body === "string"
          ? item.body
          : "GreenCloud activity item.",
    body:
      typeof item.body === "string"
        ? item.body
        : typeof item.description === "string"
          ? item.description
          : "GreenCloud activity item.",
    status:
      item.status === "Completed" ||
      item.status === "Manual" ||
      item.status === "Waiting" ||
      item.status === "Skipped" ||
      item.status === "Info"
        ? item.status
        : "Info",
    time: typeof item.time === "string" ? item.time : nowTimeLabel(),
    deviceId: typeof item.deviceId === "string" ? item.deviceId : undefined,
  };
}

function normalizeNotification(
  item: Partial<NotificationItem>,
): NotificationItem {
  const message =
    typeof item.body === "string"
      ? item.body
      : typeof item.description === "string"
        ? item.description
        : "GreenCloud notification.";

  return {
    id: typeof item.id === "string" ? item.id : createId("notification"),
    title: typeof item.title === "string" ? item.title : "Notification",
    body: message,
    description: message,
    read: typeof item.read === "boolean" ? item.read : false,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : "now",
  };
}

const fallbackDevice: Device = normalizeDevice(
  {
    id: "device-waiting",
    name: "No device paired",
    place: "Pair a device to start monitoring",
    location: "Pair a device to start monitoring",
    moisture: 0,
    rawSoil: 0,
    soilVoltage: 0,
    signal: 0,
    status: "Idle",
    updatedAt: "Waiting for device",
    lastWateredAt: "Not watered yet",
    power: "Disconnected",
    sensorStatus: "Pending",
    safeMode: true,
    pumpEnabled: false,
    relayState: "Locked",
    pumpState: "Dry-run",
    rainDetected: false,
    rainStatus: "Pending",
    waterLevelStatus: "Pending",
    buttonPressed: false,
    buttonStatus: "Pending",
    oledStatus: "Pending",
    firmware: "greencloud-esp32",
    lastCommand: "None",
    lastCommandStatus: "None",
  },
  0,
);

const defaultDevices: Device[] = [];

const defaultAutomation: AutomationState = {
  mode: "Automatic",
  moistureThreshold: 35,
  cooldownMinutes: 20,
  pumpDurationSeconds: 8,
  manualOverrideEnabled: true,
  manualOverride: true,
  autoIrrigationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
  quietStart: "23:00",
  quietEnd: "07:00",
};

const defaultSettings: SettingsState = {
  themePreset: "botanical-dark",
  theme: "botanical-dark",
  notificationMode: "priority",
  notifications: "priority",
  animations: true,
  compactMode: false,
  leafAmbience: true,
  leafFx: true,
  ambienceMode: "leaves",
  workspaceName: "GreenCloud",
  projectName: "GreenCloud",
  ownerName: "Operator",
  mainPlantLabel: "Primary plant",
  plantLabel: "Primary plant",
};

const defaultSession: SessionState = {
  signedIn: false,
  userName: "",
  email: "",
};

const defaultActivityFeed: ActivityItem[] = [
  {
    id: "activity-ready",
    title: "Workspace ready",
    description:
      "GreenCloud is ready. Power on your ESP32 device and enter the OLED pairing code to start monitoring.",
    body: "GreenCloud is ready. Power on your ESP32 device and enter the OLED pairing code to start monitoring.",
    status: "Info",
    time: "now",
  },
  {
    id: "activity-pairing-ready",
    title: "Device pairing enabled",
    description:
      "Pairing is device-first: the ESP32 shows a 7-character OLED code, then the web app attaches it to your account.",
    body: "Pairing is device-first: the ESP32 shows a 7-character OLED code, then the web app attaches it to your account.",
    status: "Info",
    time: "now",
  },
];

const defaultNotifications: NotificationItem[] = [
  {
    id: "notification-ready",
    title: "GreenCloud is ready",
    body: "Enter the 7-character code shown on your ESP32 OLED to pair your first device.",
    description:
      "Enter the 7-character code shown on your ESP32 OLED to pair your first device.",
    read: false,
    createdAt: "now",
  },
];

const defaultPersistedState: PersistedState = {
  devices: defaultDevices,
  selectedDeviceId: "",
  activityFeed: defaultActivityFeed,
  notifications: defaultNotifications,
  automation: defaultAutomation,
  settings: defaultSettings,
  session: defaultSession,
  searchQuery: "",
};

function normalizeAutomation(raw: unknown): AutomationState {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<AutomationState>) : {};

  const quietHoursStart =
    typeof source.quietHoursStart === "string"
      ? source.quietHoursStart
      : typeof source.quietStart === "string"
        ? source.quietStart
        : defaultAutomation.quietHoursStart;

  const quietHoursEnd =
    typeof source.quietHoursEnd === "string"
      ? source.quietHoursEnd
      : typeof source.quietEnd === "string"
        ? source.quietEnd
        : defaultAutomation.quietHoursEnd;

  const manualOverrideEnabled =
    typeof source.manualOverrideEnabled === "boolean"
      ? source.manualOverrideEnabled
      : typeof source.manualOverride === "boolean"
        ? source.manualOverride
        : defaultAutomation.manualOverrideEnabled;

  return {
    mode: source.mode === "Manual" ? "Manual" : "Automatic",
    moistureThreshold:
      typeof source.moistureThreshold === "number"
        ? clamp(source.moistureThreshold, 10, 90)
        : defaultAutomation.moistureThreshold,
    cooldownMinutes:
      typeof source.cooldownMinutes === "number"
        ? clamp(source.cooldownMinutes, 1, 180)
        : defaultAutomation.cooldownMinutes,
    pumpDurationSeconds:
      typeof source.pumpDurationSeconds === "number"
        ? clamp(source.pumpDurationSeconds, 1, 60)
        : defaultAutomation.pumpDurationSeconds,
    manualOverrideEnabled,
    manualOverride: manualOverrideEnabled,
    autoIrrigationEnabled:
      typeof source.autoIrrigationEnabled === "boolean"
        ? source.autoIrrigationEnabled
        : defaultAutomation.autoIrrigationEnabled,
    quietHoursEnabled:
      typeof source.quietHoursEnabled === "boolean"
        ? source.quietHoursEnabled
        : defaultAutomation.quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
    quietStart: quietHoursStart,
    quietEnd: quietHoursEnd,
  };
}

function normalizeSettings(raw: unknown): SettingsState {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<SettingsState>) : {};

  const themePreset = normalizeTheme(source.themePreset ?? source.theme);

  const notificationMode = normalizeNotificationMode(
    source.notificationMode ?? source.notifications,
  );

  const ambienceMode = normalizeAmbience(source.ambienceMode);

  const leafAmbience =
    typeof source.leafAmbience === "boolean"
      ? source.leafAmbience
      : typeof source.leafFx === "boolean"
        ? source.leafFx
        : defaultSettings.leafAmbience;

  const mainPlantLabel =
    typeof source.mainPlantLabel === "string"
      ? source.mainPlantLabel
      : typeof source.plantLabel === "string"
        ? source.plantLabel
        : defaultSettings.mainPlantLabel;

  return {
    themePreset,
    theme: themePreset,
    notificationMode,
    notifications: notificationMode,
    animations:
      typeof source.animations === "boolean"
        ? source.animations
        : defaultSettings.animations,
    compactMode:
      typeof source.compactMode === "boolean"
        ? source.compactMode
        : defaultSettings.compactMode,
    leafAmbience,
    leafFx: leafAmbience,
    ambienceMode,
    workspaceName:
      typeof source.workspaceName === "string"
        ? source.workspaceName
        : defaultSettings.workspaceName,
    projectName:
      typeof source.projectName === "string"
        ? source.projectName
        : defaultSettings.projectName,
    ownerName:
      typeof source.ownerName === "string"
        ? source.ownerName
        : defaultSettings.ownerName,
    mainPlantLabel,
    plantLabel: mainPlantLabel,
  };
}

function normalizePersistedState(raw: unknown): PersistedState {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<PersistedState>) : {};

  const devices = Array.isArray(source.devices)
    ? source.devices.map((device, index) => normalizeDevice(device, index))
    : defaultDevices;

  const selectedDeviceId =
    typeof source.selectedDeviceId === "string" &&
    devices.some((device) => device.id === source.selectedDeviceId)
      ? source.selectedDeviceId
      : devices[0]?.id ?? "";

  return {
    devices,
    selectedDeviceId,
    activityFeed: Array.isArray(source.activityFeed)
      ? source.activityFeed.map((item, index) => normalizeActivity(item, index))
      : defaultActivityFeed,
    notifications: Array.isArray(source.notifications)
      ? source.notifications.map((item) => normalizeNotification(item))
      : defaultNotifications,
    automation: normalizeAutomation(source.automation),
    settings: normalizeSettings(source.settings),
    session:
      source.session && typeof source.session === "object"
        ? {
            signedIn:
              typeof source.session.signedIn === "boolean"
                ? source.session.signedIn
                : defaultSession.signedIn,
            userName:
              typeof source.session.userName === "string"
                ? source.session.userName
                : defaultSession.userName,
            email:
              typeof source.session.email === "string"
                ? source.session.email
                : defaultSession.email,
          }
        : defaultSession,
    searchQuery: "",
  };
}

function getStoredState(): PersistedState {
  if (typeof window === "undefined") return defaultPersistedState;

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem("greencloud-app-state-v10") ||
      window.localStorage.getItem("greencloud-app-state-final-v9") ||
      window.localStorage.getItem("greencloud-app-state-ultra-v5");

    if (!raw) return defaultPersistedState;

    return normalizePersistedState(JSON.parse(raw));
  } catch {
    return defaultPersistedState;
  }
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] =
    useState<PersistedState>(defaultPersistedState);

  const [authUser, setAuthUser] = useState<GreenCloudAuthUser | null>(null);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickPanelOpen, setQuickPanelOpen] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  const currentUserId = authUser?.uid ?? "";

  const {
    devices,
    selectedDeviceId,
    activityFeed,
    notifications,
    automation,
    settings,
    session,
    searchQuery,
  } = appState;

  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ??
    devices[0] ??
    fallbackDevice;

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const filteredActivity = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return activityFeed;

    return activityFeed.filter((item) => {
      const text =
        `${item.title} ${item.description} ${item.body ?? ""} ${item.status}`.toLowerCase();
      return text.includes(query);
    });
  }, [activityFeed, searchQuery]);

  const pushActivity = useCallback(
    (item: Omit<ActivityItem, "id" | "time" | "body"> & { body?: string }) => {
      const description = item.description;

      const nextItem: ActivityItem = {
        id: createId("activity"),
        title: item.title,
        description,
        body: item.body ?? description,
        status: item.status,
        time: nowTimeLabel(),
        deviceId: item.deviceId,
      };

      setAppState((current) => ({
        ...current,
        activityFeed: [nextItem, ...current.activityFeed].slice(0, 80),
      }));

      if (currentUserId) {
        void pushActivityToFirebase(currentUserId, nextItem);
      }
    },
    [currentUserId],
  );

  const pushNotification = useCallback(
    (item: Omit<NotificationItem, "id" | "createdAt" | "description"> & {
      description?: string;
    }) => {
      const message = item.description ?? item.body;

      const nextNotification: NotificationItem = {
        id: createId("notification"),
        title: item.title,
        body: item.body,
        description: message,
        read: item.read,
        createdAt: "now",
      };

      setAppState((current) => ({
        ...current,
        notifications: [nextNotification, ...current.notifications].slice(
          0,
          50,
        ),
      }));

      if (currentUserId) {
        void pushNotificationToFirebase(currentUserId, nextNotification);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setAuthUser(user);

      setAppState((current) => ({
        ...current,
        session: user
          ? {
              signedIn: true,
              userName: user.displayName || "Operator",
              email: user.email || "",
            }
          : defaultSession,
      }));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      setAppState((current) => ({
        ...getStoredState(),
        session: current.session,
      }));
      setHasLoadedStorage(true);
    }, 0);

    const bootTimer = window.setTimeout(() => {
      setIsBootLoading(false);
    }, 420);

    return () => {
      window.clearTimeout(storageTimer);
      window.clearTimeout(bootTimer);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.theme = settings.themePreset;
    root.dataset.compact = settings.compactMode ? "true" : "false";
    root.dataset.motion = settings.animations ? "on" : "off";
    root.dataset.ambience = settings.leafAmbience
      ? settings.ambienceMode
      : "calm";
  }, [
    settings.ambienceMode,
    settings.animations,
    settings.compactMode,
    settings.leafAmbience,
    settings.themePreset,
  ]);

  useEffect(() => {
    if (!hasLoadedStorage) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      // Private mode or quota errors can block localStorage.
    }
  }, [appState, hasLoadedStorage]);

  useEffect(() => {
    if (!currentUserId) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    async function connectFirebase() {
      try {
        await seedGreenCloudIfEmpty(currentUserId, {
          devices: defaultDevices,
          selectedDeviceId: "",
          automation: defaultAutomation,
          settings: defaultSettings,
          activityFeed: defaultActivityFeed,
          notifications: defaultNotifications,
        });

        if (cancelled) return;

        unsubscribe = subscribeToGreenCloudState(currentUserId, (firebaseState) => {
          if (cancelled) return;

          setAppState((current) => {
            const firebaseDevices = Array.isArray(firebaseState.devices)
              ? firebaseState.devices.map((device, index) =>
                  normalizeDevice(device, index),
                )
              : current.devices;

            const firebaseSelectedDeviceId =
              firebaseState.selectedDeviceId &&
              firebaseDevices.some(
                (device) => device.id === firebaseState.selectedDeviceId,
              )
                ? firebaseState.selectedDeviceId
                : firebaseDevices.some(
                      (device) => device.id === current.selectedDeviceId,
                    )
                  ? current.selectedDeviceId
                  : firebaseDevices[0]?.id ?? "";

            return {
              ...current,
              devices: firebaseDevices,
              selectedDeviceId: firebaseSelectedDeviceId,
              automation: firebaseState.automation
                ? normalizeAutomation(firebaseState.automation)
                : current.automation,
              settings: firebaseState.settings
                ? normalizeSettings(firebaseState.settings)
                : current.settings,
              activityFeed: Array.isArray(firebaseState.activityFeed)
                ? firebaseState.activityFeed.map((item, index) =>
                    normalizeActivity(item, index),
                  )
                : current.activityFeed,
              notifications: Array.isArray(firebaseState.notifications)
                ? firebaseState.notifications.map((item) =>
                    normalizeNotification(item),
                  )
                : current.notifications,
            };
          });
        });
      } catch (error) {
        console.error("GreenCloud Firebase connection failed:", error);
      }
    }

    void connectFirebase();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [currentUserId]);

  const getDeviceFromCurrentRender = useCallback(
    (deviceId?: string) => {
      const targetId = deviceId ?? selectedDevice.id;
      const target =
        devices.find((device) => device.id === targetId) ?? selectedDevice;

      return {
        target,
        targetId: target.id,
        targetName: target.name,
      };
    },
    [devices, selectedDevice],
  );

  const selectDevice = useCallback(
    (deviceId: string) => {
      setAppState((current) => {
        if (!current.devices.some((device) => device.id === deviceId)) {
          return current;
        }

        return {
          ...current,
          selectedDeviceId: deviceId,
        };
      });

      if (currentUserId) {
        void writeSelectedDeviceIdToFirebase(currentUserId, deviceId);
      }
    },
    [currentUserId],
  );

  const pairDeviceByCode = useCallback(
    async (code: string, name?: string, place?: string) => {
      const safeCode = normalizePairingCode(code);

      if (!currentUserId) {
        const message = "Sign in before pairing a device.";

        pushNotification({
          title: "Sign in required",
          body: message,
          read: false,
        });

        throw new Error(message);
      }

      if (safeCode.length !== 7) {
        const message = "Enter the 7-character code shown on the ESP32 OLED.";

        pushNotification({
          title: "Invalid pairing code",
          body: message,
          read: false,
        });

        throw new Error(message);
      }

      try {
        const pairedDevice = await pairDeviceToUserInFirebase(
          currentUserId,
          safeCode,
          {
            name,
            place,
          },
        );

        const normalized = normalizeDevice(pairedDevice, 0);

        setAppState((current) => {
          const withoutDuplicate = current.devices.filter(
            (device) => device.id !== normalized.id,
          );

          return {
            ...current,
            devices: [normalized, ...withoutDuplicate],
            selectedDeviceId: normalized.id,
          };
        });

        pushActivity({
          title: "Device paired",
          description: `${normalized.name} was paired with this account using the OLED code.`,
          body: `${normalized.name} was paired with this account using the OLED code.`,
          status: "Completed",
          deviceId: normalized.id,
        });

        pushNotification({
          title: "Device paired",
          body: `${normalized.name} is ready for live monitoring.`,
          description: `${normalized.name} is ready for live monitoring.`,
          read: false,
        });

        return normalized;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Pairing failed. Check the OLED code and try again.";

        console.error("PAIR DEVICE ERROR:", error);

        pushNotification({
          title: "Pairing failed",
          body: message,
          read: false,
        });

        throw new Error(message);
      }
    },
    [currentUserId, pushActivity, pushNotification],
  );

  const createDevicePairingCode = useCallback(
    async () => {
      pushNotification({
        title: "Pairing code comes from the device",
        body: "Power on the ESP32 and enter the 7-character code shown on the OLED.",
        read: false,
      });

      return null;
    },
    [pushNotification],
  );

  const addDevice = useCallback(
    (name: string, place: string) => {
      const cleanName = name.trim() || "New device";
      const cleanPlace = place.trim() || "Unassigned plant zone";

      pushNotification({
        title: "Use the OLED pairing code",
        body: `To add ${cleanName}, power on the ESP32 and enter the 7-character OLED code. Plant zone can be saved as ${cleanPlace} while pairing.`,
        read: false,
      });

      pushActivity({
        title: "Device pairing requested",
        description:
          "GreenCloud now uses device-first pairing. The ESP32 creates the code; the web app only attaches that code to your account.",
        body:
          "GreenCloud now uses device-first pairing. The ESP32 creates the code; the web app only attaches that code to your account.",
        status: "Info",
      });
    },
    [pushActivity, pushNotification],
  );

  const updateDevice = useCallback(
    (deviceId: string, patch: Partial<Device>) => {
      const target = devices.find((device) => device.id === deviceId);

      const safePatch: Partial<Device> = {
        ...patch,
        location: patch.location ?? patch.place ?? target?.location,
        updatedAt: patch.updatedAt ?? "just now",
      };

      setAppState((current) => ({
        ...current,
        devices: current.devices.map((device) =>
          device.id === deviceId
            ? normalizeDevice(
                {
                  ...device,
                  ...safePatch,
                },
                0,
              )
            : device,
        ),
      }));

      if (!currentUserId) return;

      void patchDeviceInFirebase(currentUserId, deviceId, safePatch);

      void pushActivityToFirebase(currentUserId, {
        title: "Device updated",
        description: `${target?.name ?? "Device"} details were updated.`,
        body: `${target?.name ?? "Device"} details were updated.`,
        status: "Completed",
        time: nowTimeLabel(),
        deviceId,
      });
    },
    [currentUserId, devices],
  );

  const removeDevice = useCallback(
    (deviceId: string) => {
      const target = devices.find((device) => device.id === deviceId);
      const removedName = target?.name ?? "Device";

      let nextSelectedDeviceId = "";

      setAppState((current) => {
        const nextDevices = current.devices.filter(
          (device) => device.id !== deviceId,
        );

        nextSelectedDeviceId =
          current.selectedDeviceId === deviceId
            ? nextDevices[0]?.id ?? ""
            : current.selectedDeviceId;

        return {
          ...current,
          devices: nextDevices,
          selectedDeviceId: nextSelectedDeviceId,
        };
      });

      pushActivity({
        title: "Device removed",
        description: `${removedName} was removed from this account. If the ESP32 is online, it should reset pairing and show a new code.`,
        body: `${removedName} was removed from this account. If the ESP32 is online, it should reset pairing and show a new code.`,
        status: "Completed",
        deviceId,
      });

      pushNotification({
        title: "Device removed",
        body: `${removedName} is no longer connected to this account.`,
        description: `${removedName} is no longer connected to this account.`,
        read: false,
      });

      if (!currentUserId) return;

      void removeDeviceFromFirebase(currentUserId, deviceId).catch((error) => {
        console.error("REMOVE DEVICE ERROR:", error);

        pushNotification({
          title: "Device remove failed",
          body:
            error instanceof Error
              ? error.message
              : "Device could not be removed from Firebase.",
          read: false,
        });
      });

      if (nextSelectedDeviceId) {
        void writeSelectedDeviceIdToFirebase(currentUserId, nextSelectedDeviceId);
      }
    },
    [
      currentUserId,
      devices,
      pushActivity,
      pushNotification,
    ],
  );

  const startIrrigation = useCallback(
    (deviceId?: string) => {
      const { target, targetId, targetName } =
        getDeviceFromCurrentRender(deviceId);

      if (!devices.some((device) => device.id === targetId)) {
        pushNotification({
          title: "No device selected",
          body: "Pair a device before sending irrigation commands.",
          read: false,
        });

        return;
      }

      const safeMode = target.safeMode ?? true;
      const pumpEnabled = target.pumpEnabled ?? false;
      const realPumpAllowed = !safeMode && pumpEnabled;

      const requestId = `irrigate-${Date.now()}`;
      const wateredAt = realPumpAllowed
        ? `Today · ${nowTimeLabel()}`
        : target.lastWateredAt;

      const localPatch: Partial<Device> = {
        lastCommand: requestId,
        lastCommandStatus: safeMode || !pumpEnabled ? "Dry-run" : "Pending",
        relayState: safeMode || !pumpEnabled ? "Locked" : "Enabled",
        pumpState: safeMode || !pumpEnabled ? "Dry-run" : "Ready",
        safeMode,
        pumpEnabled,
        updatedAt: "just now",
        lastWateredAt: wateredAt,
      };

      setAppState((current) => ({
        ...current,
        selectedDeviceId: targetId,
        devices: current.devices.map((device) =>
          device.id === targetId
            ? normalizeDevice(
                {
                  ...device,
                  ...localPatch,
                },
                0,
              )
            : device,
        ),
      }));

      pushActivity({
        title: realPumpAllowed
          ? "Irrigation command sent"
          : "Protected command sent",
        description: realPumpAllowed
          ? `${targetName} received a pump command.`
          : `${targetName} received a command while pump protection is active.`,
        body: realPumpAllowed
          ? `${targetName} received a pump command.`
          : `${targetName} received a command while pump protection is active.`,
        status: "Manual",
        deviceId: targetId,
      });

      pushNotification({
        title: realPumpAllowed ? "Pump command sent" : "Command protected",
        body: realPumpAllowed
          ? `${targetName} pump command was sent.`
          : `${targetName} command was recorded while pump protection is active.`,
        description: realPumpAllowed
          ? `${targetName} pump command was sent.`
          : `${targetName} command was recorded while pump protection is active.`,
        read: false,
      });

      if (!currentUserId) return;

      void writeSelectedDeviceIdToFirebase(currentUserId, targetId);

      void writeIrrigationCommandToFirebase(
        currentUserId,
        targetId,
        automation.pumpDurationSeconds,
        {
          source: "web",
          safeMode,
          pumpEnabled,
        },
      );

      void patchDeviceInFirebase(currentUserId, targetId, localPatch);
    },
    [
      automation.pumpDurationSeconds,
      currentUserId,
      devices,
      getDeviceFromCurrentRender,
      pushActivity,
      pushNotification,
    ],
  );

  const simulateThresholdEvent = useCallback(
    (deviceId?: string) => {
      const { target, targetId, targetName } =
        getDeviceFromCurrentRender(deviceId);

      if (!devices.some((device) => device.id === targetId)) {
        pushNotification({
          title: "No device selected",
          body: "Pair a device before running automation checks.",
          read: false,
        });

        return;
      }

      const isBelowThreshold = target.moisture <= automation.moistureThreshold;

      const title = isBelowThreshold
        ? "Dry-risk rule check"
        : "Rule check completed";

      const description = isBelowThreshold
        ? `${targetName} is below the configured irrigation threshold.`
        : `${targetName} is above the configured irrigation threshold. Current moisture is ${target.moisture}%.`;

      setAppState((current) => ({
        ...current,
        selectedDeviceId: targetId,
      }));

      if (currentUserId) {
        void writeSelectedDeviceIdToFirebase(currentUserId, targetId);
      }

      pushActivity({
        title,
        description,
        body: description,
        status: isBelowThreshold ? "Waiting" : "Info",
        deviceId: targetId,
      });

      pushNotification({
        title: isBelowThreshold ? "Dry-risk detected" : "Rule check completed",
        body: description,
        description,
        read: false,
      });
    },
    [
      automation.moistureThreshold,
      currentUserId,
      devices,
      getDeviceFromCurrentRender,
      pushActivity,
      pushNotification,
    ],
  );

  const refreshTelemetry = useCallback(
    (deviceId?: string) => {
      const { targetId, targetName } = getDeviceFromCurrentRender(deviceId);

      if (!devices.some((device) => device.id === targetId)) {
        pushNotification({
          title: "No device selected",
          body: "Pair a device before refreshing telemetry.",
          read: false,
        });

        return;
      }

      setAppState((current) => ({
        ...current,
        selectedDeviceId: targetId,
        devices: current.devices.map((device) =>
          device.id === targetId
            ? normalizeDevice(
                {
                  ...device,
                  status: "Syncing",
                  updatedAt: "just now",
                  sensorStatus: "Syncing",
                },
                0,
              )
            : device,
        ),
      }));

      pushActivity({
        title: "Telemetry refresh requested",
        description: `${targetName} refresh was requested. Live values are expected from the paired device.`,
        body: `${targetName} refresh was requested. Live values are expected from the paired device.`,
        status: "Info",
        deviceId: targetId,
      });

      if (!currentUserId) return;

      void writeSelectedDeviceIdToFirebase(currentUserId, targetId);

      void patchDeviceInFirebase(currentUserId, targetId, {
        status: "Syncing",
        sensorStatus: "Syncing",
        updatedAt: "just now",
      });
    },
    [
      currentUserId,
      devices,
      getDeviceFromCurrentRender,
      pushActivity,
      pushNotification,
    ],
  );

  const updateAutomation = useCallback(
    (
      keyOrPatch: keyof AutomationState | Partial<AutomationState>,
      value?: AutomationState[keyof AutomationState],
    ) => {
      const patch =
        typeof keyOrPatch === "string"
          ? ({ [keyOrPatch]: value } as Partial<AutomationState>)
          : keyOrPatch;

      const quietHoursStart =
        patch.quietHoursStart ?? patch.quietStart ?? automation.quietHoursStart;

      const quietHoursEnd =
        patch.quietHoursEnd ?? patch.quietEnd ?? automation.quietHoursEnd;

      const manualOverrideEnabled =
        patch.manualOverrideEnabled ??
        patch.manualOverride ??
        automation.manualOverrideEnabled;

      const nextAutomation: AutomationState = {
        ...automation,
        ...patch,
        moistureThreshold:
          typeof patch.moistureThreshold === "number"
            ? clamp(patch.moistureThreshold, 10, 90)
            : automation.moistureThreshold,
        cooldownMinutes:
          typeof patch.cooldownMinutes === "number"
            ? clamp(patch.cooldownMinutes, 1, 180)
            : automation.cooldownMinutes,
        pumpDurationSeconds:
          typeof patch.pumpDurationSeconds === "number"
            ? clamp(patch.pumpDurationSeconds, 1, 60)
            : automation.pumpDurationSeconds,
        quietHoursStart,
        quietHoursEnd,
        quietStart: quietHoursStart,
        quietEnd: quietHoursEnd,
        manualOverrideEnabled,
        manualOverride: manualOverrideEnabled,
      };

      setAppState((current) => ({
        ...current,
        automation: nextAutomation,
      }));

      if (currentUserId) {
        void patchAutomationInFirebase(currentUserId, {
          ...patch,
          moistureThreshold: nextAutomation.moistureThreshold,
          cooldownMinutes: nextAutomation.cooldownMinutes,
          pumpDurationSeconds: nextAutomation.pumpDurationSeconds,
          quietHoursStart: nextAutomation.quietHoursStart,
          quietHoursEnd: nextAutomation.quietHoursEnd,
          quietStart: nextAutomation.quietStart,
          quietEnd: nextAutomation.quietEnd,
          manualOverrideEnabled: nextAutomation.manualOverrideEnabled,
          manualOverride: nextAutomation.manualOverride,
        });
      }
    },
    [automation, currentUserId],
  ) as AppStateContextValue["updateAutomation"];

  const resetAutomation = useCallback(() => {
    setAppState((current) => ({
      ...current,
      automation: defaultAutomation,
    }));

    pushActivity({
      title: "Automation reset",
      description: "Automation values returned to the protected default profile.",
      body: "Automation values returned to the protected default profile.",
      status: "Completed",
      deviceId: selectedDevice.id,
    });

    if (currentUserId) {
      void writeAutomationToFirebase(currentUserId, defaultAutomation);
    }
  }, [currentUserId, pushActivity, selectedDevice.id]);

  const updateSettings = useCallback(
    (patch: Partial<SettingsState>) => {
      setAppState((current) => {
        const themePreset = normalizeTheme(
          patch.themePreset ?? patch.theme ?? current.settings.themePreset,
        );

        const notificationMode = normalizeNotificationMode(
          patch.notificationMode ??
            patch.notifications ??
            current.settings.notificationMode,
        );

        const leafAmbience =
          typeof patch.leafAmbience === "boolean"
            ? patch.leafAmbience
            : typeof patch.leafFx === "boolean"
              ? patch.leafFx
              : current.settings.leafAmbience;

        const mainPlantLabel =
          patch.mainPlantLabel ??
          patch.plantLabel ??
          current.settings.mainPlantLabel;

        const nextSettings: SettingsState = {
          ...current.settings,
          ...patch,
          themePreset,
          theme: themePreset,
          notificationMode,
          notifications: notificationMode,
          leafAmbience,
          leafFx: leafAmbience,
          ambienceMode: normalizeAmbience(
            patch.ambienceMode ?? current.settings.ambienceMode,
          ),
          mainPlantLabel,
          plantLabel: mainPlantLabel,
        };

        if (currentUserId) {
          void patchSettingsInFirebase(currentUserId, {
            ...patch,
            themePreset: nextSettings.themePreset,
            theme: nextSettings.theme,
            notificationMode: nextSettings.notificationMode,
            notifications: nextSettings.notifications,
            leafAmbience: nextSettings.leafAmbience,
            leafFx: nextSettings.leafFx,
            ambienceMode: nextSettings.ambienceMode,
            mainPlantLabel: nextSettings.mainPlantLabel,
            plantLabel: nextSettings.plantLabel,
          });
        }

        return {
          ...current,
          settings: nextSettings,
        };
      });
    },
    [currentUserId],
  );

  const updateSetting = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      updateSettings({ [key]: value } as Partial<SettingsState>);
    },
    [updateSettings],
  );

  const resetSettings = useCallback(() => {
    setAppState((current) => ({
      ...current,
      settings: defaultSettings,
    }));

    if (currentUserId) {
      void writeSettingsToFirebase(currentUserId, defaultSettings);
    }
  }, [currentUserId]);

  const saveWorkspaceIdentity = useCallback(
    (payload: WorkspaceIdentityPayload) => {
      let nextSettingsForFirebase: SettingsState | null = null;

      setAppState((current) => {
        const nextSettings = normalizeSettings({
          ...current.settings,
          ...payload,
          plantLabel: payload.mainPlantLabel,
        });

        nextSettingsForFirebase = nextSettings;

        return {
          ...current,
          settings: nextSettings,
        };
      });

      if (currentUserId && nextSettingsForFirebase) {
        void writeSettingsToFirebase(currentUserId, nextSettingsForFirebase);
      }

      pushActivity({
        title: "Workspace identity saved",
        description: "Workspace profile was updated.",
        body: "Workspace profile was updated.",
        status: "Completed",
        deviceId: selectedDevice.id,
      });
    },
    [currentUserId, pushActivity, selectedDevice.id],
  );

  const setSearchQuery = useCallback((query: string) => {
    setAppState((current) => ({
      ...current,
      searchQuery: query,
    }));
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setAppState((current) => ({
      ...current,
      searchQuery: query,
    }));
  }, []);

  const openNotifications = useCallback(() => {
    setNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setAppState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    }));

    if (currentUserId) {
      void markAllNotificationsReadInFirebase(currentUserId, notifications);
    }
  }, [currentUserId, notifications]);

  const openQuickPanel = useCallback(() => {
    setQuickPanelOpen(true);
  }, []);

  const closeQuickPanel = useCallback(() => {
    setQuickPanelOpen(false);
  }, []);

  const toggleQuickPanel = useCallback(() => {
    setQuickPanelOpen((current) => !current);
  }, []);

  const clearActivity = useCallback(() => {
    setAppState((current) => ({
      ...current,
      activityFeed: [],
    }));

    if (currentUserId) {
      void clearActivityFeedInFirebase(currentUserId);
    }
  }, [currentUserId]);

  const loginToWorkspace = useCallback(
    (name: string, email: string) => {
      const cleanName = name.trim() || "Operator";
      const cleanEmail = email.trim() || "operator@greencloud.local";

      setAppState((current) => ({
        ...current,
        session: {
          signedIn: true,
          userName: cleanName,
          email: cleanEmail,
        },
      }));

      pushActivity({
        title: "Workspace unlocked",
        description: `Welcome back, ${cleanName}.`,
        body: `Welcome back, ${cleanName}.`,
        status: "Completed",
        deviceId: selectedDevice.id,
      });

      pushNotification({
        title: "Workspace unlocked",
        body: `Welcome back, ${cleanName}.`,
        read: false,
      });
    },
    [pushActivity, pushNotification, selectedDevice.id],
  );

    const updateProfileName = useCallback(
    async (displayName: string) => {
      const cleanName = displayName.trim();

      if (!cleanName) {
        throw new Error("Profile name is required.");
      }

      const updatedUser = await updateCurrentUserDisplayName(cleanName);

      setAuthUser((current) =>
        current
          ? {
              ...current,
              displayName: cleanName,
              email: updatedUser.email ?? current.email,
            }
          : {
              uid: updatedUser.uid,
              email: updatedUser.email,
              displayName: cleanName,
            },
      );

      setAppState((current) => {
        const nextSettings = normalizeSettings({
          ...current.settings,
          ownerName: cleanName,
        });

        return {
          ...current,
          settings: nextSettings,
          session: {
            ...current.session,
            signedIn: true,
            userName: cleanName,
            email: updatedUser.email || current.session.email,
          },
        };
      });

      if (currentUserId) {
        const nextSettings = normalizeSettings({
          ...settings,
          ownerName: cleanName,
        });

        await writeSettingsToFirebase(currentUserId, nextSettings);
      }

      pushActivity({
        title: "Profile updated",
        description: `${cleanName} updated the GreenCloud profile name.`,
        body: `${cleanName} updated the GreenCloud profile name.`,
        status: "Completed",
        deviceId: selectedDevice.id,
      });

      pushNotification({
        title: "Profile updated",
        body: `Your profile name is now ${cleanName}.`,
        description: `Your profile name is now ${cleanName}.`,
        read: false,
      });
    },
    [
      currentUserId,
      pushActivity,
      pushNotification,
      selectedDevice.id,
      settings,
    ],
  );

  const logoutFromWorkspace = useCallback(() => {
    setAppState((current) => ({
      ...current,
      session: defaultSession,
    }));

    pushActivity({
      title: "Workspace locked",
      description: "The workspace session was closed.",
      body: "The workspace session was closed.",
      status: "Info",
      deviceId: selectedDevice.id,
    });
  }, [pushActivity, selectedDevice.id]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      devices,
      selectedDevice,
      selectedDeviceId,

      activityFeed,
      filteredActivity,

      notifications,
      unreadNotifications,

      automation,
      settings,
      session,

      searchQuery,
      notificationsOpen,
      quickPanelOpen,
      isBootLoading,

      selectDevice,
      addDevice,
      pairDeviceByCode,
      createDevicePairingCode,
      updateDevice,
      removeDevice,

      startIrrigation,
      simulateThresholdEvent,
      refreshTelemetry,

      updateAutomation,
      resetAutomation,

      updateSettings,
      updateSetting,
      resetSettings,
      saveWorkspaceIdentity,

      setSearchQuery,
      updateSearchQuery,

      openNotifications,
      closeNotifications,
      markAllNotificationsRead,

      openQuickPanel,
      closeQuickPanel,
      toggleQuickPanel,

      clearActivity,

      loginToWorkspace,
      updateProfileName,
      logoutFromWorkspace,
    }),
    [
      devices,
      selectedDevice,
      selectedDeviceId,
      activityFeed,
      filteredActivity,
      notifications,
      unreadNotifications,
      automation,
      settings,
      session,
      searchQuery,
      notificationsOpen,
      quickPanelOpen,
      isBootLoading,
      selectDevice,
      addDevice,
      pairDeviceByCode,
      createDevicePairingCode,
      updateDevice,
      removeDevice,
      startIrrigation,
      simulateThresholdEvent,
      refreshTelemetry,
      updateAutomation,
      resetAutomation,
      updateSettings,
      updateSetting,
      resetSettings,
      saveWorkspaceIdentity,
      setSearchQuery,
      updateSearchQuery,
      openNotifications,
      closeNotifications,
      markAllNotificationsRead,
      openQuickPanel,
      closeQuickPanel,
      toggleQuickPanel,
      clearActivity,
      loginToWorkspace,
      updateProfileName,
      logoutFromWorkspace,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return context;
}