import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, remove, set } from "firebase/database";

const PROJECT_ID = "demo-greencloud";
const GREENCLOUD_ROOT = "greencloud";

let testEnv;

function userPath(userId) {
  return `${GREENCLOUD_ROOT}/users/${userId}`;
}

function deviceOwnerPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceOwners/${deviceId}`;
}

function deviceActorPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceActors/${deviceId}`;
}

function deviceDataPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceData/${deviceId}`;
}

function deviceCommandPath(deviceId) {
  return `${GREENCLOUD_ROOT}/deviceCommands/${deviceId}`;
}

function deviceContext(deviceId, authUid) {
  return testEnv.authenticatedContext(authUid, {
    actorType: "device",
    deviceId,
  });
}

function validTelemetry(
  deviceId = "device-a",
  ownerUid = "user-a",
  overrides = {},
) {
  return {
    deviceId,
    ownerUid,
    lastSeenMs: 1_721_410_000_000,
    moisture: 42,
    rawSoil: 1840,
    soilVoltage: 1.82,
    temperature: 24.5,
    pressure: 1012,
    humidity: 55,
    signal: 82,
    rainDetected: false,
    safeMode: true,
    pumpEnabled: false,
    status: "Online",
    updatedAt: "2026-07-19T17:30:00.000Z",
    ...overrides,
  };
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

function acknowledgedCommand(
  command,
  deviceAuthUid = "device-auth-a",
  overrides = {},
) {
  return {
    ...command,
    irrigate: false,
    handled: true,
    handledAt: "2026-07-19T17:31:00.000Z",
    handledBy: deviceAuthUid,
    status:
      command.safeMode || !command.pumpEnabled
        ? "dry-run"
        : "handled",
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
      deviceActors: {
        "device-a": {
          deviceAuthUid: "device-auth-a",
        },
        "device-b": {
          deviceAuthUid: "device-auth-b",
        },
      },
      deviceData: {
        "device-a": validTelemetry("device-a", "user-a"),
        "device-b": validTelemetry("device-b", "user-b", {
          moisture: 67,
          rawSoil: 1210,
        }),
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
    set(
      ref(database, deviceDataPath("device-a")),
      validTelemetry("device-a", "user-a", { moisture: 99 }),
    ),
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
      acknowledgedCommand(validIrrigationCommand()),
    ),
  );
});

test("device owner cannot impersonate a device command source", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ source: "device" }),
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
  await seedCommand(
    "device-a",
    acknowledgedCommand(validIrrigationCommand()),
  );

  const database = testEnv.authenticatedContext("user-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand({ requestId: "irrigate-test-2" }),
    ),
  );
});

test("authenticated user cannot read canonical device actor records", async () => {
  const database = testEnv.authenticatedContext("user-a").database();
  await assertFails(get(ref(database, deviceActorPath("device-a"))));
});

test("authenticated user cannot replace canonical device actor records", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, deviceActorPath("device-a")), {
      deviceAuthUid: "user-a",
    }),
  );
});

test("verified device actor can write its own telemetry", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceDataPath("device-a")),
      validTelemetry("device-a", "user-a", {
        moisture: 48,
        lastSeenMs: 1_721_410_100_000,
      }),
    ),
  );
});

test("device identity without device claims cannot write telemetry", async () => {
  const database = testEnv
    .authenticatedContext("device-auth-a")
    .database();

  await assertFails(
    set(
      ref(database, deviceDataPath("device-a")),
      validTelemetry("device-a", "user-a"),
    ),
  );
});

test("device actor cannot write another devices telemetry", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceDataPath("device-b")),
      validTelemetry("device-b", "user-b"),
    ),
  );
});

test("device actor cannot assign a different telemetry owner", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceDataPath("device-a")),
      validTelemetry("device-a", "user-b"),
    ),
  );
});

test("device actor cannot write an invalid moisture value", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceDataPath("device-a")),
      validTelemetry("device-a", "user-a", { moisture: 101 }),
    ),
  );
});

test("device actor cannot delete telemetry", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();
  await assertFails(remove(ref(database, deviceDataPath("device-a"))));
});

test("verified device actor can read its own command channel", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();
  await assertSucceeds(get(ref(database, deviceCommandPath("device-a"))));
});

test("device actor cannot read another devices command channel", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();
  await assertFails(get(ref(database, deviceCommandPath("device-b"))));
});

test("device identity without device claims cannot read commands", async () => {
  const database = testEnv
    .authenticatedContext("device-auth-a")
    .database();

  await assertFails(get(ref(database, deviceCommandPath("device-a"))));
});

test("device actor cannot create a new command", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      validIrrigationCommand(),
    ),
  );
});

test("verified device actor can acknowledge its pending command", async () => {
  const pending = validIrrigationCommand({
    safeMode: false,
    pumpEnabled: true,
    status: "pending",
  });
  await seedCommand("device-a", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      acknowledgedCommand(pending),
    ),
  );
});

test("verified device actor can block its pending command", async () => {
  const pending = validIrrigationCommand({
    safeMode: false,
    pumpEnabled: true,
    status: "pending",
  });
  await seedCommand("device-a", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(
      ref(database, deviceCommandPath("device-a")),
      acknowledgedCommand(pending, "device-auth-a", {
        status: "blocked",
      }),
    ),
  );
});

test("another device actor cannot acknowledge a command", async () => {
  const pending = validIrrigationCommand({
    safeMode: false,
    pumpEnabled: true,
    status: "pending",
  });
  await seedCommand("device-a", pending);

  const database = deviceContext("device-b", "device-auth-b").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      acknowledgedCommand(pending, "device-auth-b"),
    ),
  );
});

test("device actor cannot change immutable command fields", async () => {
  const pending = validIrrigationCommand({
    safeMode: false,
    pumpEnabled: true,
    status: "pending",
  });
  await seedCommand("device-a", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      acknowledgedCommand(pending, "device-auth-a", {
        requestId: "tampered-request-id",
      }),
    ),
  );
});

test("device actor cannot lie about acknowledgement identity", async () => {
  const pending = validIrrigationCommand({
    safeMode: false,
    pumpEnabled: true,
    status: "pending",
  });
  await seedCommand("device-a", pending);

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, deviceCommandPath("device-a")),
      acknowledgedCommand(pending, "different-device"),
    ),
  );
});

test("device actor cannot delete a pending command", async () => {
  await seedCommand("device-a", validIrrigationCommand());

  const database = deviceContext("device-a", "device-auth-a").database();
  await assertFails(remove(ref(database, deviceCommandPath("device-a"))));
});
