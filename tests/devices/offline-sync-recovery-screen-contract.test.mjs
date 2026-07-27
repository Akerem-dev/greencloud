import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  page: new URL("../../app/devices/[deviceId]/page.tsx", import.meta.url),
  route: new URL(
    "../../components/devices/gc2-device-detail-route.tsx",
    import.meta.url,
  ),
  recovery: new URL(
    "../../components/devices/gc2-offline-sync-recovery.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("routes Offline and Syncing devices to one dedicated recovery surface", async () => {
  const [page, route] = await Promise.all([source("page"), source("route")]);

  assert.match(page, /Gc2DeviceDetailRoute/u);
  assert.match(route, /device\?\.status === "Offline"/u);
  assert.match(route, /device\?\.status === "Syncing"/u);
  assert.match(route, /Gc2OfflineSyncRecovery/u);
  assert.match(route, /Gc2DeviceDetail/u);
  assert.doesNotMatch(page, /Gc2OfflineSyncRecovery/u);
});

test("labels stored telemetry as cached rather than live", async () => {
  const recovery = await source("recovery");

  for (const term of [
    "Cached packet, not live telemetry",
    "Stored moisture",
    "Stored signal",
    "Last accepted value",
    "Not a current link test",
    "No newer trusted evidence",
  ]) {
    assert.match(recovery, new RegExp(term, "u"));
  }

  assert.doesNotMatch(recovery, /Live now|Private device link active/u);
});

test("keeps physical output locked until current evidence returns", async () => {
  const recovery = await source("recovery");

  assert.match(recovery, /Physical output stays locked/u);
  assert.match(recovery, /Manual irrigation/u);
  assert.match(recovery, />Locked</u);
  assert.match(recovery, /Current telemetry and device reachability must return/u);
  assert.doesNotMatch(recovery, /startIrrigation|simulateThresholdEvent/u);
});

test("uses the existing refresh action without fake reconnect or ownership mutation", async () => {
  const recovery = await source("recovery");

  assert.match(recovery, /refreshTelemetry\(device\.id\)/u);
  assert.match(recovery, /Request telemetry refresh/u);
  assert.match(recovery, /no re-pair required/u);
  assert.match(recovery, /does not fabricate a reconnect/u);
  assert.doesNotMatch(
    recovery,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|httpsCallable|pairDeviceByCode|updateDevice|removeDevice/u,
  );
});

test("preserves audit context and avoids legacy glass presentation", async () => {
  const recovery = await source("recovery");

  assert.match(recovery, /Recent stored operations/u);
  assert.match(recovery, /filteredActivity/u);
  assert.match(recovery, /Restore evidence before control/u);
  assert.doesNotMatch(
    recovery,
    /GlassCard|SectionBadge|premium-btn|premium-tab|AmbientOrbs|LeafFallOverlay|backdrop-blur/u,
  );
});
