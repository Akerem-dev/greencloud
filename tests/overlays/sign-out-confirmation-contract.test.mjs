import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  shell: new URL(
    "../../components/layout/gc2-protected-shell.tsx",
    import.meta.url,
  ),
  confirmation: new URL(
    "../../components/auth/gc2-sign-out-confirmation.tsx",
    import.meta.url,
  ),
  profile: new URL(
    "../../components/profile/gc2-account-profile.tsx",
    import.meta.url,
  ),
  provider: new URL(
    "../../components/providers/app-state-provider.tsx",
    import.meta.url,
  ),
  auth: new URL("../../lib/firebase-auth.ts", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one protected sign-out overlay and intercepts the existing profile action", async () => {
  const [shell, confirmation, profile] = await Promise.all([
    source("shell"),
    source("confirmation"),
    source("profile"),
  ]);

  assert.match(shell, /Gc2SignOutConfirmation/u);
  assert.match(shell, /<Gc2SignOutConfirmation\s*\/>/u);
  assert.match(profile, />\s*Sign out\s*</u);
  assert.match(confirmation, /buttonLabel\(button\) !== "Sign out"/u);
  assert.match(confirmation, /document\.addEventListener\("click", handleSignOutCapture, true\)/u);
  assert.match(confirmation, /event\.preventDefault\(\)/u);
  assert.match(confirmation, /event\.stopPropagation\(\)/u);
  assert.match(confirmation, /event\.stopImmediatePropagation\(\)/u);
});

test("shows the real account and preserved workspace scope before confirmation", async () => {
  const confirmation = await source("confirmation");

  for (const term of [
    "Authenticated operator",
    "Account email",
    "Workspace",
    "Paired device scope",
    "Session action only",
    "Sign out of GreenCloud?",
  ]) {
    assert.match(confirmation, new RegExp(term, "u"));
  }

  assert.match(confirmation, /session\.userName/u);
  assert.match(confirmation, /session\.email/u);
  assert.match(confirmation, /settings\.workspaceName/u);
  assert.match(confirmation, /devices\.length/u);
  assert.match(confirmation, /does not unpair ESP32/u);
  assert.match(confirmation, /erase telemetry/u);
  assert.match(confirmation, /clear Activity history/u);
  assert.match(confirmation, /reset workspace settings/u);
});

test("requires explicit confirmation and blocks close or duplicate submit while pending", async () => {
  const confirmation = await source("confirmation");

  assert.match(confirmation, /function confirmSignOut\(\)/u);
  assert.match(
    confirmation,
    /function confirmSignOut\(\) \{[\s\S]*if \(pending \|\| sessionEnded\) return;[\s\S]*setPhase\("pending"\);[\s\S]*logoutFromWorkspace\(\)/u,
  );
  assert.match(
    confirmation,
    /function closeModal\(\) \{[\s\S]*if \(pending\) return;[\s\S]*setOpen\(false\)/u,
  );
  assert.match(confirmation, /disabled=\{pending\}/u);
  assert.match(confirmation, /Ending Firebase session\.\.\./u);
  assert.match(confirmation, /Confirm sign out/u);

  const captureFunction = confirmation.match(
    /const handleSignOutCapture = \(event: MouseEvent\) => \{(?<body>[\s\S]*?)\n    \};/u,
  );
  assert.ok(captureFunction?.groups?.body);
  assert.doesNotMatch(captureFunction.groups.body, /logoutFromWorkspace/u);
});

test("reports success only after subscribed Firebase session state ends", async () => {
  const [confirmation, provider, auth] = await Promise.all([
    source("confirmation"),
    source("provider"),
    source("auth"),
  ]);

  assert.match(
    confirmation,
    /const sessionEnded = phase === "pending" && !session\.signedIn/u,
  );
  assert.match(confirmation, /Sign-out verified by session state/u);
  assert.match(confirmation, /subscribed Firebase Auth state/u);
  assert.match(provider, /logoutFromGreenCloud\(\)/u);
  assert.match(auth, /await signOut\(firebaseAuth\)/u);
  assert.doesNotMatch(
    confirmation,
    /setPhase\("success"\)|setPhase\("complete"\)|setTimeout|fake|simulated success/u,
  );
});

test("keeps a failed sign-out visible through the existing blocked-session event", async () => {
  const [confirmation, provider] = await Promise.all([
    source("confirmation"),
    source("provider"),
  ]);

  assert.match(confirmation, /AUTH_SESSION_BLOCKED_EVENT/u);
  assert.match(confirmation, /setPhase\("failed"\)/u);
  assert.match(confirmation, /role="alert"/u);
  assert.match(provider, /emitBlockedAuthSession\(authSessionErrorMessage\(error\)\)/u);
  assert.match(provider, /logoutFromGreenCloud\(\)\.catch/u);
});

test("keeps the overlay inside AppState without workspace or Firebase mutation imports", async () => {
  const confirmation = await source("confirmation");

  assert.match(confirmation, /useAppState/u);
  assert.match(confirmation, /logoutFromWorkspace/u);
  assert.doesNotMatch(
    confirmation,
    /logoutFromGreenCloud|firebaseAuth|firebaseFunctions|realtimeDatabase|httpsCallable|from ["']firebase/u,
  );
  assert.doesNotMatch(
    confirmation,
    /removeDevice|updateDevice|startIrrigation|resetAutomation|updateSettings|clearActivity/u,
  );
  assert.doesNotMatch(
    confirmation,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
