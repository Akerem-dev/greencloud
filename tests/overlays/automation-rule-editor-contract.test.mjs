import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/automation/page.tsx", import.meta.url),
  launcher: new URL(
    "../../components/automation/gc2-automation-rule-editor-launcher.tsx",
    import.meta.url,
  ),
  editor: new URL(
    "../../components/automation/gc2-automation-rule-editor.tsx",
    import.meta.url,
  ),
  safety: new URL("../../lib/automation-safety.mjs", import.meta.url),
  provider: new URL(
    "../../components/providers/app-state-provider.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one deliberate rule editor launcher on the Automation route", async () => {
  const [page, launcher] = await Promise.all([
    source("page"),
    source("launcher"),
  ]);

  assert.match(page, /Gc2AutomationPolicy/u);
  assert.match(page, /Gc2AutomationRuleEditorLauncher/u);
  assert.match(page, /<Gc2AutomationRuleEditorLauncher\s*\/>/u);
  assert.match(launcher, /Edit automation rule/u);
  assert.match(launcher, /aria-label="Edit automation rule"/u);
  assert.match(launcher, /if \(!device\) return null/u);
});

test("copies active AppState into an isolated local draft", async () => {
  const editor = await source("editor");

  assert.match(editor, /function initialDraft\(automation: AutomationState\)/u);
  assert.match(editor, /useState<AutomationDraft>\(\(\) =>\s*initialDraft\(automation\)/u);
  assert.match(editor, /setDraft\(\(current\) =>/u);
  assert.match(editor, /Draft changes are isolated/u);
  assert.match(editor, /does not change the active policy/u);
  assert.doesNotMatch(editor, /useAppState/u);
  assert.doesNotMatch(editor, /updateAutomation/u);
});

test("validates every visible policy limit before save", async () => {
  const [editor, safety] = await Promise.all([
    source("editor"),
    source("safety"),
  ]);

  assert.match(editor, /parseInteger\([\s\S]*"Moisture threshold"[\s\S]*15,[\s\S]*80/u);
  assert.match(editor, /parseInteger\([\s\S]*"Cooldown window"[\s\S]*5,[\s\S]*120/u);
  assert.match(editor, /parseInteger\([\s\S]*"Pump duration"[\s\S]*2,[\s\S]*60/u);
  assert.match(editor, /CLOCK_PATTERN/u);
  assert.match(editor, /Quiet hours must use a valid 24-hour HH:MM time/u);
  assert.match(editor, /min=\{15\}/u);
  assert.match(editor, /max=\{80\}/u);
  assert.match(editor, /min=\{5\}/u);
  assert.match(editor, /max=\{120\}/u);
  assert.match(editor, /min=\{2\}/u);
  assert.match(editor, /max=\{60\}/u);

  assert.match(safety, /moistureThreshold: \[15, 80\]/u);
  assert.match(safety, /cooldownMinutes: \[5, 120\]/u);
  assert.match(safety, /pumpDurationSeconds: \[2, 60\]/u);
  assert.match(safety, /CLOCK_PATTERN/u);
});

test("sends one complete normalized patch only after explicit submit", async () => {
  const [editor, launcher, provider] = await Promise.all([
    source("editor"),
    source("launcher"),
    source("provider"),
  ]);

  assert.match(editor, /function saveRule\(event: FormEvent<HTMLFormElement>\)/u);
  assert.match(editor, /event\.preventDefault\(\)/u);
  assert.match(editor, /const patch = validateDraft\(draft\)/u);
  assert.match(editor, /onSave\(patch\)/u);
  assert.match(editor, /Save automation rule/u);
  assert.match(editor, /disabled=\{!dirty\}/u);

  for (const field of [
    "mode",
    "moistureThreshold",
    "cooldownMinutes",
    "pumpDurationSeconds",
    "autoIrrigationEnabled",
    "manualOverrideEnabled",
    "manualOverride",
    "quietHoursEnabled",
    "quietHoursStart",
    "quietHoursEnd",
    "quietStart",
    "quietEnd",
  ]) {
    assert.match(editor, new RegExp(`${field}[,:]`, "u"));
  }

  assert.match(launcher, /updateAutomation\(patch\)/u);
  assert.match(launcher, /setOpen\(false\)/u);
  assert.match(provider, /normalizeAutomationPatch/u);
  assert.match(provider, /updateBaseAutomation\(normalized\)/u);
});

test("keeps invalid input visible and does not perform physical operations", async () => {
  const editor = await source("editor");

  assert.match(editor, /catch \(validationError\)/u);
  assert.match(editor, /setError\(/u);
  assert.match(editor, /role="alert"/u);
  assert.match(editor, /cannot send irrigation/u);
  assert.match(editor, /energize the relay/u);
  assert.match(editor, /control the pump/u);
  assert.match(editor, /write directly to Firebase/u);

  assert.doesNotMatch(
    editor,
    /startIrrigation|refreshTelemetry|removeDevice|updateDevice|resetAutomation/u,
  );
  assert.doesNotMatch(
    editor,
    /firebaseAuth|firebaseFunctions|realtimeDatabase|writeIrrigationCommandToFirebase|patchDeviceInFirebase|httpsCallable/u,
  );
  assert.doesNotMatch(
    editor,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
