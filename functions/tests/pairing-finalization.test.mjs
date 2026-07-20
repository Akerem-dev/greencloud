import assert from "node:assert/strict";
import test from "node:test";
import module from "../src/pairing-finalization.js";

const { PairingFinalizationError, finalizePairingState } = module;
const NOW = 1_721_500_000_000;

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

test("finalizes an approved pairing atomically in state", () => {
  const original = approvedState();
  const { state, result } = finalize(original);

  assert.equal(original.deviceOwners["device-a"], undefined);
  assert.deepEqual(state.deviceOwners["device-a"], {
    ownerUid: "user-a",
    assignedAtMs: NOW,
    source: "pairing",
  });
  assert.equal(state.pairings.ABC123.status, "paired");
  assert.equal(state.pairings.ABC123.ownerUid, "user-a");
  assert.equal(state.pairingClaims.ABC123.status, "finalized");
  assert.equal(state.pairingClaims.ABC123.finalizedBy, "user-a");
  assert.equal(result.idempotent, false);
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

test("returns an idempotent result for the same finalized owner", () => {
  const state = approvedState({
    deviceOwners: {
      "device-a": {
        ownerUid: "user-a",
        assignedAtMs: NOW - 10,
        source: "pairing",
      },
    },
  });
  state.pairings.ABC123 = {
    ...state.pairings.ABC123,
    status: "paired",
    ownerUid: "user-a",
    pairedAtMs: NOW - 10,
  };
  state.pairingClaims.ABC123 = {
    ...state.pairingClaims.ABC123,
    status: "finalized",
    finalizedAtMs: NOW - 10,
    finalizedBy: "user-a",
  };

  const { state: nextState, result } = finalize(state);
  assert.equal(nextState, state);
  assert.equal(result.idempotent, true);
  assert.equal(result.finalizedAtMs, NOW - 10);
});
