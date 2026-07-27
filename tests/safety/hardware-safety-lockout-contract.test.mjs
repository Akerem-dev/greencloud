import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  STALE_TELEMETRY_MS,
  getHardwareSafetyLockout,
  isTelemetryStale,
} from "../../lib/hardware-safety-lockout.mjs";

const healthyDevice = {
  id: "device-healthy",
  name: "Balcony Controller",
  place: "Balcony",
  moisture: 42,
  signal: 88,
  status: "Online",
  updatedAt: "now",
  lastSeenMs: 1_800_000_000_000,
  sensorStatus: "OK",
  rainStatus: "Clear",
  waterLevelStatus: "OK",
  relayState: "Enabled",
  pumpState: "Ready",
  safeMode: false,
  pumpEnabled: true,
  lastCommandStatus: "Handled",
};

const files = {
  screen: new URL(
    "../../components/safety/gc2-hardware-safety-lockout.tsx",
    import.meta.url,
  ),
  dashboardRoute: new URL(
    "../../components/dashboard/gc2-dashboard-route.tsx",
    import.meta.url,
  ),
  deviceRoute: new URL(
    "../../components/devices/gc2-device-detail-route.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("does not treat an empty placeholder or first-packet pending state as a hardware incident", () => {
  assert.equal(
    getHardwareSafetyLockout({ id: "device-waiting" }).locked,
    false,
  );

  const pending = getHardwareSafetyLockout({
    id: "device-pending",
    name: "New controller",
    place: "Plant zone",
    moisture: 0,
    signal: 0,
    status: "Idle",
    updatedAt: "Waiting for device",
    sensorStatus: "Pending",
    rainStatus: "Pending",
    waterLevelStatus: "Pending",
    relayState: "Locked",
    pumpState: "Dry-run",
    safeMode: true,
    pumpEnabled: false,
    lastCommandStatus: "None",
  });

  assert.equal(pending.locked, false);
  assert.deepEqual(pending.incidents, []);
});

test("leaves a current healthy device on the normal dashboard and detail surfaces", () => {
  const nowMs = healthyDevice.lastSeenMs + 30_000;
  assert.equal(isTelemetryStale(healthyDevice, nowMs), false);
  assert.equal(getHardwareSafetyLockout(healthyDevice, nowMs).locked, false);
});

test("classifies stale telemetry with the five-minute fail-closed window", () => {
  const nowMs = healthyDevice.lastSeenMs + STALE_TELEMETRY_MS + 1;
  const result = getHardwareSafetyLockout(healthyDevice, nowMs);

  assert.equal(isTelemetryStale(healthyDevice, nowMs), true);
  assert.equal(result.locked, true);
  assert.equal(result.incidents[0].id, "telemetry");
  assert.match(result.incidents[0].prevented, /Manual and automatic irrigation/u);
});

test("reports sensor, tank, rain, relay, pump and blocked-command guards independently", () => {
  const result = getHardwareSafetyLockout(
    {
      ...healthyDevice,
      sensorStatus: "Sensor check",
      waterLevelStatus: "Empty",
      rainDetected: true,
      rainStatus: "Detected",
      relayState: "Locked",
      pumpState: "Blocked",
      safeMode: true,
      pumpEnabled: false,
      lastCommand: "START_IRRIGATION",
      lastCommandStatus: "Blocked",
    },
    healthyDevice.lastSeenMs + 10_000,
  );

  assert.equal(result.locked, true);
  assert.deepEqual(
    result.incidents.map((item) => item.id),
    ["soil-sensor", "water-level", "rain", "relay", "pump", "command"],
  );
});

test("mounts one shared incident screen on dashboard and device detail routes", async () => {
  const [dashboardRoute, deviceRoute] = await Promise.all([
    source("dashboardRoute"),
    source("deviceRoute"),
  ]);

  assert.match(dashboardRoute, /getHardwareSafetyLockout\(selectedDevice\)/u);
  assert.match(dashboardRoute, /Gc2HardwareSafetyLockout/u);
  assert.match(dashboardRoute, /surface="dashboard"/u);
  assert.match(deviceRoute, /getHardwareSafetyLockout\(device\)/u);
  assert.match(deviceRoute, /Gc2HardwareSafetyLockout/u);
  assert.match(deviceRoute, /surface="device"/u);

  const connectionIndex = deviceRoute.indexOf("if (needsConnectionRecovery && device)");
  const hardwareIndex = deviceRoute.indexOf(
    "if (!isBootLoading && device && hardwareLockout.locked)",
  );
  assert.ok(connectionIndex >= 0 && hardwareIndex > connectionIndex);
});

test("explains failure, prevented action, garden safety and physical inspection without bypass controls", async () => {
  const screen = await source("screen");

  for (const term of [
    "What failed",
    "Action prevented",
    "Garden safety",
    "Inspect next",
    "Output-safe, field inspection required",
    "The browser cannot clear a hardware guard",
    "Request fresh hardware evidence",
  ]) {
    assert.match(screen, new RegExp(term, "u"));
  }

  assert.match(screen, /refreshTelemetry\(device\.id\)/u);
  assert.doesNotMatch(
    screen,
    /startIrrigation|simulateThresholdEvent|updateDevice|pairDeviceByCode|firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable/u,
  );
  assert.doesNotMatch(
    screen,
    /Force pump|Unlock relay|Clear fault|bypass protection|GlassCard|AmbientOrbs|backdrop-blur/u,
  );
});
