import { expect } from "@playwright/test";
import { getUserByEmail, waitForGreenCloud } from "./emulator-harness.mjs";

export const E2E_PASSWORD = "Test123456!";

export async function registerUser(
  page,
  {
    displayName = "E2E GreenCloud User",
    email = "greencloud-e2e@example.com",
    password = E2E_PASSWORD,
  } = {},
) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.getByLabel("Workspace owner name", { exact: true }).fill(displayName);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  const user = await getUserByEmail(email);
  await waitForGreenCloud(`users/${user.uid}/meta`, (value) => Boolean(value));
  return user;
}

export async function loginUser(
  page,
  {
    email = "greencloud-e2e@example.com",
    password = E2E_PASSWORD,
  } = {},
) {
  await page.goto("/auth");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function signOutUser(page) {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/auth$/);
}

export async function pairDeviceThroughUi(
  page,
  {
    code = "ABC123",
    name = "E2E Balcony Basil",
    place = "E2E South Balcony",
  } = {},
) {
  await page.goto("/devices");
  await expect(
    page.getByRole("heading", { name: "Pair, rename, monitor.", exact: true }),
  ).toBeVisible();

  const addDeviceButton = page.getByRole("button", {
    name: "Add ESP32",
    exact: true,
  });
  const inlineHeading = page.getByRole("heading", {
    name: "Connect ESP32.",
    exact: true,
  });

  await expect(addDeviceButton.or(inlineHeading).first()).toBeVisible();

  let pairingHeading;

  if (await addDeviceButton.isVisible()) {
    await addDeviceButton.click();
    pairingHeading = page.getByRole("heading", {
      name: "Add another ESP32.",
      exact: true,
    });
  } else {
    pairingHeading = inlineHeading;
  }

  await pairingHeading.evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await expect(pairingHeading).toBeVisible();

  const pairingForm = pairingHeading.locator("xpath=..");
  const codeInput = pairingForm.getByLabel("OLED code", { exact: true });
  const nameInput = pairingForm.getByLabel("Device name", { exact: true });
  const placeInput = pairingForm.getByLabel("Plant zone", { exact: true });

  await expect(codeInput).toBeVisible();
  await codeInput.fill(code);
  await nameInput.fill(name);
  await placeInput.fill(place);

  await pairingForm
    .getByRole("button", { name: "Pair device", exact: true })
    .click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({
    timeout: 30_000,
  });
}
