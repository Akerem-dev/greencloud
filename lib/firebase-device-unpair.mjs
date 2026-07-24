import { httpsCallable } from "firebase/functions";

import { validateDeviceId } from "./device-mutation-safety.mjs";

export class DeviceUnpairFlowError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "DeviceUnpairFlowError";
    this.code = code;
    this.cause = cause;
  }
}

function requireRecord(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new DeviceUnpairFlowError("invalid-response", message);
  }

  return value;
}

function firebaseErrorCode(error) {
  if (!error || typeof error !== "object") return "";
  return typeof error.code === "string" ? error.code : "";
}

export function friendlyDeviceUnpairError(error) {
  if (error instanceof DeviceUnpairFlowError) return error;

  const code = firebaseErrorCode(error);

  if (code.includes("unauthenticated")) {
    return new DeviceUnpairFlowError(
      "unauthenticated",
      "Sign in before removing a device.",
      error,
    );
  }

  if (code.includes("permission-denied")) {
    return new DeviceUnpairFlowError(
      "permission-denied",
      "Only the verified device owner can remove this device.",
      error,
    );
  }

  if (code.includes("invalid-argument")) {
    return new DeviceUnpairFlowError(
      "invalid-argument",
      "The selected device identity is invalid.",
      error,
    );
  }

  if (code.includes("not-found")) {
    return new DeviceUnpairFlowError(
      "not-found",
      "This device is no longer paired with the workspace.",
      error,
    );
  }

  if (code.includes("failed-precondition")) {
    return new DeviceUnpairFlowError(
      "failed-precondition",
      "The device workspace is not ready for secure removal.",
      error,
    );
  }

  return new DeviceUnpairFlowError(
    "firebase-error",
    "The device could not be removed securely. Try again.",
    error,
  );
}

export function validateDeviceUnpairResult(value, expected) {
  const result = requireRecord(
    value,
    "Device removal returned an invalid response.",
  );

  if (
    result.deviceId !== expected.deviceId ||
    result.ownerUid !== expected.userId ||
    typeof result.requestId !== "string" ||
    !result.requestId ||
    !Number.isSafeInteger(result.unpairedAtMs) ||
    result.unpairedAtMs <= 0 ||
    result.factoryResetQueued !== true ||
    typeof result.selectedDeviceId !== "string" ||
    typeof result.idempotent !== "boolean"
  ) {
    throw new DeviceUnpairFlowError(
      "invalid-response",
      "Device removal returned mismatched ownership data.",
    );
  }

  return result;
}

export async function unpairDeviceWithTrustedCallable(options) {
  const {
    functions,
    userId,
    deviceId: rawDeviceId,
    callableFactory = httpsCallable,
  } = options ?? {};

  if (!functions) {
    throw new DeviceUnpairFlowError(
      "invalid-config",
      "Firebase Functions is required for secure device removal.",
    );
  }

  if (typeof userId !== "string" || !userId.trim()) {
    throw new DeviceUnpairFlowError(
      "unauthenticated",
      "Sign in before removing a device.",
    );
  }

  const deviceId = validateDeviceId(rawDeviceId);
  const unpairDevice = callableFactory(functions, "unpairDevice");

  try {
    const response = await unpairDevice({ deviceId });
    return validateDeviceUnpairResult(response?.data, {
      deviceId,
      userId,
    });
  } catch (error) {
    throw friendlyDeviceUnpairError(error);
  }
}
