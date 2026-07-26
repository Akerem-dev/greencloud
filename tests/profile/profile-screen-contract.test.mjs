import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/profile/page.tsx", import.meta.url),
  profile: new URL(
    "../../components/profile/gc2-account-profile.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one protected account profile route", async () => {
  const [page, profile] = await Promise.all([
    source("page"),
    source("profile"),
  ]);

  assert.match(page, /Gc2AccountProfile/u);
  assert.match(page, /<Gc2AccountProfile\s*\/>/u);
  assert.match(profile, /Gc2ProtectedShell/u);
});

test("updates only the validated Firebase display identity", async () => {
  const profile = await source("profile");

  for (const term of [
    "Account identity",
    "Authenticated operator",
    "Firebase display identity",
    "Profile display name",
    "Account email",
    "Account boundaries",
  ]) {
    assert.match(profile, new RegExp(term, "u"));
  }

  assert.match(profile, /updateProfileName\(displayName\)/u);
  assert.match(profile, /label="Profile display name"[\s\S]*?maxLength=\{60\}/u);
  assert.match(profile, /label="Account email"[\s\S]*?readOnly/u);
  assert.match(profile, /Email identity is read-only here/u);
});

test("requires an explicit confirmation before ending the AppState session", async () => {
  const profile = await source("profile");

  assert.match(profile, /logoutFromWorkspace/u);
  assert.match(profile, /Gc2Dialog/u);
  assert.match(profile, /Sign out of GreenCloud\?/u);
  assert.match(profile, /Confirm sign out/u);
  assert.match(profile, /Signing out does not unpair ESP32 devices/u);
  assert.match(profile, /setSignOutOpen\(true\)/u);
});

test("keeps workspace editing, Firebase SDK access and glass presentation out of Profile", async () => {
  const profile = await source("profile");

  assert.doesNotMatch(
    profile,
    /updateSettings|updateSetting|saveWorkspaceIdentity|workspaceName\s*,\s*projectName/u,
  );
  assert.doesNotMatch(
    profile,
    /logoutFromGreenCloud|firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable|from ["']firebase/u,
  );
  assert.doesNotMatch(
    profile,
    /GlassCard|SectionBadge|BrandMark|AmbientOrbs|LeafFallOverlay|premium-btn|backdrop-blur/u,
  );
});
