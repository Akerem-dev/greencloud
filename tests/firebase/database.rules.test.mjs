import { after, before, beforeEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, set } from "firebase/database";

const PROJECT_ID = "demo-greencloud";
const GREENCLOUD_ROOT = "greencloud";

let testEnv;

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

  await assertFails(
    get(ref(database, GREENCLOUD_ROOT)),
  );
});

test("unauthenticated user cannot write GreenCloud root", async () => {
  const database = testEnv.unauthenticatedContext().database();

  await assertFails(
    set(ref(database, GREENCLOUD_ROOT), { probe: true }),
  );
});

test("authenticated user cannot read while baseline rules are locked", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    get(ref(database, GREENCLOUD_ROOT)),
  );
});

test("authenticated user cannot write while baseline rules are locked", async () => {
  const database = testEnv.authenticatedContext("user-a").database();

  await assertFails(
    set(ref(database, GREENCLOUD_ROOT), { probe: true }),
  );
});
