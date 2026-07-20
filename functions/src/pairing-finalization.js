"use strict";

const PAIRING_CODE_PATTERN = /^[A-Z0-9]{6}$/;

class PairingFinalizationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PairingFinalizationError";
    this.code = code;
  }
}

function requireObject(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PairingFinalizationError(code, message);
  }
  return value;
}

function normalizePairingCode(value) {
  if (typeof value !== "string") {
    throw new PairingFinalizationError(
      "invalid-argument",
      "pairingCode must be a string.",
    );
  }

  const code = value.trim().toUpperCase();
  if (!PAIRING_CODE_PATTERN.test(code)) {
    throw new PairingFinalizationError(
      "invalid-argument",
      "pairingCode must be six uppercase letters or digits.",
    );
  }

  return code;
}

function finalizePairingState(currentState, input) {
  const greencloud = requireObject(
    currentState ?? {},
    "failed-precondition",
    "GreenCloud state is unavailable.",
  );
  const requesterUid = input?.requesterUid;
  const nowMs = input?.nowMs;
  const pairingCode = normalizePairingCode(input?.pairingCode);

  if (typeof requesterUid !== "string" || requesterUid.length === 0) {
    throw new PairingFinalizationError(
      "unauthenticated",
      "An authenticated requester is required.",
    );
  }
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) {
    throw new PairingFinalizationError(
      "invalid-argument",
      "nowMs must be a positive safe integer.",
    );
  }

  const claims = requireObject(
    greencloud.pairingClaims ?? {},
    "failed-precondition",
    "Pairing claims are unavailable.",
  );
  const pairings = requireObject(
    greencloud.pairings ?? {},
    "failed-precondition",
    "Pairings are unavailable.",
  );
  const actors = requireObject(
    greencloud.deviceActors ?? {},
    "failed-precondition",
    "Device actors are unavailable.",
  );
  const owners = requireObject(
    greencloud.deviceOwners ?? {},
    "failed-precondition",
    "Device owners are unavailable.",
  );

  const claim = requireObject(
    claims[pairingCode],
    "not-found",
    "Pairing claim was not found.",
  );
  const pairing = requireObject(
    pairings[pairingCode],
    "not-found",
    "Pairing code was not found.",
  );

  if (claim.requesterUid !== requesterUid) {
    throw new PairingFinalizationError(
      "permission-denied",
      "The requester does not own this pairing claim.",
    );
  }
  if (claim.code !== pairingCode || pairing.code !== pairingCode) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing code records do not match.",
    );
  }
  if (
    typeof claim.deviceId !== "string" ||
    claim.deviceId.length === 0 ||
    claim.deviceId !== pairing.deviceId
  ) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing claim device does not match the pairing record.",
    );
  }
  if (
    claim.pairingExpiresAtMs !== pairing.expiresAtMs ||
    !Number.isSafeInteger(pairing.expiresAtMs)
  ) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing expiry records do not match.",
    );
  }

  const deviceId = claim.deviceId;
  const existingOwner = owners[deviceId];
  const isAlreadyFinalized =
    claim.status === "finalized" &&
    pairing.status === "paired" &&
    claim.finalizedBy === requesterUid &&
    pairing.ownerUid === requesterUid &&
    existingOwner?.ownerUid === requesterUid;

  if (isAlreadyFinalized) {
    return {
      state: greencloud,
      result: {
        pairingCode,
        deviceId,
        ownerUid: requesterUid,
        finalizedAtMs: claim.finalizedAtMs,
        idempotent: true,
      },
    };
  }

  if (claim.status !== "approved") {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing claim must be approved by the device.",
    );
  }
  if (pairing.status !== "available") {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing code is no longer available.",
    );
  }
  if (pairing.expiresAtMs <= nowMs || claim.pairingExpiresAtMs <= nowMs) {
    throw new PairingFinalizationError(
      "deadline-exceeded",
      "Pairing code has expired.",
    );
  }
  if (
    typeof pairing.deviceAuthUid !== "string" ||
    pairing.deviceAuthUid.length === 0 ||
    claim.decidedBy !== pairing.deviceAuthUid
  ) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing approval identity does not match the device.",
    );
  }

  const actor = requireObject(
    actors[deviceId],
    "failed-precondition",
    "Canonical device actor is missing.",
  );
  if (actor.deviceAuthUid !== pairing.deviceAuthUid) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Canonical device actor does not match the pairing record.",
    );
  }
  if (existingOwner && existingOwner.ownerUid !== requesterUid) {
    throw new PairingFinalizationError(
      "already-exists",
      "Device already belongs to another user.",
    );
  }

  const nextState = structuredClone(greencloud);
  nextState.deviceOwners ??= {};
  nextState.pairings ??= {};
  nextState.pairingClaims ??= {};

  nextState.deviceOwners[deviceId] = {
    ownerUid: requesterUid,
    assignedAtMs: nowMs,
    source: "pairing",
  };
  nextState.pairings[pairingCode] = {
    ...pairing,
    status: "paired",
    ownerUid: requesterUid,
    pairedAtMs: nowMs,
  };
  nextState.pairingClaims[pairingCode] = {
    ...claim,
    status: "finalized",
    finalizedAtMs: nowMs,
    finalizedBy: requesterUid,
  };

  return {
    state: nextState,
    result: {
      pairingCode,
      deviceId,
      ownerUid: requesterUid,
      finalizedAtMs: nowMs,
      idempotent: false,
    },
  };
}

module.exports = {
  PairingFinalizationError,
  finalizePairingState,
  normalizePairingCode,
};
