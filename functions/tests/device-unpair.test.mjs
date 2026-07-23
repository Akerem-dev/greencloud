import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const {
  DeviceUnpairError,
  normalizeDeviceId,
  unpairDeviceState,
} = require("../src/device-unpair");

const NOW = 1_721_500_000_000;
const UNPAIRED_AT = new Date(NOW).toISOString();

function pairedState(overrides = {}) {
  return {
    deviceActors: {
      "device-a": { deviceAuthUid: "device-auth-a" },
      "device-b": { deviceAuthUid: "device-auth-b" },
    },
    deviceOwners: {
      "device-a": {
        ownerUid: "user-a",
        assignedAtMs: NOW - 5_000,
        source: "pairing",
      },
      "device-b": {
        ownerUid: "user-a",
        assignedAtMs: NOW - 4_000,
        source: "pairing",
      },
    },
    deviceData: {
      "device-a": {
        deviceId: "device-a",
        ownerUid: "user-a",
        lastSeenMs: NOW - 100,
        moisture: 42,
      },
    },
    deviceCommands: {},
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
        commands: {
          "device-a": { type: "IRRIGATE" },
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
        meta: {
          schemaVersion: 9,
          updatedAt: new Date(NOW - 5_000).toISOString(),
        },
      },
    },
    ...overrides,
  };
}

function unpair(state = pairedState(), input = {}) {
  return unpairDeviceState(state, {
    requesterUid: "user-a",
    deviceId: "device-a",
    nowMs: NOW,
    ...input,
  });
}

test("normalizes a valid device identity and rejects malformed values", () => {
  assert.equal(normalizeDeviceId("device-a"), "device-a");
  assert.throws(() => normalizeDeviceId(" device-a"), /invalid/);
  assert.throws(() => normalizeDeviceId("bad\/device"), /invalid/);
  assert.throws(() => normalizeDeviceId("x".repeat(129)), /invalid/);
});

test("removes canonical ownership and the owner workspace projection atomically", () => {
  const { state, result } = unpair();
  const workspace = state.users["user-a"];

  assert.equal(result.idempotent, false);
  assert.equal(result.deviceId, "device-a");
  assert.equal(result.ownerUid, "user-a");
  assert.equal(result.pairingCode, "ABC123");
  assert.equal(result.factoryResetQueued, true);
  assert.equal(result.selectedDeviceId, "device-b");

  assert.equal(state.deviceOwners?.["device-a"], undefined);
  assert.equal(workspace.devices?.["device-a"], undefined);
  assert.equal(workspace.commands?.["device-a"], undefined);
  assert.equal(workspace.pairings?.ABC123, undefined);
  assert.equal(workspace.selectedDeviceId, "device-b");
  assert.equal(workspace.meta.lastUnpairAt, UNPAIRED_AT);
  assert.equal(workspace.meta.schemaVersion, 9);
});

test("queues a factory-reset command while preserving the verified device actor", () => {
  const { state, result } = unpair();
  const command = state.deviceCommands["device-a"];

  assert.equal(state.deviceActors["device-a"].deviceAuthUid, "device-auth-a");
  assert.equal(command.type, "FACTORY_RESET");
  assert.equal(command.factoryReset, true);
  assert.equal(command.irrigate, false);
  assert.equal(command.handled, false);
  assert.equal(command.status, "pending");
  assert.equal(command.requestId, result.requestId);
  assert.equal(command.createdAt, UNPAIRED_AT);
});

test("expires the old pairing and removes the finalized claim", () => {
  const { state } = unpair();

  assert.equal(state.pairings.ABC123.status, "expired");
  assert.equal(state.pairings.ABC123.ownerUid, undefined);
  assert.equal(state.pairings.ABC123.unpairedBy, "user-a");
  assert.equal(state.pairings.ABC123.unpairedAtMs, NOW);
  assert.equal(state.pairingClaims?.ABC123, undefined);
});

test("marks retained telemetry as deleted without exposing it to the former owner", () => {
  const { state, result } = unpair();
  const telemetry = state.deviceData["device-a"];

  assert.equal(telemetry.moisture, 42);
  assert.equal(telemetry.factoryResetRequested, true);
  assert.equal(telemetry.deletedFromWeb, true);
  assert.equal(telemetry.lastCommand, result.requestId);
  assert.equal(telemetry.lastCommandStatus, "Pending");
  assert.equal(state.deviceOwners?.["device-a"], undefined);
});

test("rejects unauthenticated, foreign-owner and missing-workspace requests", () => {
  assert.throws(
    () => unpair(pairedState(), { requesterUid: "" }),
    (error) => error instanceof DeviceUnpairError && error.code === "unauthenticated",
  );

  assert.throws(
    () => unpair(pairedState(), { requesterUid: "user-b" }),
    (error) => error instanceof DeviceUnpairError && error.code === "permission-denied",
  );

  const malformed = pairedState({ users: {} });
  assert.throws(
    () => unpair(malformed),
    (error) => error instanceof DeviceUnpairError && error.code === "failed-precondition",
  );
});

test("does not mutate the original state when validation fails", () => {
  const state = pairedState();
  const snapshot = structuredClone(state);

  assert.throws(() => unpair(state, { requesterUid: "user-b" }));
  assert.deepEqual(state, snapshot);
});

test("returns the prior trusted audit for repeated owner requests", () => {
  const first = unpair();
  const second = unpairDeviceState(first.state, {
    requesterUid: "user-a",
    deviceId: "device-a",
    nowMs: NOW + 100,
  });

  assert.equal(second.result.idempotent, true);
  assert.equal(second.result.requestId, first.result.requestId);
  assert.equal(second.result.unpairedAtMs, NOW);
  assert.deepEqual(second.state, first.state);
});
