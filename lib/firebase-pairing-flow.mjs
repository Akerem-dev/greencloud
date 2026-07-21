import { get, onValue, ref, set } from "firebase/database";
import { httpsCallable } from "firebase/functions";

const GREENCLOUD_ROOT = "greencloud";
const PAIRING_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const DEFAULT_TIMEOUT_MS = 90_000;
const MAX_DEVICE_NAME_LENGTH = 80;
const MAX_DEVICE_PLACE_LENGTH = 120;

export class PairingFlowError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "PairingFlowError";
    this.code = code;
    this.cause = cause;
  }
}

export function normalizePairingCode(value) {
  if (typeof value !== "string") {
    throw new PairingFlowError("invalid-code", "Pairing code must be a string.");
  }

  const code = value.trim().replace(/\s+/g, "").toUpperCase();
  if (!PAIRING_CODE_PATTERN.test(code)) {
    throw new PairingFlowError(
      "invalid-code",
      "Enter the 6-character code shown on the ESP32 OLED.",
    );
  }

  return code;
}

function normalizeLabel(value, fallback, fieldName, maxLength) {
  if (value === undefined || value === null) return fallback;

  if (typeof value !== "string") {
    throw new PairingFlowError(
      "invalid-label",
      `${fieldName} must be a string.`,
    );
  }

  const label = value.trim();
  if (!label) return fallback;

  if (label.length > maxLength) {
    throw new PairingFlowError(
      "invalid-label",
      `${fieldName} must be ${maxLength} characters or fewer.`,
    );
  }

  return label;
}

function requireRecord(value, code, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PairingFlowError(code, message);
  }

  return value;
}

function requireString(value, code, message) {
  if (typeof value !== "string" || value.length === 0) {
    throw new PairingFlowError(code, message);
  }

  return value;
}

function requirePositiveSafeInteger(value, code, message) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new PairingFlowError(code, message);
  }

  return value;
}

function firebaseErrorCode(error) {
  if (!error || typeof error !== "object") return "";
  return typeof error.code === "string" ? error.code : "";
}

function isPermissionDenied(error) {
  const code = firebaseErrorCode(error);
  return code.includes("permission-denied") || code.includes("permission_denied");
}

function friendlyFirebaseError(error, fallbackMessage) {
  const code = firebaseErrorCode(error);

  if (isPermissionDenied(error)) {
    return new PairingFlowError(
      "permission-denied",
      "This pairing request is not allowed or the code is already claimed.",
      error,
    );
  }

  if (code.includes("unauthenticated")) {
    return new PairingFlowError(
      "unauthenticated",
      "Sign in before pairing a device.",
      error,
    );
  }

  return new PairingFlowError("firebase-error", fallbackMessage, error);
}

function pairingPath(code) {
  return `${GREENCLOUD_ROOT}/pairings/${code}`;
}

function pairingClaimPath(code) {
  return `${GREENCLOUD_ROOT}/pairingClaims/${code}`;
}

function parseAvailablePairing(snapshotValue, code, nowMs) {
  const pairing = requireRecord(
    snapshotValue,
    "not-found",
    "Pairing code was not found. Check the ESP32 OLED.",
  );
  const storedCode = requireString(
    pairing.code,
    "invalid-pairing",
    "Pairing record does not contain a valid code.",
  );
  const deviceId = requireString(
    pairing.deviceId,
    "invalid-pairing",
    "Pairing record does not contain a device identity.",
  );
  const expiresAtMs = requirePositiveSafeInteger(
    pairing.expiresAtMs,
    "invalid-pairing",
    "Pairing record does not contain a valid expiry.",
  );

  if (storedCode !== code) {
    throw new PairingFlowError(
      "invalid-pairing",
      "Pairing record does not match the entered code.",
    );
  }

  if (pairing.status !== "available") {
    throw new PairingFlowError(
      "unavailable",
      "This pairing code is no longer available.",
    );
  }

  if (expiresAtMs <= nowMs) {
    throw new PairingFlowError(
      "expired",
      "This pairing code has expired. Restart the ESP32 for a new code.",
    );
  }

  return { code, deviceId, expiresAtMs };
}

function validateOwnedClaim(value, expected) {
  const claim = requireRecord(
    value,
    "claim-conflict",
    "The pairing claim could not be resumed.",
  );

  if (
    claim.code !== expected.code ||
    claim.deviceId !== expected.deviceId ||
    claim.requestedByUid !== expected.userId ||
    claim.expiresAtMs !== expected.expiresAtMs
  ) {
    throw new PairingFlowError(
      "claim-conflict",
      "A different pairing claim already exists for this code.",
    );
  }

  if (
    claim.status !== "pending" &&
    claim.status !== "approved" &&
    claim.status !== "rejected" &&
    claim.status !== "finalized"
  ) {
    throw new PairingFlowError(
      "claim-conflict",
      "The existing pairing claim has an invalid status.",
    );
  }

  return claim;
}

function claimExpectation(pairing, userId) {
  return {
    code: pairing.code,
    deviceId: pairing.deviceId,
    userId,
    expiresAtMs: pairing.expiresAtMs,
  };
}

async function readExistingOwnedClaim(claimRef, pairing, userId) {
  try {
    const snapshot = await get(claimRef);
    if (!snapshot.exists()) return null;
    return validateOwnedClaim(snapshot.val(), claimExpectation(pairing, userId));
  } catch (error) {
    // A missing claim and a claim owned by another user are intentionally
    // unreadable under the RTDB rules. Creation below determines which case it is.
    if (isPermissionDenied(error)) return null;

    throw friendlyFirebaseError(
      error,
      "The existing pairing claim could not be read.",
    );
  }
}

async function createOrResumeClaim(database, pairing, userId, nowMs) {
  const claimRef = ref(database, pairingClaimPath(pairing.code));
  const existingClaim = await readExistingOwnedClaim(claimRef, pairing, userId);

  if (existingClaim) {
    return { claimRef, claim: existingClaim, resumed: true };
  }

  const pendingClaim = {
    code: pairing.code,
    deviceId: pairing.deviceId,
    requestedByUid: userId,
    status: "pending",
    createdAtMs: nowMs,
    expiresAtMs: pairing.expiresAtMs,
  };

  try {
    await set(claimRef, pendingClaim);
    return { claimRef, claim: pendingClaim, resumed: false };
  } catch (writeError) {
    // Handle a narrow race where the same user creates the claim between the
    // initial read and this create attempt.
    const racedClaim = await readExistingOwnedClaim(claimRef, pairing, userId);
    if (racedClaim) {
      return { claimRef, claim: racedClaim, resumed: true };
    }

    throw friendlyFirebaseError(
      writeError,
      "The pairing claim could not be created.",
    );
  }
}

function rejectedClaimError() {
  return new PairingFlowError(
    "rejected",
    "The ESP32 rejected this pairing request.",
  );
}

function resolveInitialClaim(claim) {
  if (claim.status === "rejected") throw rejectedClaimError();
  if (claim.status === "approved" || claim.status === "finalized") {
    return claim;
  }

  return null;
}

function waitForClaimDecision(claimRef, options) {
  const { code, deviceId, userId, expiresAtMs, timeoutMs, signal } = options;

  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe = () => {};
    let timer = null;

    const cleanup = () => {
      unsubscribe();
      if (timer !== null) clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    const finish = (operation) => {
      if (settled) return;
      settled = true;
      cleanup();
      operation();
    };

    const onAbort = () => {
      finish(() =>
        reject(new PairingFlowError("aborted", "Pairing was cancelled.")),
      );
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });

    timer = setTimeout(() => {
      finish(() =>
        reject(
          new PairingFlowError(
            "timeout",
            "The ESP32 did not approve the pairing request in time.",
          ),
        ),
      );
    }, timeoutMs);

    unsubscribe = onValue(
      claimRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          finish(() =>
            reject(
              new PairingFlowError(
                "claim-missing",
                "The pairing claim was removed before approval.",
              ),
            ),
          );
          return;
        }

        let claim;
        try {
          claim = validateOwnedClaim(snapshot.val(), {
            code,
            deviceId,
            userId,
            expiresAtMs,
          });
        } catch (error) {
          finish(() => reject(error));
          return;
        }

        if (claim.status === "rejected") {
          finish(() => reject(rejectedClaimError()));
          return;
        }

        if (claim.status === "approved" || claim.status === "finalized") {
          finish(() => resolve(claim));
        }
      },
      (error) => {
        finish(() =>
          reject(
            friendlyFirebaseError(
              error,
              "The pairing claim could not be observed.",
            ),
          ),
        );
      },
    );
  });
}

function validateCallableResult(value, expectedCode, expectedDeviceId, userId) {
  const result = requireRecord(
    value,
    "invalid-response",
    "Pairing finalization returned an invalid response.",
  );
  const device = requireRecord(
    result.device,
    "invalid-response",
    "Pairing finalization did not return a device.",
  );

  if (
    result.pairingCode !== expectedCode ||
    result.deviceId !== expectedDeviceId ||
    result.ownerUid !== userId ||
    device.id !== expectedDeviceId ||
    device.ownerUid !== userId
  ) {
    throw new PairingFlowError(
      "invalid-response",
      "Pairing finalization returned mismatched ownership data.",
    );
  }

  return result;
}

export async function pairDeviceWithProtectedClaim(options) {
  const {
    database,
    functions,
    userId,
    code: rawCode,
    name,
    place,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    now = () => Date.now(),
  } = options ?? {};

  if (!database || !functions) {
    throw new PairingFlowError(
      "invalid-config",
      "Firebase Database and Functions instances are required.",
    );
  }

  if (typeof userId !== "string" || !userId.trim()) {
    throw new PairingFlowError(
      "unauthenticated",
      "Sign in before pairing a device.",
    );
  }

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new PairingFlowError(
      "invalid-timeout",
      "Pairing timeout must be a positive safe integer.",
    );
  }

  if (signal?.aborted) {
    throw new PairingFlowError("aborted", "Pairing was cancelled.");
  }

  const code = normalizePairingCode(rawCode);
  const deviceName = normalizeLabel(
    name,
    "GreenCloud Device",
    "Device name",
    MAX_DEVICE_NAME_LENGTH,
  );
  const devicePlace = normalizeLabel(
    place,
    "Plant zone",
    "Plant zone",
    MAX_DEVICE_PLACE_LENGTH,
  );
  const nowMs = now();

  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) {
    throw new PairingFlowError(
      "invalid-clock",
      "The current pairing timestamp is invalid.",
    );
  }

  let pairingSnapshot;
  try {
    pairingSnapshot = await get(ref(database, pairingPath(code)));
  } catch (error) {
    throw friendlyFirebaseError(error, "The pairing code could not be read.");
  }

  if (!pairingSnapshot.exists()) {
    throw new PairingFlowError(
      "not-found",
      "Pairing code was not found. Check the ESP32 OLED.",
    );
  }

  const pairing = parseAvailablePairing(pairingSnapshot.val(), code, nowMs);
  const effectiveTimeoutMs = Math.min(
    timeoutMs,
    pairing.expiresAtMs - nowMs,
  );

  if (effectiveTimeoutMs <= 0) {
    throw new PairingFlowError(
      "expired",
      "This pairing code has expired. Restart the ESP32 for a new code.",
    );
  }

  const { claimRef, claim, resumed } = await createOrResumeClaim(
    database,
    pairing,
    userId,
    nowMs,
  );

  if (!resolveInitialClaim(claim)) {
    await waitForClaimDecision(claimRef, {
      code,
      deviceId: pairing.deviceId,
      userId,
      expiresAtMs: pairing.expiresAtMs,
      timeoutMs: effectiveTimeoutMs,
      signal,
    });
  }

  const finalizePairing = httpsCallable(functions, "finalizePairing");

  try {
    const response = await finalizePairing({
      pairingCode: code,
      name: deviceName,
      place: devicePlace,
    });
    const result = validateCallableResult(
      response.data,
      code,
      pairing.deviceId,
      userId,
    );

    return { ...result, claimResumed: resumed };
  } catch (error) {
    if (error instanceof PairingFlowError) throw error;

    throw friendlyFirebaseError(
      error,
      "The approved pairing could not be finalized.",
    );
  }
}
