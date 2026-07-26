import { defineConfig, devices } from "@playwright/test";

const E2E_ORIGIN = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 12_000,
  },
  retries: process.env.CI ? 2 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/playwright-results.json" }],
  ],
  use: {
    baseURL: E2E_ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "node scripts/start-isolated-dev.mjs",
    url: `${E2E_ORIGIN}/auth`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
