import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, set } from "firebase/database";

const PROJECT_ID = "demo-greencloud";
const GREENCLOUD_ROOT = "greencloud";

let testEnv;

function userPath(userId) {
  return `${GREENCLOUD_ROOT}/users/${userId}`;
}

function deviceOwnerPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceOwners/${deviceId}`;
}

function deviceDataPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceData/${deviceId}`;
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

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.database();

    await set(ref(database, GREENCLOUD_ROOT), {
      deviceOwners: {
        "device-a": {
          ownerUid: "user-a",
        },
        "device-b": {
          ownerUid: "user-b",
        },
      },
      deviceData: {
        "device-a": {
          deviceId: "device-a",
          ownerUid: "user-a",
          moisture: 42,
        },
        "device-b": {
          deviceId: "device-b",
          ownerUid: "user-b",
          moisture: 67,
        },
      },
    });
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test("unauthenticated user cannot read GreenCloud root", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(get(ref(database, GREENCLOUD_ROOT)));
});

test("unauthenticated user cannot write a user workspace", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(
    set(ref(database, userPath("user-a")), { probe: true }),
  );
});

test("user can read their own workspace", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(get(ref(database, userPath("user-a"))));
});

test("user can write their own workspace", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(ref(database, userPath("user-a")), {
      meta: { ownerUid: "user-a" },
    }),
  );
});

test("user cannot read another user workspace", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, userPath("user-b"))));
});

test("user cannot write another user workspace", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, userPath("user-b")), {
      meta: { ownerUid: "user-a" },
    }),
  );
});

test("authenticated user cannot list all user workspaces", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, `${GREENCLOUD_ROOT}/users`)));
});

test("device owner can read their device telemetry", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(get(ref(database, deviceDataPath("device-a"))));
});

test("user cannot read another owners device telemetry", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, deviceDataPath("device-b"))));
});

test("unauthenticated user cannot read owned device telemetry", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(get(ref(database, deviceDataPath("device-a"))));
});

test("device owner cannot write telemetry from the web client", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, deviceDataPath("device-a")), {
      deviceId: "device-a",
      ownerUid: "user-a",
      moisture: 99,
    }),
  );
});

test("authenticated user cannot list all device telemetry", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, `${GREENCLOUD_ROOT}/deviceData`)));
});

test("authenticated user cannot read canonical ownership records", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, deviceOwnerPath("device-a"))));
});

test("authenticated user cannot replace canonical ownership", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, deviceOwnerPath("device-b")), {
      ownerUid: "user-a",
    }),
  );
});

test("authenticated user cannot write global device commands", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, `${GREENCLOUD_ROOT}/deviceCommands/device-a`), {
      type: "IRRIGATE",
    }),
  );
});
