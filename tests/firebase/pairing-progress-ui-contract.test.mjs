import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const studioSource = readFileSync(
  new URL(
    "../../components/devices/protected-pairing-studio.tsx",
    import.meta.url,
  ),
  "utf8",
);

const layoutSource = readFileSync(
  new URL("../../app/devices/layout.tsx", import.meta.url),
  "utf8",
);

const experienceSource = readFileSync(
  new URL(
    "../../components/devices/devices-pairing-experience.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("mounts the protected pairing studio on the Devices route", () => {
  assert.match(layoutSource, /DevicesPairingExperience/);
  assert.match(layoutSource, /<DevicesPairingExperience>/);
  assert.match(experienceSource, /ProtectedPairingStudio/);
  assert.match(experienceSource, /<ProtectedPairingStudio\s*\/>/);
});

test("shows the four visible protected pairing trust steps", () => {
  assert.match(studioSource, /OLED code/);
  assert.match(studioSource, /Secure claim/);
  assert.match(studioSource, /ESP32 approval/);
  assert.match(studioSource, /Workspace/);
  assert.match(studioSource, /Waiting for ESP32 approval/);
});

test("routes the visual studio through the protected app pairing action", () => {
  assert.match(studioSource, /pairDeviceByCode/);
  assert.match(studioSource, /safeCode\.length !== 6/);
  assert.match(studioSource, /rejected/);
  assert.match(studioSource, /timeout/);
  assert.doesNotMatch(studioSource, /pairDeviceToUserInFirebase/);
});
