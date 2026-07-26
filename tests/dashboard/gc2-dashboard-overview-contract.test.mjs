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
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts the GC-06 overview through the protected GreenCloud shell", async () => {
  const [page, dashboard, shell] = await Promise.all([
    source("page"),
    source("dashboard"),
    source("shell"),
  ]);

  assert.match(page, /Gc2DashboardOverview/u);
  assert.match(dashboard, /Gc2ProtectedShell/u);
  assert.match(shell, /Gc2AppShell/u);
  assert.match(shell, /AuthGate/u);
  assert.match(shell, /Overview.*\/dashboard/su);
  assert.match(shell, /Devices.*\/devices/su);
  assert.match(shell, /Automation.*\/automation/su);
  assert.match(shell, /Activity.*\/activity/su);
});

test("keeps empty workspaces honest and routes users to pairing", async () => {
  const dashboard = await source("dashboard");

  assert.match(dashboard, /Empty workspace/u);
  assert.match(dashboard, /Pair the first ESP32 before monitoring begins/u);
  assert.match(dashboard, /rather than inventing telemetry/u);
  assert.match(dashboard, /href="\/devices\/add"/u);
  assert.match(dashboard, /No fabricated plant state/u);
  assert.match(dashboard, /Moisture, signal and watering controls remain unavailable/u);
});

test("derives telemetry and safety state from real device fields", async () => {
  const dashboard = await source("dashboard");

  for (const field of [
    "lastSeenMs",
    "safeMode",
    "pumpEnabled",
    "relayState",
    "pumpState",
    "rainStatus",
    "waterLevelStatus",
    "lastCommandStatus",
  ]) {
    assert.match(dashboard, new RegExp(field, "u"));
  }

  assert.match(dashboard, /percentLabel\(selectedDevice\.moisture, telemetryReady\)/u);
  assert.match(dashboard, /Waiting for sensor packet/u);
  assert.match(dashboard, /["']\u2014["']/u);
  assert.match(dashboard, /protectedOutput/u);
  assert.match(dashboard, /Irrigation decision boundary/u);
});

test("uses existing protected operations instead of bypassing application safety", async () => {
  const dashboard = await source("dashboard");

  assert.match(dashboard, /startIrrigation\(selectedDevice\.id\)/u);
  assert.match(dashboard, /refreshTelemetry\(selectedDevice\.id\)/u);
  assert.match(dashboard, /simulateThresholdEvent\(selectedDevice\.id\)/u);
  assert.match(dashboard, /Every command still passes through the existing protected AppState action/u);
  assert.doesNotMatch(dashboard, /writeIrrigationCommandToFirebase/u);
  assert.doesNotMatch(dashboard, /Math\.random/u);
});

test("represents the live system and operations as topology, table and ledger", async () => {
  const dashboard = await source("dashboard");

  assert.match(dashboard, /<svg/u);
  assert.match(dashboard, /dashboard-topology-title/u);
  assert.match(dashboard, /Soil sensor/u);
  assert.match(dashboard, /ESP32/u);
  assert.match(dashboard, /Firebase sync/u);
  assert.match(dashboard, /Relay/u);
  assert.match(dashboard, /Gc2Table/u);
  assert.match(dashboard, /Gc2LedgerRow/u);
  assert.match(dashboard, /Recent operations/u);
});

test("does not regress to generic glass dashboard presentation", async () => {
  const dashboard = await source("dashboard");

  for (const forbidden of [
    "GlassCard",
    "AmbientOrbs",
    "LeafFallOverlay",
    "backdrop-blur",
    "shadow-[0_0_",
    "grid-cols-4 gap-4 KPI",
  ]) {
    assert.doesNotMatch(
      dashboard,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"),
    );
  }
});
