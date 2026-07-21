function optionalNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function requireRecord(value, message) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(message);
  }

  return value;
}

function requireString(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`Protected pairing result is missing ${fieldName}.`);
  }

  return value;
}

export function pairedResultToDevice(
  rawResult,
  requestedName,
  requestedPlace,
) {
  const result = requireRecord(
    rawResult,
    "Protected pairing result must be an object.",
  );
  const source = requireRecord(
    result.device,
    "Protected pairing result must include a device object.",
  );
  const deviceId = requireString(result.deviceId, "deviceId");
  const pairingCode = requireString(result.pairingCode, "pairingCode");
  const ownerUid = requireString(result.ownerUid, "ownerUid");

  const name =
    typeof source.name === "string" && source.name.trim()
      ? source.name
      : requestedName?.trim() || "GreenCloud Device";
  const place =
    typeof source.place === "string" && source.place.trim()
      ? source.place
      : requestedPlace?.trim() || "Plant zone";
  const finalizedAt = Number.isSafeInteger(result.finalizedAtMs)
    ? new Date(result.finalizedAtMs).toISOString()
    : undefined;

  return {
    ...source,
    id: deviceId,
    name,
    place,
    location:
      typeof source.location === "string" && source.location.trim()
        ? source.location
        : place,
    moisture: optionalNumber(source.moisture) ?? 0,
    signal: optionalNumber(source.signal) ?? 0,
    status:
      source.status === "Online" ||
      source.status === "Idle" ||
      source.status === "Syncing" ||
      source.status === "Offline"
        ? source.status
        : "Idle",
    updatedAt:
      typeof source.updatedAt === "string"
        ? source.updatedAt
        : "Waiting for device",
    pairingCode,
    pairedAt:
      typeof source.pairedAt === "string" ? source.pairedAt : finalizedAt,
    ownerUid,
  };
}
