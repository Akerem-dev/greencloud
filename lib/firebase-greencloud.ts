import {
  get,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type DataSnapshot,
} from "firebase/database";
import { GREENCLOUD_ROOT, realtimeDatabase } from "@/lib/firebase";
import type {
  ActivityItem,
  AutomationState,
  Device,
  NotificationItem,
  SettingsState,
} from "@/components/providers/app-state-provider";

export type HardwareStatus =
  | "Sensor check"
  | "Dry risk"
  | "No signal"
  | "Syncing"
  | "Pending"
  | "Active"
  | "Locked"
  | "Dry-run"
  | "Ready"
  | "Detected"
  | "Clear"
  | "Low"
  | "Empty"
  | "OK"
  | "Pressed"
  | "Released"
  | "Blocked"
  | "Handled"
  | "None";

export type DeviceHardwareFields = {
  rawSoil?: number;
  soilVoltage?: number;

  temperature?: number;
  pressure?: number;
  humidity?: number;

  safeMode?: boolean;
  pumpEnabled?: boolean;

  relayState?: "Locked" | "Enabled" | "Off" | "On" | "Pending";
  pumpState?: "Dry-run" | "Ready" | "Running" | "Stopped" | "Blocked";

  rainDetected?: boolean;
  rainStatus?: "Pending" | "Clear" | "Detected" | "Sensor check";

  waterLevel?: number;
  waterLevelStatus?: "Pending" | "OK" | "Low" | "Empty" | "Sensor check";

  buttonPressed?: boolean;
  buttonStatus?: "Pending" | "Ready" | "Pressed" | "Released";

  oledStatus?: "Active" | "Pending" | "Off";
  firmware?: string;
  lastSeenMs?: number;

  power?: string;

  lastCommand?: string;
  lastCommandStatus?: "None" | "Pending" | "Handled" | "Dry-run" | "Blocked";

  pairingCode?: string;
  pairedAt?: string;
  ownerUid?: string;
};

export type GreenCloudDevice = Device & DeviceHardwareFields;

export type DevicePatch = Partial<Device> & Partial<DeviceHardwareFields>;

export type IrrigationCommandStatus =
  | "pending"
  | "handled"
  | "blocked"
  | "dry-run";

export type CommandPayload = {
  type: "IRRIGATE" | "FACTORY_RESET";
  factoryReset?: boolean;

  irrigate: boolean;
  durationSeconds: number;
  requestId: string;
  createdAt: string;

  source: "web" | "automation" | "esp32";
  safeMode: boolean;
  pumpEnabled: boolean;

  handled: boolean;
  handledAt?: string;
  handledBy?: string;
  status: IrrigationCommandStatus;
};

export type DevicePairingRecord = {
  code: string;
  deviceId: string;
  ownerUid?: string;
  deviceAuthUid?: string;
  status: "available" | "paired" | "expired";
  createdAt: string;
  expiresAt?: string;
  pairedAt?: string;
  firmware?: string;
  lastSeenMs?: number;
};

export type DeviceDataRecord = Partial<GreenCloudDevice> & {
  deviceId?: string;
  deviceAuthUid?: string;
  factoryResetRequested?: boolean;
  deletedFromWeb?: boolean;
};

export type GreenCloudFirebaseState = {
  devices: Device[];
  selectedDeviceId: string;
  automation: Partial<AutomationState> | null;
  settings: Partial<SettingsState> | null;
  activityFeed: ActivityItem[];
  notifications: NotificationItem[];
  commands: Record<string, CommandPayload>;
  pairings: Record<string, DevicePairingRecord>;
};

type SeedPayload = {
  devices: Device[];
  selectedDeviceId: string;
  automation: AutomationState;
  settings: SettingsState;
  activityFeed: ActivityItem[];
  notifications: NotificationItem[];
};

const GREENCLOUD_SCHEMA_VERSION = 9;
const PAIRING_CODE_LENGTH = 7;

function isoNow() {
  return new Date().toISOString();
}

function assertUserId(userId: string) {
  if (!userId.trim()) {
    throw new Error("GreenCloud userId is required for Firebase operations.");
  }
}

function assertDeviceId(deviceId: string) {
  if (!deviceId.trim()) {
    throw new Error("GreenCloud deviceId is required for Firebase operations.");
  }
}

function userRootPath(userId: string) {
  assertUserId(userId);
  return `${GREENCLOUD_ROOT}/users/${userId}`;
}

function globalPairingsPath() {
  return `${GREENCLOUD_ROOT}/pairings`;
}

function userPairingsPath(userId: string) {
  return `${userRootPath(userId)}/pairings`;
}

function deviceDataPath(deviceId: string) {
  assertDeviceId(deviceId);
  return `${GREENCLOUD_ROOT}/deviceData/${deviceId}`;
}

function deviceCommandPath(deviceId: string) {
  assertDeviceId(deviceId);
  return `${GREENCLOUD_ROOT}/deviceCommands/${deviceId}`;
}

function greencloudUserRef(userId: string) {
  return ref(realtimeDatabase, userRootPath(userId));
}

function greencloudUserPath(userId: string, path: string) {
  return ref(realtimeDatabase, `${userRootPath(userId)}/${path}`);
}

function greencloudGlobalPath(path: string) {
  return ref(realtimeDatabase, `${GREENCLOUD_ROOT}/${path}`);
}

function greencloudDeviceDataRef(deviceId: string) {
  return ref(realtimeDatabase, deviceDataPath(deviceId));
}

function greencloudDeviceCommandRef(deviceId: string) {
  return ref(realtimeDatabase, deviceCommandPath(deviceId));
}

function normalizeNumber(value: unknown, fallback?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeString(value: unknown, fallback?: string) {
  return typeof value === "string" ? value : fallback;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefinedDeep(item)]),
    ) as T;
  }

  return value;
}

export function normalizePairingCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

function normalizeDeviceHardwareFields(
  device: Partial<GreenCloudDevice>,
): DeviceHardwareFields {
  const safeMode = normalizeBoolean(device.safeMode, true);
  const pumpEnabled = normalizeBoolean(device.pumpEnabled, false);

  const relayState =
    device.relayState === "Enabled" ||
    device.relayState === "Off" ||
    device.relayState === "On" ||
    device.relayState === "Pending" ||
    device.relayState === "Locked"
      ? device.relayState
      : safeMode || !pumpEnabled
        ? "Locked"
        : "Enabled";

  const pumpState =
    device.pumpState === "Ready" ||
    device.pumpState === "Running" ||
    device.pumpState === "Stopped" ||
    device.pumpState === "Blocked" ||
    device.pumpState === "Dry-run"
      ? device.pumpState
      : safeMode || !pumpEnabled
        ? "Dry-run"
        : "Ready";

  return stripUndefinedDeep({
    rawSoil: normalizeNumber(device.rawSoil),
    soilVoltage: normalizeNumber(device.soilVoltage),

    temperature: normalizeNumber(device.temperature),
    pressure: normalizeNumber(device.pressure),
    humidity: normalizeNumber(device.humidity),

    safeMode,
    pumpEnabled,

    relayState,
    pumpState,

    rainDetected: normalizeBoolean(device.rainDetected, false),
    rainStatus:
      device.rainStatus === "Clear" ||
      device.rainStatus === "Detected" ||
      device.rainStatus === "Sensor check" ||
      device.rainStatus === "Pending"
        ? device.rainStatus
        : "Pending",

    waterLevel: normalizeNumber(device.waterLevel),
    waterLevelStatus:
      device.waterLevelStatus === "OK" ||
      device.waterLevelStatus === "Low" ||
      device.waterLevelStatus === "Empty" ||
      device.waterLevelStatus === "Sensor check" ||
      device.waterLevelStatus === "Pending"
        ? device.waterLevelStatus
        : "Pending",

    buttonPressed: normalizeBoolean(device.buttonPressed, false),
    buttonStatus:
      device.buttonStatus === "Ready" ||
      device.buttonStatus === "Pressed" ||
      device.buttonStatus === "Released" ||
      device.buttonStatus === "Pending"
        ? device.buttonStatus
        : "Pending",

    oledStatus:
      device.oledStatus === "Pending" ||
      device.oledStatus === "Off" ||
      device.oledStatus === "Active"
        ? device.oledStatus
        : "Pending",

    firmware: normalizeString(device.firmware, "greencloud-esp32"),
    lastSeenMs: normalizeNumber(device.lastSeenMs),

    power: normalizeString(device.power, "USB / Adapter"),

    lastCommand: normalizeString(device.lastCommand, "None"),
    lastCommandStatus:
      device.lastCommandStatus === "Pending" ||
      device.lastCommandStatus === "Handled" ||
      device.lastCommandStatus === "Dry-run" ||
      device.lastCommandStatus === "Blocked" ||
      device.lastCommandStatus === "None"
        ? device.lastCommandStatus
        : "None",

    pairingCode: normalizeString(device.pairingCode),
    pairedAt: normalizeString(device.pairedAt),
    ownerUid: normalizeString(device.ownerUid),
  });
}

function normalizeDeviceBase(
  key: string,
  device: Partial<GreenCloudDevice>,
): Device {
  const hardware = normalizeDeviceHardwareFields(device);

  const status =
    device.status === "Online" ||
    device.status === "Syncing" ||
    device.status === "Idle" ||
    device.status === "Offline"
      ? device.status
      : "Idle";

  const name = normalizeString(device.name, "GreenCloud Device");

  const place = normalizeString(
    device.place,
    normalizeString(device.location, "Plant zone"),
  );

  return stripUndefinedDeep({
    ...device,
    ...hardware,

    id: normalizeString(device.id, key) ?? key,
    name: name ?? "GreenCloud Device",
    place: place ?? "Plant zone",
    location: normalizeString(device.location, place) ?? "Plant zone",

    status,

    moisture: normalizeNumber(device.moisture, 0) ?? 0,
    signal: normalizeNumber(device.signal, 0) ?? 0,

    updatedAt:
      normalizeString(device.updatedAt, "Waiting for device") ??
      "Waiting for device",
    lastWateredAt: normalizeString(device.lastWateredAt, "Not watered yet"),
  }) as Device;
}

function recordToDeviceArray(value: unknown): Device[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, Partial<GreenCloudDevice>>).map(
    ([key, device]) => normalizeDeviceBase(key, device),
  );
}

function recordToActivityArray(value: unknown): ActivityItem[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, Partial<ActivityItem>>)
    .map(
      ([key, item]) =>
        stripUndefinedDeep({
          ...item,
          id: typeof item.id === "string" ? item.id : key,
        }) as ActivityItem,
    )
    .reverse();
}

function recordToNotificationArray(value: unknown): NotificationItem[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value as Record<string, Partial<NotificationItem>>)
    .map(
      ([key, item]) =>
        stripUndefinedDeep({
          ...item,
          id: typeof item.id === "string" ? item.id : key,
        }) as NotificationItem,
    )
    .reverse();
}

function normalizeCommandPayload(
  value: Partial<CommandPayload>,
): CommandPayload {
  const commandType =
    value.type === "FACTORY_RESET" ? "FACTORY_RESET" : "IRRIGATE";

  const safeMode = normalizeBoolean(value.safeMode, true);
  const pumpEnabled = normalizeBoolean(value.pumpEnabled, false);
  const handled = normalizeBoolean(value.handled, false);

  return stripUndefinedDeep({
    type: commandType,
    factoryReset:
      commandType === "FACTORY_RESET"
        ? normalizeBoolean(value.factoryReset, false)
        : undefined,

    irrigate: normalizeBoolean(value.irrigate, false),
    durationSeconds:
      typeof value.durationSeconds === "number"
        ? Math.min(60, Math.max(1, value.durationSeconds))
        : 8,
    requestId:
      typeof value.requestId === "string"
        ? value.requestId
        : commandType === "FACTORY_RESET"
          ? `factory-reset-${Date.now()}`
          : `irrigate-${Date.now()}`,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : isoNow(),

    source:
      value.source === "automation" || value.source === "esp32"
        ? value.source
        : "web",

    safeMode,
    pumpEnabled,

    handled,
    handledAt: typeof value.handledAt === "string" ? value.handledAt : undefined,
    handledBy: typeof value.handledBy === "string" ? value.handledBy : undefined,
    status:
      value.status === "handled" ||
      value.status === "blocked" ||
      value.status === "dry-run" ||
      value.status === "pending"
        ? value.status
        : handled
          ? "handled"
          : commandType === "FACTORY_RESET"
            ? "pending"
            : safeMode || !pumpEnabled
              ? "dry-run"
              : "pending",
  }) as CommandPayload;
}

function recordToCommandRecord(value: unknown): Record<string, CommandPayload> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<CommandPayload>>).map(
      ([deviceId, command]) => [deviceId, normalizeCommandPayload(command)],
    ),
  );
}

function normalizePairingRecord(
  key: string,
  value: Partial<DevicePairingRecord>,
): DevicePairingRecord {
  return stripUndefinedDeep({
    code: normalizeString(value.code, key) ?? key,
    deviceId: normalizeString(value.deviceId, `device-${key}`) ?? `device-${key}`,
    ownerUid: normalizeString(value.ownerUid),
    deviceAuthUid: normalizeString(value.deviceAuthUid),
    status:
      value.status === "paired" || value.status === "expired"
        ? value.status
        : "available",
    createdAt: normalizeString(value.createdAt, isoNow()) ?? isoNow(),
    expiresAt: normalizeString(value.expiresAt),
    pairedAt: normalizeString(value.pairedAt),
    firmware: normalizeString(value.firmware, "greencloud-esp32"),
    lastSeenMs: normalizeNumber(value.lastSeenMs),
  }) as DevicePairingRecord;
}

function recordToPairingRecord(
  value: unknown,
): Record<string, DevicePairingRecord> {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, Partial<DevicePairingRecord>>).map(
      ([key, pairing]) => [key, normalizePairingRecord(key, pairing)],
    ),
  );
}

function mergeDeviceDataIntoDevices(
  devices: Device[],
  deviceData: Record<string, DeviceDataRecord>,
): Device[] {
  return devices.map((device) => {
    const live = deviceData[device.id];

    if (!live) return device;

    return normalizeDeviceBase(device.id, {
      ...device,
      ...live,

      id: device.id,

      name: device.name,
      place: device.place,
      location: device.location ?? device.place,

      ownerUid: device.ownerUid ?? live.ownerUid,
      pairingCode: device.pairingCode ?? live.pairingCode,
      pairedAt: device.pairedAt ?? live.pairedAt,
    });
  });
}

function snapshotToGreenCloudState(
  snapshot: DataSnapshot,
  deviceData: Record<string, DeviceDataRecord> = {},
): GreenCloudFirebaseState {
  const raw = snapshot.val() as
    | {
        devices?: unknown;
        selectedDeviceId?: unknown;
        automation?: Partial<AutomationState>;
        settings?: Partial<SettingsState>;
        activityFeed?: unknown;
        notifications?: unknown;
        commands?: unknown;
        pairings?: unknown;
      }
    | null;

  if (!raw) {
    return {
      devices: [],
      selectedDeviceId: "",
      automation: null,
      settings: null,
      activityFeed: [],
      notifications: [],
      commands: {},
      pairings: {},
    };
  }

  const baseDevices = recordToDeviceArray(raw.devices);
  const devices = mergeDeviceDataIntoDevices(baseDevices, deviceData);

  let selectedDeviceId =
    typeof raw.selectedDeviceId === "string"
      ? raw.selectedDeviceId
      : devices[0]?.id ?? "";

  const exists = devices.some((device) => device.id === selectedDeviceId);

  if (!exists && devices.length > 0) {
    selectedDeviceId = devices[0].id;
  }

  return {
    devices,
    selectedDeviceId,
    automation: raw.automation ?? null,
    settings: raw.settings ?? null,
    activityFeed: recordToActivityArray(raw.activityFeed),
    notifications: recordToNotificationArray(raw.notifications),
    commands: recordToCommandRecord(raw.commands),
    pairings: recordToPairingRecord(raw.pairings),
  };
}

function devicesToRecord(devices: Device[]) {
  return Object.fromEntries(
    devices.map((device) => {
      const finalDevice = device as GreenCloudDevice;

      return [
        device.id,
        stripUndefinedDeep({
          ...device,
          ...normalizeDeviceHardwareFields(finalDevice),
        }),
      ];
    }),
  );
}

function activityToRecord(activityFeed: ActivityItem[]) {
  return Object.fromEntries(
    activityFeed.map((item) => [item.id, stripUndefinedDeep(item)]),
  );
}

function notificationsToRecord(notifications: NotificationItem[]) {
  return Object.fromEntries(
    notifications.map((item) => [item.id, stripUndefinedDeep(item)]),
  );
}

function metaPatch(extra?: Record<string, string | number | boolean>) {
  return stripUndefinedDeep({
    updatedAt: isoNow(),
    schemaVersion: GREENCLOUD_SCHEMA_VERSION,
    ...extra,
  });
}

export function getGreenCloudUserPath(userId: string) {
  return userRootPath(userId);
}

export function getGreenCloudDevicePath(userId: string, deviceId: string) {
  assertDeviceId(deviceId);
  return `${userRootPath(userId)}/devices/${deviceId}`;
}

export function getGreenCloudCommandPath(_userId: string, deviceId: string) {
  assertDeviceId(deviceId);
  return deviceCommandPath(deviceId);
}

export function getGreenCloudPairingPath(code: string) {
  return `${globalPairingsPath()}/${normalizePairingCode(code)}`;
}

export function getGreenCloudDeviceDataPath(deviceId: string) {
  return deviceDataPath(deviceId);
}

export function getGreenCloudDeviceCommandPath(deviceId: string) {
  return deviceCommandPath(deviceId);
}

export function subscribeToGreenCloudState(
  userId: string,
  onChange: (state: GreenCloudFirebaseState) => void,
  onError?: (error: Error) => void,
) {
  let userSnapshot: DataSnapshot | null = null;
  let deviceDataById: Record<string, DeviceDataRecord> = {};
  let deviceUnsubscribers: Record<string, () => void> = {};
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function emit() {
    if (!userSnapshot) return;
    onChange(snapshotToGreenCloudState(userSnapshot, deviceDataById));
  }

  function retrySubscriptionsSoon() {
    if (retryTimer !== null) return;

    retryTimer = setTimeout(() => {
      retryTimer = null;

      if (!userSnapshot) return;

      const state = snapshotToGreenCloudState(userSnapshot, deviceDataById);
      syncDeviceDataSubscriptions(state.devices);
    }, 2500);
  }

  function syncDeviceDataSubscriptions(devices: Device[]) {
    const nextIds = new Set(devices.map((device) => device.id));

    Object.entries(deviceUnsubscribers).forEach(([deviceId, unsubscribe]) => {
      if (!nextIds.has(deviceId)) {
        unsubscribe();
        delete deviceUnsubscribers[deviceId];
        delete deviceDataById[deviceId];
      }
    });

    devices.forEach((device) => {
      if (deviceUnsubscribers[device.id]) return;

      const unsubscribe = onValue(
        greencloudDeviceDataRef(device.id),
        (snapshot) => {
          if (snapshot.exists()) {
            deviceDataById[device.id] = snapshot.val() as DeviceDataRecord;
          } else {
            delete deviceDataById[device.id];
          }

          emit();
        },
        (error) => {
          deviceUnsubscribers[device.id]?.();
          delete deviceUnsubscribers[device.id];
          delete deviceDataById[device.id];

          retrySubscriptionsSoon();

          onError?.(error);
        },
      );

      deviceUnsubscribers[device.id] = unsubscribe;
    });
  }

  const userUnsubscribe = onValue(
    greencloudUserRef(userId),
    (snapshot) => {
      userSnapshot = snapshot;

      const baseState = snapshotToGreenCloudState(snapshot, deviceDataById);

      syncDeviceDataSubscriptions(baseState.devices);
      onChange(baseState);
    },
    (error) => {
      onError?.(error);
    },
  );

  return () => {
    userUnsubscribe();

    Object.values(deviceUnsubscribers).forEach((unsubscribe) => {
      unsubscribe();
    });

    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }

    deviceUnsubscribers = {};
    deviceDataById = {};
    userSnapshot = null;
  };
}

export async function seedGreenCloudIfEmpty(
  userId: string,
  payload: SeedPayload,
) {
  const snapshot = await get(greencloudUserRef(userId));

  if (snapshot.exists()) {
    return false;
  }

  const now = isoNow();

  await set(
    greencloudUserRef(userId),
    stripUndefinedDeep({
      devices: devicesToRecord(payload.devices),
      selectedDeviceId: payload.selectedDeviceId,
      automation: payload.automation,
      settings: payload.settings,
      activityFeed: activityToRecord(payload.activityFeed),
      notifications: notificationsToRecord(payload.notifications),
      commands: {},
      pairings: {},
      meta: {
        createdAt: now,
        updatedAt: now,
        ownerUid: userId,
        schemaVersion: GREENCLOUD_SCHEMA_VERSION,
        product: "GreenCloud",
        hardwareProfile: "esp32-smart-irrigation",
        databaseScope: "per-user-private-workspace",
        pairingModel: "device-oled-code",
        liveDeviceDataPath: `${GREENCLOUD_ROOT}/deviceData/{deviceId}`,
        commandPath: `${GREENCLOUD_ROOT}/deviceCommands/{deviceId}`,
        supportedFields:
          "soil-moisture,raw-soil,soil-voltage,temperature,pressure,humidity,relay,pump,rain,water-level,button,oled",
      },
    }),
  );

  return true;
}

export async function writeDeviceToFirebase(
  userId: string,
  device: Device & Partial<DeviceHardwareFields>,
) {
  assertDeviceId(device.id);

  await set(
    greencloudUserPath(userId, `devices/${device.id}`),
    stripUndefinedDeep({
      ...device,
      ...normalizeDeviceHardwareFields(device),
      ownerUid: userId,
    }),
  );

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function patchDeviceInFirebase(
  userId: string,
  deviceId: string,
  patch: DevicePatch,
) {
  assertDeviceId(deviceId);

  await update(
    greencloudUserPath(userId, `devices/${deviceId}`),
    stripUndefinedDeep(patch),
  );

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function writeDeviceTelemetryToFirebase(
  userId: string,
  deviceId: string,
  telemetry: DevicePatch,
) {
  assertDeviceId(deviceId);

  const lastSeenMs = telemetry.lastSeenMs ?? Date.now();

  await update(
    greencloudDeviceDataRef(deviceId),
    stripUndefinedDeep({
      ...telemetry,
      id: deviceId,
      deviceId,
      status: telemetry.status ?? "Online",
      updatedAt: telemetry.updatedAt ?? "just now",
      lastSeenMs,
      ownerUid: userId,
    }),
  );

  await update(
    greencloudUserPath(userId, `devices/${deviceId}`),
    stripUndefinedDeep({
      status: telemetry.status ?? "Online",
      updatedAt: telemetry.updatedAt ?? "just now",
      lastSeenMs,
    }),
  );

  await update(
    greencloudUserPath(userId, "meta"),
    metaPatch({
      lastTelemetryAt: isoNow(),
    }),
  );
}

export async function removeDeviceFromFirebase(
  userId: string,
  deviceId: string,
) {
  assertDeviceId(deviceId);

  const now = isoNow();
  const resetRequestId = `factory-reset-${Date.now()}`;

  const deviceSnapshot = await get(
    greencloudUserPath(userId, `devices/${deviceId}`),
  );

  const device = deviceSnapshot.val() as Partial<GreenCloudDevice> | null;

  const pairingCode =
    typeof device?.pairingCode === "string"
      ? normalizePairingCode(device.pairingCode)
      : "";

  const resetCommand: CommandPayload = {
    type: "FACTORY_RESET",
    factoryReset: true,

    irrigate: false,
    durationSeconds: 1,
    requestId: resetRequestId,
    createdAt: now,

    source: "web",
    safeMode: true,
    pumpEnabled: false,

    handled: false,
    status: "pending",
  };

  const updates: Record<string, unknown> = {
    [`${deviceCommandPath(deviceId)}`]: resetCommand,

    [`${userRootPath(userId)}/devices/${deviceId}`]: null,
    [`${userRootPath(userId)}/commands/${deviceId}`]: null,

    [`${deviceDataPath(deviceId)}/lastCommand`]: resetRequestId,
    [`${deviceDataPath(deviceId)}/lastCommandStatus`]: "Pending",
    [`${deviceDataPath(deviceId)}/factoryResetRequested`]: true,
    [`${deviceDataPath(deviceId)}/deletedFromWeb`]: true,
    [`${deviceDataPath(deviceId)}/updatedAt`]: "Factory reset requested",

    [`${userRootPath(userId)}/meta/updatedAt`]: now,
    [`${userRootPath(userId)}/meta/schemaVersion`]: GREENCLOUD_SCHEMA_VERSION,
  };

  if (pairingCode) {
    updates[`${userPairingsPath(userId)}/${pairingCode}`] = null;
    updates[`${globalPairingsPath()}/${pairingCode}/status`] = "expired";
    updates[`${globalPairingsPath()}/${pairingCode}/ownerUid`] = null;
  }

  await update(ref(realtimeDatabase), stripUndefinedDeep(updates));
}

export async function writeSelectedDeviceIdToFirebase(
  userId: string,
  deviceId: string,
) {
  assertDeviceId(deviceId);

  await set(greencloudUserPath(userId, "selectedDeviceId"), deviceId);

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function writeAutomationToFirebase(
  userId: string,
  automation: AutomationState,
) {
  await set(
    greencloudUserPath(userId, "automation"),
    stripUndefinedDeep(automation),
  );

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function patchAutomationInFirebase(
  userId: string,
  patch: Partial<AutomationState>,
) {
  await update(
    greencloudUserPath(userId, "automation"),
    stripUndefinedDeep(patch),
  );

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function writeSettingsToFirebase(
  userId: string,
  settings: SettingsState,
) {
  await set(greencloudUserPath(userId, "settings"), stripUndefinedDeep(settings));

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function patchSettingsInFirebase(
  userId: string,
  patch: Partial<SettingsState>,
) {
  await update(
    greencloudUserPath(userId, "settings"),
    stripUndefinedDeep(patch),
  );

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function pushActivityToFirebase(
  userId: string,
  item: Omit<ActivityItem, "id"> & { id?: string },
) {
  const nextRef = push(greencloudUserPath(userId, "activityFeed"));
  const id = nextRef.key ?? `activity-${Date.now()}`;

  const nextItem: ActivityItem = {
    ...item,
    id,
  };

  await set(nextRef, stripUndefinedDeep(nextItem));

  await update(greencloudUserPath(userId, "meta"), metaPatch());

  return nextItem;
}

export async function pushNotificationToFirebase(
  userId: string,
  item: Omit<NotificationItem, "id"> & { id?: string },
) {
  const nextRef = push(greencloudUserPath(userId, "notifications"));
  const id = nextRef.key ?? `notification-${Date.now()}`;

  const nextItem: NotificationItem = {
    ...item,
    id,
  };

  await set(nextRef, stripUndefinedDeep(nextItem));

  await update(greencloudUserPath(userId, "meta"), metaPatch());

  return nextItem;
}

export async function createDevicePairingCodeInFirebase() {
  throw new Error(
    "Pairing codes are generated by the ESP32 and shown on the OLED display.",
  );
}

export async function registerDevicePairingCodeFromDevice(
  code: string,
  deviceId: string,
  firmware = "greencloud-esp32",
) {
  const safeCode = normalizePairingCode(code);
  assertDeviceId(deviceId);

  if (safeCode.length !== PAIRING_CODE_LENGTH) {
    throw new Error("GreenCloud pairing code must be 7 characters.");
  }

  const now = isoNow();

  const pairing: DevicePairingRecord = {
    code: safeCode,
    deviceId,
    status: "available",
    createdAt: now,
    firmware,
    lastSeenMs: Date.now(),
  };

  await set(
    greencloudGlobalPath(`pairings/${safeCode}`),
    stripUndefinedDeep(pairing),
  );

  return pairing;
}

export async function pairDeviceToUserInFirebase(
  userId: string,
  code: string,
  options?: {
    name?: string;
    place?: string;
  },
) {
  const safeCode = normalizePairingCode(code);

  if (safeCode.length !== PAIRING_CODE_LENGTH) {
    throw new Error("Enter the 7-character code shown on the device.");
  }

  const globalSnapshot = await get(greencloudGlobalPath(`pairings/${safeCode}`));

  if (!globalSnapshot.exists()) {
    throw new Error("Pairing code was not found. Check the OLED code.");
  }

  const pairing = normalizePairingRecord(
    safeCode,
    globalSnapshot.val() as Partial<DevicePairingRecord>,
  );

  if (pairing.status === "paired" && pairing.ownerUid !== userId) {
    throw new Error("This device is already paired with another account.");
  }

  if (pairing.status === "expired") {
    throw new Error("This pairing code has expired. Restart the device for a new code.");
  }

  const now = isoNow();
  const deviceId = pairing.deviceId;

  const cleanName = options?.name?.trim() || "GreenCloud Device";
  const cleanPlace = options?.place?.trim() || "Plant zone";

  const device: Device & DeviceHardwareFields = normalizeDeviceBase(deviceId, {
    id: deviceId,
    name: cleanName,
    place: cleanPlace,
    location: cleanPlace,

    moisture: 0,
    rawSoil: 0,
    soilVoltage: 0,
    signal: 0,

    status: "Idle",
    updatedAt: "Waiting for device",
    lastWateredAt: "Not watered yet",

    power: "USB / Adapter",
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

    firmware: pairing.firmware ?? "greencloud-esp32",
    lastCommand: "None",
    lastCommandStatus: "None",

    pairingCode: safeCode,
    pairedAt: now,
    ownerUid: userId,
  }) as Device & DeviceHardwareFields;

  const pairedRecord: DevicePairingRecord = {
    ...pairing,
    ownerUid: userId,
    status: "paired",
    pairedAt: now,
  };

  const updates: Record<string, unknown> = {
    [`${userRootPath(userId)}/devices/${deviceId}`]: device,
    [`${userRootPath(userId)}/selectedDeviceId`]: deviceId,
    [`${userPairingsPath(userId)}/${safeCode}`]: pairedRecord,
    [`${globalPairingsPath()}/${safeCode}`]: pairedRecord,

    [`${userRootPath(userId)}/meta/updatedAt`]: now,
    [`${userRootPath(userId)}/meta/schemaVersion`]: GREENCLOUD_SCHEMA_VERSION,
    [`${userRootPath(userId)}/meta/lastPairingAt`]: now,
  };

  await update(ref(realtimeDatabase), stripUndefinedDeep(updates));

  return device;
}

export async function writeIrrigationCommandToFirebase(
  userId: string,
  deviceId: string,
  durationSeconds: number,
  options?: {
    source?: "web" | "automation";
    safeMode?: boolean;
    pumpEnabled?: boolean;
  },
) {
  assertDeviceId(deviceId);

  const requestId = `irrigate-${Date.now()}`;
  const safeMode = options?.safeMode ?? true;
  const pumpEnabled = options?.pumpEnabled ?? false;
  const commandStatus: IrrigationCommandStatus =
    safeMode || !pumpEnabled ? "dry-run" : "pending";

  const command: CommandPayload = {
    type: "IRRIGATE",
    irrigate: true,
    durationSeconds: Math.min(60, Math.max(1, durationSeconds)),
    requestId,
    createdAt: isoNow(),

    source: options?.source ?? "web",
    safeMode,
    pumpEnabled,

    handled: false,
    status: commandStatus,
  };

  await set(greencloudDeviceCommandRef(deviceId), stripUndefinedDeep(command));

  await set(
    greencloudUserPath(userId, `commands/${deviceId}`),
    stripUndefinedDeep(command),
  );

  const devicePatch = stripUndefinedDeep({
    lastCommand: requestId,
    lastCommandStatus: safeMode || !pumpEnabled ? "Dry-run" : "Pending",
    safeMode,
    pumpEnabled,
    relayState: safeMode || !pumpEnabled ? "Locked" : "Enabled",
    pumpState: safeMode || !pumpEnabled ? "Dry-run" : "Ready",
    updatedAt: "just now",
  } satisfies DevicePatch);

  await update(greencloudUserPath(userId, `devices/${deviceId}`), devicePatch);
  await update(greencloudDeviceDataRef(deviceId), devicePatch);

  await update(
    greencloudUserPath(userId, "meta"),
    metaPatch({
      lastCommandAt: isoNow(),
    }),
  );

  return command;
}

export async function markIrrigationCommandHandledInFirebase(
  userId: string,
  deviceId: string,
  patch?: {
    handledBy?: string;
    status?: IrrigationCommandStatus;
    safeMode?: boolean;
    pumpEnabled?: boolean;
  },
) {
  assertDeviceId(deviceId);

  const safeMode = patch?.safeMode ?? true;
  const pumpEnabled = patch?.pumpEnabled ?? false;
  const status =
    patch?.status ?? (safeMode || !pumpEnabled ? "dry-run" : "handled");

  const commandPatch = stripUndefinedDeep({
    irrigate: false,
    handled: true,
    handledAt: isoNow(),
    handledBy: patch?.handledBy ?? "esp32",
    safeMode,
    pumpEnabled,
    status,
  } satisfies Partial<CommandPayload>);

  await update(greencloudDeviceCommandRef(deviceId), commandPatch);

  await update(
    greencloudUserPath(userId, `commands/${deviceId}`),
    commandPatch,
  );

  const devicePatch = stripUndefinedDeep({
    lastCommandStatus:
      status === "dry-run"
        ? "Dry-run"
        : status === "blocked"
          ? "Blocked"
          : "Handled",
    relayState: safeMode || !pumpEnabled ? "Locked" : "Enabled",
    pumpState:
      status === "blocked"
        ? "Blocked"
        : safeMode || !pumpEnabled
          ? "Dry-run"
          : "Stopped",
    updatedAt: "just now",
  } satisfies DevicePatch);

  await update(greencloudUserPath(userId, `devices/${deviceId}`), devicePatch);
  await update(greencloudDeviceDataRef(deviceId), devicePatch);

  await update(
    greencloudUserPath(userId, "meta"),
    metaPatch({
      lastCommandHandledAt: isoNow(),
    }),
  );
}

export async function clearIrrigationCommandInFirebase(
  userId: string,
  deviceId: string,
) {
  assertDeviceId(deviceId);

  const commandPatch = stripUndefinedDeep({
    irrigate: false,
    handled: true,
    handledAt: isoNow(),
    handledBy: "web",
    status: "handled",
  } satisfies Partial<CommandPayload>);

  await update(greencloudDeviceCommandRef(deviceId), commandPatch);

  await update(
    greencloudUserPath(userId, `commands/${deviceId}`),
    commandPatch,
  );

  const devicePatch = stripUndefinedDeep({
    lastCommandStatus: "Handled",
    updatedAt: "just now",
  } satisfies DevicePatch);

  await update(greencloudUserPath(userId, `devices/${deviceId}`), devicePatch);
  await update(greencloudDeviceDataRef(deviceId), devicePatch);

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}

export async function markAllNotificationsReadInFirebase(
  userId: string,
  notifications: NotificationItem[],
) {
  const updates: Record<string, string | number | boolean> = {
    "meta/updatedAt": isoNow(),
    "meta/schemaVersion": GREENCLOUD_SCHEMA_VERSION,
  };

  notifications.forEach((item) => {
    updates[`notifications/${item.id}/read`] = true;
  });

  await update(greencloudUserRef(userId), stripUndefinedDeep(updates));
}

export async function clearActivityFeedInFirebase(userId: string) {
  await remove(greencloudUserPath(userId, "activityFeed"));

  await update(greencloudUserPath(userId, "meta"), metaPatch());
}