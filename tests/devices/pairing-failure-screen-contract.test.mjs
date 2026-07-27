import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  studio: new URL(
    "../../components/devices/protected-pairing-studio.tsx",
    import.meta.url,
  ),
  failure: new URL(
    "../../components/devices/gc2-pairing-failure-recovery.tsx",
    import.meta.url,
  ),
  flow: new URL("../../lib/firebase-pairing-flow.mjs", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("routes protected pairing failures to one dedicated recovery screen", async () => {
  const [studio, failure] = await Promise.all([
    source("studio"),
    source("failure"),
  ]);

  assert.match(studio, /Gc2PairingFailureRecovery/u);
  assert.match(
    studio,
    /stage === "rejected" \|\| stage === "timeout" \|\| stage === "error"/u,
  );
  assert.match(studio, /failureCode=\{failureCode\}/u);
  assert.match(studio, /onRetrySameDetails=\{retrySameDetails\}/u);
  assert.match(studio, /onUseFreshCode=\{useFreshCode\}/u);
  assert.match(failure, /Recovery required/u);
  assert.match(failure, /Protected service report/u);
});

test("classifies real protected-flow failures into safe recovery plans", async () => {
  const [failure, flow] = await Promise.all([
    source("failure"),
    source("flow"),
  ]);

  for (const term of [
    "Hardware rejection",
    "Approval window closed",
    "Code unavailable",
    "Claim boundary blocked",
    "Owner session unavailable",
    "Ownership result unconfirmed",
    "Protected service unavailable",
  ]) {
    assert.match(failure, new RegExp(term, "u"));
  }

  for (const code of [
    "rejected",
    "timeout",
    "expired",
    "not-found",
    "permission-denied",
    "claim-conflict",
    "unauthenticated",
    "invalid-response",
  ]) {
    assert.match(`${failure}\n${flow}`, new RegExp(code, "u"));
  }
});

test("preserves details for review and clears only the stale OLED code for fresh recovery", async () => {
  const studio = await source("studio");

  assert.match(
    studio,
    /function retrySameDetails\(\) \{[\s\S]*?setStage\("idle"\)[\s\S]*?setFailureCode\(""\)/u,
  );
  assert.doesNotMatch(
    studio.match(/function retrySameDetails\(\)[\s\S]*?\n  \}/u)?.[0] ?? "",
    /setCode\(""\)|setName\(|setPlace\(/u,
  );
  assert.match(
    studio,
    /function useFreshCode\(\) \{[\s\S]*?setCode\(""\)[\s\S]*?setStage\("idle"\)/u,
  );
  assert.doesNotMatch(
    studio.match(/function useFreshCode\(\)[\s\S]*?\n  \}/u)?.[0] ?? "",
    /setName\(|setPlace\(/u,
  );
});

test("fails closed without direct Firebase access or fake ownership completion", async () => {
  const [studio, failure] = await Promise.all([
    source("studio"),
    source("failure"),
  ]);

  for (const term of [
    "Canonical ownership",
    "Unconfirmed",
    "No device is presented as trusted by this recovery screen",
    "Fail closed",
    "Existing workspace preserved",
    "Fresh-code rule",
  ]) {
    assert.match(failure, new RegExp(term, "u"));
  }

  assert.match(studio, /setFailureCode\("invalid-response"\)/u);
  assert.match(studio, /setFailureCode\(codeValue \|\| "pairing-error"\)/u);
  assert.doesNotMatch(
    `${studio}\n${failure}`,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable|pairDeviceToUserInFirebase/u,
  );
  assert.doesNotMatch(
    failure,
    /setStage\("success"\)|ownerUid\s*=|Math\.random|fakeSuccess|fakeOwnership/u,
  );
});
