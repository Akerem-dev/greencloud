import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(
  new URL("../../app/dashboard/layout.tsx", import.meta.url),
  "utf8",
);

const routeSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-route.tsx", import.meta.url),
  "utf8",
);

const dashboardSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-overview.tsx", import.meta.url),
  "utf8",
);

const emptySource = readFileSync(
  new URL("../../components/dashboard/gc2-empty-workspace.tsx", import.meta.url),
  "utf8",
);

const shellSource = readFileSync(
  new URL("../../components/layout/gc2-protected-shell.tsx", import.meta.url),
  "utf8",
);

test("keeps the Dashboard layout free of injected portals and duplicate decks", () => {
  assert.match(layoutSource, /return children/);
  assert.doesNotMatch(layoutSource, /WorkspacePulsePortal/);
  assert.doesNotMatch(layoutSource, /LiveOperationsDeck/);
  assert.doesNotMatch(layoutSource, /createPortal/);
});

test("projects state-driven workspace context into both dashboard states", () => {
  assert.match(routeSource, /useAppState/);
  assert.match(routeSource, /settings/);
  assert.match(routeSource, /unreadNotifications/);
  assert.match(routeSource, /Gc2DashboardOverview/);
  assert.match(routeSource, /Gc2EmptyWorkspace/);

  assert.match(dashboardSource, /Workspace pulse/);
  assert.match(dashboardSource, /Current field state/);
  assert.match(dashboardSource, /Device roster/);
  assert.match(dashboardSource, /Recent operations/);
  assert.match(dashboardSource, /Live system path/);

  assert.match(emptySource, /Workspace record/);
  assert.match(emptySource, /Identity exists before telemetry/);
  assert.match(emptySource, /Real workspace notification count/);
  assert.match(emptySource, /No device packet has been accepted yet/);
});

test("uses the shared protected shell and keeps actions inside AppState", () => {
  assert.match(shellSource, /Gc2AppShell/);
  assert.match(shellSource, /AuthGate/);
  assert.match(shellSource, /href="\/activity"/);
  assert.match(shellSource, /href="\/profile"/);
  assert.match(dashboardSource, /href="\/devices"/);
  assert.match(dashboardSource, /href="\/activity"/);
  assert.match(emptySource, /href="\/devices\/add"/);
  assert.match(emptySource, /href="\/settings"/);
  assert.doesNotMatch(
    `${dashboardSource}\n${emptySource}`,
    /firebaseAuth|httpsCallable|realtimeDatabase|firebaseFunctions/,
  );
});
