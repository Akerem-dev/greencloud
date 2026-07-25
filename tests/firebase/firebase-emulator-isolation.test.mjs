import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  FIREBASE_EMULATOR_DEFAULTS,
  FirebaseRuntimeConfigurationError,
  resolveFirebaseRuntimeConfig,
} from "../../lib/firebase-runtime-config.mjs";

test("requires an explicit Firebase target during development", () => {
  assert.throws(
    () => resolveFirebaseRuntimeConfig({ nodeEnv: "development" }),
    (error) =>
      error instanceof FirebaseRuntimeConfigurationError &&
      error.code === "target-required",
  );
});

test("defaults production builds to the real Firebase target", () => {
  assert.deepEqual(resolveFirebaseRuntimeConfig({ nodeEnv: "production" }), {
    target: "production",
    useEmulators: false,
  });
});

test("allows an explicit production target during development", () => {
  assert.deepEqual(
    resolveFirebaseRuntimeConfig({
      nodeEnv: "development",
      useEmulators: " false ",
    }),
    {
      target: "production",
      useEmulators: false,
    },
  );
});

test("creates an isolated demo runtime with safe emulator defaults", () => {
  const runtime = resolveFirebaseRuntimeConfig({
    nodeEnv: "development",
    useEmulators: "true",
  });

  assert.equal(runtime.target, "emulator");
  assert.equal(runtime.projectId, FIREBASE_EMULATOR_DEFAULTS.projectId);
  assert.equal(runtime.host, FIREBASE_EMULATOR_DEFAULTS.host);
  assert.equal(runtime.authPort, 9099);
  assert.equal(runtime.databasePort, 9000);
  assert.equal(runtime.functionsPort, 5001);
  assert.equal(runtime.authUrl, "http://127.0.0.1:9099");
  assert.equal(
    runtime.databaseUrl,
    "http://127.0.0.1:9000?ns=demo-greencloud-default-rtdb",
  );
});

test("accepts validated custom local emulator endpoints", () => {
  const runtime = resolveFirebaseRuntimeConfig({
    nodeEnv: "development",
    useEmulators: "true",
    projectId: "demo-greencloud-tests",
    host: "localhost",
    authPort: "9199",
    databasePort: 9100,
    functionsPort: "5101",
  });

  assert.equal(runtime.projectId, "demo-greencloud-tests");
  assert.equal(runtime.host, "localhost");
  assert.equal(runtime.authPort, 9199);
  assert.equal(runtime.databasePort, 9100);
  assert.equal(runtime.functionsPort, 5101);
});

test("rejects ambiguous target values and real project IDs in emulator mode", () => {
  assert.throws(
    () =>
      resolveFirebaseRuntimeConfig({
        nodeEnv: "development",
        useEmulators: "yes",
      }),
    (error) =>
      error instanceof FirebaseRuntimeConfigurationError &&
      error.code === "invalid-target",
  );

  assert.throws(
    () =>
      resolveFirebaseRuntimeConfig({
        nodeEnv: "development",
        useEmulators: "true",
        projectId: "greencloud-production",
      }),
    (error) =>
      error instanceof FirebaseRuntimeConfigurationError &&
      error.code === "unsafe-emulator-project",
  );
});

test("rejects protocol paths, control characters and invalid emulator ports", () => {
  for (const host of [
    "http://127.0.0.1",
    "localhost/path",
    "local\u202Ehost",
  ]) {
    assert.throws(
      () =>
        resolveFirebaseRuntimeConfig({
          nodeEnv: "development",
          useEmulators: "true",
          host,
        }),
      (error) =>
        error instanceof FirebaseRuntimeConfigurationError &&
        error.code === "invalid-host",
    );
  }

  for (const authPort of [0, 65536, "abc", "90.99"]) {
    assert.throws(
      () =>
        resolveFirebaseRuntimeConfig({
          nodeEnv: "development",
          useEmulators: "true",
          authPort,
        }),
      (error) =>
        error instanceof FirebaseRuntimeConfigurationError &&
        error.code === "invalid-port",
    );
  }
});

test("wires Auth, Database and Functions through an HMR-safe emulator boundary", async () => {
  const source = await readFile("lib/firebase.ts", "utf8");

  assert.match(source, /resolveFirebaseRuntimeConfig\(/u);
  assert.match(source, /connectAuthEmulator\(/u);
  assert.match(source, /connectDatabaseEmulator\(/u);
  assert.match(source, /connectFunctionsEmulator\(/u);
  assert.match(source, /__greenCloudFirebaseEmulatorConnections/u);
  assert.match(source, /typeof window === "undefined"/u);
  assert.match(source, /demo-api-key/u);
});

test("provides a fail-closed isolated development command and documents the target", async () => {
  const [launcher, packageSource, envExample, readme] = await Promise.all([
    readFile("scripts/start-isolated-dev.mjs", "utf8"),
    readFile("package.json", "utf8"),
    readFile(".env.example", "utf8"),
    readFile("README.md", "utf8"),
  ]);

  assert.match(launcher, /Promise\.allSettled/u);
  assert.match(launcher, /Isolated development was blocked safely/u);
  assert.match(launcher, /NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true"/u);
  assert.match(packageSource, /"dev:isolated"/u);
  assert.match(packageSource, /"emulators:start"/u);
  assert.match(packageSource, /"test:firebase-emulator-isolation"/u);
  assert.match(envExample, /NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false/u);
  assert.match(readme, /npm run dev:isolated/u);
  assert.match(readme, /demo-greencloud/u);
});
