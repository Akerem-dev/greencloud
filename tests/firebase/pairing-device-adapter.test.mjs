import assert from "node:assert/strict";
import { test } from "node:test";

import { pairedResultToDevice } from "../../lib/firebase-pairing-device.mjs";

function pairingResult(overrides = {}) {
  return {
    pairingCode: "ABC123",
    deviceId: "device-123",
    ownerUid: "user-123",
    finalizedAtMs: 1_750_000_000_000,
    idempotent: false,
    workspaceProjected: true,
    claimResumed: false,
    device: {},
    ...overrides,
  };
}

test("maps the trusted pairing result into the app device contract", () => {
  const device = pairedResultToDevice(
    pairingResult({
      device: {
        id: "untrusted-device-id",
        name: "ESP32 Greenhouse",
        place: "North shelf",
        location: "Shelf A",
        moisture: 47,
        signal: 91,
        status: "Online",
        updatedAt: "just now",
        pairedAt: "2026-07-21T17:00:00.000Z",
        firmware: "greencloud-esp32-v2",
      },
    }),
    "Requested name",
    "Requested place",
  );

  assert.equal(device.id, "device-123");
  assert.equal(device.ownerUid, "user-123");
  assert.equal(device.pairingCode, "ABC123");
  assert.equal(device.name, "ESP32 Greenhouse");
  assert.equal(device.place, "North shelf");
  assert.equal(device.location, "Shelf A");
  assert.equal(device.moisture, 47);
  assert.equal(device.signal, 91);
  assert.equal(device.status, "Online");
  assert.equal(device.updatedAt, "just now");
  assert.equal(device.pairedAt, "2026-07-21T17:00:00.000Z");
  assert.equal(device.firmware, "greencloud-esp32-v2");
});

test("applies safe app defaults when optional device fields are absent", () => {
  const result = pairingResult({
    device: {
      moisture: Number.NaN,
      signal: "unknown",
      status: "Booting",
    },
  });

  const device = pairedResultToDevice(
    result,
    "  Balcony Plant  ",
    "  Balcony shelf  ",
  );

  assert.equal(device.name, "Balcony Plant");
  assert.equal(device.place, "Balcony shelf");
  assert.equal(device.location, "Balcony shelf");
  assert.equal(device.moisture, 0);
  assert.equal(device.signal, 0);
  assert.equal(device.status, "Idle");
  assert.equal(device.updatedAt, "Waiting for device");
  assert.equal(device.pairedAt, new Date(result.finalizedAtMs).toISOString());
});

test("rejects malformed protected pairing results", () => {
  assert.throws(
    () => pairedResultToDevice(null),
    /must be an object/,
  );
  assert.throws(
    () => pairedResultToDevice(pairingResult({ device: null })),
    /device object/,
  );
  assert.throws(
    () => pairedResultToDevice(pairingResult({ ownerUid: "" })),
    /ownerUid/,
  );
});
