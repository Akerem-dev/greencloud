"use strict";

const PAIRING_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const WORKSPACE_SCHEMA_VERSION = 9;
const DEFAULT_DEVICE_NAME = "GreenCloud Device";
const DEFAULT_DEVICE_PLACE = "Plant zone";
const MAX_DEVICE_NAME_LENGTH = 80;
const MAX_DEVICE_PLACE_LENGTH = 120;

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

function normalizeWorkspaceLabel(value, fallback, fieldName, maxLength) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value !== "string") {
    throw new PairingFinalizationError(
      "invalid-argument",
      `${fieldName} must be a string.`,
    );
  }

  const label = value.trim();
  if (!label) {
    return fallback;
  }
  if (label.length > maxLength) {
    throw new PairingFinalizationError(
      "invalid-argument",
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return label;
}

function toIsoString(value) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function optionalRecord(value, code, message) {
  if (value === undefined || value === null) {
    return {};
  }
  return requireObject(value, code, message);
}

function workspaceProjectionIsComplete(
  greencloud,
  requesterUid,
  deviceId,
  pairingCode,
  finalizedAtMs,
) {
  const workspace = greencloud.users?.[requesterUid];
  const device = workspace?.devices?.[deviceId];
  const pairing = workspace?.pairings?.[pairingCode];
  const pairedAt = toIsoString(finalizedAtMs);

  return Boolean(
    workspace &&
      device &&
      pairing &&
      pairedAt &&
      device.id === deviceId &&
      device.ownerUid === requesterUid &&
      device.pairingCode === pairingCode &&
      device.pairedAt === pairedAt &&
      pairing.code === pairingCode &&
      pairing.deviceId === deviceId &&
      pairing.ownerUid === requesterUid &&
      pairing.status === "paired" &&
      workspace.meta?.schemaVersion === WORKSPACE_SCHEMA_VERSION &&
      workspace.meta?.lastPairingAt === pairedAt,
  );
}

function buildWorkspaceDevice({
  existingDevice,
  requesterUid,
  deviceId,
  pairingCode,
  pairing,
  pairedAtMs,
  requestedName,
  requestedPlace,
  preserveExistingLabels,
}) {
  const current = existingDevice ?? {};
  const pairedAt = toIsoString(pairedAtMs);
  const name =
    preserveExistingLabels &&
    typeof current.name === "string" &&
    current.name.trim()
      ? current.name
      : requestedName;
  const place =
    preserveExistingLabels &&
    typeof current.place === "string" &&
    current.place.trim()
      ? current.place
      : requestedPlace;

  return {
    ...current,
    id: deviceId,
    name,
    place,
    location: place,
    moisture:
      typeof current.moisture === "number" && Number.isFinite(current.moisture)
        ? current.moisture
        : 0,
    signal:
      typeof current.signal === "number" && Number.isFinite(current.signal)
        ? current.signal
        : 0,
    status:
      current.status === "Online" ||
      current.status === "Syncing" ||
      current.status === "Idle" ||
      current.status === "Offline"
        ? current.status
        : "Idle",
    updatedAt:
      typeof current.updatedAt === "string"
        ? current.updatedAt
        : "Waiting for device",
    lastWateredAt:
      typeof current.lastWateredAt === "string"
        ? current.lastWateredAt
        : "Not watered yet",
    power: typeof current.power === "string" ? current.power : "USB / Adapter",
    sensorStatus:
      typeof current.sensorStatus === "string" ? current.sensorStatus : "Pending",
    safeMode: typeof current.safeMode === "boolean" ? current.safeMode : true,
    pumpEnabled:
      typeof current.pumpEnabled === "boolean" ? current.pumpEnabled : false,
    relayState:
      typeof current.relayState === "string" ? current.relayState : "Locked",
    pumpState:
      typeof current.pumpState === "string" ? current.pumpState : "Dry-run",
    rainDetected:
      typeof current.rainDetected === "boolean" ? current.rainDetected : false,
    rainStatus:
      typeof current.rainStatus === "string" ? current.rainStatus : "Pending",
    waterLevelStatus:
      typeof current.waterLevelStatus === "string"
        ? current.waterLevelStatus
        : "Pending",
    buttonPressed:
      typeof current.buttonPressed === "boolean" ? current.buttonPressed : false,
    buttonStatus:
      typeof current.buttonStatus === "string" ? current.buttonStatus : "Pending",
    oledStatus:
      typeof current.oledStatus === "string" ? current.oledStatus : "Pending",
    firmware:
      typeof pairing.firmware === "string" && pairing.firmware
        ? pairing.firmware
        : typeof current.firmware === "string"
          ? current.firmware
          : "greencloud-esp32",
    lastCommand:
      typeof current.lastCommand === "string" ? current.lastCommand : "None",
    lastCommandStatus:
      typeof current.lastCommandStatus === "string"
        ? current.lastCommandStatus
        : "None",
    pairingCode,
    pairedAt,
    ownerUid: requesterUid,
  };
}

function buildWorkspacePairing({
  pairing,
  requesterUid,
  deviceId,
  pairingCode,
  pairedAtMs,
}) {
  const projection = {
    code: pairingCode,
    deviceId,
    ownerUid: requesterUid,
    status: "paired",
    pairedAt: toIsoString(pairedAtMs),
    firmware:
      typeof pairing.firmware === "string" && pairing.firmware
        ? pairing.firmware
        : "greencloud-esp32",
  };
  const createdAt = toIsoString(pairing.createdAtMs);
  const expiresAt = toIsoString(pairing.expiresAtMs);

  if (createdAt) projection.createdAt = createdAt;
  if (expiresAt) projection.expiresAt = expiresAt;
  if (Number.isSafeInteger(pairing.lastSeenMs)) {
    projection.lastSeenMs = pairing.lastSeenMs;
  }

  return projection;
}

function projectUserWorkspace(nextState, options) {
  const {
    requesterUid,
    deviceId,
    pairingCode,
    pairing,
    pairedAtMs,
    requestedName,
    requestedPlace,
    selectDevice,
    preserveExistingLabels,
  } = options;
  const pairedAt = toIsoString(pairedAtMs);

  if (!pairedAt) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "Pairing finalization timestamp is invalid.",
    );
  }

  nextState.users ??= {};
  const workspace = (nextState.users[requesterUid] ??= {});
  workspace.devices ??= {};
  workspace.pairings ??= {};
  workspace.meta ??= {};

  const existingDevice = workspace.devices[deviceId];
  if (
    existingDevice?.ownerUid &&
    existingDevice.ownerUid !== requesterUid
  ) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "User workspace contains a conflicting device projection.",
    );
  }

  workspace.devices[deviceId] = buildWorkspaceDevice({
    existingDevice,
    requesterUid,
    deviceId,
    pairingCode,
    pairing,
    pairedAtMs,
    requestedName,
    requestedPlace,
    preserveExistingLabels,
  });
  workspace.pairings[pairingCode] = buildWorkspacePairing({
    pairing,
    requesterUid,
    deviceId,
    pairingCode,
    pairedAtMs,
  });

  if (
    selectDevice ||
    typeof workspace.selectedDeviceId !== "string" ||
    !workspace.selectedDeviceId
  ) {
    workspace.selectedDeviceId = deviceId;
  }

  workspace.meta = {
    ...workspace.meta,
    updatedAt: pairedAt,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    lastPairingAt: pairedAt,
  };

  return workspace.devices[deviceId];
}

function validateWorkspaceContainers(greencloud, requesterUid, deviceId) {
  const users = optionalRecord(
    greencloud.users,
    "failed-precondition",
    "User workspaces are unavailable.",
  );
  const workspace = users[requesterUid];

  if (!workspace) {
    return;
  }

  requireObject(
    workspace,
    "failed-precondition",
    "User workspace is malformed.",
  );
  const devices = optionalRecord(
    workspace.devices,
    "failed-precondition",
    "User workspace devices are malformed.",
  );
  optionalRecord(
    workspace.pairings,
    "failed-precondition",
    "User workspace pairings are malformed.",
  );
  optionalRecord(
    workspace.meta,
    "failed-precondition",
    "User workspace metadata is malformed.",
  );

  const existingDevice = devices[deviceId];
  if (
    existingDevice &&
    requireObject(
      existingDevice,
      "failed-precondition",
      "User workspace device projection is malformed.",
    ).ownerUid &&
    existingDevice.ownerUid !== requesterUid
  ) {
    throw new PairingFinalizationError(
      "failed-precondition",
      "User workspace contains a conflicting device projection.",
    );
  }
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
  const requestedName = normalizeWorkspaceLabel(
    input?.deviceName,
    DEFAULT_DEVICE_NAME,
    "name",
    MAX_DEVICE_NAME_LENGTH,
  );
  const requestedPlace = normalizeWorkspaceLabel(
    input?.devicePlace,
    DEFAULT_DEVICE_PLACE,
    "place",
    MAX_DEVICE_PLACE_LENGTH,
  );

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

  validateWorkspaceContainers(greencloud, requesterUid, deviceId);

  if (isAlreadyFinalized) {
    if (!Number.isSafeInteger(claim.finalizedAtMs)) {
      throw new PairingFinalizationError(
        "failed-precondition",
        "Finalized pairing timestamp is missing.",
      );
    }

    if (
      workspaceProjectionIsComplete(
        greencloud,
        requesterUid,
        deviceId,
        pairingCode,
        claim.finalizedAtMs,
      )
    ) {
      return {
        state: greencloud,
        result: {
          pairingCode,
          deviceId,
          ownerUid: requesterUid,
          finalizedAtMs: claim.finalizedAtMs,
          idempotent: true,
          workspaceProjected: true,
          device: greencloud.users[requesterUid].devices[deviceId],
        },
      };
    }

    const repairedState = structuredClone(greencloud);
    const device = projectUserWorkspace(repairedState, {
      requesterUid,
      deviceId,
      pairingCode,
      pairing,
      pairedAtMs: claim.finalizedAtMs,
      requestedName,
      requestedPlace,
      selectDevice: false,
      preserveExistingLabels: true,
    });

    return {
      state: repairedState,
      result: {
        pairingCode,
        deviceId,
        ownerUid: requesterUid,
        finalizedAtMs: claim.finalizedAtMs,
        idempotent: true,
        workspaceProjected: true,
        device,
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
  const device = projectUserWorkspace(nextState, {
    requesterUid,
    deviceId,
    pairingCode,
    pairing,
    pairedAtMs: nowMs,
    requestedName,
    requestedPlace,
    selectDevice: true,
    preserveExistingLabels: false,
  });

  return {
    state: nextState,
    result: {
      pairingCode,
      deviceId,
      ownerUid: requesterUid,
      finalizedAtMs: nowMs,
      idempotent: false,
      workspaceProjected: true,
      device,
    },
  };
}

module.exports = {
  PairingFinalizationError,
  finalizePairingState,
  normalizePairingCode,
};
