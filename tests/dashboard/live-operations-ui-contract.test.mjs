import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-overview.tsx", import.meta.url),
  "utf8",
);

const pageSource = readFileSync(
  new URL("../../app/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("mounts one unified operations overview on the Dashboard route", () => {
  assert.match(pageSource, /Gc2DashboardOverview/);
  assert.match(pageSource, /<Gc2DashboardOverview\s*\/>/);
  assert.doesNotMatch(pageSource, /GlassCard/);
  assert.doesNotMatch(pageSource, /AppShell/);
});

test("shows the visible live operations and safety command surface", () => {
  assert.match(dashboardSource, /Current field state/);
  assert.match(dashboardSource, /Soil moisture/);
  assert.match(dashboardSource, /Safety matrix/);
  assert.match(dashboardSource, /Protected irrigation command/);
  assert.match(dashboardSource, /Wi-Fi signal/);
  assert.match(dashboardSource, /Test threshold/);
});

test("routes dashboard operations through the existing protected app actions", () => {
  assert.match(dashboardSource, /useAppState/);
  assert.match(dashboardSource, /startIrrigation/);
  assert.match(dashboardSource, /refreshTelemetry/);
  assert.match(dashboardSource, /simulateThresholdEvent/);
  assert.doesNotMatch(dashboardSource, /firebase-greencloud/);
  assert.doesNotMatch(dashboardSource, /realtimeDatabase/);
  assert.doesNotMatch(dashboardSource, /firebaseFunctions/);
});
