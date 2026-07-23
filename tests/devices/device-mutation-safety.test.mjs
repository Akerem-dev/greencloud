import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEVICE_REMOVAL_BLOCKED_MESSAGE,
  assertTrustedDeviceRemovalAvailable,
  getDeviceMutationDecision,
  normalizeDeviceIdentityPatch,
  normalizePairingDeviceIdentity,
  validateDeviceId,
  validateDeviceIdentityInput,
} from "../../lib/device-mutation-safety.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const device = {
  id: "esp32-balcony-01",
  name: "Balcony Plant",
  place: "Balcony shelf",
  location: "Balcony shelf",
  ownerUid: "user-a",
};

test("normalizes pairing device labels before the protected claim starts", () => {
  assert.deepEqual(
    normalizePairingDeviceIdentity("  Balcony   Plant  ", "  North   shelf "),
    {
      name: "Balcony Plant",
      place: "North shelf",
    },
  );

  assert.deepEqual(normalizePairingDeviceIdentity(undefined, undefined), {
    name: "GreenCloud Device",
    place: "Plant zone",
  });
});

test("rejects empty, unsafe and oversized device identity input", () => {
  assert.throws(
    () => validateDeviceIdentityInput("   ", "Balcony"),
    /Device name is required/,
  );
  assert.throws(
    () => validateDeviceIdentityInput("Plant\u202Eevil", "Balcony"),
    /unsupported control characters/,
  );
  assert.throws(
    () => validateDeviceIdentityInput("x".repeat(61), "Balcony"),
    /60 characters or fewer/,
  );
  assert.throws(
    () => validateDeviceIdentityInput("Plant", "x".repeat(101)),
    /100 characters or fewer/,
  );
});

test("allows only device name and synchronized plant-zone metadata", () => {
  assert.deepEqual(
    normalizeDeviceIdentityPatch(device, {
      name: "  Patio   Herbs ",
      place: " Patio table ",
      location: "Patio table",
    }),
    {
      name: "Patio Herbs",
      place: "Patio table",
      location: "Patio table",
    },
  );

  assert.throws(
    () => normalizeDeviceIdentityPatch(device, { status: "Online" }),
    /Only device name and plant zone/,
  );
  assert.throws(
    () => normalizeDeviceIdentityPatch(device, { ownerUid: "attacker" }),
    /Only device name and plant zone/,
  );
  assert.throws(
    () =>
      normalizeDeviceIdentityPatch(device, {
        place: "Balcony",
        location: "Kitchen",
      }),
    /must match/,
  );
});

test("rejects malformed, missing and foreign device targets", () => {
  assert.throws(() => validateDeviceId("bad/device"), /invalid/);
  assert.throws(() => validateDeviceId("device-waiting"), /real paired device/);

  assert.equal(
    getDeviceMutationDecision({
      authenticated: false,
      devices: [device],
      deviceId: device.id,
    }).allowed,
    false,
  );

  assert.equal(
    getDeviceMutationDecision({
      authenticated: true,
      userId: "user-a",
      devices: [device],
      deviceId: "missing-device",
    }).allowed,
    false,
  );

  assert.match(
    getDeviceMutationDecision({
      authenticated: true,
      userId: "user-b",
      devices: [device],
      deviceId: device.id,
    }).reason,
    /another workspace/,
  );
});

test("permits selecting a real workspace device without opening a write bypass", () => {
  const decision = getDeviceMutationDecision({
    authenticated: false,
    devices: [device],
    deviceId: device.id,
    requireAuthentication: false,
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.target.id, device.id);
});

test("blocks legacy web removal until a trusted unpair service exists", () => {
  assert.throws(
    () =>
      assertTrustedDeviceRemovalAvailable({
        authenticated: true,
        userId: "user-a",
        devices: [device],
        deviceId: device.id,
      }),
    new RegExp(DEVICE_REMOVAL_BLOCKED_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("routes public device mutations through the protected adapter", () => {
  const source = readFileSync(
    path.join(root, "components/providers/app-state-provider.tsx"),
    "utf8",
  );

  assert.match(source, /normalizePairingDeviceIdentity/);
  assert.match(source, /assertDeviceMutationTarget/);
  assert.match(source, /normalizeDeviceIdentityPatch/);
  assert.match(source, /assertTrustedDeviceRemovalAvailable/);
  assert.match(source, /DEVICE_MUTATION_BLOCKED_EVENT/);
  assert.doesNotMatch(source, /removeBaseDevice/);
});

test("mounts visible capture-phase protection on the Devices route", () => {
  const layout = readFileSync(path.join(root, "app/devices/layout.tsx"), "utf8");
  const boundary = readFileSync(
    path.join(root, "components/devices/device-mutation-boundary.tsx"),
    "utf8",
  );

  assert.match(layout, /DevicesPairingExperience/);
  assert.match(layout, /DeviceMutationBoundary/);
  assert.match(boundary, /document\.addEventListener\("click", handleClickCapture, true\)/);
  assert.match(boundary, /label === "Remove device"/);
  assert.match(boundary, /label !== "Save changes"/);
  assert.match(boundary, /validateDeviceIdentityInput/);
  assert.match(boundary, /Device change blocked safely/);
});
