import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../../app/devices/layout.tsx", import.meta.url);
const experiencePath = new URL(
  "../../components/devices/devices-pairing-experience.tsx",
  import.meta.url,
);

const [layoutSource, experienceSource] = await Promise.all([
  readFile(layoutPath, "utf8"),
  readFile(experiencePath, "utf8"),
]);

test("routes the Devices page through the single protected pairing experience", () => {
  assert.match(layoutSource, /DevicesPairingExperience/);
  assert.doesNotMatch(layoutSource, /ProtectedPairingStudio/);
  assert.match(experienceSource, /<ProtectedPairingStudio \/>/);
});

test("hides the legacy inline pairing surfaces and header action", () => {
  assert.match(experienceSource, /data-devices-pairing-experience/);
  assert.match(experienceSource, /input\[placeholder="ABC123"\]\[maxlength="6"\]/);
  assert.match(experienceSource, /\.lucide-key-round/);
  assert.match(experienceSource, /> :first-child\s+button\.premium-btn/);
  assert.match(experienceSource, /display: none !important/);
});

test("redirects the legacy Add ESP32 action to Secure pairing", () => {
  assert.match(experienceSource, /LEGACY_ADD_BUTTON_LABEL = "Add ESP32"/);
  assert.match(experienceSource, /STUDIO_LAUNCHER_COPY = "Secure pairing"/);
  assert.match(experienceSource, /handleLegacyPairingClick/);
  assert.match(experienceSource, /findButtonByCopy\(STUDIO_LAUNCHER_COPY\)\?\.click\(\)/);
});
