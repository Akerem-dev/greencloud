import { createRequire } from "node:module";
import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, set } from "firebase/database";

const require = createRequire(import.meta.url);
const { unpairDeviceState } = require("../../functions/src/device-unpair");

const PROJECT_ID = "demo-greencloud";
const GREENCLOUD_ROOT = "greencloud";
const NOW = 1_721_500_000_000;

let testEnv;
let trustedState;

function pairedState() {
  return {
    deviceActors: {
      "device-a": { deviceAuthUid: "device-auth-a" },
    },
    deviceOwners: {
      "device-a": {
        ownerUid: "user-a",
        assignedAtMs: NOW - 5_000,
        source: "pairing",
      },
    },
    deviceData: {
      "device-a": {
        deviceId: "device-a",
        ownerUid: "user-a",
        lastSeenMs: NOW - 100,
        moisture: 42,
      },
    },
    pairings: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        deviceAuthUid: "device-auth-a",
        ownerUid: "user-a",
        status: "paired",
        createdAtMs: NOW - 10_000,
        expiresAtMs: NOW + 100_000,
        pairedAtMs: NOW - 5_000,
      },
    },
    pairingClaims: {
      ABC123: {
        code: "ABC123",
        deviceId: "device-a",
        requestedByUid: "user-a",
        status: "finalized",
        createdAtMs: NOW - 9_000,
        expiresAtMs: NOW + 100_000,
        decidedAtMs: NOW - 8_000,
        decidedByUid: "device-auth-a",
        finalizedAtMs: NOW - 5_000,
        finalizedBy: "user-a",
      },
    },
    users: {
      "user-a": {
        devices: {
          "device-a": {
            id: "device-a",
            name: "Balcony Basil",
            place: "South Balcony",
            location: "South Balcony",
            ownerUid: "user-a",
            pairingCode: "ABC123",
          },
        },
        pairings: {
          ABC123: {
            code: "ABC123",
            deviceId: "device-a",
            ownerUid: "user-a",
            status: "paired",
          },
        },
        selectedDeviceId: "device-a",
        meta: { schemaVersion: 9 },
      },
    },
  };
}

function deviceContext() {
  return testEnv.authenticatedContext("device-auth-a", {
    actorType: "device",
    deviceId: "device-a",
  });
}

before(async () => {
  const rules = await readFile(
    new URL("../../database.rules.json", import.meta.url),
    "utf8",
  );

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  trustedState = unpairDeviceState(pairedState(), {
    requesterUid: "user-a",
    deviceId: "device-a",
    nowMs: NOW,
  }).state;

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), GREENCLOUD_ROOT), trustedState);
  });
});

after(async () => {
  if (testEnv) await testEnv.cleanup();
});

test("former owner cannot read the reset command after canonical unpair", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    get(ref(database, `${GREENCLOUD_ROOT}/deviceCommands/device-a`)),
  );
});

test("verified device actor can read the trusted reset command after owner removal", async () => {
  const database = deviceContext().database();

  await assertSucceeds(
    get(ref(database, `${GREENCLOUD_ROOT}/deviceCommands/device-a`)),
  );
});

test("verified device actor can acknowledge the trusted reset command", async () => {
  const database = deviceContext().database();
  const pending = trustedState.deviceCommands["device-a"];

  await assertSucceeds(
    set(ref(database, `${GREENCLOUD_ROOT}/deviceCommands/device-a`), {
      ...pending,
      irrigate: false,
      handled: true,
      handledAt: new Date(NOW + 1_000).toISOString(),
      handledBy: "device-auth-a",
      status: "dry-run",
    }),
  );
});
