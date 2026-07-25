import { test, expect } from "./support/fixtures.mjs";
import {
  findUserByEmail,
  getUserByEmail,
  readGreenCloud,
} from "./support/emulator-harness.mjs";
import {
  E2E_PASSWORD,
  loginUser,
  registerUser,
  signOutUser,
} from "./support/ui-helpers.mjs";

const EMAIL = "auth-lifecycle@example.com";

test("protects private routes and completes register, sign-out and login", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth$/);

  const user = await registerUser(page, {
    displayName: "Auth Lifecycle User",
    email: EMAIL,
  });

  const authRecord = await getUserByEmail(EMAIL);
  expect(authRecord.uid).toBe(user.uid);
  expect(authRecord.displayName).toBe("Auth Lifecycle User");

  const workspace = await readGreenCloud(`users/${user.uid}`);
  expect(workspace?.meta?.ownerUid).toBe(user.uid);
  expect(workspace?.devices ?? null).toBeNull();

  await signOutUser(page);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth$/);

  await loginUser(page, { email: EMAIL, password: E2E_PASSWORD });
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("rejects invalid registration before creating an emulator account", async ({
  page,
}) => {
  const invalidEmail = "invalid-registration@example.com";

  await page.goto("/auth");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.getByLabel("Workspace owner name").fill(" ");
  await page.getByLabel("Email").fill(invalidEmail);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText(/profile name|required/i)).toBeVisible();
  expect(await findUserByEmail(invalidEmail)).toBeNull();

  await page.getByLabel("Workspace owner name").fill("A".repeat(61));
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText(/60|long|maximum/i)).toBeVisible();
  expect(await findUserByEmail(invalidEmail)).toBeNull();
});
