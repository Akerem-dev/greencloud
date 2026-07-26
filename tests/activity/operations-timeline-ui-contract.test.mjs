import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync("app/activity/page.tsx", "utf8");
const layoutSource = readFileSync("app/activity/layout.tsx", "utf8");
const activitySource = readFileSync(
  "components/activity/gc2-activity-log.tsx",
  "utf8",
);
const appStateAdapterSource = readFileSync(
  "components/providers/app-state-provider.tsx",
  "utf8",
);

test("mounts one protected GC-10 operations log on the Activity route", () => {
  assert.match(pageSource, /Gc2ActivityLog/);
  assert.match(pageSource, /<Gc2ActivityLog\s*\/>/);
  assert.match(activitySource, /Gc2ProtectedShell/);
  assert.match(layoutSource, /return children/);
  assert.doesNotMatch(layoutSource, /OperationsTimelineDeck|createPortal/);
});

test("shows a filterable auditable workspace ledger", () => {
  for (const term of [
    "Audit and operations",
    "Operations ledger",
    "Search records",
    "Device scope",
    "Recorded events",
    "Commands",
    "Attention",
    "Workspace alerts",
    "Audit boundaries",
    "No fabricated history",
  ]) {
    assert.match(activitySource, new RegExp(term, "u"));
  }

  assert.match(activitySource, /Gc2Table/);
  assert.match(activitySource, /FILTERS\.map/);
  assert.match(activitySource, /deviceFilter/);
  assert.match(activitySource, /localQuery/);
  assert.match(activitySource, /visibleItems\.map/);
  assert.match(activitySource, /encodeURIComponent\(device\.id\)/);
});

test("keeps operations inside the existing AppState boundary", () => {
  for (const action of [
    "activityFeed",
    "filteredActivity",
    "notifications",
    "markAllNotificationsRead",
    "clearActivity",
    "simulateThresholdEvent",
  ]) {
    assert.match(activitySource, new RegExp(action, "u"));
  }

  assert.match(activitySource, /disabled=\{!hasRealDevice\}/);
  assert.match(
    activitySource,
    /GreenCloud does not fabricate\s+placeholder history/su,
  );
  assert.doesNotMatch(
    activitySource,
    /realtimeDatabase|firebaseFunctions|firebaseAuth|writeIrrigationCommandToFirebase|Math\.random/u,
  );
});

test("uses deliberate GreenCloud surfaces instead of the legacy glass timeline", () => {
  assert.match(activitySource, /Gc2SectionHeading/);
  assert.match(activitySource, /Gc2Surface/);
  assert.match(activitySource, /Gc2Status/);
  assert.match(activitySource, /Gc2Dialog/);
  assert.doesNotMatch(
    activitySource,
    /GlassCard|SectionBadge|premium-btn|premium-tab|backdrop-blur|fixed bottom-/u,
  );
});

test("normalizes legacy activity copy to the six-character pairing contract", () => {
  assert.match(
    appStateAdapterSource,
    /replaceAll\("7-character", "six-character"\)/,
  );
  assert.match(
    appStateAdapterSource,
    /activityFeed: base\.activityFeed\.map\(normalizeActivityPairingCopy\)/,
  );
  assert.match(
    appStateAdapterSource,
    /filteredActivity: base\.filteredActivity\.map\(normalizeActivityPairingCopy\)/,
  );
  assert.match(
    appStateAdapterSource,
    /notifications: base\.notifications\.map\(normalizeNotificationPairingCopy\)/,
  );
});
