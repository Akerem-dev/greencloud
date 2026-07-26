import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/analytics/page.tsx", import.meta.url),
  analytics: new URL(
    "../../components/analytics/gc2-environmental-analytics.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("activates a dedicated protected environmental analytics route", async () => {
  const [page, analytics] = await Promise.all([
    source("page"),
    source("analytics"),
  ]);

  assert.match(page, /Gc2EnvironmentalAnalytics/u);
  assert.match(page, /<Gc2EnvironmentalAnalytics\s*\/>/u);
  assert.doesNotMatch(page, /redirect\(/u);
  assert.match(analytics, /Gc2ProtectedShell/u);
});

test("derives the fleet snapshot only from current AppState evidence", async () => {
  const analytics = await source("analytics");

  for (const term of [
    "Fleet snapshot",
    "Current moisture distribution",
    "Recorded event composition",
    "Device evidence table",
    "Data confidence",
    "No invented trend line",
  ]) {
    assert.match(analytics, new RegExp(term, "u"));
  }

  assert.match(analytics, /devices,/u);
  assert.match(analytics, /activityFeed,/u);
  assert.match(analytics, /filteredActivity,/u);
  assert.match(analytics, /searchQuery,/u);
  assert.match(analytics, /refreshTelemetry/u);
  assert.match(analytics, /devices\.find\(\(device\) => device\.id === selectedDevice\.id\)/u);
  assert.match(analytics, /telemetryDevices\.reduce/u);
  assert.match(analytics, /device\.moisture <= automation\.moistureThreshold/u);
});

test("renders source-driven comparisons and explicit missing-data behavior", async () => {
  const analytics = await source("analytics");

  assert.match(analytics, /style=\{\{ width: `\$\{clampPercent\(device\.moisture\)\}%` \}\}/u);
  assert.match(analytics, /valuePercent\(device\.moisture, ready\)/u);
  assert.match(analytics, /valuePercent\(device\.signal, ready\)/u);
  assert.match(analytics, /return ready.*["']—["']/su);
  assert.match(analytics, /Historical trends remain unavailable/u);
  assert.match(analytics, /does not claim hourly, daily or weekly history/u);
  assert.match(analytics, /href=\{`\/devices\/\$\{encodeURIComponent\(device\.id\)\}`\}/u);
});

test("does not regress analytics into fabricated charts or direct Firebase access", async () => {
  const analytics = await source("analytics");

  assert.doesNotMatch(
    analytics,
    /GlassCard|SectionBadge|premium-btn|premium-tab|AmbientOrbs|backdrop-blur/u,
  );
  assert.doesNotMatch(
    analytics,
    /realtimeDatabase|firebaseFunctions|firebaseAuth|from ["']firebase/u,
  );
  assert.doesNotMatch(
    analytics,
    /Math\.random|mockData|fakeData|sevenDay|7-day|weeklyTrend|hourlyTrend/u,
  );
});
