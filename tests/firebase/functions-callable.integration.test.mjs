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
  connectDatabaseEmulator,
  getDatabase as getClientDatabase,
  goOffline,
  ref as clientRef,
  set as clientSet,
} from "firebase/database";
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
const CLIENT_APP_NAME = "callable-auth-integration-client";
const ADMIN_APP_NAME = "callable-auth-integration-admin";
const DATABASE_URL = `http://127.0.0.1:9000?ns=${PROJECT_ID}`;

let clientApp;
let adminApp;
let auth;
let clientDatabase;
let rootRef;
let finalizePairing;

function availableState() {
  const nowMs = Date.now();

  return {
    deviceActors: {
      "device-a": { deviceAuthUid: "device-auth-a" },
    },
    deviceOwners: {},
    pairings: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        deviceAuthUid: "device-auth-a",
        status: "available",
        createdAtMs: nowMs - 1_000,
        expiresAtMs: nowMs + 600_000,
        firmware: "greencloud-esp32",
      },
    },
  };
}

function approvedState(requestedByUid) {
  const state = availableState();
  const nowMs = Date.now();

  return {
    ...state,
    pairingClaims: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        requestedByUid,
        status: "approved",
        createdAtMs: nowMs - 500,
        expiresAtMs: state.pairings.ABC123.expiresAtMs,
        decidedAtMs: nowMs - 100,
        decidedByUid: "device-auth-a",
      },
    },
  };
}

function normalizeEmptyCollections(state) {
  return {
    ...state,
    deviceOwners: state?.deviceOwners ?? {},
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

  clientDatabase = getClientDatabase(clientApp);
  connectDatabaseEmulator(clientDatabase, "127.0.0.1", 9000);

  const functions = getFunctions(clientApp, "europe-west1");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  finalizePairing = httpsCallable(functions, "finalizePairing");
});

beforeEach(async () => {
  await signOut(auth);
  await rootRef.remove();
});

after(async () => {
  if (auth) {
    await signOut(auth);
  }
  if (clientDatabase) {
    goOffline(clientDatabase);
  }
  if (rootRef) {
    await rootRef.remove();
  }
  if (clientApp) {
    await deleteClientApp(clientApp);
  }
  if (adminApp) {
    await deleteAdminApp(adminApp);
  }
});

test("rejects an unauthenticated callable request without changing RTDB", async () => {
  const state = approvedState("unrelated-user");
  await rootRef.set(state);

  await assertCallableError(
    "unauthenticated",
    finalizePairing({ pairingCode: "ABC123" }),
  );

  assert.deepEqual(normalizeEmptyCollections((await rootRef.get()).val()), state);
});

test("finalizes pairing and projects the authenticated user workspace", async () => {
  const credential = await signInAnonymously(auth);
  const requesterUid = credential.user.uid;
  await rootRef.set(approvedState(requesterUid));

  const response = await finalizePairing({
    pairingCode: "abc123",
    name: "  Patio Basil  ",
    place: "  South Balcony  ",
  });
  const state = (await rootRef.get()).val();
  const workspace = state.users[requesterUid];
  const device = workspace.devices["device-a"];

  assert.equal(response.data.pairingCode, "ABC123");
  assert.equal(response.data.ownerUid, requesterUid);
  assert.equal(response.data.deviceId, "device-a");
  assert.equal(response.data.idempotent, false);
  assert.equal(response.data.workspaceProjected, true);
  assert.equal(response.data.device.name, "Patio Basil");
  assert.equal(response.data.device.place, "South Balcony");

  assert.equal(state.deviceOwners["device-a"].ownerUid, requesterUid);
  assert.equal(state.pairings.ABC123.status, "paired");
  assert.equal(state.pairingClaims.ABC123.status, "finalized");
  assert.equal(state.pairingClaims.ABC123.requestedByUid, requesterUid);
  assert.equal(state.pairingClaims.ABC123.decidedByUid, "device-auth-a");
  assert.equal(device.id, "device-a");
  assert.equal(device.name, "Patio Basil");
  assert.equal(device.place, "South Balcony");
  assert.equal(device.ownerUid, requesterUid);
  assert.equal(device.pairingCode, "ABC123");
  assert.equal(workspace.selectedDeviceId, "device-a");
  assert.equal(workspace.pairings.ABC123.status, "paired");
  assert.equal(workspace.meta.schemaVersion, 9);
});

test("creates a rules-compliant claim and finalizes the same record", async () => {
  const credential = await signInAnonymously(auth);
  const requestedByUid = credential.user.uid;
  const state = availableState();
  const pairing = state.pairings.ABC123;

  await rootRef.set(state);

  const pendingClaim = {
    code: "ABC123",
    deviceId: pairing.deviceId,
    requestedByUid,
    status: "pending",
    createdAtMs: Date.now(),
    expiresAtMs: pairing.expiresAtMs,
  };

  await clientSet(
    clientRef(clientDatabase, "greencloud/pairingClaims/ABC123"),
    pendingClaim,
  );

  assert.deepEqual(
    (await rootRef.child("pairingClaims/ABC123").get()).val(),
    pendingClaim,
  );

  await rootRef.child("pairingClaims/ABC123").update({
    status: "approved",
    decidedAtMs: Date.now(),
    decidedByUid: "device-auth-a",
  });

  const response = await finalizePairing({
    pairingCode: "ABC123",
    name: "Rules Contract Device",
    place: "Test Bench",
  });
  const finalizedState = (await rootRef.get()).val();

  assert.equal(response.data.ownerUid, requestedByUid);
  assert.equal(response.data.idempotent, false);
  assert.equal(finalizedState.pairingClaims.ABC123.status, "finalized");
  assert.equal(
    finalizedState.pairingClaims.ABC123.requestedByUid,
    requestedByUid,
  );
  assert.equal(
    finalizedState.pairingClaims.ABC123.decidedByUid,
    "device-auth-a",
  );
  assert.equal(
    finalizedState.users[requestedByUid].devices["device-a"].name,
    "Rules Contract Device",
  );
});

test("maps invalid callable pairing input to invalid-argument", async () => {
  await signInAnonymously(auth);

  await assertCallableError(
    "invalid-argument",
    finalizePairing({ pairingCode: "bad" }),
  );
});

test("maps oversized workspace labels to invalid-argument", async () => {
  await signInAnonymously(auth);

  await assertCallableError(
    "invalid-argument",
    finalizePairing({
      pairingCode: "ABC123",
      name: "x".repeat(81),
    }),
  );
});

test("rejects a caller who does not own the approved claim", async () => {
  await signInAnonymously(auth);
  const state = approvedState("different-user");
  await rootRef.set(state);

  await assertCallableError(
    "permission-denied",
    finalizePairing({ pairingCode: "ABC123" }),
  );

  assert.deepEqual(normalizeEmptyCollections((await rootRef.get()).val()), state);
});

test("keeps repeated authenticated callable finalization idempotent", async () => {
  const credential = await signInAnonymously(auth);
  const requesterUid = credential.user.uid;
  await rootRef.set(approvedState(requesterUid));

  const first = await finalizePairing({
    pairingCode: "ABC123",
    name: "Patio Basil",
    place: "South Balcony",
  });
  const second = await finalizePairing({
    pairingCode: "ABC123",
    name: "Do not overwrite",
    place: "Do not overwrite",
  });
  const state = (await rootRef.get()).val();

  assert.equal(first.data.idempotent, false);
  assert.equal(second.data.idempotent, true);
  assert.equal(second.data.finalizedAtMs, first.data.finalizedAtMs);
  assert.equal(second.data.device.name, "Patio Basil");
  assert.equal(second.data.device.place, "South Balcony");
  assert.equal(state.users[requesterUid].devices["device-a"].name, "Patio Basil");
  assert.equal(state.users[requesterUid].devices["device-a"].place, "South Balcony");
});
