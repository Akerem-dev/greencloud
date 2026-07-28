import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/automation/page.tsx", import.meta.url),
  modal: new URL(
    "../../components/automation/gc2-delete-automation-confirmation.tsx",
    import.meta.url,
  ),
  policy: new URL(
    "../../components/automation/gc2-automation-policy.tsx",
    import.meta.url,
  ),
  providerBase: new URL(
    "../../components/providers/app-state-provider-base.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one delete-equivalent confirmation on the Automation route", async () => {
  const [page, policy] = await Promise.all([
    source("page"),
    source("policy"),
  ]);

  assert.match(page, /Gc2DeleteAutomationConfirmation/u);
  assert.match(page, /<Gc2DeleteAutomationConfirmation\s*\/>/u);
  assert.match(policy, />\s*Reset policy\s*</u);
});

test("captures the existing reset trigger before the legacy dialog opens", async () => {
  const modal = await source("modal");

  assert.match(
    modal,
    /document\.addEventListener\("click", handleResetCapture, true\)/u,
  );
  assert.match(modal, /buttonLabel\(button\) !== "Reset policy"/u);
  assert.match(modal, /button\.closest\('\[role="dialog"\]'\)/u);
  assert.match(modal, /event\.preventDefault\(\)/u);
  assert.match(modal, /event\.stopPropagation\(\)/u);
  assert.match(modal, /event\.stopImmediatePropagation\(\)/u);
  assert.match(modal, /setPhase\("confirm"\)/u);
  assert.match(modal, /setOpen\(true\)/u);
});

test("requires the exact destructive phrase before resetAutomation", async () => {
  const modal = await source("modal");

  assert.match(modal, /const CONFIRMATION_PHRASE = "DELETE RULE"/u);
  assert.match(
    modal,
    /confirmation\.trim\(\) !== CONFIRMATION_PHRASE[\s\S]*setError\([\s\S]*return;/u,
  );
  assert.match(
    modal,
    /setError\(""\);[\s\S]*resetAutomation\(\);[\s\S]*setPhase\("success"\)/u,
  );
  assert.match(modal, /disabled=\{!phraseMatches\}/u);
  assert.match(modal, /Replace with protected defaults/u);
});

test("shows the real current policy and describes truthful replacement semantics", async () => {
  const modal = await source("modal");

  for (const field of [
    "mode",
    "moistureThreshold",
    "cooldownMinutes",
    "pumpDurationSeconds",
    "autoIrrigationEnabled",
    "manualOverrideEnabled",
    "quietHoursEnabled",
    "quietHoursStart",
    "quietHoursEnd",
  ]) {
    assert.match(modal, new RegExp(`automation\\.${field}`, "u"));
  }

  assert.match(modal, /supported delete-equivalent/u);
  assert.match(modal, /replaces the custom rule with protected defaults/u);
  assert.match(modal, /Protected defaults applied through AppState/u);
  assert.match(modal, /Remote persistence remains managed/u);
  assert.match(modal, /No hardware or history was deleted/u);
});

test("uses the existing reset boundary and does not invent record deletion", async () => {
  const [modal, providerBase] = await Promise.all([
    source("modal"),
    source("providerBase"),
  ]);

  assert.match(providerBase, /const resetAutomation = useCallback\(\(\) => \{/u);
  assert.match(
    providerBase,
    /automation: defaultAutomation[\s\S]*title: "Automation reset"[\s\S]*writeAutomationToFirebase\(currentUserId, defaultAutomation\)/u,
  );

  assert.doesNotMatch(
    modal,
    /updateAutomation\(|startIrrigation|removeDevice|updateDevice|refreshTelemetry/u,
  );
  assert.doesNotMatch(
    modal,
    /firebaseAuth|firebaseFunctions|realtimeDatabase|writeAutomationToFirebase|patchAutomationInFirebase|httpsCallable/u,
  );
  assert.doesNotMatch(
    modal,
    /delete automation record|database record deleted|device deleted|ESP32 reset completed/u,
  );
});

test("does not regress to the old glass visual language", async () => {
  const modal = await source("modal");

  assert.doesNotMatch(
    modal,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
