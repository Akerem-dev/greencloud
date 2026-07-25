import { test, expect } from "./support/fixtures.mjs";
import {
  getUserByEmail,
  waitForGreenCloud,
} from "./support/emulator-harness.mjs";
import { registerUser } from "./support/ui-helpers.mjs";

const EMAIL = "workspace-preferences@example.com";

test("persists interface preferences, workspace identity and profile name", async ({
  page,
}) => {
  const user = await registerUser(page, {
    displayName: "Workspace Preferences User",
    email: EMAIL,
  });

  await page.goto("/settings");
  await page.getByRole("button", { name: /Rain glass/i }).click();
  await page.getByRole("button", { name: /All notifications/i }).click();
  await page.getByRole("button", { name: "Calm", exact: true }).click();
  await page.getByRole("button", { name: /Compact mode/i }).click();

  await page.getByLabel("Workspace name").fill("E2E Greenhouse Lab");
  await page.getByLabel("Project name").fill("E2E Irrigation Project");
  await page.getByLabel("Owner name").fill("E2E Operator");
  await page.getByLabel("Main plant label").fill("E2E Main Basil");

  const settings = await waitForGreenCloud(
    `users/${user.uid}/settings`,
    (value) =>
      value?.themePreset === "rain-glass" &&
      value?.notificationMode === "all" &&
      value?.ambienceMode === "calm" &&
      value?.leafAmbience === false &&
      value?.compactMode === true &&
      value?.workspaceName === "E2E Greenhouse Lab" &&
      value?.mainPlantLabel === "E2E Main Basil",
  );

  expect(settings.theme).toBe("rain-glass");
  expect(settings.notifications).toBe("all");
  expect(settings.leafFx).toBe(false);
  expect(settings.plantLabel).toBe("E2E Main Basil");

  await page.reload();
  await expect(page.getByLabel("Workspace name")).toHaveValue(
    "E2E Greenhouse Lab",
  );
  await expect(page.getByLabel("Main plant label")).toHaveValue(
    "E2E Main Basil",
  );

  const rootState = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    compact: document.documentElement.dataset.compact,
    ambience: document.documentElement.dataset.ambience,
  }));
  expect(rootState).toEqual({
    theme: "rain-glass",
    compact: "true",
    ambience: "calm",
  });

  await page.goto("/profile");
  await page.getByLabel("Profile name").fill("E2E Renamed Operator");
  await page.getByLabel("Workspace name").fill("E2E Profile Workspace");
  await page.getByLabel("Project name").fill("E2E Profile Project");
  await page.getByLabel("Main plant label").fill("E2E Profile Plant");
  await page.getByRole("button", { name: "Save profile" }).click();

  await expect(page.getByText(/profile.*saved|updated/i).first()).toBeVisible();
  const authRecord = await getUserByEmail(EMAIL);
  expect(authRecord.displayName).toBe("E2E Renamed Operator");

  await waitForGreenCloud(
    `users/${user.uid}/settings`,
    (value) =>
      value?.workspaceName === "E2E Profile Workspace" &&
      value?.projectName === "E2E Profile Project" &&
      value?.mainPlantLabel === "E2E Profile Plant" &&
      value?.ownerName === "E2E Renamed Operator",
  );
});
