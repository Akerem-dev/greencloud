import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { deleteApp as deleteClientApp, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";

const requireFunctions = createRequire(
  new URL("../../functions/package.json", import.meta.url),
);
const {
  deleteApp: deleteAdminApp,
  initializeApp: initializeAdminApp,
} = requireFunctions("firebase-admin/app");
const { getDatabase: getAdminDatabase } = requireFunctions(
  "firebase-admin/database",
);

const PROJECT_ID = "demo-greencloud";
const CLIENT_APP_NAME = "device-unpair-callable-client";
const ADMIN_APP_NAME = "device-unpair-callable-admin";
const DATABASE_URL = `http://127.0.0.1:9000?ns=${PROJECT_ID}`;

let clientApp;
let adminApp;
let auth;
let rootRef;
let unpairDevice;

function pairedState(ownerUid) {
  const nowMs = Date.now();

  return {
    deviceActors: {
      "device-a": { deviceAuthUid: "device-auth-a" },
      "device-b": { deviceAuthUid: "device-auth-b" },
    },
    deviceOwners: {
      "device-a": {
        ownerUid,
        assignedAtMs: nowMs - 5_000,
        source: "pairing",
      },
      "device-b": {
        ownerUid,
        assignedAtMs: nowMs - 4_000,
        source: "pairing",
      },
    },
    deviceData: {
      "device-a": {
        deviceId: "device-a",
        ownerUid,
        lastSeenMs: nowMs - 100,
        moisture: 41,
      },
    },
    pairings: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        deviceAuthUid: "device-auth-a",
        ownerUid,
        status: "paired",
        createdAtMs: nowMs - 10_000,
        expiresAtMs: nowMs + 100_000,
        pairedAtMs: nowMs - 5_000,
      },
    },
    pairingClaims: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        requestedByUid: ownerUid,
        status: "finalized",
        createdAtMs: nowMs - 9_000,
        expiresAtMs: nowMs + 100_000,
        decidedAtMs: nowMs - 8_000,
        decidedByUid: "device-auth-a",
        finalizedAtMs: nowMs - 5_000,
        finalizedBy: ownerUid,
      },
    },
    users: {
      [ownerUid]: {
        devices: {
          "device-a": {
            id: "device-a",
            name: "Balcony Basil",
            place: "South Balcony",
            location: "South Balcony",
            ownerUid,
            pairingCode: "ABC123",
          },
          "device-b": {
            id: "device-b",
            name: "Kitchen Mint",
            place: "Kitchen",
            location: "Kitchen",
            ownerUid,
          },
        },
        pairings: {
          ABC123: {
            code: "ABC123",
            deviceId: "device-a",
            ownerUid,
            status: "paired",
          },
        },
        selectedDeviceId: "device-a",
        meta: { schemaVersion: 9 },
      },
    },
  };
}

async function assertCallableError(code, operation) {
  await assert.rejects(operation, (error) => {
    assert.equal(error.code, `functions/${code}`);
    return true;
  });
}

before(() => {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

  adminApp = initializeAdminApp(
    {
      projectId: PROJECT_ID,
      databaseURL: DATABASE_URL,
    },
    ADMIN_APP_NAME,
  );
  rootRef = getAdminDatabase(adminApp).ref("greencloud");

  clientApp = initializeApp(
    {
      apiKey: "demo-api-key",
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      databaseURL: DATABASE_URL,
      projectId: PROJECT_ID,
    },
    CLIENT_APP_NAME,
  );

  auth = getAuth(clientApp);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", {
    disableWarnings: true,
  });

  const functions = getFunctions(clientApp, "europe-west1");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  unpairDevice = httpsCallable(functions, "unpairDevice");
});

beforeEach(async () => {
  await signOut(auth);
  await rootRef.remove();
});

after(async () => {
  if (auth) await signOut(auth);
  if (rootRef) await rootRef.remove();
  if (clientApp) await deleteClientApp(clientApp);
  if (adminApp) await deleteAdminApp(adminApp);
});

test("rejects an unauthenticated device unpair without changing RTDB", async () => {
  const state = pairedState("owner-a");
  await rootRef.set(state);

  await assertCallableError(
    "unauthenticated",
    unpairDevice({ deviceId: "device-a" }),
  );

  assert.deepEqual((await rootRef.get()).val(), state);
});

test("unpairs the authenticated canonical owner and queues factory reset", async () => {
  const credential = await signInAnonymously(auth);
  const ownerUid = credential.user.uid;
  await rootRef.set(pairedState(ownerUid));

  const response = await unpairDevice({ deviceId: "device-a" });
  const state = (await rootRef.get()).val();

  assert.equal(response.data.deviceId, "device-a");
  assert.equal(response.data.ownerUid, ownerUid);
  assert.equal(response.data.pairingCode, "ABC123");
  assert.equal(response.data.idempotent, false);
  assert.equal(response.data.factoryResetQueued, true);
  assert.equal(response.data.selectedDeviceId, "device-b");

  assert.equal(state.deviceOwners?.["device-a"], undefined);
  assert.equal(state.users[ownerUid].devices?.["device-a"], undefined);
  assert.equal(state.users[ownerUid].selectedDeviceId, "device-b");
  assert.equal(state.deviceCommands["device-a"].type, "FACTORY_RESET");
  assert.equal(state.deviceCommands["device-a"].requestId, response.data.requestId);
  assert.equal(state.pairings.ABC123.status, "expired");
  assert.equal(state.pairingClaims?.ABC123, undefined);
});

test("maps malformed device identities to invalid-argument", async () => {
  await signInAnonymously(auth);

  await assertCallableError(
    "invalid-argument",
    unpairDevice({ deviceId: "bad/device" }),
  );
});

test("rejects a caller who is not the canonical device owner", async () => {
  await signInAnonymously(auth);
  const state = pairedState("different-owner");
  await rootRef.set(state);

  await assertCallableError(
    "permission-denied",
    unpairDevice({ deviceId: "device-a" }),
  );

  assert.deepEqual((await rootRef.get()).val(), state);
});

test("keeps repeated authenticated device unpair calls idempotent", async () => {
  const credential = await signInAnonymously(auth);
  const ownerUid = credential.user.uid;
  await rootRef.set(pairedState(ownerUid));

  const first = await unpairDevice({ deviceId: "device-a" });
  const second = await unpairDevice({ deviceId: "device-a" });
  const state = (await rootRef.get()).val();

  assert.equal(first.data.idempotent, false);
  assert.equal(second.data.idempotent, true);
  assert.equal(second.data.requestId, first.data.requestId);
  assert.equal(second.data.unpairedAtMs, first.data.unpairedAtMs);
  assert.equal(state.deviceUnpairs["device-a"].ownerUid, ownerUid);
});
