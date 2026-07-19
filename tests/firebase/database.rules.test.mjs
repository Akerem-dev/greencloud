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

test("authenticated user cannot read global device data", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    get(ref(database, `${GREENCLOUD_ROOT}/deviceData/device-a`)),
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
