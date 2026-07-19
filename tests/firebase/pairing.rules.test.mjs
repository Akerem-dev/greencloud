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

function pairingPath(pairingCode) {
  return `${GREENCLOUD_ROOT}/pairings/${pairingCode}`;
}

function deviceContext(deviceId, authUid) {
  return testEnv.authenticatedContext(authUid, {
    actorType: "device",
    deviceId,
  });
}

function validPairing(
  pairingCode = "ABC123",
  deviceId = "device-a",
  deviceAuthUid = "device-auth-a",
  overrides = {},
) {
  const createdAtMs = Date.now() - 1_000;

  return {
    code: pairingCode,
    deviceId,
    deviceAuthUid,
    status: "available",
    createdAtMs,
    expiresAtMs: createdAtMs + 10 * 60 * 1_000,
    ...overrides,
  };
}

async function seedPairing(pairingCode, pairing) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const database = context.database();
    await set(ref(database, pairingPath(pairingCode)), pairing);
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

    await set(ref(database, `${GREENCLOUD_ROOT}/deviceActors`), {
      "device-a": {
        deviceAuthUid: "device-auth-a",
      },
      "device-b": {
        deviceAuthUid: "device-auth-b",
      },
    });
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

test("unauthenticated user cannot read a known pairing code", async () => {
  await seedPairing("ABC123", validPairing());

  const database = testEnv.unauthenticatedContext().database();
  await assertFails(get(ref(database, pairingPath("ABC123"))));
});

test("authenticated user can read a known unexpired pairing code", async () => {
  await seedPairing("ABC123", validPairing());

  const database = testEnv.authenticatedContext("user-a").database();
  await assertSucceeds(get(ref(database, pairingPath("ABC123"))));
});

test("authenticated user cannot read an expired pairing code", async () => {
  await seedPairing(
    "ABC123",
    validPairing("ABC123", "device-a", "device-auth-a", {
      createdAtMs: Date.now() - 20 * 60 * 1_000,
      expiresAtMs: Date.now() - 10 * 60 * 1_000,
    }),
  );

  const database = testEnv.authenticatedContext("user-a").database();
  await assertFails(get(ref(database, pairingPath("ABC123"))));
});

test("authenticated user cannot list all pairing codes", async () => {
  await seedPairing("ABC123", validPairing());

  const database = testEnv.authenticatedContext("user-a").database();
  await assertFails(get(ref(database, `${GREENCLOUD_ROOT}/pairings`)));
});

test("verified device actor can create its own pairing code", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertSucceeds(
    set(ref(database, pairingPath("ABC123")), validPairing()),
  );
});

test("unauthenticated user cannot create a pairing code", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(
    set(ref(database, pairingPath("ABC123")), validPairing()),
  );
});

test("regular web user cannot create a pairing code", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, pairingPath("ABC123")), validPairing()),
  );
});

test("device identity without device claims cannot create a pairing code", async () => {
  const database = testEnv
    .authenticatedContext("device-auth-a")
    .database();

  await assertFails(
    set(ref(database, pairingPath("ABC123")), validPairing()),
  );
});

test("device actor cannot create a pairing code for another device", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-b", "device-auth-a"),
    ),
  );
});

test("device actor cannot publish a mismatched pairing code value", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("DEF456"),
    ),
  );
});

test("device actor cannot publish an invalid pairing code format", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("abc123")),
      validPairing("abc123"),
    ),
  );
});

test("device actor cannot preassign an owner to a pairing code", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-a", "device-auth-a", {
        ownerUid: "user-a",
      }),
    ),
  );
});

test("device actor cannot create a pairing code already marked paired", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-a", "device-auth-a", {
        status: "paired",
      }),
    ),
  );
});

test("device actor cannot create an expired pairing code", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-a", "device-auth-a", {
        createdAtMs: Date.now() - 20 * 60 * 1_000,
        expiresAtMs: Date.now() - 10 * 60 * 1_000,
      }),
    ),
  );
});

test("device actor cannot add unknown pairing fields", async () => {
  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-a", "device-auth-a", {
        debug: true,
      }),
    ),
  );
});

test("device actor cannot overwrite or delete an existing pairing code", async () => {
  await seedPairing("ABC123", validPairing());

  const database = deviceContext("device-a", "device-auth-a").database();

  await assertFails(
    set(
      ref(database, pairingPath("ABC123")),
      validPairing("ABC123", "device-a", "device-auth-a", {
        expiresAtMs: Date.now() + 5 * 60 * 1_000,
      }),
    ),
  );

  await assertFails(remove(ref(database, pairingPath("ABC123"))));
});
