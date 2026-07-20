import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";

const require = createRequire(import.meta.url);
const { deleteApp, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const {
  finalizePairingTransaction,
} = require("../src/pairing-transaction");

const PROJECT_ID = "demo-greencloud";
const APP_NAME = "pairing-transaction-integration";
const NOW = 1_721_500_000_000;
const PAIRED_AT = new Date(NOW).toISOString();

let app;
let rootRef;

function approvedState(overrides = {}) {
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
        createdAtMs: NOW - 1_000,
        expiresAtMs: NOW + 600_000,
        firmware: "greencloud-esp32",
      },
    },
    pairingClaims: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        requesterUid: "user-a",
        status: "approved",
        requestedAtMs: NOW - 500,
        pairingExpiresAtMs: NOW + 600_000,
        decidedAtMs: NOW - 100,
        decidedBy: "device-auth-a",
      },
    },
    ...overrides,
  };
}

function finalize(input = {}) {
  return finalizePairingTransaction(rootRef, {
    pairingCode: "ABC123",
    requesterUid: "user-a",
    nowMs: NOW,
    deviceName: "Patio Basil",
    devicePlace: "South Balcony",
    ...input,
  });
}

before(() => {
  const emulatorHost =
    process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? "127.0.0.1:9000";
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = emulatorHost;

  app = initializeApp(
    {
      projectId: PROJECT_ID,
      databaseURL: `http://${emulatorHost}?ns=${PROJECT_ID}`,
    },
    APP_NAME,
  );
  rootRef = getDatabase(app).ref("greencloud");
});

beforeEach(async () => {
  await rootRef.set(approvedState());
});

after(async () => {
  if (rootRef) {
    await rootRef.remove();
  }
  if (app) {
    await deleteApp(app);
  }
});

test("commits canonical ownership and workspace projection in RTDB", async () => {
  const result = await finalize();
  const state = (await rootRef.get()).val();
  const workspace = state.users["user-a"];
  const device = workspace.devices["device-a"];

  assert.equal(result.idempotent, false);
  assert.equal(result.workspaceProjected, true);
  assert.deepEqual(state.deviceOwners["device-a"], {
    ownerUid: "user-a",
    assignedAtMs: NOW,
    source: "pairing",
  });
  assert.equal(state.pairings.ABC123.status, "paired");
  assert.equal(state.pairings.ABC123.ownerUid, "user-a");
  assert.equal(state.pairingClaims.ABC123.status, "finalized");
  assert.equal(state.pairingClaims.ABC123.finalizedBy, "user-a");

  assert.equal(device.id, "device-a");
  assert.equal(device.name, "Patio Basil");
  assert.equal(device.place, "South Balcony");
  assert.equal(device.ownerUid, "user-a");
  assert.equal(device.pairingCode, "ABC123");
  assert.equal(device.pairedAt, PAIRED_AT);
  assert.equal(workspace.selectedDeviceId, "device-a");
  assert.equal(workspace.pairings.ABC123.status, "paired");
  assert.equal(workspace.meta.schemaVersion, 9);
  assert.equal(workspace.meta.lastPairingAt, PAIRED_AT);
  assert.deepEqual(result.device, device);
});

test("keeps repeated finalization idempotent in RTDB", async () => {
  const first = await finalize();
  const second = await finalize({
    nowMs: NOW + 100,
    deviceName: "Do not overwrite",
    devicePlace: "Do not overwrite",
  });
  const state = (await rootRef.get()).val();

  assert.equal(first.idempotent, false);
  assert.equal(second.idempotent, true);
  assert.equal(second.finalizedAtMs, NOW);
  assert.equal(state.deviceOwners["device-a"].assignedAtMs, NOW);
  assert.equal(state.pairings.ABC123.pairedAtMs, NOW);
  assert.equal(state.pairingClaims.ABC123.finalizedAtMs, NOW);
  assert.equal(state.users["user-a"].devices["device-a"].name, "Patio Basil");
  assert.equal(state.users["user-a"].devices["device-a"].place, "South Balcony");
  assert.equal(state.users["user-a"].meta.lastPairingAt, PAIRED_AT);
});

test("serializes concurrent finalization attempts", async () => {
  const results = await Promise.all([
    finalize({ nowMs: NOW }),
    finalize({ nowMs: NOW + 1 }),
  ]);
  const state = (await rootRef.get()).val();

  assert.deepEqual(
    results.map((result) => result.idempotent).sort(),
    [false, true],
  );
  assert.equal(state.deviceOwners["device-a"].ownerUid, "user-a");
  assert.equal(state.pairings.ABC123.status, "paired");
  assert.equal(state.pairingClaims.ABC123.status, "finalized");
  assert.equal(state.users["user-a"].devices["device-a"].ownerUid, "user-a");
});

test("rejects a conflicting owner without partially changing RTDB", async () => {
  const state = approvedState({
    deviceOwners: {
      "device-a": {
        ownerUid: "user-b",
        assignedAtMs: NOW - 5_000,
        source: "migration",
      },
    },
  });
  await rootRef.set(state);

  await assert.rejects(finalize(), (error) => {
    assert.equal(error.code, "already-exists");
    return true;
  });

  assert.deepEqual((await rootRef.get()).val(), state);
});
