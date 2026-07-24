import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  AUTH_INPUT_LIMITS,
  AuthSessionIntegrityError,
  assertFirebaseAuthSessionOnly,
  normalizeAuthEmail,
  normalizeAuthLoginInput,
  normalizeAuthRegistrationInput,
  validateAuthPassword,
} from "../../lib/auth-session-integrity.mjs";

test("normalizes login email without changing the submitted password", () => {
  assert.deepEqual(
    normalizeAuthLoginInput({
      email: "  operator@example.com  ",
      password: "secret-pass",
    }),
    {
      email: "operator@example.com",
      password: "secret-pass",
    },
  );
});

test("normalizes registration identity through the protected profile contract", () => {
  assert.deepEqual(
    normalizeAuthRegistrationInput({
      email: " user@example.com ",
      password: "secret-pass",
      displayName: "  Cafe\u0301   Operator  ",
    }),
    {
      email: "user@example.com",
      password: "secret-pass",
      displayName: "Café Operator",
    },
  );
});

test("rejects empty, unsafe and oversized registration display names", () => {
  for (const displayName of [
    "   ",
    "Operator\u202Ehidden",
    "X".repeat(61),
  ]) {
    assert.throws(
      () =>
        normalizeAuthRegistrationInput({
          email: "user@example.com",
          password: "secret-pass",
          displayName,
        }),
      (error) =>
        error instanceof AuthSessionIntegrityError &&
        error.code === "invalid-display-name",
    );
  }
});

test("rejects malformed, unsafe and oversized email input", () => {
  assert.throws(
    () => normalizeAuthEmail(undefined),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "invalid-email",
  );
  assert.throws(
    () => normalizeAuthEmail("user\u202E@example.com"),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "unsafe-email",
  );
  assert.throws(
    () => normalizeAuthEmail("a".repeat(AUTH_INPUT_LIMITS.email + 1)),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "email-too-long",
  );
});

test("requires bounded string passwords before Firebase Auth calls", () => {
  assert.equal(validateAuthPassword("123456"), "123456");
  assert.throws(
    () => validateAuthPassword(123456),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "invalid-password",
  );
  assert.throws(
    () => validateAuthPassword("12345"),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "weak-password",
  );
  assert.throws(
    () => validateAuthPassword("x".repeat(AUTH_INPUT_LIMITS.password + 1)),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "password-too-long",
  );
});

test("blocks the legacy local workspace login path", () => {
  assert.throws(
    () => assertFirebaseAuthSessionOnly(),
    (error) =>
      error instanceof AuthSessionIntegrityError &&
      error.code === "firebase-auth-required",
  );
});

test("routes Firebase Auth SDK calls through normalized runtime input", async () => {
  const source = await readFile("lib/firebase-auth.ts", "utf8");

  assert.match(source, /normalizeAuthRegistrationInput\(/u);
  assert.match(source, /normalized\.email/u);
  assert.match(source, /normalized\.password/u);
  assert.match(source, /displayName: normalized\.displayName/u);
  assert.match(source, /normalizeAuthLoginInput\(/u);
  assert.match(source, /normalizeAuthDisplayName\(displayName\)/u);
  assert.match(source, /error instanceof AuthSessionIntegrityError/u);
  assert.doesNotMatch(source, /const cleanDisplayName = displayName\?\.trim/u);
});

test("overrides legacy session methods and mounts a visible global boundary", async () => {
  const [providerSource, layoutSource, boundarySource] = await Promise.all([
    readFile("components/providers/app-state-provider.tsx", "utf8"),
    readFile("app/layout.tsx", "utf8"),
    readFile("components/auth/auth-session-safety-boundary.tsx", "utf8"),
  ]);

  assert.match(providerSource, /assertFirebaseAuthSessionOnly\(\)/u);
  assert.match(providerSource, /logoutFromGreenCloud\(\)/u);
  assert.match(providerSource, /loginToWorkspace,/u);
  assert.match(providerSource, /logoutFromWorkspace,/u);
  assert.match(providerSource, /AUTH_SESSION_BLOCKED_EVENT/u);
  assert.match(layoutSource, /AuthSessionSafetyBoundary/u);
  assert.match(boundarySource, /Authentication change blocked safely/u);
  assert.match(boundarySource, /AUTH_SESSION_BLOCKED_EVENT/u);
});
