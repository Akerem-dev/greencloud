import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  package: new URL("../../package.json", import.meta.url),
  runner: new URL("../../scripts/run-final-ui-quality-gate.mjs", import.meta.url),
  checklist: new URL("../../docs/greencloud-final-ui-verification.md", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

const screenScripts = [
  "test:design-system",
  "test:public-landing",
  "test:auth-screens",
  "test:setup-screens",
  "test:dashboard-screen",
  "test:empty-workspace",
  "test:device-screens",
  "test:pairing-awaiting",
  "test:pairing-failure",
  "test:offline-sync",
  "test:hardware-lockout",
  "test:activity-screen",
  "test:automation-screen",
  "test:analytics-screen",
  "test:settings-screen",
  "test:profile-screen",
  "test:recovery-screen",
];

const overlayScripts = [
  "test:notification-drawer",
  "test:command-palette",
  "test:rename-device",
  "test:irrigation-confirmation",
  "test:irrigation-status",
  "test:trusted-unpair",
  "test:automation-rule-editor",
  "test:delete-automation",
  "test:unsaved-changes",
  "test:sign-out-confirmation",
];

test("exposes one serialized final UI regression command", async () => {
  const packageJson = JSON.parse(await source("package"));

  assert.equal(
    packageJson.scripts["test:final-ui-contract"],
    "node --test tests/design/final-ui-quality-gate-contract.test.mjs",
  );
  assert.equal(
    packageJson.scripts["test:final-ui"],
    "node scripts/run-final-ui-quality-gate.mjs",
  );
});

test("runs every primary screen and supporting overlay contract", async () => {
  const runner = await source("runner");

  for (const script of [...screenScripts, ...overlayScripts]) {
    assert.match(runner, new RegExp(`\\["[^"]+", "${script}"\\]`, "u"));
  }

  assert.match(runner, /test:auth-session/u);
  assert.match(runner, /test:workspace-profile/u);
  assert.match(runner, /test:settings-preferences/u);
  assert.match(runner, /test:final-ui-contract/u);
  assert.match(runner, /spawnSync/u);
  assert.match(runner, /process\.exit/u);
  assert.match(runner, /stopped immediately/u);
});

test("keeps the final gate serialized, local, portable and fail-closed", async () => {
  const runner = await source("runner");

  assert.match(runner, /for \(const \[label, script\] of checkpoints\)/u);
  assert.match(runner, /const npmExecPath = process\.env\.npm_execpath/u);
  assert.match(runner, /spawnSync\(process\.execPath, \[npmExecPath, "run", script\]/u);
  assert.match(runner, /result\.status !== 0/u);
  assert.match(runner, /Manual visual review is still required/u);
  assert.doesNotMatch(runner, /npm\.cmd/u);
  assert.doesNotMatch(
    runner,
    /git\s+(?:merge|push)|firebase\s+deploy|vercel\s+deploy|gh\s+pr\s+merge/u,
  );
});

test("documents a manual matrix for exactly 20 screens and 10 overlays", async () => {
  const checklist = await source("checklist");
  const primarySection = checklist.match(
    /## Primary screens — 20 \/ 20(?<body>[\s\S]*?)## Supporting overlays/u,
  );
  const overlaySection = checklist.match(
    /## Supporting overlays — 10 \/ 10(?<body>[\s\S]*?)## Cross-surface review/u,
  );

  assert.ok(primarySection?.groups?.body);
  assert.ok(overlaySection?.groups?.body);

  const primaryRows = primarySection.groups.body.match(/^\| \d{2} \|/gmu) ?? [];
  const overlayRows = overlaySection.groups.body.match(/^\| \d{2} \|/gmu) ?? [];

  assert.equal(primaryRows.length, 20);
  assert.equal(overlayRows.length, 10);

  for (const viewport of ["1920×1080", "1440×900", "1280×720"]) {
    assert.match(checklist, new RegExp(viewport, "u"));
  }
});

test("does not confuse automated success with review or deployment approval", async () => {
  const checklist = await source("checklist");

  assert.match(checklist, /Every checkbox above is reviewed on the same commit SHA/u);
  assert.match(checklist, /working tree is clean/u);
  assert.match(checklist, /does not authorize merge or deployment/u);
});
