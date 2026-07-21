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
  get,
  ref,
  set,
} from "firebase/database";
import {
  connectFunctionsEmulator,
  getFunctions,
} from "firebase/functions";
import {
  PairingFlowError,
  normalizePairingCode,
  pairDeviceWithProtectedClaim,
} from "../../lib/firebase-pairing-flow.mjs";

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
const CLIENT_APP_NAME = "pairing-client-flow-client";
const ADMIN_APP_NAME = "pairing-client-flow-admin";
const PAIRING_CODE = "ABC123";
const DEVICE_ID = "device-a";
const DEVICE_AUTH_UID = "device-auth-a";
const DATABASE_URL = `http://127.0.0.1:9000?ns=${PROJECT_ID}`;

let clientApp;
let adminApp;
let auth;
let clientDatabase;
let functions;
let rootRef;

function availableState(overrides = {}) {
  const nowMs = Date.now();

  return {
    deviceActors: {
      [DEVICE_ID]: { deviceAuthUid: DEVICE_AUTH_UID },
    },
    deviceOwners: {},
    pairings: {
      [PAIRING_CODE]: {
        code: PAIRING_CODE,
        deviceId: DEVICE_ID,
        deviceAuthUid: DEVICE_AUTH_UID,
        status: "available",
        createdAtMs: nowMs - 1_000,
        expiresAtMs: nowMs + 60_000,
        firmware: "greencloud-esp32",
      },
    },
    ...overrides,
  };
}

function decidePendingClaim(status, expectedUid) {
  const claimRef = rootRef.child(`pairingClaims/${PAIRING_CODE}`);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      claimRef.off("value", onValue);
      reject(new Error("Pending pairing claim was not created in time."));
    }, 5_000);

    async function onValue(snapshot) {
      const claim = snapshot.val();
      if (!claim || claim.status !== "pending") return;

      clearTimeout(timeout);
      claimRef.off("value", onValue);

      try {
        assert.equal(claim.requestedByUid, expectedUid);
        await claimRef.set({
          ...claim,
          status,
          decidedByUid: DEVICE_AUTH_UID,
          decidedAtMs: Date.now(),
        });
        resolve(claim);
      } catch (error) {
        reject(error);
      }
    }

    claimRef.on("value", onValue, (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function signInClient() {
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
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

  functions = getFunctions(clientApp, "europe-west1");
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
});

beforeEach(async () => {
  await signOut(auth);
  await rootRef.remove();
});

after(async () => {
  if (auth) {
    await signOut(auth);
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

test("normalizes the protected six-character pairing code", () => {
  assert.equal(normalizePairingCode(" ab c123 "), PAIRING_CODE);
  assert.throws(
    () => normalizePairingCode("A7K9Q2M"),
    (error) => {
      assert.ok(error instanceof PairingFlowError);
      assert.equal(error.code, "invalid-code");
      return true;
    },
  );
});

test("creates a protected claim, waits for device approval and finalizes", async () => {
  const userId = await signInClient();
  await rootRef.set(availableState());

  const decision = decidePendingClaim("approved", userId);
  const result = await pairDeviceWithProtectedClaim({
    database: clientDatabase,
    functions,
    userId,
    code: "abc123",
    name: "  Patio Basil  ",
    place: "  South Balcony  ",
    timeoutMs: 5_000,
  });
  await decision;

  const state = (await rootRef.get()).val();

  assert.equal(result.pairingCode, PAIRING_CODE);
  assert.equal(result.deviceId, DEVICE_ID);
  assert.equal(result.ownerUid, userId);
  assert.equal(result.claimResumed, false);
  assert.equal(result.device.name, "Patio Basil");
  assert.equal(result.device.place, "South Balcony");
  assert.equal(state.pairingClaims[PAIRING_CODE].status, "finalized");
  assert.equal(state.deviceOwners[DEVICE_ID].ownerUid, userId);
  assert.equal(state.users[userId].devices[DEVICE_ID].ownerUid, userId);
});

test("surfaces a verified device rejection without creating ownership", async () => {
  const userId = await signInClient();
  await rootRef.set(availableState());

  const decision = decidePendingClaim("rejected", userId);

  await assert.rejects(
    pairDeviceWithProtectedClaim({
      database: clientDatabase,
      functions,
      userId,
      code: PAIRING_CODE,
      timeoutMs: 5_000,
    }),
    (error) => {
      assert.ok(error instanceof PairingFlowError);
      assert.equal(error.code, "rejected");
      return true;
    },
  );
  await decision;

  const state = (await rootRef.get()).val();
  assert.equal(state.pairingClaims[PAIRING_CODE].status, "rejected");
  assert.equal(state.deviceOwners, undefined);
  assert.equal(state.users, undefined);
});

test("times out while preserving the users resumable pending claim", async () => {
  const userId = await signInClient();
  await rootRef.set(availableState());

  await assert.rejects(
    pairDeviceWithProtectedClaim({
      database: clientDatabase,
      functions,
      userId,
      code: PAIRING_CODE,
      timeoutMs: 250,
    }),
    (error) => {
      assert.ok(error instanceof PairingFlowError);
      assert.equal(error.code, "timeout");
      return true;
    },
  );

  const claim = (
    await get(ref(clientDatabase, `greencloud/pairingClaims/${PAIRING_CODE}`))
  ).val();
  assert.equal(claim.status, "pending");
  assert.equal(claim.requestedByUid, userId);
});

test("resumes the users existing approved claim before callable finalization", async () => {
  const userId = await signInClient();
  const state = availableState();
  const pairing = state.pairings[PAIRING_CODE];
  await rootRef.set(state);

  const claim = {
    code: PAIRING_CODE,
    deviceId: DEVICE_ID,
    requestedByUid: userId,
    status: "pending",
    createdAtMs: Date.now(),
    expiresAtMs: pairing.expiresAtMs,
  };

  await set(
    ref(clientDatabase, `greencloud/pairingClaims/${PAIRING_CODE}`),
    claim,
  );
  await rootRef.child(`pairingClaims/${PAIRING_CODE}`).set({
    ...claim,
    status: "approved",
    decidedByUid: DEVICE_AUTH_UID,
    decidedAtMs: Date.now(),
  });

  const result = await pairDeviceWithProtectedClaim({
    database: clientDatabase,
    functions,
    userId,
    code: PAIRING_CODE,
    timeoutMs: 5_000,
  });

  assert.equal(result.claimResumed, true);
  assert.equal(result.ownerUid, userId);
  assert.equal(result.deviceId, DEVICE_ID);
  assert.equal(result.device.ownerUid, userId);
});
