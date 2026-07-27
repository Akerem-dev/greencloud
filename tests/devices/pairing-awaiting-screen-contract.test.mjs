import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  studio: new URL(
    "../../components/devices/protected-pairing-studio.tsx",
    import.meta.url,
  ),
  waiting: new URL(
    "../../components/devices/gc2-pairing-approval-wait.tsx",
    import.meta.url,
  ),
  flow: new URL("../../lib/firebase-pairing-flow.mjs", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("switches from code entry to one dedicated approval screen", async () => {
  const [studio, waiting] = await Promise.all([
    source("studio"),
    source("waiting"),
  ]);

  assert.match(studio, /stage === "awaiting"/u);
  assert.match(studio, /Gc2PairingApprovalWait/u);
  assert.match(studio, /code=\{code\}/u);
  assert.match(studio, /deviceName=\{name\}/u);
  assert.match(studio, /ownerLabel=\{ownerLabel\}/u);
  assert.match(waiting, /Approval pending/u);
  assert.match(waiting, /Active OLED code/u);
});

test("matches the visible countdown to the protected service timeout", async () => {
  const [waiting, flow] = await Promise.all([
    source("waiting"),
    source("flow"),
  ]);

  assert.match(waiting, /APPROVAL_WINDOW_SECONDS = 90/u);
  assert.match(waiting, /Local wait window/u);
  assert.match(waiting, /waits for up to 90 seconds/u);
  assert.match(flow, /DEFAULT_TIMEOUT_MS = 90_000/u);
  assert.match(flow, /Math\.min\([\s\S]*?pairing\.expiresAtMs - nowMs/u);
});

test("keeps hardware approval and ownership boundaries explicit", async () => {
  const waiting = await source("waiting");

  for (const term of [
    "Signed-in owner",
    "Pending claim",
    "ESP32 approval required",
    "Canonical ownership",
    "Not written yet",
    "the browser cannot approve its own claim",
    "No ownership shortcut",
  ]) {
    assert.match(waiting, new RegExp(term, "u"));
  }

  assert.match(waiting, /Leaving this screen does not delete the pending claim/u);
  assert.match(waiting, /resume it/u);
});

test("uses the existing pairing action without direct Firebase or fake completion", async () => {
  const [studio, waiting] = await Promise.all([
    source("studio"),
    source("waiting"),
  ]);

  assert.match(studio, /pairDeviceByCode\(safeCode, safeName, safePlace\)/u);
  assert.doesNotMatch(
    `${studio}\n${waiting}`,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable|pairDeviceToUserInFirebase/u,
  );
  assert.doesNotMatch(
    waiting,
    /setStage\("success"\)|ownerUid\s*=|Math\.random|fakeApproval/u,
  );
});
