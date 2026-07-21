import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const deckSource = readFileSync(
  new URL("../../components/dashboard/live-operations-deck.tsx", import.meta.url),
  "utf8",
);

const layoutSource = readFileSync(
  new URL("../../app/dashboard/layout.tsx", import.meta.url),
  "utf8",
);

test("mounts the live operations deck on the Dashboard route", () => {
  assert.match(layoutSource, /LiveOperationsDeck/);
  assert.match(layoutSource, /<LiveOperationsDeck\s*\/>/);
});

test("shows the visible live operations command surface", () => {
  assert.match(deckSource, /Live operations/);
  assert.match(deckSource, /Soil moisture/);
  assert.match(deckSource, /Protection matrix/);
  assert.match(deckSource, /Safe run/);
  assert.match(deckSource, /Wi-Fi signal/);
});

test("routes operations through the existing protected app actions", () => {
  assert.match(deckSource, /useAppState/);
  assert.match(deckSource, /startIrrigation/);
  assert.match(deckSource, /refreshTelemetry/);
  assert.match(deckSource, /simulateThresholdEvent/);
  assert.doesNotMatch(deckSource, /firebase-greencloud/);
  assert.doesNotMatch(deckSource, /realtimeDatabase/);
});
