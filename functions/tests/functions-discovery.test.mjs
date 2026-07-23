import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);

test("loads both callable exports within the Firebase discovery budget", () => {
  const startedAt = performance.now();
  const exported = require("../src/index.js");
  const elapsedMs = performance.now() - startedAt;

  assert.equal(typeof exported.finalizePairing, "function");
  assert.equal(typeof exported.unpairDevice, "function");
  assert.ok(
    elapsedMs < 9_000,
    `Functions entrypoint took ${Math.round(elapsedMs)}ms to load.`,
  );
});
