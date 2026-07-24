import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SettingsPreferenceValidationError,
  normalizeSettingsPreferencePatch,
} from "../../lib/settings-preference-validation.mjs";

const current = Object.freeze({
  themePreset: "golden-hour",
  theme: "golden-hour",
  notificationMode: "priority",
  notifications: "priority",
  animations: true,
  compactMode: false,
  leafAmbience: true,
  leafFx: true,
  ambienceMode: "wind",
  workspaceName: "GreenCloud",
  projectName: "GreenCloud",
  ownerName: "Operator",
  mainPlantLabel: "Primary plant",
  plantLabel: "Primary plant",
});

test("synchronizes valid theme, notification and ambience aliases", () => {
  assert.deepEqual(
    normalizeSettingsPreferencePatch(current, {
      theme: "rain-glass",
      notifications: "all",
      leafFx: false,
      ambienceMode: "rain",
    }),
    {
      themePreset: "rain-glass",
      theme: "rain-glass",
      notificationMode: "all",
      notifications: "all",
      leafAmbience: false,
      leafFx: false,
      ambienceMode: "rain",
    },
  );
});

test("accepts only real booleans for visual preference switches", () => {
  assert.deepEqual(
    normalizeSettingsPreferencePatch(current, {
      animations: false,
      compactMode: true,
    }),
    {
      animations: false,
      compactMode: true,
    },
  );

  assert.throws(
    () =>
      normalizeSettingsPreferencePatch(current, {
        animations: "false",
      }),
    (error) =>
      error instanceof SettingsPreferenceValidationError &&
      error.code === "invalid-boolean",
  );
});

test("rejects unsupported theme, notification and ambience values", () => {
  for (const patch of [
    { themePreset: "system" },
    { notificationMode: "silent" },
    { ambienceMode: "storm" },
  ]) {
    assert.throws(
      () => normalizeSettingsPreferencePatch(current, patch),
      (error) =>
        error instanceof SettingsPreferenceValidationError &&
        error.code === "invalid-enum",
    );
  }
});

test("rejects conflicting alias values before persistence", () => {
  assert.throws(
    () =>
      normalizeSettingsPreferencePatch(current, {
        themePreset: "golden-hour",
        theme: "rain-glass",
      }),
    (error) =>
      error instanceof SettingsPreferenceValidationError &&
      error.code === "alias-conflict",
  );

  assert.throws(
    () =>
      normalizeSettingsPreferencePatch(current, {
        leafAmbience: true,
        leafFx: false,
      }),
    (error) =>
      error instanceof SettingsPreferenceValidationError &&
      error.code === "alias-conflict",
  );
});

test("rejects unknown settings fields instead of spreading them into state", () => {
  assert.throws(
    () =>
      normalizeSettingsPreferencePatch(current, {
        adminMode: true,
      }),
    (error) =>
      error instanceof SettingsPreferenceValidationError &&
      error.code === "unknown-field",
  );
});

test("allows known identity fields to be delegated to identity validation", () => {
  assert.deepEqual(
    normalizeSettingsPreferencePatch(current, {
      workspaceName: "Updated workspace",
      ownerName: "Updated owner",
      mainPlantLabel: "Herbs",
    }),
    {},
  );
});

test("turns the calm ambience into a synchronized disabled ambient layer", () => {
  assert.deepEqual(
    normalizeSettingsPreferencePatch(current, {
      ambienceMode: "calm",
    }),
    {
      ambienceMode: "calm",
      leafAmbience: false,
      leafFx: false,
    },
  );
});

test("routes Settings writes through the protected adapter and visible route boundary", async () => {
  const [providerSource, layoutSource, boundarySource] = await Promise.all([
    readFile("components/providers/app-state-provider.tsx", "utf8"),
    readFile("app/settings/layout.tsx", "utf8"),
    readFile(
      "components/settings/settings-preference-safety-boundary.tsx",
      "utf8",
    ),
  ]);

  assert.match(providerSource, /normalizeSettingsPreferencePatch\(/u);
  assert.match(providerSource, /normalizeIdentitySettingsPatch\(/u);
  assert.match(providerSource, /emitBlockedSettingsPreference\(/u);
  assert.match(
    providerSource,
    /updateBaseSettings\(normalizedPatch\)/u,
  );
  assert.doesNotMatch(
    providerSource,
    /updateBaseSettings\(\{\s*\.\.\.patch/u,
  );

  assert.match(
    layoutSource,
    /SettingsPreferenceSafetyBoundary/u,
  );
  assert.match(
    boundarySource,
    /SETTINGS_PREFERENCE_BLOCKED_EVENT/u,
  );
  assert.match(
    boundarySource,
    /Settings change blocked safely/u,
  );
});
