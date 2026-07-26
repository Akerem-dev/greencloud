import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DeviceUnpairFlowError,
  friendlyDeviceUnpairError,
  unpairDeviceWithTrustedCallable,
  validateDeviceUnpairResult,
} from "../../lib/firebase-device-unpair.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const validResult = {
  deviceId: "esp32-balcony-01",
  ownerUid: "user-a",
  pairingCode: "ABC123",
  requestId: "factory-reset-1721500000000",
  unpairedAtMs: 1_721_500_000_000,
  idempotent: false,
  factoryResetQueued: true,
  selectedDeviceId: "esp32-kitchen-02",
};

test("validates trusted unpair ownership and factory-reset response", () => {
  assert.deepEqual(
    validateDeviceUnpairResult(validResult, {
      deviceId: "esp32-balcony-01",
      userId: "user-a",
    }),
    validResult,
  );

  assert.throws(
    () =>
      validateDeviceUnpairResult(
        { ...validResult, ownerUid: "attacker" },
        { deviceId: "esp32-balcony-01", userId: "user-a" },
      ),
    /mismatched ownership data/,
  );

  assert.throws(
    () =>
      validateDeviceUnpairResult(
        { ...validResult, factoryResetQueued: false },
        { deviceId: "esp32-balcony-01", userId: "user-a" },
      ),
    /mismatched ownership data/,
  );
});

test("calls only the trusted unpair callable with the validated device ID", async () => {
  const calls = [];
  const result = await unpairDeviceWithTrustedCallable({
    functions: { name: "test-functions" },
    userId: "user-a",
    deviceId: "esp32-balcony-01",
    callableFactory(functions, callableName) {
      calls.push({ functions, callableName });

      return async (payload) => {
        calls.push(payload);
        return { data: validResult };
      };
    },
  });

  assert.equal(result.deviceId, "esp32-balcony-01");
  assert.deepEqual(calls, [
    {
      functions: { name: "test-functions" },
      callableName: "unpairDevice",
    },
    { deviceId: "esp32-balcony-01" },
  ]);
});

test("maps callable authorization and workspace errors to safe UI messages", () => {
  const denied = friendlyDeviceUnpairError({
    code: "functions/permission-denied",
  });
  const unauthenticated = friendlyDeviceUnpairError({
    code: "functions/unauthenticated",
  });
  const precondition = friendlyDeviceUnpairError({
    code: "functions/failed-precondition",
  });

  assert.ok(denied instanceof DeviceUnpairFlowError);
  assert.match(denied.message, /verified device owner/);
  assert.match(unauthenticated.message, /Sign in/);
  assert.match(precondition.message, /workspace is not ready/);
});

test("rejects invalid client configuration before invoking Firebase", async () => {
  await assert.rejects(
    unpairDeviceWithTrustedCallable({
      functions: null,
      userId: "user-a",
      deviceId: "esp32-balcony-01",
    }),
    /Firebase Functions is required/,
  );

  await assert.rejects(
    unpairDeviceWithTrustedCallable({
      functions: {},
      userId: "",
      deviceId: "esp32-balcony-01",
    }),
    /Sign in before removing/,
  );

  await assert.rejects(
    unpairDeviceWithTrustedCallable({
      functions: {},
      userId: "user-a",
      deviceId: "bad\/device",
    }),
    /Device ID is invalid/,
  );
});

test("connects the GC-09 confirmation to loading-safe trusted removal", () => {
  const boundary = readFileSync(
    path.join(root, "components/devices/device-mutation-boundary.tsx"),
    "utf8",
  );
  const detail = readFileSync(
    path.join(root, "components/devices/gc2-device-detail.tsx"),
    "utf8",
  );
  const dialog = readFileSync(
    path.join(root, "components/ui/gc2-dialog.tsx"),
    "utf8",
  );

  assert.match(boundary, /unpairDeviceWithTrustedCallable/);
  assert.match(boundary, /button\.title === "Remove device"/);
  assert.match(boundary, /label === "Remove device"/);
  assert.match(boundary, /stopMutation\(event\)/);
  assert.match(boundary, /removalInFlight\.current/);
  assert.match(boundary, /button\.disabled = true/);
  assert.match(boundary, /aria-busy/);
  assert.match(boundary, /Removing securely/);
  assert.match(boundary, /Device removed securely/);
  assert.match(boundary, /factory-reset command was queued/);
  assert.match(boundary, /backdrop\.click\(\)/);

  assert.match(detail, /removeDevice\(deleteTarget\.id\)/);
  assert.match(detail, /removed from workspace/);
  assert.match(detail, /title="Copy device ID"/);
  assert.match(detail, /title="Remove device"/);
  assert.match(detail, /closeLabel="Close delete confirmation"/);
  assert.match(dialog, /if \(!open\) return null/);
  assert.doesNotMatch(boundary, /removeDevice\(deleteTarget\.id\)/);
});
