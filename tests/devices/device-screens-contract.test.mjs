import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  indexPage: new URL("../../app/devices/page.tsx", import.meta.url),
  index: new URL("../../components/devices/gc2-devices-index.tsx", import.meta.url),
  addPage: new URL("../../app/devices/add/page.tsx", import.meta.url),
  pairing: new URL("../../components/devices/protected-pairing-studio.tsx", import.meta.url),
  detailPage: new URL("../../app/devices/[deviceId]/page.tsx", import.meta.url),
  detail: new URL("../../components/devices/gc2-device-detail.tsx", import.meta.url),
  layout: new URL("../../app/devices/layout.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts three deliberate protected device routes", async () => {
  const [indexPage, index, addPage, pairing, detailPage, detail, layout] = await Promise.all([
    source("indexPage"),
    source("index"),
    source("addPage"),
    source("pairing"),
    source("detailPage"),
    source("detail"),
    source("layout"),
  ]);

  assert.match(indexPage, /Gc2DevicesIndex/u);
  assert.match(index, /Gc2ProtectedShell/u);
  assert.match(addPage, /ProtectedPairingStudio/u);
  assert.match(pairing, /Gc2ProtectedShell/u);
  assert.match(detailPage, /Gc2DeviceDetail/u);
  assert.match(detailPage, /deviceId/u);
  assert.match(detail, /Gc2ProtectedShell/u);
  assert.match(layout, /DeviceMutationBoundary/u);
  assert.doesNotMatch(layout, /DevicesPairingExperience|ProtectedPairingStudio/u);
});

test("keeps the device index focused on inventory and selected-node operations", async () => {
  const index = await source("index");

  for (const term of [
    "Hardware inventory",
    "Device roster",
    "Selected node",
    "Paired nodes",
    "Protected outputs",
    "No trusted hardware is attached yet",
  ]) {
    assert.match(index, new RegExp(term, "u"));
  }

  assert.match(index, /href="\/devices\/add"/u);
  assert.match(index, /selectDevice/u);
  assert.match(index, /refreshTelemetry/u);
  assert.match(index, /startIrrigation/u);
  assert.match(index, /encodeURIComponent\(device\.id\)/u);
  assert.doesNotMatch(index, /pairDeviceByCode|placeholder="ABC123"/u);
});

test("keeps protected pairing on a visible four-step full route", async () => {
  const pairing = await source("pairing");

  for (const term of [
    "OLED code",
    "Secure claim",
    "ESP32 approval",
    "Workspace",
    "Waiting for ESP32 approval",
    "Approve request on ESP32",
  ]) {
    assert.match(pairing, new RegExp(term, "u"));
  }

  assert.match(pairing, /pairDeviceByCode/u);
  assert.match(pairing, /safeCode\.length !== 6/u);
  assert.match(pairing, /maxLength=\{6\}/u);
  assert.match(pairing, /rejected/u);
  assert.match(pairing, /timeout/u);
  assert.doesNotMatch(pairing, /pairDeviceToUserInFirebase|backdrop-blur|fixed bottom-/u);
});

test("keeps device detail state-driven and trusted-mutation compatible", async () => {
  const detail = await source("detail");

  for (const term of [
    "Live telemetry",
    "Safety matrix",
    "Hardware identity",
    "Recent operations",
    "Protected irrigation command",
    "Trusted removal required",
  ]) {
    assert.match(detail, new RegExp(term, "u"));
  }

  assert.match(detail, /updateDevice\(device\.id, normalized\)/u);
  assert.match(detail, /removeDevice\(deleteTarget\.id\)/u);
  assert.match(detail, /startIrrigation\(device\.id\)/u);
  assert.match(detail, /refreshTelemetry\(device\.id\)/u);
  assert.match(detail, /title="Copy device ID"/u);
  assert.match(detail, /title="Remove device"/u);
  assert.match(detail, /closeLabel="Close delete confirmation"/u);
  assert.match(detail, /Save changes/u);
  assert.doesNotMatch(detail, /realtimeDatabase|firebaseFunctions|writeIrrigationCommandToFirebase/u);
});

test("does not regress the new device surfaces to the old glass workspace", async () => {
  const [index, pairing, detail] = await Promise.all([
    source("index"),
    source("pairing"),
    source("detail"),
  ]);

  for (const sourceText of [index, pairing, detail]) {
    assert.doesNotMatch(
      sourceText,
      /GlassCard|SectionBadge|premium-btn|premium-tab|AmbientOrbs|LeafFallOverlay/u,
    );
  }
});
