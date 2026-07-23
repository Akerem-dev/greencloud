"use strict";

const DEVICE_ID_PATTERN = /^[^.#$\[\]\/\u0000-\u001F\u007F]{1,128}$/u;
const PAIRING_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const WORKSPACE_SCHEMA_VERSION = 9;

class DeviceUnpairError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DeviceUnpairError";
    this.code = code;
  }
}

function requireObject(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DeviceUnpairError(code, message);
  }

  return value;
}

function optionalRecord(value, code, message) {
  if (value === undefined || value === null) return {};
  return requireObject(value, code, message);
}

function requirePositiveSafeInteger(value, code, message) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new DeviceUnpairError(code, message);
  }

  return value;
}

function normalizeDeviceId(value) {
  if (typeof value !== "string") {
    throw new DeviceUnpairError(
      "invalid-argument",
      "deviceId must be a string.",
    );
  }

  const deviceId = value.trim();
  if (deviceId !== value || !DEVICE_ID_PATTERN.test(deviceId)) {
    throw new DeviceUnpairError(
      "invalid-argument",
      "deviceId is invalid.",
    );
  }

  return deviceId;
}

function toIsoString(nowMs) {
  const date = new Date(nowMs);
  if (Number.isNaN(date.getTime())) {
    throw new DeviceUnpairError(
      "invalid-argument",
      "nowMs does not represent a valid timestamp.",
    );
  }

  return date.toISOString();
}

function validPairingCode(value) {
  return typeof value === "string" && PAIRING_CODE_PATTERN.test(value);
}

function findPairingCode(greencloud, workspace, deviceId, requesterUid) {
  const projectedDevice = workspace.devices?.[deviceId];
  if (validPairingCode(projectedDevice?.pairingCode)) {
    return projectedDevice.pairingCode;
  }

  const workspacePairings = optionalRecord(
    workspace.pairings,
    "failed-precondition",
    "User workspace pairings are malformed.",
  );

  for (const [code, pairing] of Object.entries(workspacePairings)) {
    if (
      validPairingCode(code) &&
      pairing &&
      typeof pairing === "object" &&
      !Array.isArray(pairing) &&
      pairing.deviceId === deviceId &&
      (!pairing.ownerUid || pairing.ownerUid === requesterUid)
    ) {
      return code;
    }
  }

  const globalPairings = optionalRecord(
    greencloud.pairings,
    "failed-precondition",
    "Pairing records are malformed.",
  );

  for (const [code, pairing] of Object.entries(globalPairings)) {
    if (
      validPairingCode(code) &&
      pairing &&
      typeof pairing === "object" &&
      !Array.isArray(pairing) &&
      pairing.deviceId === deviceId &&
      pairing.ownerUid === requesterUid
    ) {
      return code;
    }
  }

  return undefined;
}

function buildFactoryResetCommand(deviceId, nowMs) {
  return {
    type: "FACTORY_RESET",
    factoryReset: true,
    irrigate: false,
    durationSeconds: 1,
    requestId: `factory-reset-${nowMs}`,
    createdAt: toIsoString(nowMs),
    source: "web",
    safeMode: true,
    pumpEnabled: false,
    handled: false,
    status: "pending",
    deviceId,
  };
}

function resultFromAudit(audit, idempotent) {
  return {
    deviceId: audit.deviceId,
    ownerUid: audit.ownerUid,
    pairingCode: audit.pairingCode ?? null,
    requestId: audit.requestId,
    unpairedAtMs: audit.unpairedAtMs,
    idempotent,
    factoryResetQueued: true,
    selectedDeviceId: audit.selectedDeviceId ?? "",
  };
}

function unpairDeviceState(currentState, input) {
  const greencloud = requireObject(
    currentState ?? {},
    "failed-precondition",
    "GreenCloud state is unavailable.",
  );
  const requesterUid = input?.requesterUid;
  const deviceId = normalizeDeviceId(input?.deviceId);
  const nowMs = requirePositiveSafeInteger(
    input?.nowMs,
    "invalid-argument",
    "nowMs must be a positive safe integer.",
  );

  if (typeof requesterUid !== "string" || requesterUid.length === 0) {
    throw new DeviceUnpairError(
      "unauthenticated",
      "An authenticated requester is required.",
    );
  }

  const unpairAudits = optionalRecord(
    greencloud.deviceUnpairs,
    "failed-precondition",
    "Device unpair audit records are malformed.",
  );
  const previousAudit = unpairAudits[deviceId];
  const owners = optionalRecord(
    greencloud.deviceOwners,
    "failed-precondition",
    "Device owners are malformed.",
  );
  const owner = owners[deviceId];

  if (!owner) {
    if (
      previousAudit &&
      typeof previousAudit === "object" &&
      !Array.isArray(previousAudit) &&
      previousAudit.ownerUid === requesterUid &&
      previousAudit.deviceId === deviceId
    ) {
      return {
        state: greencloud,
        result: resultFromAudit(previousAudit, true),
      };
    }

    throw new DeviceUnpairError(
      "not-found",
      "An owned device with this identity was not found.",
    );
  }

  const ownerRecord = requireObject(
    owner,
    "failed-precondition",
    "Canonical device ownership is malformed.",
  );

  if (ownerRecord.ownerUid !== requesterUid) {
    throw new DeviceUnpairError(
      "permission-denied",
      "Only the canonical device owner can unpair this device.",
    );
  }

  const users = requireObject(
    greencloud.users ?? {},
    "failed-precondition",
    "User workspaces are unavailable.",
  );
  const workspace = requireObject(
    users[requesterUid],
    "failed-precondition",
    "The owner workspace is unavailable.",
  );
  const devices = requireObject(
    workspace.devices ?? {},
    "failed-precondition",
    "User workspace devices are unavailable.",
  );
  const projectedDevice = requireObject(
    devices[deviceId],
    "failed-precondition",
    "The canonical owner workspace does not contain this device.",
  );

  if (projectedDevice.ownerUid && projectedDevice.ownerUid !== requesterUid) {
    throw new DeviceUnpairError(
      "failed-precondition",
      "The workspace device projection has conflicting ownership.",
    );
  }

  const pairingCode = findPairingCode(
    greencloud,
    workspace,
    deviceId,
    requesterUid,
  );
  const unpairedAt = toIsoString(nowMs);
  const command = buildFactoryResetCommand(deviceId, nowMs);
  const nextState = structuredClone(greencloud);

  nextState.deviceCommands ??= {};
  nextState.deviceUnpairs ??= {};
  nextState.deviceCommands[deviceId] = command;

  if (
    nextState.deviceData?.[deviceId] &&
    typeof nextState.deviceData[deviceId] === "object" &&
    !Array.isArray(nextState.deviceData[deviceId])
  ) {
    nextState.deviceData[deviceId] = {
      ...nextState.deviceData[deviceId],
      lastCommand: command.requestId,
      lastCommandStatus: "Pending",
      factoryResetRequested: true,
      deletedFromWeb: true,
      updatedAt: "Factory reset requested",
    };
  }

  delete nextState.deviceOwners[deviceId];

  const nextWorkspace = nextState.users[requesterUid];
  delete nextWorkspace.devices[deviceId];

  if (nextWorkspace.commands && typeof nextWorkspace.commands === "object") {
    delete nextWorkspace.commands[deviceId];
  }

  if (pairingCode) {
    if (nextWorkspace.pairings && typeof nextWorkspace.pairings === "object") {
      delete nextWorkspace.pairings[pairingCode];
    }

    if (
      nextState.pairings?.[pairingCode] &&
      typeof nextState.pairings[pairingCode] === "object"
    ) {
      const expiredPairing = {
        ...nextState.pairings[pairingCode],
        status: "expired",
        unpairedAtMs: nowMs,
        unpairedBy: requesterUid,
      };
      delete expiredPairing.ownerUid;
      nextState.pairings[pairingCode] = expiredPairing;
    }

    if (nextState.pairingClaims && typeof nextState.pairingClaims === "object") {
      delete nextState.pairingClaims[pairingCode];
    }
  }

  const remainingDeviceIds = Object.keys(nextWorkspace.devices ?? {});
  const selectedDeviceId =
    nextWorkspace.selectedDeviceId === deviceId ||
    !remainingDeviceIds.includes(nextWorkspace.selectedDeviceId)
      ? remainingDeviceIds[0] ?? ""
      : nextWorkspace.selectedDeviceId;

  nextWorkspace.selectedDeviceId = selectedDeviceId;
  nextWorkspace.meta = {
    ...(nextWorkspace.meta ?? {}),
    updatedAt: unpairedAt,
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    lastUnpairAt: unpairedAt,
  };

  const audit = {
    deviceId,
    ownerUid: requesterUid,
    requestId: command.requestId,
    unpairedAtMs: nowMs,
    selectedDeviceId,
    factoryResetQueued: true,
  };
  if (pairingCode) audit.pairingCode = pairingCode;
  nextState.deviceUnpairs[deviceId] = audit;

  return {
    state: nextState,
    result: resultFromAudit(audit, false),
  };
}

module.exports = {
  DeviceUnpairError,
  normalizeDeviceId,
  unpairDeviceState,
};
