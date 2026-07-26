import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/dashboard/page.tsx", import.meta.url),
  dashboard: new URL(
    "../../components/dashboard/gc2-dashboard-overview.tsx",
    import.meta.url,
  ),
  shell: new URL("../../components/layout/gc2-protected-shell.tsx", import.meta.url),
  analytics: new URL("../../app/analytics/page.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one protected GreenCloud overview on the dashboard route", async () => {
  const [page, dashboard, shell] = await Promise.all([
    source("page"),
    source("dashboard"),
    source("shell"),
  ]);

  assert.match(page, /Gc2DashboardOverview/u);
  assert.match(dashboard, /Gc2ProtectedShell/u);
  assert.match(shell, /Gc2AppShell/u);
  assert.match(shell, /AuthGate/u);
  assert.doesNotMatch(page, /GlassCard|AmbientOrbs|LeafFallOverlay/u);
});

test("shows real field, safety, device and audit state without fabricated telemetry", async () => {
  const dashboard = await source("dashboard");

  for (const term of [
    "Current field state",
    "Safety matrix",
    "Device roster",
    "Recent operations",
    "Live system path",
    "No fabricated plant state",
    "Pair the first ESP32 before monitoring begins",
  ]) {
    assert.match(dashboard, new RegExp(term, "u"));
  }

  assert.match(dashboard, /telemetryReady/u);
  assert.match(dashboard, /hasTelemetry/u);
  assert.match(dashboard, /selectedDevice/u);
  assert.doesNotMatch(dashboard, /Math\.random|chartPattern|recharts|fakeTelemetry/u);
});

test("routes operational controls through existing protected application actions", async () => {
  const dashboard = await source("dashboard");

  for (const action of [
    "startIrrigation",
    "refreshTelemetry",
    "simulateThresholdEvent",
    "selectDevice",
  ]) {
    assert.match(dashboard, new RegExp(action, "u"));
  }

  assert.doesNotMatch(
    dashboard,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable/u,
  );
});

test("keeps analytics navigation active after the dedicated analytics screen ships", async () => {
  const analytics = await source("analytics");

  assert.match(analytics, /Gc2EnvironmentalAnalytics/u);
  assert.match(analytics, /<Gc2EnvironmentalAnalytics\s*\/>/u);
  assert.doesNotMatch(analytics, /redirect\(/u);
});
