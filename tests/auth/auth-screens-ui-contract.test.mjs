import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  screen: new URL("../../components/auth/gc2-auth-screen.tsx", import.meta.url),
  login: new URL("../../app/login/page.tsx", import.meta.url),
  register: new URL("../../app/register/page.tsx", import.meta.url),
  legacy: new URL("../../app/auth/page.tsx", import.meta.url),
  recover: new URL("../../app/recover/page.tsx", import.meta.url),
  setup: new URL("../../app/setup/workspace/page.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("builds dedicated login and registration routes from one deliberate auth surface", async () => {
  const [screen, login, register] = await Promise.all([
    source("screen"),
    source("login"),
    source("register"),
  ]);

  assert.match(screen, /Gc2AuthShell/u);
  assert.match(screen, /Gc2Surface/u);
  assert.match(screen, /Gc2Input/u);
  assert.match(screen, /Gc2Button/u);
  assert.match(screen, /mode === "register"/u);
  assert.match(login, /Gc2AuthScreen mode="login"/u);
  assert.match(register, /Gc2AuthScreen mode="register"/u);
});

test("preserves Firebase authentication and strict input handling", async () => {
  const screen = await source("screen");

  assert.match(screen, /loginWithEmailPassword/u);
  assert.match(screen, /registerWithEmailPassword/u);
  assert.match(screen, /getAuthErrorMessage/u);
  assert.match(screen, /subscribeToAuthState/u);
  assert.match(screen, /autoComplete="email"/u);
  assert.match(screen, /autoComplete=\{isRegister \? "new-password" : "current-password"\}/u);
  assert.match(screen, /maxLength=\{60\}/u);
  assert.match(screen, /minLength=\{6\}/u);
  assert.match(screen, /Firebase does not store a second local password|GreenCloud does not store a second local password/u);
});

test("covers session, validation, password visibility and route hand-off states", async () => {
  const screen = await source("screen");

  assert.match(screen, /Checking the existing Firebase session/u);
  assert.match(screen, /Authentication could not continue/u);
  assert.match(screen, /showPassword/u);
  assert.match(screen, /aria-pressed=\{showPassword\}/u);
  assert.match(screen, /successRoute: "\/dashboard"/u);
  assert.match(screen, /successRoute: "\/setup\/workspace"/u);
  assert.match(screen, /href="\/recover"/u);
  assert.match(screen, /href=\{screen\.alternateHref\}/u);
});

test("removes the previous combined glass auth presentation", async () => {
  const screen = await source("screen");

  for (const forbidden of [
    "AuthCard",
    "AmbientOrbs",
    "LeafFallOverlay",
    "GlassCard",
    "SectionBadge",
    "backdrop-blur",
    "shadow-[0_0_",
  ]) {
    assert.doesNotMatch(
      screen,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"),
    );
  }
});

test("keeps staged compatibility routes explicit and non-cyclic", async () => {
  const [legacy, recover, setup] = await Promise.all([
    source("legacy"),
    source("recover"),
    source("setup"),
  ]);

  assert.match(legacy, /redirect\("\/login"\)/u);
  assert.match(recover, /redirect\("\/login"\)/u);
  assert.match(setup, /redirect\("\/dashboard"\)/u);
});
