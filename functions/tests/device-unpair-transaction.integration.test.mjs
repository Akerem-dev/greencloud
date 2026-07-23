import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";

const require = createRequire(import.meta.url);
const { deleteApp, initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const {
  unpairDeviceTransaction,
} = require("../src/device-unpair-transaction");

const PROJECT_ID = "demo-greencloud";
const APP_NAME = "device-unpair-transaction-integration";
const NOW = 1_721_500_000_000;

let app;
let rootRef;

function pairedState() {
  return {
    deviceActors: {
      "device-a": { deviceAuthUid: "device-auth-a" },
      "device-b": { deviceAuthUid: "device-auth-b" },
    },
    deviceOwners: {
      "device-a": { ownerUid: "user-a", assignedAtMs: NOW - 5_000, source: "pairing" },
      "device-b": { ownerUid: "user-a", assignedAtMs: NOW - 4_000, source: "pairing" },
    },
    deviceData: {
      "device-a": {
        deviceId: "device-a",
        ownerUid: "user-a",
        lastSeenMs: NOW - 100,
        moisture: 38,
      },
    },
    pairings: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        deviceAuthUid: "device-auth-a",
        ownerUid: "user-a",
        status: "paired",
        createdAtMs: NOW - 10_000,
        expiresAtMs: NOW + 100_000,
        pairedAtMs: NOW - 5_000,
      },
    },
    pairingClaims: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        requestedByUid: "user-a",
        status: "finalized",
        createdAtMs: NOW - 9_000,
        expiresAtMs: NOW + 100_000,
        decidedAtMs: NOW - 8_000,
        decidedByUid: "device-auth-a",
        finalizedAtMs: NOW - 5_000,
        finalizedBy: "user-a",
      },
    },
    users: {
      "user-a": {
        devices: {
          "device-a": {
            id: "device-a",
            name: "Balcony Basil",
            place: "South Balcony",
            location: "South Balcony",
            ownerUid: "user-a",
            pairingCode: "ABC123",
          },
          "device-b": {
            id: "device-b",
            name: "Kitchen Mint",
            place: "Kitchen",
            location: "Kitchen",
            ownerUid: "user-a",
          },
        },
        pairings: {
          ABC123: {
            code: "ABC123",
            deviceId: "device-a",
            ownerUid: "user-a",
            status: "paired",
          },
        },
        selectedDeviceId: "device-a",
        meta: { schemaVersion: 9 },
      },
    },
  };
}

function unpair(input = {}) {
  return unpairDeviceTransaction(rootRef, {
    requesterUid: "user-a",
    deviceId: "device-a",
    nowMs: NOW,
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
  await rootRef.set(pairedState());
});

after(async () => {
  if (rootRef) await rootRef.remove();
  if (app) await deleteApp(app);
});

test("commits owner removal, workspace cleanup and reset command atomically", async () => {
  const result = await unpair();
  const state = (await rootRef.get()).val();

  assert.equal(result.idempotent, false);
  assert.equal(result.selectedDeviceId, "device-b");
  assert.equal(state.deviceOwners?.["device-a"], undefined);
  assert.equal(state.users["user-a"].devices?.["device-a"], undefined);
  assert.equal(state.users["user-a"].selectedDeviceId, "device-b");
  assert.equal(state.deviceCommands["device-a"].type, "FACTORY_RESET");
  assert.equal(state.deviceCommands["device-a"].requestId, result.requestId);
  assert.equal(state.pairings.ABC123.status, "expired");
  assert.equal(state.pairingClaims?.ABC123, undefined);
  assert.equal(state.deviceUnpairs["device-a"].ownerUid, "user-a");
});

test("keeps repeated trusted unpair calls idempotent in RTDB", async () => {
  const first = await unpair();
  const second = await unpair({ nowMs: NOW + 100 });
  const state = (await rootRef.get()).val();

  assert.equal(first.idempotent, false);
  assert.equal(second.idempotent, true);
  assert.equal(second.requestId, first.requestId);
  assert.equal(state.deviceUnpairs["device-a"].unpairedAtMs, NOW);
  assert.equal(state.deviceCommands["device-a"].requestId, first.requestId);
});

test("serializes concurrent trusted unpair attempts", async () => {
  const results = await Promise.all([
    unpair({ nowMs: NOW }),
    unpair({ nowMs: NOW + 1 }),
  ]);
  const state = (await rootRef.get()).val();

  assert.deepEqual(
    results.map((result) => result.idempotent).sort(),
    [false, true],
  );
  assert.equal(state.deviceOwners?.["device-a"], undefined);
  assert.equal(state.deviceCommands["device-a"].type, "FACTORY_RESET");
});

test("rejects a non-owner without partially changing RTDB", async () => {
  const before = (await rootRef.get()).val();

  await assert.rejects(
    unpair({ requesterUid: "user-b" }),
    (error) => error.code === "permission-denied",
  );

  assert.deepEqual((await rootRef.get()).val(), before);
});
