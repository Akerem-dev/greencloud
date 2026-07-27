import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  modal: new URL(
    "../../components/devices/gc2-rename-device-modal.tsx",
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
  safety: new URL(
    "../../lib/device-mutation-safety.mjs",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one dedicated rename overlay only on normal device detail", async () => {
  const [route, detail] = await Promise.all([
    source("route"),
    source("detail"),
  ]);

  assert.match(route, /Gc2RenameDeviceModal/u);
  assert.match(route, /<Gc2RenameDeviceModal deviceId=\{deviceId\}\s*\/>/u);
  assert.match(route, /Gc2OfflineSyncRecovery/u);
  assert.match(route, /Gc2HardwareSafetyLockout/u);
  assert.match(
    route,
    /if \(needsConnectionRecovery[\s\S]*return <Gc2OfflineSyncRecovery[\s\S]*if \(!isBootLoading && device && hardwareLockout\.locked\)[\s\S]*return <Gc2HardwareSafetyLockout[\s\S]*<Gc2RenameDeviceModal/u,
  );
  assert.match(detail, />\s*Rename\s*</u);
});

test("turns the existing Rename button into the single modal trigger", async () => {
  const modal = await source("modal");

  assert.match(modal, /document\.addEventListener\("click", handleRenameCapture, true\)/u);
  assert.match(modal, /buttonLabel\(button\) !== "Rename"/u);
  assert.match(modal, /event\.preventDefault\(\)/u);
  assert.match(modal, /event\.stopPropagation\(\)/u);
  assert.match(modal, /event\.stopImmediatePropagation\(\)/u);
  assert.match(modal, /setName\(device\.name\)/u);
  assert.match(modal, /setPlace\(device\.place\)/u);
  assert.match(modal, /setOpen\(true\)/u);
  assert.match(modal, /Gc2Dialog/u);
  assert.match(modal, /closeLabel="Close rename device modal"/u);
});

test("validates human labels and refuses empty or unchanged writes", async () => {
  const [modal, safety] = await Promise.all([
    source("modal"),
    source("safety"),
  ]);

  assert.match(modal, /validateDeviceIdentityInput\(name, place\)/u);
  assert.match(modal, /normalizedIdentityMatches/u);
  assert.match(modal, /Change the device name or plant zone before saving/u);
  assert.match(modal, /DEVICE_NAME_MAX_LENGTH/u);
  assert.match(modal, /DEVICE_PLACE_MAX_LENGTH/u);
  assert.match(modal, /role="alert"/u);
  assert.match(safety, /unsupported control characters/u);
  assert.match(safety, /DEVICE_NAME_MAX_LENGTH = 60/u);
  assert.match(safety, /DEVICE_PLACE_MAX_LENGTH = 100/u);
});

test("keeps mutation and blocked-state handling inside protected AppState", async () => {
  const [modal, provider] = await Promise.all([
    source("modal"),
    source("provider"),
  ]);

  assert.match(modal, /updateDevice\(device\.id, normalized\)/u);
  assert.match(modal, /DEVICE_MUTATION_BLOCKED_EVENT/u);
  assert.match(modal, /mutationBlockedRef\.current = true/u);
  assert.match(modal, /if \(mutationBlockedRef\.current\) return/u);
  assert.match(provider, /assertDeviceMutationTarget/u);
  assert.match(provider, /normalizeDeviceIdentityPatch/u);
  assert.match(provider, /if \(Object\.keys\(normalized\)\.length === 0\) return/u);
  assert.match(provider, /updateBaseDevice\(target\.id, normalized\)/u);
});

test("states immutable identity and avoids fake sync or unrelated controls", async () => {
  const modal = await source("modal");

  assert.match(modal, /Controller identity, ownership and safety state remain immutable/u);
  assert.match(modal, /Remote persistence remains managed by the existing Firebase adapter/u);
  assert.match(modal, /Device ID \{device\.id\}/u);
  assert.match(modal, /pairing trust, telemetry[\s\S]*hardware protection were not changed/u);
  assert.doesNotMatch(
    modal,
    /startIrrigation|removeDevice|pairDeviceByCode|createDevicePairingCode|updateAutomation|resetAutomation|refreshTelemetry/u,
  );
  assert.doesNotMatch(
    modal,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|firebase-greencloud|httpsCallable|patchDeviceInFirebase/u,
  );
  assert.doesNotMatch(
    modal,
    /fully synced|sync complete|saved to Firebase|GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
