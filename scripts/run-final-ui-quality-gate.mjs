import { spawnSync } from "node:child_process";

const checkpoints = [
  ["Design system", "test:design-system"],
  ["Public landing", "test:public-landing"],
  ["Authentication screens", "test:auth-screens"],
  ["Setup screens", "test:setup-screens"],
  ["Dashboard", "test:dashboard-screen"],
  ["Empty workspace", "test:empty-workspace"],
  ["Device screens", "test:device-screens"],
  ["Pairing awaiting", "test:pairing-awaiting"],
  ["Pairing failure", "test:pairing-failure"],
  ["Offline and syncing recovery", "test:offline-sync"],
  ["Hardware safety lockout", "test:hardware-lockout"],
  ["Activity", "test:activity-screen"],
  ["Automation", "test:automation-screen"],
  ["Analytics", "test:analytics-screen"],
  ["Settings", "test:settings-screen"],
  ["Profile", "test:profile-screen"],
  ["Recovery", "test:recovery-screen"],
  ["Auth session integrity", "test:auth-session"],
  ["Workspace profile validation", "test:workspace-profile"],
  ["Settings preference validation", "test:settings-preferences"],
  ["Notification Center Drawer", "test:notification-drawer"],
  ["Global Search / Command Palette", "test:command-palette"],
  ["Rename-device modal", "test:rename-device"],
  ["Manual-irrigation confirmation", "test:irrigation-confirmation"],
  ["Irrigation progress / result panel", "test:irrigation-status"],
  ["Trusted-unpair confirmation", "test:trusted-unpair"],
  ["Automation-rule editor", "test:automation-rule-editor"],
  ["Delete-automation confirmation", "test:delete-automation"],
  ["Unsaved-changes warning", "test:unsaved-changes"],
  ["Sign-out confirmation", "test:sign-out-confirmation"],
  ["Final UI quality-gate contract", "test:final-ui-contract"],
];

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const startedAt = Date.now();

console.log("\n=== GREENCLOUD FINAL UI QUALITY GATE ===");
console.log(`Running ${checkpoints.length} serialized checkpoints.`);
console.log("This command does not merge, deploy or mutate production data.\n");

for (const [label, script] of checkpoints) {
  console.log(`\n=== ${label.toUpperCase()} ===`);
  console.log(`npm run ${script}`);

  const result = spawnSync(npmCommand, ["run", script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`\nFAILED: ${label} could not start.`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nFAILED: ${label} exited with code ${result.status ?? "unknown"}.`);
    console.error("The final gate stopped immediately; later checkpoints were not run.");
    process.exit(result.status ?? 1);
  }
}

const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

console.log("\n=== FINAL UI QUALITY GATE PASSED ===");
console.log(`All ${checkpoints.length} checkpoints passed in ${durationSeconds}s.`);
console.log("Automated verification is complete. Manual visual review is still required.");
