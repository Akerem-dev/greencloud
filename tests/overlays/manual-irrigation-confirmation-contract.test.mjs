import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  modal: new URL(
    "../../components/irrigation/gc2-manual-irrigation-confirmation.tsx",
    import.meta.url,
  ),
  route: new URL(
    "../../components/devices/gc2-device-detail-route.tsx",
    import.meta.url,
  ),
  detail: new URL(
    "../../components/devices/gc2-device-detail.tsx",
    import.meta.url,
  ),
  provider: new URL(
    "../../components/providers/app-state-provider.tsx",
    import.meta.url,
  ),
  safety: new URL("../../lib/automation-safety.mjs", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts irrigation confirmation only on normal device detail", async () => {
  const [route, detail] = await Promise.all([
    source("route"),
    source("detail"),
  ]);

  assert.match(route, /Gc2ManualIrrigationConfirmation/u);
  assert.match(
    route,
    /<Gc2ManualIrrigationConfirmation deviceId=\{deviceId\}\s*\/>/u,
  );
  assert.match(
    route,
    /if \(needsConnectionRecovery[\s\S]*return <Gc2OfflineSyncRecovery[\s\S]*if \(!isBootLoading && device && hardwareLockout\.locked\)[\s\S]*return <Gc2HardwareSafetyLockout[\s\S]*<Gc2ManualIrrigationConfirmation/u,
  );
  assert.match(detail, />\s*Protected irrigation command\s*</u);
});

test("turns the existing irrigation button into an explicit confirmation trigger", async () => {
  const modal = await source("modal");

  assert.match(
    modal,
    /document\.addEventListener\("click", handleIrrigationCapture, true\)/u,
  );
  assert.match(
    modal,
    /buttonLabel\(button\) !== "Protected irrigation command"/u,
  );
  assert.match(modal, /event\.preventDefault\(\)/u);
  assert.match(modal, /event\.stopPropagation\(\)/u);
  assert.match(modal, /event\.stopImmediatePropagation\(\)/u);
  assert.match(modal, /setPhase\("confirm"\)/u);
  assert.match(modal, /setOpen\(true\)/u);
  assert.match(modal, /title=\{[\s\S]*"Confirm protected irrigation"/u);
  assert.match(modal, /Send protected command/u);
  assert.match(modal, /closeLabel="Close irrigation confirmation"/u);
});

test("shows real field evidence and the configured command duration", async () => {
  const modal = await source("modal");

  for (const term of [
    "Target device",
    "Command duration",
    "Soil moisture",
    "Connection",
    "Rain lockout",
    "Tank protection",
    "Manual override",
    "Immutable device ID",
  ]) {
    assert.match(modal, new RegExp(term, "u"));
  }

  assert.match(modal, /automation\.pumpDurationSeconds/u);
  assert.match(modal, /device\.moisture/u);
  assert.match(modal, /device\.rainStatus/u);
  assert.match(modal, /device\.waterLevelStatus/u);
  assert.match(modal, /automation\.manualOverrideEnabled/u);
  assert.match(modal, /\{device\.id\}/u);
});

test("calls protected AppState only after confirmation and keeps blocked requests visible", async () => {
  const [modal, provider, safety] = await Promise.all([
    source("modal"),
    source("provider"),
    source("safety"),
  ]);

  assert.match(modal, /function confirmIrrigation\(\)/u);
  assert.match(modal, /startIrrigation\(device\.id\)/u);
  assert.match(modal, /AUTOMATION_COMMAND_BLOCKED_EVENT/u);
  assert.match(modal, /commandBlockedRef\.current = true/u);
  assert.match(modal, /setError\(/u);
  assert.match(modal, /setPhase\("confirm"\)/u);
  assert.match(modal, /setOpen\(true\)/u);
  assert.match(modal, /if \(commandBlockedRef\.current\) return/u);
  assert.match(modal, /setPhase\("submitted"\)/u);
  assert.match(provider, /getManualIrrigationDecision/u);
  assert.match(provider, /emitBlockedAutomationCommand\(decision\.reason\)/u);
  assert.match(provider, /startBaseIrrigation\(commandTarget\.id\)/u);
  assert.match(safety, /AUTOMATION_COMMAND_BLOCKED_EVENT/u);
});

test("avoids fake hardware completion and direct mutation bypasses", async () => {
  const modal = await source("modal");

  assert.match(modal, /Hardware acknowledgement is still required/u);
  assert.match(
    modal,
    /does not claim that the relay energized or that watering\s+completed/u,
  );
  assert.match(
    modal,
    /cannot bypass AppState safety or write directly to Firebase/u,
  );
  assert.doesNotMatch(
    modal,
    /updateDevice|removeDevice|pairDeviceByCode|updateAutomation|resetAutomation|refreshTelemetry/u,
  );
  assert.doesNotMatch(
    modal,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|firebase-greencloud|writeIrrigationCommandToFirebase|httpsCallable/u,
  );
  assert.doesNotMatch(
    modal,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
