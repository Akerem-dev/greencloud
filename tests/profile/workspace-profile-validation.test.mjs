import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  WORKSPACE_IDENTITY_LIMITS,
  WorkspaceProfileValidationError,
  normalizeIdentitySettingsPatch,
  sanitizeLiveIdentityValue,
  validateProfileName,
  validateWorkspaceIdentity,
} from "../../lib/workspace-profile-validation.mjs";

const currentSettings = {
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
};

const providerSource = fs.readFileSync(
  "components/providers/app-state-provider.tsx",
  "utf8",
);

test("normalizes profile names before Firebase Auth updates", () => {
  assert.equal(validateProfileName("  Kerem   Can  "), "Kerem Can");
  assert.equal(validateProfileName("Cafe\u0301"), "Café");
});

test("rejects empty, unsafe and oversized profile names", () => {
  assert.throws(
    () => validateProfileName("   "),
    (error) =>
      error instanceof WorkspaceProfileValidationError &&
      error.code === "required",
  );

  assert.throws(
    () => validateProfileName("Operator\u202Ehidden"),
    (error) =>
      error instanceof WorkspaceProfileValidationError &&
      error.code === "unsafe-characters",
  );

  assert.throws(
    () =>
      validateProfileName(
        "A".repeat(WORKSPACE_IDENTITY_LIMITS.profileName + 1),
      ),
    (error) =>
      error instanceof WorkspaceProfileValidationError &&
      error.code === "too-long",
  );
});

test("sanitizes live identity fields without splitting Unicode code points", () => {
  assert.equal(sanitizeLiveIdentityValue("A\u0000B\u202EC", 10), "ABC");
  assert.equal(sanitizeLiveIdentityValue("🌱🌿🌳", 2), "🌱🌿");
});

test("normalizes only identity settings and synchronizes plant aliases", () => {
  const normalized = normalizeIdentitySettingsPatch(currentSettings, {
    themePreset: "rain-glass",
    workspaceName: `Lab\u0000${"X".repeat(100)}`,
    plantLabel: "Main greenhouse",
  });

  assert.equal(
    Array.from(normalized.workspaceName).length,
    WORKSPACE_IDENTITY_LIMITS.workspaceName,
  );
  assert.equal(normalized.workspaceName.includes("\u0000"), false);
  assert.equal(normalized.mainPlantLabel, "Main greenhouse");
  assert.equal(normalized.plantLabel, "Main greenhouse");
  assert.equal("themePreset" in normalized, false);
});

test("validates a complete workspace identity with safe fallbacks", () => {
  const normalized = validateWorkspaceIdentity(
    {
      workspaceName: "  Home   Lab  ",
      projectName: "",
      ownerName: "  Kerem  ",
      mainPlantLabel: "  Balcony   mint ",
    },
    currentSettings,
  );

  assert.deepEqual(normalized, {
    workspaceName: "Home Lab",
    projectName: "GreenCloud",
    ownerName: "Kerem",
    mainPlantLabel: "Balcony mint",
  });
});

test("rejects unsafe workspace identity before persistence", () => {
  assert.throws(
    () =>
      validateWorkspaceIdentity(
        {
          workspaceName: "Safe",
          projectName: "Project\u0007",
          ownerName: "Operator",
          mainPlantLabel: "Plant",
        },
        currentSettings,
      ),
    (error) =>
      error instanceof WorkspaceProfileValidationError &&
      error.code === "unsafe-characters",
  );
});

test("routes profile and workspace writes through the adapter boundary", () => {
  assert.match(providerSource, /normalizeIdentitySettingsPatch/);
  assert.match(providerSource, /validateWorkspaceIdentity/);
  assert.match(providerSource, /validateProfileName/);
  assert.match(providerSource, /const normalizedPatch = \{/);
  assert.match(providerSource, /updateBaseSettings\(normalizedPatch\)/);
  assert.match(providerSource, /saveBaseWorkspaceIdentity\(normalized\)/);
  assert.match(providerSource, /updateBaseProfileName\(normalized\)/);
});
