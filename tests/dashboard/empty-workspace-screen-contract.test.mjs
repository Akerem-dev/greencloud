import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/dashboard/page.tsx", import.meta.url),
  route: new URL(
    "../../components/dashboard/gc2-dashboard-route.tsx",
    import.meta.url,
  ),
  empty: new URL(
    "../../components/dashboard/gc2-empty-workspace.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("routes dashboard boot, empty and live-device states explicitly", async () => {
  const [page, route] = await Promise.all([
    source("page"),
    source("route"),
  ]);

  assert.match(page, /Gc2DashboardRoute/u);
  assert.match(page, /<Gc2DashboardRoute\s*\/>/u);
  assert.match(route, /Gc2DashboardOverview/u);
  assert.match(route, /Gc2EmptyWorkspace/u);
  assert.match(route, /isBootLoading \|\| hasRealDevice/u);
  assert.match(route, /selectedDevice\.id !== "device-waiting"/u);
});

test("builds a complete first-device readiness screen without fake telemetry", async () => {
  const empty = await source("empty");

  for (const term of [
    "First-device readiness",
    "Pair before the workspace starts telling a plant story",
    "Power the ESP32 controller",
    "Read the six-character code",
    "Submit the protected claim",
    "Wait for trusted approval",
    "No device packet has been accepted yet",
    "Nothing is broken",
  ]) {
    assert.match(empty, new RegExp(term, "u"));
  }

  assert.match(empty, /href="\/devices\/add"/u);
  assert.match(empty, /href="\/settings"/u);
  assert.doesNotMatch(
    empty,
    /Math\.random|fakeTelemetry|demoMoisture|sampleSignal|recharts/u,
  );
  assert.doesNotMatch(empty, /\b\d+%\b|\b\d+°C\b/u);
});

test("keeps protected ownership, telemetry and irrigation boundaries visible", async () => {
  const empty = await source("empty");

  for (const term of [
    "Owner session",
    "Workspace identity",
    "Canonical device owner",
    "Live telemetry",
    "Irrigation command",
    "Output locked safely",
    "Pump and relay commands remain unavailable",
  ]) {
    assert.match(empty, new RegExp(term, "u"));
  }

  assert.match(empty, /Gc2ProtectedShell/u);
  assert.doesNotMatch(
    empty,
    /startIrrigation|refreshTelemetry|simulateThresholdEvent|firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable/u,
  );
});

test("avoids legacy glass empty-state presentation", async () => {
  const empty = await source("empty");

  assert.doesNotMatch(
    empty,
    /GlassCard|SectionBadge|BrandMark|AmbientOrbs|LeafFallOverlay|premium-btn|backdrop-blur|shadow-\[0_0_/u,
  );
});
