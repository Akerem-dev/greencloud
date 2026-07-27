import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const providerSource = readFileSync(
  new URL(
    "../../components/providers/app-state-provider.tsx",
    import.meta.url,
  ),
  "utf8",
);
const studioSource = readFileSync(
  new URL(
    "../../components/devices/protected-pairing-studio.tsx",
    import.meta.url,
  ),
  "utf8",
);
const waitingSource = readFileSync(
  new URL(
    "../../components/devices/gc2-pairing-approval-wait.tsx",
    import.meta.url,
  ),
  "utf8",
);
const routeSource = readFileSync(
  new URL("../../app/devices/add/page.tsx", import.meta.url),
  "utf8",
);

test("routes the app pairing action through the protected claim service", () => {
  assert.match(providerSource, /pairDeviceWithProtectedClaim/);
  assert.match(providerSource, /firebaseFunctions/);
  assert.match(providerSource, /realtimeDatabase/);
  assert.doesNotMatch(providerSource, /pairDeviceToUserInFirebase/);
});

test("mounts the six-character approval flow on the dedicated add route", () => {
  assert.match(routeSource, /ProtectedPairingStudio/);
  assert.match(studioSource, /maxLength=\{6\}/);
  assert.match(studioSource, /safeCode\.length !== 6/);
  assert.match(studioSource, /Approve request on ESP32/);
  assert.match(studioSource, /Gc2PairingApprovalWait/);
  assert.match(waitingSource, /Waiting for ESP32 approval/);
  assert.doesNotMatch(`${studioSource}\n${waitingSource}`, /7-character/);
});
