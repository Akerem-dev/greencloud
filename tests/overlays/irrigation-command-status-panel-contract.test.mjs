import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  panel: new URL(
    "../../components/irrigation/gc2-irrigation-command-status-panel.tsx",
    import.meta.url,
  ),
  confirmation: new URL(
    "../../components/irrigation/gc2-manual-irrigation-confirmation.tsx",
    import.meta.url,
  ),
  route: new URL(
    "../../components/devices/gc2-device-detail-route.tsx",
    import.meta.url,
  ),
  providerBase: new URL(
    "../../components/providers/app-state-provider-base.tsx",
    import.meta.url,
  ),
  events: new URL(
    "../../lib/irrigation-command-ui-events.mjs",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts command status only after normal device detail boundaries", async () => {
  const route = await source("route");

  assert.match(route, /Gc2IrrigationCommandStatusPanel/u);
  assert.match(
    route,
    /if \(needsConnectionRecovery[\s\S]*return <Gc2OfflineSyncRecovery[\s\S]*if \(!isBootLoading && device && hardwareLockout\.locked\)[\s\S]*return <Gc2HardwareSafetyLockout[\s\S]*<Gc2IrrigationCommandStatusPanel deviceId=\{deviceId\}\s*\/>/u,
  );
});

test("opens from an accepted confirmation without inventing command authority", async () => {
  const [confirmation, events] = await Promise.all([
    source("confirmation"),
    source("events"),
  ]);

  assert.match(events, /IRRIGATION_COMMAND_SUBMITTED_EVENT/u);
  assert.match(confirmation, /previousCommandId = device\.lastCommand \?\? "None"/u);
  assert.match(confirmation, /startIrrigation\(device\.id\)/u);
  assert.match(
    confirmation,
    /if \(commandBlockedRef\.current\) return;[\s\S]*window\.dispatchEvent\([\s\S]*IRRIGATION_COMMAND_SUBMITTED_EVENT/u,
  );
  assert.match(confirmation, /deviceId: device\.id/u);
  assert.match(confirmation, /durationSeconds/u);
  assert.match(confirmation, /previousCommandId/u);
});

test("derives pending, running, handled, protected and blocked states from device evidence", async () => {
  const [panel, providerBase] = await Promise.all([
    source("panel"),
    source("providerBase"),
  ]);

  for (const field of [
    "lastCommand",
    "lastCommandStatus",
    "pumpState",
    "relayState",
    "updatedAt",
  ]) {
    assert.match(panel, new RegExp(`device\\?\\.${field}|device\\.${field}`, "u"));
  }

  for (const state of [
    "Waiting for command record",
    "Waiting for device acknowledgement",
    "Irrigation active",
    "Irrigation completed",
    "Command protected",
    "Command blocked",
    "Waiting for telemetry evidence",
  ]) {
    assert.match(panel, new RegExp(state, "u"));
  }

  assert.match(providerBase, /lastCommand: requestId/u);
  assert.match(providerBase, /lastCommandStatus:[\s\S]*"Dry-run"[\s\S]*"Pending"/u);
  assert.match(providerBase, /pumpState:[\s\S]*"Dry-run"[\s\S]*"Ready"/u);
  assert.match(providerBase, /relayState:[\s\S]*"Locked"[\s\S]*"Enabled"/u);
});

test("uses a truthful drawer with refresh-only follow-up controls", async () => {
  const panel = await source("panel");

  assert.match(panel, /variant="drawer"/u);
  assert.match(panel, /aria-live="polite"/u);
  assert.match(panel, /refreshTelemetry\(device\.id\)/u);
  assert.match(panel, /No estimated progress is fabricated/u);
  assert.match(panel, /does not publish a percentage or countdown/u);
  assert.match(panel, /only the latest command, pump, relay and telemetry evidence/u);
  assert.doesNotMatch(panel, /setInterval|setTimeout|progressPercent|countdown/u);
});

test("does not bypass AppState or write directly to command infrastructure", async () => {
  const panel = await source("panel");

  assert.doesNotMatch(
    panel,
    /startIrrigation|updateDevice|removeDevice|pairDeviceByCode|updateAutomation|resetAutomation/u,
  );
  assert.doesNotMatch(
    panel,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|firebase-greencloud|writeIrrigationCommandToFirebase|patchDeviceInFirebase|httpsCallable/u,
  );
  assert.doesNotMatch(
    panel,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
