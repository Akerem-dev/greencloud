import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/settings/page.tsx", import.meta.url),
  settings: new URL(
    "../../components/settings/gc2-workspace-settings.tsx",
    import.meta.url,
  ),
  layout: new URL("../../app/settings/layout.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one protected workspace settings screen", async () => {
  const [page, settings, layout] = await Promise.all([
    source("page"),
    source("settings"),
    source("layout"),
  ]);

  assert.match(page, /Gc2WorkspaceSettings/u);
  assert.match(page, /<Gc2WorkspaceSettings\s*\/>/u);
  assert.match(settings, /Gc2ProtectedShell/u);
  assert.match(layout, /SettingsPreferenceSafetyBoundary/u);
});

test("keeps workspace identity inside the existing strict validation boundary", async () => {
  const settings = await source("settings");

  for (const term of [
    "Workspace identity",
    "Workspace name",
    "Garden or project name",
    "Workspace owner",
    "Primary plant or zone",
    "Strict safe-save contract",
  ]) {
    assert.match(settings, new RegExp(term, "u"));
  }

  assert.match(settings, /saveWorkspaceIdentity/u);
  assert.match(settings, /workspaceName,[\s\S]*projectName,[\s\S]*ownerName,[\s\S]*mainPlantLabel/u);
  assert.match(settings, /label="Workspace name"[\s\S]*?maxLength=\{80\}/u);
  assert.match(settings, /label="Garden or project name"[\s\S]*?maxLength=\{80\}/u);
  assert.match(settings, /label="Workspace owner"[\s\S]*?maxLength=\{60\}/u);
  assert.match(settings, /label="Primary plant or zone"[\s\S]*?maxLength=\{80\}/u);
});

test("edits only validated interface and notification preferences", async () => {
  const settings = await source("settings");

  for (const term of [
    "Operating contrast",
    "Priority notifications",
    "All workspace notifications",
    "Interface motion",
    "Compact data density",
    "Ambient background cue",
    "Calm interface defaults",
  ]) {
    assert.match(settings, new RegExp(term, "u"));
  }

  assert.match(settings, /updateSettings\(\{/u);
  assert.match(settings, /themePreset,/u);
  assert.match(settings, /notificationMode,/u);
  assert.match(settings, /animations,/u);
  assert.match(settings, /compactMode,/u);
  assert.match(settings, /leafAmbience,/u);
  assert.match(settings, /ambienceMode,/u);
});

test("does not mix automation, hardware commands or direct Firebase access into settings", async () => {
  const settings = await source("settings");

  assert.doesNotMatch(
    settings,
    /updateAutomation|resetAutomation|startIrrigation|refreshTelemetry|simulateThresholdEvent/u,
  );
  assert.doesNotMatch(
    settings,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable|from ["']firebase/u,
  );
  assert.doesNotMatch(
    settings,
    /GlassCard|SectionBadge|premium-btn|premium-tab|AmbientOrbs|LeafFallOverlay|backdrop-blur/u,
  );
});
