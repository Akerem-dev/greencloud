import { test, expect } from "./support/fixtures.mjs";
import {
  decidePendingPairing,
  readGreenCloud,
  seedAvailableDevice,
} from "./support/emulator-harness.mjs";
import {
  pairDeviceThroughUi,
  registerUser,
  signOutUser,
} from "./support/ui-helpers.mjs";

const DEVICE_NAME = "User A Private Device";

test("keeps a paired device private when a second user signs in", async ({
  page,
}) => {
  const userA = await registerUser(page, {
    displayName: "Tenant User A",
    email: "tenant-user-a@example.com",
  });

  await seedAvailableDevice({
    code: "TEN123",
    deviceId: "device-tenant-a",
    deviceAuthUid: "device-auth-tenant-a",
  });
  const approval = decidePendingPairing({
    code: "TEN123",
    deviceAuthUid: "device-auth-tenant-a",
    expectedRequesterUid: userA.uid,
  });

  await pairDeviceThroughUi(page, {
    code: "TEN123",
    name: DEVICE_NAME,
    place: "Tenant A Greenhouse",
  });
  await approval;

  expect(
    (await readGreenCloud("deviceOwners/device-tenant-a"))?.ownerUid,
  ).toBe(userA.uid);

  await signOutUser(page);

  const userB = await registerUser(page, {
    displayName: "Tenant User B",
    email: "tenant-user-b@example.com",
  });

  await page.goto("/devices");
  await expect(page.getByText(DEVICE_NAME, { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("OLED code")).toBeVisible();

  expect(
    await readGreenCloud(`users/${userB.uid}/devices/device-tenant-a`),
  ).toBeNull();
  expect(
    (await readGreenCloud("deviceOwners/device-tenant-a"))?.ownerUid,
  ).toBe(userA.uid);
});
