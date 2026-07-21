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
const devicesSource = readFileSync(
  new URL("../../app/devices/page.tsx", import.meta.url),
  "utf8",
);

test("routes the app pairing action through the protected claim service", () => {
  assert.match(providerSource, /pairDeviceWithProtectedClaim/);
  assert.match(providerSource, /firebaseFunctions/);
  assert.match(providerSource, /realtimeDatabase/);
  assert.doesNotMatch(providerSource, /pairDeviceToUserInFirebase/);
});

test("keeps the Devices UI on the six-character approval flow", () => {
  assert.match(devicesSource, /maxLength=\{6\}/);
  assert.match(devicesSource, /cleanCode\.length !== 6/);
  assert.match(devicesSource, /Approve request on ESP32/);
  assert.match(devicesSource, /Waiting for ESP32\.\.\./);
  assert.doesNotMatch(devicesSource, /7-character/);
});
