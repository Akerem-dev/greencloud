import { createRequire } from "node:module";

const requireFunctions = createRequire(
  new URL("../../../functions/package.json", import.meta.url),
);

const {
  getApp,
  getApps,
  initializeApp,
} = requireFunctions("firebase-admin/app");
const { getAuth } = requireFunctions("firebase-admin/auth");
const { getDatabase } = requireFunctions("firebase-admin/database");

export const E2E_PROJECT_ID = "demo-greencloud";
export const E2E_DATABASE_NAMESPACE = `${E2E_PROJECT_ID}-default-rtdb`;
export const E2E_DATABASE_URL =
  `http://127.0.0.1:9000?ns=${E2E_DATABASE_NAMESPACE}`;

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
process.env.GCLOUD_PROJECT = E2E_PROJECT_ID;

const ADMIN_APP_NAME = "greencloud-playwright-admin";
const adminApp = getApps().some((app) => app.name === ADMIN_APP_NAME)
  ? getApp(ADMIN_APP_NAME)
  : initializeApp(
      {
        projectId: E2E_PROJECT_ID,
        databaseURL: E2E_DATABASE_URL,
      },
      ADMIN_APP_NAME,
    );

const adminAuth = getAuth(adminApp);
const adminDatabase = getDatabase(adminApp);
const greenCloudRoot = adminDatabase.ref("greencloud");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resetFirebaseEmulators() {
  const response = await fetch(
    `http://127.0.0.1:9099/emulator/v1/projects/${E2E_PROJECT_ID}/accounts`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(
      `Authentication emulator reset failed with HTTP ${response.status}.`,
    );
  }

  await greenCloudRoot.remove();
}

export async function getUserByEmail(email) {
  return adminAuth.getUserByEmail(email);
}

export async function findUserByEmail(email) {
  try {
    return await getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

export async function readGreenCloud(path = "") {
  const normalized = String(path).replace(/^\/+|\/+$/g, "");
  const snapshot = await (normalized
    ? greenCloudRoot.child(normalized)
    : greenCloudRoot
  ).get();

  return snapshot.exists() ? snapshot.val() : null;
}

export async function waitForGreenCloud(
  path,
  predicate = (value) => value !== null,
  { timeoutMs = 12_000, intervalMs = 80 } = {},
) {
  const startedAt = Date.now();
  let latest = null;

  while (Date.now() - startedAt < timeoutMs) {
    latest = await readGreenCloud(path);
    if (predicate(latest)) return latest;
    await sleep(intervalMs);
  }

  throw new Error(
    `Timed out waiting for greencloud/${path}. Last value: ${JSON.stringify(latest)}`,
  );
}

export async function seedAvailableDevice({
  code = "ABC123",
  deviceId = "device-e2e-a",
  deviceAuthUid = "device-auth-e2e-a",
  firmware = "greencloud-esp32-e2e",
  lifetimeMs = 120_000,
} = {}) {
  const normalizedCode = String(code).trim().toUpperCase();
  const nowMs = Date.now();

  await greenCloudRoot.update({
    [`deviceActors/${deviceId}`]: { deviceAuthUid },
    [`deviceOwners/${deviceId}`]: null,
    [`pairings/${normalizedCode}`]: {
      code: normalizedCode,
      deviceId,
      deviceAuthUid,
      status: "available",
      createdAtMs: nowMs - 1_000,
      expiresAtMs: nowMs + lifetimeMs,
      firmware,
    },
  });

  return {
    code: normalizedCode,
    deviceId,
    deviceAuthUid,
  };
}

export async function decidePendingPairing({
  code = "ABC123",
  deviceAuthUid = "device-auth-e2e-a",
  status = "approved",
  expectedRequesterUid,
} = {}) {
  const normalizedCode = String(code).trim().toUpperCase();
  const claim = await waitForGreenCloud(
    `pairingClaims/${normalizedCode}`,
    (value) => value?.status === "pending",
    { timeoutMs: 30_000 },
  );

  if (
    expectedRequesterUid &&
    claim.requestedByUid !== expectedRequesterUid
  ) {
    throw new Error(
      `Pairing requester mismatch. Expected ${expectedRequesterUid}, received ${claim.requestedByUid}.`,
    );
  }

  await greenCloudRoot.child(`pairingClaims/${normalizedCode}`).set({
    ...claim,
    status,
    decidedByUid: deviceAuthUid,
    decidedAtMs: Date.now(),
  });

  return claim;
}

export async function seedDeviceTelemetry({
  deviceId = "device-e2e-a",
  ownerUid,
  overrides = {},
} = {}) {
  if (!ownerUid) {
    throw new Error("ownerUid is required for E2E telemetry.");
  }

  const telemetry = {
    id: deviceId,
    deviceId,
    ownerUid,
    status: "Online",
    moisture: 67,
    rawSoil: 1780,
    soilVoltage: 1.73,
    signal: 92,
    temperature: 23.8,
    pressure: 1012,
    humidity: 51,
    sensorStatus: "OK",
    safeMode: false,
    pumpEnabled: true,
    relayState: "Enabled",
    pumpState: "Ready",
    rainDetected: false,
    rainStatus: "Clear",
    waterLevel: 84,
    waterLevelStatus: "OK",
    buttonPressed: false,
    buttonStatus: "Ready",
    oledStatus: "Active",
    firmware: "greencloud-esp32-e2e",
    lastCommand: "None",
    lastCommandStatus: "None",
    updatedAt: "E2E telemetry",
    lastSeenMs: Date.now(),
    ...overrides,
  };

  await greenCloudRoot.child(`deviceData/${deviceId}`).set(telemetry);
  return telemetry;
}

export async function acknowledgeDeviceCommand({
  deviceId = "device-e2e-a",
  deviceAuthUid = "device-auth-e2e-a",
  status = "handled",
} = {}) {
  const command = await waitForGreenCloud(
    `deviceCommands/${deviceId}`,
    (value) => value?.handled === false,
  );

  await greenCloudRoot.child(`deviceCommands/${deviceId}`).set({
    ...command,
    handled: true,
    handledAt: new Date().toISOString(),
    handledBy: deviceAuthUid,
    status,
  });

  await greenCloudRoot.child(`deviceData/${deviceId}`).update({
    lastCommand: command.requestId,
    lastCommandStatus: status === "handled" ? "Handled" : "Blocked",
    updatedAt: "E2E command acknowledged",
    lastSeenMs: Date.now(),
  });

  return command;
}
