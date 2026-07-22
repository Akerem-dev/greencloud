import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layoutSource = fs.readFileSync("app/activity/layout.tsx", "utf8");
const deckSource = fs.readFileSync(
  "components/activity/operations-timeline-deck.tsx",
  "utf8",
);

test("mounts the operations timeline deck on the Activity route", () => {
  assert.match(layoutSource, /OperationsTimelineDeck/);
  assert.match(layoutSource, /<OperationsTimelineDeck\s*\/>/);
});

test("shows a visible state-driven activity operations rail", () => {
  assert.match(deckSource, /Live event rail/);
  assert.match(deckSource, /Operations timeline/);
  assert.match(deckSource, /Commands/);
  assert.match(deckSource, /Attention/);
  assert.match(deckSource, /Unread/);
  assert.match(deckSource, /selectedDeviceEvents\.map/);
});

test("keeps activity operations inside the existing app state boundary", () => {
  assert.match(deckSource, /useAppState/);
  assert.match(deckSource, /activityFeed/);
  assert.match(deckSource, /refreshTelemetry/);
  assert.match(deckSource, /disabled=\{!hasRealDevice\}/);
  assert.doesNotMatch(deckSource, /from ["']firebase/);
  assert.doesNotMatch(deckSource, /realtimeDatabase|firebaseFunctions|firebaseAuth/);
});
