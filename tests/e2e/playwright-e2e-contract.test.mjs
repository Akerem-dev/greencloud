import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  package: new URL("../../package.json", import.meta.url),
  config: new URL("../../playwright.config.mjs", import.meta.url),
  harness: new URL("./support/emulator-harness.mjs", import.meta.url),
  fixtures: new URL("./support/fixtures.mjs", import.meta.url),
  helpers: new URL("./support/ui-helpers.mjs", import.meta.url),
  auth: new URL("./auth-lifecycle.spec.mjs", import.meta.url),
  device: new URL("./device-lifecycle.spec.mjs", import.meta.url),
  settings: new URL("./workspace-preferences.spec.mjs", import.meta.url),
  tenant: new URL("./tenant-isolation.spec.mjs", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("runs Playwright only inside the isolated Firebase emulator stack", async () => {
  const packageJson = JSON.parse(await source("package"));
  const command = packageJson.scripts["test:e2e"];

  assert.equal(packageJson.devDependencies["@playwright/test"], "1.61.1");
  assert.match(command, /firebase emulators:exec/u);
  assert.match(command, /--only auth,database,functions/u);
  assert.match(command, /--project demo-greencloud/u);
  assert.match(command, /playwright test/u);
  assert.equal(packageJson.scripts["test:e2e:install"], "playwright install chromium");
});

test("serializes shared-emulator browser tests and captures failure artifacts", async () => {
  const config = await source("config");

  assert.match(config, /workers:\s*1/u);
  assert.match(config, /fullyParallel:\s*false/u);
  assert.match(config, /start-isolated-dev\.mjs/u);
  assert.match(config, /const E2E_ORIGIN = "http:\/\/localhost:3000"/u);
  assert.match(config, /baseURL:\s*E2E_ORIGIN/u);
  assert.match(config, /url:\s*`\$\{E2E_ORIGIN\}\/auth`/u);
  assert.doesNotMatch(config, /http:\/\/127\.0\.0\.1:3000/u);
  assert.match(config, /trace:\s*"retain-on-failure"/u);
  assert.match(config, /screenshot:\s*"only-on-failure"/u);
  assert.match(config, /video:\s*"retain-on-failure"/u);
  assert.match(config, /playwright-report/u);
  assert.match(config, /playwright-results\.json/u);
});

test("cleans Auth and RTDB around every browser scenario", async () => {
  const harness = await source("harness");
  const fixtures = await source("fixtures");

  assert.match(harness, /E2E_PROJECT_ID\s*=\s*"demo-greencloud"/u);
  assert.match(
    harness,
    /E2E_DATABASE_NAMESPACE\s*=\s*`\$\{E2E_PROJECT_ID\}-default-rtdb`/u,
  );
  assert.match(harness, /ns=\$\{E2E_DATABASE_NAMESPACE\}/u);
  assert.match(harness, /\/emulator\/v1\/projects\/\$\{E2E_PROJECT_ID\}\/accounts/u);
  assert.match(harness, /greenCloudRoot\.remove\(\)/u);
  assert.match(fixtures, /resetFirebaseEmulators\(\)/u);
  assert.match(fixtures, /\{ auto: true \}/u);
  assert.doesNotMatch(harness, /https:\/\/[^\s"']*firebaseio\.com/u);
  assert.doesNotMatch(harness, /https:\/\/[^\s"']*googleapis\.com/u);
});

test("models device pairing, telemetry, commands and trusted unpair", async () => {
  const harness = await source("harness");
  const device = await source("device");

  assert.match(harness, /seedAvailableDevice/u);
  assert.match(harness, /decidePendingPairing/u);
  assert.match(harness, /seedDeviceTelemetry/u);
  assert.match(harness, /acknowledgeDeviceCommand/u);
  assert.match(device, /pairDeviceThroughUi\(page,\s*DEVICE\)/u);
  assert.match(device, /deviceOwners/u);
  assert.match(device, /IRRIGATE/u);
  assert.match(device, /Device removed securely/u);
  assert.match(device, /FACTORY_RESET/u);
});

test("covers auth, settings persistence and cross-account isolation", async () => {
  const auth = await source("auth");
  const settings = await source("settings");
  const tenant = await source("tenant");
  const helpers = await source("helpers");

  assert.match(auth, /register, sign-out and login/u);
  assert.match(auth, /rejects invalid registration/u);
  assert.match(settings, /rain-glass/u);
  assert.match(settings, /notificationMode/u);
  assert.match(settings, /displayName/u);
  assert.match(tenant, /second user signs in/u);
  assert.match(tenant, /deviceOwners/u);
  assert.match(helpers, /waitForGreenCloud/u);
});
