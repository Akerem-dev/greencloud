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

function deviceCommandPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceCommands/${deviceId}`;
}

function validIrrigationCommand(overrides = {}) {
  return {
    type: "IRRIGATE",
    irrigate: true,
    durationSeconds: 8,
    requestId: "irrigate-test-1",
    createdAt: "2026-07-19T17:20:00.000Z",
    source: "web",
    safeMode: true,
    pumpEnabled: false,
    handled: false,
    status: "dry-run",
    ...overrides,
  };
}

function validFactoryResetCommand(overrides = {}) {
  return {
    type: "FACTORY_RESET",
    factoryReset: true,
    irrigate: false,
    durationSeconds: 1,
    requestId: "factory-reset-test-1",
    createdAt: "2026-07-19T17:20:00.000Z",
    source: "web",
    safeMode: true,
    pumpEnabled: false,
    handled: false,
    status: "dry-run",
    ...overrides,
  };
}

async function seedCommand(deviceId, command) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.database();
    await set(ref(database, deviceCommandPath(deviceId)), command);
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

test("device owner can read their command channel", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(get(ref(database, deviceCommandPath("device-a"))));
});

test("user cannot read another owners command channel", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(get(ref(database, deviceCommandPath("device-b"))));
});

test("unauthenticated user cannot read a device command channel", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(get(ref(database, deviceCommandPath("device-a"))));
});

test("device owner can create a valid irrigation command", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand(),
    ),
  );
});

test("device owner can create a valid factory reset command", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      validFactoryResetCommand(),
    ),
  );
});

test("user cannot create a command for another owners device", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-b")),
      validIrrigationCommand(),
    ),
  );
});

test("device owner cannot create a command with invalid duration", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ durationSeconds: 61 }),
    ),
  );
});

test("device owner cannot impersonate a handled command", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ handled: true, status: "handled" }),
    ),
  );
});

test("device owner cannot impersonate an ESP32 command source", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ source: "esp32" }),
    ),
  );
});

test("device owner cannot add unknown command fields", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ ownerUid: "user-a" }),
    ),
  );
});

test("device owner cannot overwrite a pending command", async () => {
  await seedCommand("device-a", validIrrigationCommand());

  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ requestId: "irrigate-test-2" }),
    ),
  );
});

test("device owner can create a new command after the prior command is handled", async () => {
  await seedCommand("device-a", {
    ...validIrrigationCommand(),
    irrigate: false,
    handled: true,
    handledAt: "2026-07-19T17:21:00.000Z",
    handledBy: "esp32",
    status: "handled",
  });

  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ requestId: "irrigate-test-2" }),
    ),
  );
});
