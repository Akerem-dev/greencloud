import assert from "node:assert/strict";
import test from "node:test";
import module from "../src/pairing-finalization.js";

const { PairingFinalizationError, finalizePairingState } = module;
const NOW = 1_721_500_000_000;
const PAIRED_AT = new Date(NOW).toISOString();

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

function finalize(state = approvedState(), input = {}) {
  return finalizePairingState(state, {
    pairingCode: "ABC123",
    requesterUid: "user-a",
    nowMs: NOW,
    ...input,
  });
}

function assertError(code, operation) {
  assert.throws(operation, (error) => {
    assert.ok(error instanceof PairingFinalizationError);
    assert.equal(error.code, code);
    return true;
  });
}

test("finalizes ownership and user workspace projection atomically", () => {
  const original = approvedState();
  const { state, result } = finalize(original);
  const workspace = state.users["user-a"];
  const device = workspace.devices["device-a"];

  assert.equal(original.deviceOwners["device-a"], undefined);
  assert.equal(original.users, undefined);
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
  assert.equal(device.name, "GreenCloud Device");
  assert.equal(device.place, "Plant zone");
  assert.equal(device.ownerUid, "user-a");
  assert.equal(device.pairingCode, "ABC123");
  assert.equal(device.pairedAt, PAIRED_AT);
  assert.equal(workspace.selectedDeviceId, "device-a");
  assert.equal(workspace.pairings.ABC123.status, "paired");
  assert.equal(workspace.pairings.ABC123.ownerUid, "user-a");
  assert.equal(workspace.meta.schemaVersion, 9);
  assert.equal(workspace.meta.lastPairingAt, PAIRED_AT);

  assert.equal(result.idempotent, false);
  assert.equal(result.workspaceProjected, true);
  assert.deepEqual(result.device, device);
});

test("projects trimmed custom device labels", () => {
  const { state, result } = finalize(approvedState(), {
    deviceName: "  Patio Basil  ",
    devicePlace: "  South Balcony  ",
  });
  const device = state.users["user-a"].devices["device-a"];

  assert.equal(device.name, "Patio Basil");
  assert.equal(device.place, "South Balcony");
  assert.equal(device.location, "South Balcony");
  assert.equal(result.device.name, "Patio Basil");
});

test("normalizes a lowercase pairing code", () => {
  const { result } = finalize(approvedState(), { pairingCode: "abc123" });
  assert.equal(result.pairingCode, "ABC123");
});

test("rejects an invalid pairing code", () => {
  assertError("invalid-argument", () =>
    finalize(approvedState(), { pairingCode: "bad" }),
  );
});

test("rejects a non-string device name", () => {
  assertError("invalid-argument", () =>
    finalize(approvedState(), { deviceName: { unsafe: true } }),
  );
});

test("rejects an oversized device place", () => {
  assertError("invalid-argument", () =>
    finalize(approvedState(), { devicePlace: "x".repeat(121) }),
  );
});

test("rejects a requester who does not own the claim", () => {
  assertError("permission-denied", () =>
    finalize(approvedState(), { requesterUid: "user-b" }),
  );
});

test("rejects a claim that was not approved", () => {
  const state = approvedState();
  state.pairingClaims.ABC123.status = "pending";
  assertError("failed-precondition", () => finalize(state));
});

test("rejects an expired pairing", () => {
  const state = approvedState();
  state.pairings.ABC123.expiresAtMs = NOW - 1;
  state.pairingClaims.ABC123.pairingExpiresAtMs = NOW - 1;
  assertError("deadline-exceeded", () => finalize(state));
});

test("rejects a mismatched device approval identity", () => {
  const state = approvedState();
  state.pairingClaims.ABC123.decidedBy = "different-device";
  assertError("failed-precondition", () => finalize(state));
});

test("rejects a mismatched canonical device actor", () => {
  const state = approvedState();
  state.deviceActors["device-a"].deviceAuthUid = "different-device";
  assertError("failed-precondition", () => finalize(state));
});

test("rejects a device already owned by someone else", () => {
  const state = approvedState({
    deviceOwners: {
      "device-a": { ownerUid: "user-b" },
    },
  });
  assertError("already-exists", () => finalize(state));
});

test("rejects a conflicting user workspace device projection", () => {
  const state = approvedState({
    users: {
      "user-a": {
        devices: {
          "device-a": {
            id: "device-a",
            ownerUid: "user-b",
          },
        },
      },
    },
  });

  assertError("failed-precondition", () => finalize(state));
});

test("repairs a missing workspace projection for an already finalized owner", () => {
  const { state: finalizedState } = finalize();
  delete finalizedState.users;

  const { state, result } = finalize(finalizedState, { nowMs: NOW + 100 });

  assert.notEqual(state, finalizedState);
  assert.equal(result.idempotent, true);
  assert.equal(result.finalizedAtMs, NOW);
  assert.equal(state.users["user-a"].devices["device-a"].ownerUid, "user-a");
  assert.equal(state.users["user-a"].selectedDeviceId, "device-a");
  assert.equal(state.users["user-a"].meta.lastPairingAt, PAIRED_AT);
});

test("returns the same state for a complete idempotent projection", () => {
  const { state: finalizedState } = finalize(approvedState(), {
    deviceName: "Patio Basil",
    devicePlace: "South Balcony",
  });

  const { state: nextState, result } = finalize(finalizedState, {
    nowMs: NOW + 100,
    deviceName: "Do not overwrite",
    devicePlace: "Do not overwrite",
  });

  assert.equal(nextState, finalizedState);
  assert.equal(result.idempotent, true);
  assert.equal(result.finalizedAtMs, NOW);
  assert.equal(result.device.name, "Patio Basil");
  assert.equal(result.device.place, "South Balcony");
  assert.equal(finalizedState.deviceOwners["device-a"].assignedAtMs, NOW);
});
