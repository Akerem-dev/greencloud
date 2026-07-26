import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  shell: new URL("../../components/setup/setup-shell.tsx", import.meta.url),
  workspaceForm: new URL(
    "../../components/setup/workspace-setup-form.tsx",
    import.meta.url,
  ),
  preferencesForm: new URL(
    "../../components/setup/preferences-setup-form.tsx",
    import.meta.url,
  ),
  workspacePage: new URL("../../app/setup/workspace/page.tsx", import.meta.url),
  preferencesPage: new URL(
    "../../app/setup/preferences/page.tsx",
    import.meta.url,
  ),
  pairingCompatibility: new URL("../../app/devices/add/page.tsx", import.meta.url),
  authGate: new URL("../../components/auth/auth-gate.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("uses one deliberate setup shell for workspace, preferences and device handoff", async () => {
  const shell = await source("shell");

  assert.match(shell, /Workspace identity/u);
  assert.match(shell, /Preferences/u);
  assert.match(shell, /First device/u);
  assert.match(shell, /aria-label="Setup progress"/u);
  assert.match(shell, /aria-current=\{active \? "step"/u);
  assert.doesNotMatch(shell, /GlassCard|AmbientOrbs|LeafFallOverlay|backdrop-blur/u);
});

test("persists validated workspace identity before advancing", async () => {
  const [page, form] = await Promise.all([
    source("workspacePage"),
    source("workspaceForm"),
  ]);

  assert.match(page, /<AuthGate>/u);
  assert.match(page, /<WorkspaceSetupForm/u);
  assert.match(form, /saveWorkspaceIdentity/u);

  for (const field of [
    "workspaceName",
    "projectName",
    "ownerName",
    "mainPlantLabel",
  ]) {
    assert.match(form, new RegExp(field, "u"));
  }

  assert.match(form, /router\.push\("\/setup\/preferences"\)/u);
  assert.match(form, /Workspace setup was blocked/u);
});

test("keeps onboarding preferences essential and hands off to pairing explicitly", async () => {
  const [page, form, pairing] = await Promise.all([
    source("preferencesPage"),
    source("preferencesForm"),
    source("pairingCompatibility"),
  ]);

  assert.match(page, /<AuthGate>/u);
  assert.match(page, /<PreferencesSetupForm/u);
  assert.match(form, /updateSettings/u);
  assert.match(form, /themePreset/u);
  assert.match(form, /notificationMode/u);
  assert.match(form, /animations/u);
  assert.match(form, /compactMode/u);
  assert.match(form, /Pair the first ESP32 now/u);
  assert.match(form, /Continue without a device/u);
  assert.match(form, /"\/devices\/add"/u);
  assert.match(form, /"\/dashboard"/u);
  assert.doesNotMatch(form, /leafAmbience|ambienceMode|fireflies/u);
  assert.match(pairing, /redirect\("\/devices"\)/u);
});

test("protects setup with the migrated session gate and dedicated login route", async () => {
  const authGate = await source("authGate");

  assert.match(authGate, /router\.replace\("\/login"\)/u);
  assert.match(authGate, /Gc2Surface/u);
  assert.match(authGate, /Checking secure session/u);
  assert.doesNotMatch(authGate, /GlassCard|BrandMark|var\(--gc-bg\)|backdrop-blur/u);
});
