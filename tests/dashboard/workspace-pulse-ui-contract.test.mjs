import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(
  new URL("../../app/dashboard/layout.tsx", import.meta.url),
  "utf8",
);

const pulseSource = readFileSync(
  new URL(
    "../../components/dashboard/workspace-pulse-portal.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("mounts the workspace pulse beside dashboard live operations", () => {
  assert.match(layoutSource, /WorkspacePulsePortal/);
  assert.match(layoutSource, /<WorkspacePulsePortal\s*\/>/);
  assert.match(layoutSource, /<LiveOperationsDeck\s*\/>/);
});

test("projects a state-driven workspace pulse into the dashboard", () => {
  assert.match(pulseSource, /useAppState/);
  assert.match(pulseSource, /createPortal/);
  assert.match(pulseSource, /\.dashboard-page/);
  assert.match(pulseSource, /Workspace pulse/);
  assert.match(pulseSource, /Soil moisture/);
  assert.match(pulseSource, /Connectivity/);
  assert.match(pulseSource, /Protection/);
});

test("keeps workspace pulse actions inside the existing app state boundary", () => {
  assert.match(pulseSource, /refreshTelemetry/);
  assert.match(pulseSource, /href="\/devices"/);
  assert.match(pulseSource, /href="\/activity"/);
  assert.doesNotMatch(pulseSource, /realtimeDatabase/);
  assert.doesNotMatch(pulseSource, /firebaseAuth/);
  assert.doesNotMatch(pulseSource, /firebaseFunctions/);
  assert.doesNotMatch(pulseSource, /httpsCallable/);
});
