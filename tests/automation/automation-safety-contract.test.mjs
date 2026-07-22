import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  AUTOMATION_COMMAND_BLOCKED_EVENT,
  getManualIrrigationDecision,
  normalizeAutomationPatch,
} from "../../lib/automation-safety.mjs";

const currentAutomation = {
  mode: "Automatic",
  moistureThreshold: 35,
  cooldownMinutes: 20,
  pumpDurationSeconds: 8,
  manualOverrideEnabled: true,
  manualOverride: true,
  autoIrrigationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
  quietStart: "23:00",
  quietEnd: "07:00",
};

const safeCommandContext = {
  authenticated: true,
  hasRealDevice: true,
  manualOverrideEnabled: true,
  telemetryReady: true,
  deviceStatus: "Online",
  sensorStatus: "OK",
  rainStatus: "Clear",
  waterLevelStatus: "OK",
};

const providerSource = fs.readFileSync(
  "components/providers/app-state-provider.tsx",
  "utf8",
);
const layoutSource = fs.readFileSync("app/automation/layout.tsx", "utf8");
const boundarySource = fs.readFileSync(
  "components/automation/automation-safety-boundary.tsx",
  "utf8",
);

test("clamps automation numbers to the visible protected editor limits", () => {
  const normalized = normalizeAutomationPatch(currentAutomation, {
    moistureThreshold: -50,
    cooldownMinutes: 999,
    pumpDurationSeconds: Number.POSITIVE_INFINITY,
  });

  assert.equal(normalized.moistureThreshold, 15);
  assert.equal(normalized.cooldownMinutes, 120);
  assert.equal(normalized.pumpDurationSeconds, 8);
});

test("rejects malformed mode and clock input while synchronizing aliases", () => {
  const normalized = normalizeAutomationPatch(currentAutomation, {
    mode: "Unsafe",
    quietHoursStart: "25:99",
    quietEnd: "06:30",
    manualOverride: false,
    unknownField: "ignored",
  });

  assert.equal(normalized.mode, "Automatic");
  assert.equal(normalized.quietHoursStart, "23:00");
  assert.equal(normalized.quietStart, "23:00");
  assert.equal(normalized.quietHoursEnd, "06:30");
  assert.equal(normalized.quietEnd, "06:30");
  assert.equal(normalized.manualOverrideEnabled, false);
  assert.equal(normalized.manualOverride, false);
  assert.equal("unknownField" in normalized, false);
});

test("blocks unauthenticated and unpaired command attempts", () => {
  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      authenticated: false,
    }).reason,
    "Sign in before sending device commands.",
  );

  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      hasRealDevice: false,
    }).allowed,
    false,
  );
});

test("blocks manual irrigation when manual override is disabled", () => {
  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      manualOverrideEnabled: false,
    }).reason,
    "Manual override is disabled.",
  );
});

test("blocks irrigation for unreliable telemetry, rain and tank protection", () => {
  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      telemetryReady: false,
    }).allowed,
    false,
  );
  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      rainStatus: "Detected",
    }).allowed,
    false,
  );
  assert.equal(
    getManualIrrigationDecision({
      ...safeCommandContext,
      waterLevelStatus: "Low",
    }).allowed,
    false,
  );
});

test("allows a manual command only after all web-side guards pass", () => {
  const decision = getManualIrrigationDecision(safeCommandContext);

  assert.deepEqual(decision, {
    allowed: true,
    reason: "Manual watering command is allowed.",
  });
});

test("routes automation updates and commands through the adapter boundary", () => {
  assert.match(providerSource, /normalizeAutomationPatch/);
  assert.match(providerSource, /getManualIrrigationDecision/);
  assert.match(providerSource, /authenticated: Boolean\(firebaseAuth\.currentUser\)/);
  assert.match(providerSource, /updateBaseAutomation\(normalized\)/);
  assert.match(providerSource, /startBaseIrrigation\(commandTarget\.id\)/);
  assert.match(providerSource, /if \(!decision\.allowed\)/);
  assert.match(providerSource, /\[automation, updateBaseAutomation\]/);
  assert.match(providerSource, /startBaseIrrigation,/);
});

test("mounts a visible blocked-command notice on the Automation route", () => {
  assert.equal(
    AUTOMATION_COMMAND_BLOCKED_EVENT,
    "greencloud:automation-command-blocked",
  );
  assert.match(layoutSource, /AutomationSafetyBoundary/);
  assert.match(boundarySource, /Command blocked safely/);
  assert.match(boundarySource, /addEventListener/);
  assert.match(boundarySource, /AUTOMATION_COMMAND_BLOCKED_EVENT/);
});
