import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sourceUrl = new URL(
  "../../lib/firebase-connection-state.ts",
  import.meta.url,
);

test("uses narrowed emulator details and the initialized app for production", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /if \(firebaseRuntimeConfig\.useEmulators\)/u);
  assert.ok(
    source.includes(
      "`${firebaseRuntimeConfig.host}:${firebaseRuntimeConfig.databasePort}`",
    ),
  );
  assert.match(source, /firebaseApp\.options\.projectId/u);
  assert.doesNotMatch(
    source,
    /runtimeTarget:\s*firebaseRuntimeConfig\.projectId/u,
  );
});

test("keeps reconnect behavior inside the existing Firebase connection adapter", async () => {
  const source = await readFile(sourceUrl, "utf8");

  assert.match(source, /goOnline\(realtimeDatabase\)/u);
  assert.match(source, /ref\(realtimeDatabase, "\.info\/connected"\)/u);
  assert.match(source, /browser-offline/u);
  assert.match(source, /firebase-unavailable/u);
  assert.match(source, /emulator-unavailable/u);
});
