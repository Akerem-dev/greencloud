import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  modal: new URL(
    "../../components/devices/gc2-trusted-unpair-confirmation.tsx",
    import.meta.url,
  ),
  client: new URL("../../lib/trusted-device-unpair-client.ts", import.meta.url),
  route: new URL(
    "../../components/devices/gc2-device-detail-route.tsx",
    import.meta.url,
  ),
  detail: new URL(
    "../../components/devices/gc2-device-detail.tsx",
    import.meta.url,
  ),
  callable: new URL("../../lib/firebase-device-unpair.mjs", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts trusted unpair only on normal device detail", async () => {
  const [route, detail] = await Promise.all([
    source("route"),
    source("detail"),
  ]);

  assert.match(route, /Gc2TrustedUnpairConfirmation/u);
  assert.match(
    route,
    /if \(needsConnectionRecovery[\s\S]*return <Gc2OfflineSyncRecovery[\s\S]*if \(!isBootLoading && device && hardwareLockout\.locked\)[\s\S]*return <Gc2HardwareSafetyLockout[\s\S]*<Gc2TrustedUnpairConfirmation deviceId=\{deviceId\}\s*\/>/u,
  );
  assert.match(detail, /title="Remove device"/u);
  assert.match(detail, />\s*Remove device\s*</u);
});

test("captures the legacy remove control before local deletion can run", async () => {
  const modal = await source("modal");

  assert.match(
    modal,
    /document\.addEventListener\("click", handleRemoveCapture, true\)/u,
  );
  assert.match(modal, /button\.title !== "Remove device"/u);
  assert.match(modal, /buttonLabel\(button\) !== "Remove device"/u);
  assert.match(modal, /event\.preventDefault\(\)/u);
  assert.match(modal, /event\.stopPropagation\(\)/u);
  assert.match(modal, /event\.stopImmediatePropagation\(\)/u);
  assert.match(modal, /setTarget\(currentDevice\)/u);
  assert.match(modal, /setOpen\(true\)/u);
});

test("requires exact device-name confirmation and blocks duplicate submission", async () => {
  const modal = await source("modal");

  assert.match(modal, /confirmation\.trim\(\) !== target\.name/u);
  assert.match(modal, /Type \$\{target\.name\} exactly/u);
  assert.match(modal, /phase === "pending"/u);
  assert.match(modal, /disabled=\{!confirmationMatches \|\| phase === "pending"\}/u);
  assert.match(modal, /aria-busy=\{phase === "pending"\}/u);
  assert.match(modal, /if \(phase === "pending"\) return/u);
  assert.match(modal, /Verifying ownership…/u);
});

test("routes unpair through the trusted client and callable boundary", async () => {
  const [modal, client, callable] = await Promise.all([
    source("modal"),
    source("client"),
    source("callable"),
  ]);

  assert.match(modal, /requestTrustedDeviceUnpair\(\{/u);
  assert.match(modal, /devices,/u);
  assert.match(modal, /deviceId: target\.id/u);
  assert.doesNotMatch(modal, /firebaseAuth|firebaseFunctions|realtimeDatabase/u);
  assert.doesNotMatch(modal, /removeDevice\(|setDevices|patchDeviceInFirebase/u);

  assert.match(client, /assertDeviceMutationTarget/u);
  assert.match(client, /firebaseAuth\.currentUser/u);
  assert.match(client, /unpairDeviceWithTrustedCallable/u);
  assert.match(client, /userId: user\.uid/u);
  assert.match(client, /deviceId: target\.id/u);
  assert.match(callable, /callableFactory\(functions, "unpairDevice"\)/u);
  assert.match(callable, /validateDeviceUnpairResult/u);
});

test("keeps failures visible and reports only validated queued-reset evidence", async () => {
  const modal = await source("modal");

  assert.match(modal, /catch \(unpairError\)/u);
  assert.match(modal, /setError\(/u);
  assert.match(modal, /setPhase\("confirm"\)/u);
  assert.match(modal, /Trusted unpair accepted/u);
  assert.match(modal, /Server-side ownership verified/u);
  assert.match(modal, /Factory-reset request/u);
  assert.match(modal, />Queued</u);
  assert.match(modal, /Trusted request ID/u);
  assert.match(modal, /result\.requestId/u);
  assert.match(modal, /Hardware reset is not claimed complete/u);
  assert.match(
    modal,
    /does not claim that the ESP32 has already received or completed\s+that reset/u,
  );
});

test("does not directly delete database state or invent reset completion", async () => {
  const modal = await source("modal");

  assert.doesNotMatch(
    modal,
    /remove\(|set\(|update\(|ref\(|removeDeviceFromFirebase|realtimeDatabase|firebase-greencloud/u,
  );
  assert.doesNotMatch(
    modal,
    /factory reset completed|ESP32 reset completed|hardware reset complete/u,
  );
  assert.doesNotMatch(
    modal,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
