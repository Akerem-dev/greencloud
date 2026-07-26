import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../../app/devices/layout.tsx", import.meta.url);
const indexPath = new URL(
  "../../components/devices/gc2-devices-index.tsx",
  import.meta.url,
);
const pairingPath = new URL(
  "../../components/devices/protected-pairing-studio.tsx",
  import.meta.url,
);
const addRoutePath = new URL("../../app/devices/add/page.tsx", import.meta.url);

const [layoutSource, indexSource, pairingSource, addRouteSource] = await Promise.all([
  readFile(layoutPath, "utf8"),
  readFile(indexPath, "utf8"),
  readFile(pairingPath, "utf8"),
  readFile(addRoutePath, "utf8"),
]);

test("keeps one deliberate protected pairing entry route", () => {
  assert.match(indexSource, /href="\/devices\/add"/);
  assert.match(addRouteSource, /ProtectedPairingStudio/);
  assert.doesNotMatch(layoutSource, /ProtectedPairingStudio|DevicesPairingExperience/);
});

test("keeps pairing controls out of the inventory screen", () => {
  assert.doesNotMatch(indexSource, /pairDeviceByCode/);
  assert.doesNotMatch(indexSource, /placeholder="ABC123"/);
  assert.doesNotMatch(indexSource, /maxLength=\{6\}/);
  assert.match(pairingSource, /placeholder="ABC123"/);
  assert.match(pairingSource, /maxLength=\{6\}/);
});

test("does not restore the legacy floating pairing launcher", () => {
  assert.doesNotMatch(pairingSource, /fixed bottom-|Secure pairing|handleLegacyPairingClick/);
  assert.doesNotMatch(layoutSource, /data-devices-pairing-experience/);
});
