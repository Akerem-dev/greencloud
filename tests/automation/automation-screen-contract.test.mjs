import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../../app/automation/page.tsx", import.meta.url);
const policyPath = new URL(
  "../../components/automation/gc2-automation-policy.tsx",
  import.meta.url,
);
const layoutPath = new URL("../../app/automation/layout.tsx", import.meta.url);

const [page, policy, layout] = await Promise.all([
  readFile(pagePath, "utf8"),
  readFile(policyPath, "utf8"),
  readFile(layoutPath, "utf8"),
]);

test("mounts GC-11 as a deliberate protected control-policy route", () => {
  assert.match(page, /Gc2AutomationPolicy/u);
  assert.match(page, /<Gc2AutomationPolicy\s*\/>/u);
  assert.match(policy, /Gc2ProtectedShell/u);
  assert.match(layout, /AutomationSafetyBoundary/u);
});

test("keeps rule, timing and permission controls visible", () => {
  for (const term of [
    "Automation is a policy, not a shortcut",
    "Rule and timing controls",
    "Moisture threshold",
    "Cooldown window",
    "Requested pump duration",
    "Automatic irrigation",
    "Manual override",
    "Quiet hours",
    "Decision trace",
    "Physical output",
  ]) {
    assert.match(policy, new RegExp(term, "u"));
  }

  assert.match(policy, /min=\{15\}/u);
  assert.match(policy, /max=\{80\}/u);
  assert.match(policy, /min=\{5\}/u);
  assert.match(policy, /max=\{120\}/u);
  assert.match(policy, /min=\{2\}/u);
  assert.match(policy, /max=\{60\}/u);
});

test("routes policy updates, reset and manual evaluation through AppState", () => {
  assert.match(policy, /updateAutomation/u);
  assert.match(policy, /resetAutomation/u);
  assert.match(policy, /startIrrigation\(device\.id\)/u);
  assert.match(policy, /manualOverrideEnabled/u);
  assert.match(policy, /autoIrrigationEnabled/u);
  assert.match(policy, /quietHoursStart/u);
  assert.match(policy, /quietHoursEnd/u);
  assert.doesNotMatch(
    policy,
    /realtimeDatabase|firebaseFunctions|firebaseAuth|writeIrrigationCommandToFirebase/u,
  );
});

test("keeps physical blockers and honest no-device state explicit", () => {
  for (const term of [
    "Telemetry is not ready",
    "Sensor reliability requires review",
    "Rain lockout is active",
    "Water-level protection is active",
    "Physical output remains protected",
    "No selected hardware node",
    "does not create placeholder policies",
  ]) {
    assert.match(policy, new RegExp(term, "u"));
  }

  assert.match(policy, /href="\/devices\/add"/u);
  assert.doesNotMatch(
    policy,
    /GlassCard|SectionBadge|premium-btn|premium-tab|backdrop-blur|AmbientOrbs/u,
  );
});
