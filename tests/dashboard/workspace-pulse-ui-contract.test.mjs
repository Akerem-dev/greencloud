import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(
  new URL("../../app/dashboard/layout.tsx", import.meta.url),
  "utf8",
);

const dashboardSource = readFileSync(
  new URL("../../components/dashboard/gc2-dashboard-overview.tsx", import.meta.url),
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

test("projects one state-driven workspace pulse into the overview", () => {
  assert.match(dashboardSource, /useAppState/);
  assert.match(dashboardSource, /Workspace pulse/);
  assert.match(dashboardSource, /Current field state/);
  assert.match(dashboardSource, /Device roster/);
  assert.match(dashboardSource, /Recent operations/);
  assert.match(dashboardSource, /Live system path/);
  assert.match(dashboardSource, /No fabricated plant state/);
});

test("uses the shared protected shell and keeps actions inside AppState", () => {
  assert.match(shellSource, /Gc2AppShell/);
  assert.match(shellSource, /AuthGate/);
  assert.match(shellSource, /href="\/activity"/);
  assert.match(shellSource, /href="\/profile"/);
  assert.match(dashboardSource, /href="\/devices"/);
  assert.match(dashboardSource, /href="\/activity"/);
  assert.doesNotMatch(dashboardSource, /firebaseAuth/);
  assert.doesNotMatch(dashboardSource, /httpsCallable/);
});
