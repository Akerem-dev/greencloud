import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-overview.tsx", import.meta.url),
  "utf8",
);

const emptySource = readFileSync(
  new URL("../../components/dashboard/gc2-empty-workspace.tsx", import.meta.url),
  "utf8",
);

const routeSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-route.tsx", import.meta.url),
  "utf8",
);

const pageSource = readFileSync(
  new URL("../../app/dashboard/page.tsx", import.meta.url),
  "utf8",
);

test("mounts live operations behind the dashboard state boundary", () => {
  assert.match(pageSource, /Gc2DashboardRoute/);
  assert.match(pageSource, /<Gc2DashboardRoute\s*\/>/);
  assert.match(routeSource, /Gc2DashboardOverview/);
  assert.match(routeSource, /Gc2EmptyWorkspace/);
  assert.match(routeSource, /isBootLoading \|\| hasRealDevice/);
  assert.doesNotMatch(pageSource, /GlassCard/);
  assert.doesNotMatch(pageSource, /AppShell/);
});

test("shows live operations only on the real-device dashboard", () => {
  assert.match(dashboardSource, /Current field state/);
  assert.match(dashboardSource, /Soil moisture/);
  assert.match(dashboardSource, /Safety matrix/);
  assert.match(dashboardSource, /Protected irrigation command/);
  assert.match(dashboardSource, /Wi-Fi signal/);
  assert.match(dashboardSource, /Test threshold/);

  assert.match(emptySource, /First-device readiness/);
  assert.match(emptySource, /Pump and relay commands remain unavailable/);
  assert.doesNotMatch(
    emptySource,
    /startIrrigation|refreshTelemetry|simulateThresholdEvent/,
  );
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
