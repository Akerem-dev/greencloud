const CONTROL_OR_BIDI_PATTERN = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u;
const INVALID_DEVICE_ID_PATTERN = /[.#$\[\]\/\u0000-\u001F\u007F]/u;

export const DEVICE_NAME_MAX_LENGTH = 60;
export const DEVICE_PLACE_MAX_LENGTH = 100;
export const DEVICE_ID_MAX_LENGTH = 128;
export const DEVICE_MUTATION_BLOCKED_EVENT =
  "greencloud:device-mutation-blocked";

export const DEVICE_REMOVAL_BLOCKED_MESSAGE =
  "Secure device removal is temporarily unavailable until the trusted unpair service is connected.";

function codePointLength(value) {
  return Array.from(value).length;
}

function normalizeLabel(value, { label, maxLength, fallback }) {
  if (value === undefined || value === null || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`${label} is required.`);
  }

  if (typeof value !== "string") {
    throw new Error(`${label} must be text.`);
  }

  if (CONTROL_OR_BIDI_PATTERN.test(value)) {
    throw new Error(`${label} contains unsupported control characters.`);
  }

  const normalized = value.normalize("NFC").trim().replace(/\s+/gu, " ");

  if (!normalized) {
    if (fallback !== undefined) return fallback;
    throw new Error(`${label} is required.`);
  }

  if (codePointLength(normalized) > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

export function validateDeviceId(deviceId) {
  if (typeof deviceId !== "string") {
    throw new Error("Device ID must be text.");
  }

  const normalized = deviceId.trim();

  if (!normalized || normalized === "device-waiting") {
    throw new Error("Select a real paired device first.");
  }

  if (
    normalized !== deviceId ||
    normalized.length > DEVICE_ID_MAX_LENGTH ||
    INVALID_DEVICE_ID_PATTERN.test(normalized)
  ) {
    throw new Error("Device ID is invalid.");
  }

  return normalized;
}

export function validateDeviceIdentityInput(name, place) {
  return {
    name: normalizeLabel(name, {
      label: "Device name",
      maxLength: DEVICE_NAME_MAX_LENGTH,
    }),
    place: normalizeLabel(place, {
      label: "Plant zone",
      maxLength: DEVICE_PLACE_MAX_LENGTH,
    }),
  };
}

export function normalizePairingDeviceIdentity(name, place) {
  return {
    name: normalizeLabel(name, {
      label: "Device name",
      maxLength: DEVICE_NAME_MAX_LENGTH,
      fallback: "GreenCloud Device",
    }),
    place: normalizeLabel(place, {
      label: "Plant zone",
      maxLength: DEVICE_PLACE_MAX_LENGTH,
      fallback: "Plant zone",
    }),
  };
}

export function normalizeDeviceIdentityPatch(currentDevice, patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("Device update must be an object.");
  }

  const allowedKeys = new Set(["name", "place", "location"]);
  const unknownKeys = Object.keys(patch).filter((key) => !allowedKeys.has(key));

  if (unknownKeys.length > 0) {
    throw new Error("Only device name and plant zone can be changed from the web app.");
  }

  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    normalized.name = normalizeLabel(patch.name, {
      label: "Device name",
      maxLength: DEVICE_NAME_MAX_LENGTH,
    });
  }

  const hasPlace = Object.prototype.hasOwnProperty.call(patch, "place");
  const hasLocation = Object.prototype.hasOwnProperty.call(patch, "location");

  if (hasPlace || hasLocation) {
    const normalizedPlace = normalizeLabel(
      hasPlace ? patch.place : patch.location,
      {
        label: "Plant zone",
        maxLength: DEVICE_PLACE_MAX_LENGTH,
      },
    );

    if (hasPlace && hasLocation) {
      const normalizedLocation = normalizeLabel(patch.location, {
        label: "Plant zone",
        maxLength: DEVICE_PLACE_MAX_LENGTH,
      });

      if (normalizedLocation !== normalizedPlace) {
        throw new Error("Device place and location must match.");
      }
    }

    normalized.place = normalizedPlace;
    normalized.location = normalizedPlace;
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error("No editable device fields were provided.");
  }

  if (
    normalized.name === currentDevice?.name &&
    normalized.place === currentDevice?.place &&
    normalized.location === currentDevice?.location
  ) {
    return {};
  }

  return normalized;
}

export function getDeviceMutationDecision({
  authenticated,
  userId,
  devices,
  deviceId,
  requireAuthentication = true,
}) {
  if (requireAuthentication && !authenticated) {
    return {
      allowed: false,
      reason: "Sign in before changing a device.",
      target: null,
    };
  }

  let normalizedDeviceId;

  try {
    normalizedDeviceId = validateDeviceId(deviceId);
  } catch (error) {
    return {
      allowed: false,
      reason: error instanceof Error ? error.message : "Device ID is invalid.",
      target: null,
    };
  }

  const target = Array.isArray(devices)
    ? devices.find((device) => device?.id === normalizedDeviceId)
    : null;

  if (!target) {
    return {
      allowed: false,
      reason: "The selected device is not part of this workspace.",
      target: null,
    };
  }

  if (
    userId &&
    typeof target.ownerUid === "string" &&
    target.ownerUid &&
    target.ownerUid !== userId
  ) {
    return {
      allowed: false,
      reason: "This device belongs to another workspace.",
      target: null,
    };
  }

  return {
    allowed: true,
    reason: "",
    target,
  };
}

export function assertDeviceMutationTarget(input) {
  const decision = getDeviceMutationDecision(input);

  if (!decision.allowed) {
    throw new Error(decision.reason);
  }

  return decision.target;
}

export function assertTrustedDeviceRemovalAvailable(input) {
  const target = assertDeviceMutationTarget(input);
  throw new Error(DEVICE_REMOVAL_BLOCKED_MESSAGE, {
    cause: { deviceId: target.id },
  });
}
