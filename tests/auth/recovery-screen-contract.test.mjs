import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/recover/page.tsx", import.meta.url),
  recovery: new URL(
    "../../components/auth/gc2-recovery-screen.tsx",
    import.meta.url,
  ),
  auth: new URL("../../lib/firebase-auth.ts", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("activates one dedicated GreenCloud recovery route", async () => {
  const [page, recovery] = await Promise.all([
    source("page"),
    source("recovery"),
  ]);

  assert.match(page, /Gc2RecoveryScreen/u);
  assert.match(page, /<Gc2RecoveryScreen\s*\/>/u);
  assert.doesNotMatch(page, /redirect\(/u);
  assert.match(recovery, /Gc2AuthShell/u);
});

test("requests a normalized Firebase reset link through one adapter", async () => {
  const [recovery, auth] = await Promise.all([
    source("recovery"),
    source("auth"),
  ]);

  assert.match(recovery, /requestPasswordReset\(email\)/u);
  assert.match(auth, /sendPasswordResetEmail/u);
  assert.match(auth, /normalizeAuthEmail\(email\)/u);
  assert.match(auth, /code !== "auth\/user-not-found"/u);
  assert.match(auth, /return \{ email: normalizedEmail \}/u);
});

test("keeps account discovery private and avoids fake recovery claims", async () => {
  const recovery = await source("recovery");

  for (const term of [
    "Account recovery",
    "Request a reset link",
    "The response never confirms whether an account exists",
    "If an eligible GreenCloud account exists",
    "Paired ESP32 devices and private workspace data remain untouched",
  ]) {
    assert.match(recovery, new RegExp(term, "u"));
  }

  assert.match(
    recovery,
    /label="Account email"[\s\S]*?maxLength=\{254\}/u,
  );
  assert.doesNotMatch(recovery, /label="Password"|new-password|current-password/u);
  assert.doesNotMatch(recovery, /account exists for|No account was found/u);
});

test("keeps Firebase SDK access and legacy glass presentation out of the screen", async () => {
  const recovery = await source("recovery");

  assert.doesNotMatch(
    recovery,
    /firebaseAuth|sendPasswordResetEmail|from ["']firebase|realtimeDatabase|firebaseFunctions/u,
  );
  assert.doesNotMatch(
    recovery,
    /GlassCard|SectionBadge|BrandMark|AmbientOrbs|LeafFallOverlay|premium-btn|backdrop-blur/u,
  );
});
