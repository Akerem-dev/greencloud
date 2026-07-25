import { test, expect } from "./support/fixtures.mjs";
import {
  acknowledgeDeviceCommand,
  decidePendingPairing,
  readGreenCloud,
  seedAvailableDevice,
  seedDeviceTelemetry,
  waitForGreenCloud,
} from "./support/emulator-harness.mjs";
import {
  pairDeviceThroughUi,
  registerUser,
} from "./support/ui-helpers.mjs";

const DEVICE = {
  code: "ABC123",
  deviceId: "device-e2e-a",
  deviceAuthUid: "device-auth-e2e-a",
  name: "E2E Balcony Basil",
  place: "E2E South Balcony",
};

test("pairs, monitors, renames, commands and securely unpairs an ESP32", async ({
  page,
}) => {
  const user = await registerUser(page, {
    displayName: "Device Lifecycle User",
    email: "device-lifecycle@example.com",
  });

  await seedAvailableDevice(DEVICE);
  const approval = decidePendingPairing({
    code: DEVICE.code,
    deviceAuthUid: DEVICE.deviceAuthUid,
    expectedRequesterUid: user.uid,
  });

  await pairDeviceThroughUi(page, DEVICE);
  await approval;

  const canonicalOwner = await waitForGreenCloud(
    `deviceOwners/${DEVICE.deviceId}`,
    (value) => value?.ownerUid === user.uid,
  );
  expect(canonicalOwner.ownerUid).toBe(user.uid);

  const projection = await readGreenCloud(
    `users/${user.uid}/devices/${DEVICE.deviceId}`,
  );
  expect(projection?.name).toBe(DEVICE.name);
  expect(projection?.place).toBe(DEVICE.place);

  await seedDeviceTelemetry({
    deviceId: DEVICE.deviceId,
    ownerUid: user.uid,
  });

  await expect(page.getByText("67%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("92%", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("E2E telemetry", { exact: true })).toBeVisible();

  await page.getByTitle("Edit device").click();
  await page.getByLabel("Device name").fill("E2E Renamed Mint");
  await page.getByLabel("Plant zone").fill("E2E Kitchen Window");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(
    page.getByRole("heading", { name: "E2E Renamed Mint", exact: true }),
  ).toBeVisible();

  const renamedProjection = await waitForGreenCloud(
    `users/${user.uid}/devices/${DEVICE.deviceId}`,
    (value) =>
      value?.name === "E2E Renamed Mint" &&
      value?.place === "E2E Kitchen Window",
  );
  expect(renamedProjection.location).toBe("E2E Kitchen Window");

  await page.getByRole("button", { name: "Send command", exact: true }).click();
  const irrigationCommand = await waitForGreenCloud(
    `deviceCommands/${DEVICE.deviceId}`,
    (value) => value?.type === "IRRIGATE" && value?.handled === false,
  );

  expect(irrigationCommand.source).toBe("web");
  expect(irrigationCommand.safeMode).toBe(false);
  expect(irrigationCommand.pumpEnabled).toBe(true);
  expect(irrigationCommand.durationSeconds).toBeGreaterThan(0);

  await acknowledgeDeviceCommand({
    deviceId: DEVICE.deviceId,
    deviceAuthUid: DEVICE.deviceAuthUid,
  });
  await expect(page.getByText("Completed", { exact: true }).first()).toBeVisible();

  await page.getByTitle("Remove device").click();
  await expect(
    page.getByRole("heading", { name: "Disconnect this device?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove device", exact: true })
    .last()
    .click();

  await expect(page.getByRole("alert")).toContainText(
    "Device removed securely",
  );
  await expect(
    page.getByRole("heading", { name: "E2E Renamed Mint", exact: true }),
  ).toHaveCount(0);

  await waitForGreenCloud(
    `users/${user.uid}/devices/${DEVICE.deviceId}`,
    (value) => value === null,
  );
  await waitForGreenCloud(
    `deviceOwners/${DEVICE.deviceId}`,
    (value) => value === null,
  );

  const resetCommand = await waitForGreenCloud(
    `deviceCommands/${DEVICE.deviceId}`,
    (value) => value?.type === "FACTORY_RESET",
  );
  expect(resetCommand.factoryReset).toBe(true);
  expect(resetCommand.status).toBe("pending");
});
