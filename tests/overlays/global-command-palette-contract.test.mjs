import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  palette: new URL(
    "../../components/search/gc2-global-command-palette.tsx",
    import.meta.url,
  ),
  shell: new URL(
    "../../components/layout/gc2-protected-shell.tsx",
    import.meta.url,
  ),
  provider: new URL(
    "../../components/providers/app-state-provider-base.tsx",
    import.meta.url,
  ),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("mounts one accessible global palette in the protected topbar", async () => {
  const [palette, shell] = await Promise.all([
    source("palette"),
    source("shell"),
  ]);

  assert.match(shell, /Gc2GlobalCommandPalette/u);
  assert.match(shell, /<Gc2GlobalCommandPalette\s*\/>/u);
  assert.match(palette, /aria-label="Open global search and command palette"/u);
  assert.match(palette, /aria-haspopup="dialog"/u);
  assert.match(palette, /aria-expanded=\{quickPanelOpen\}/u);
  assert.match(palette, /onClick=\{openQuickPanel\}/u);
  assert.match(palette, /Gc2Dialog/u);
  assert.match(palette, /open=\{quickPanelOpen\}/u);
  assert.match(palette, /onClose=\{closeQuickPanel\}/u);
});

test("opens and closes through the existing quick-panel state and keyboard shortcut", async () => {
  const [palette, provider] = await Promise.all([
    source("palette"),
    source("provider"),
  ]);

  assert.match(palette, /event\.metaKey \|\| event\.ctrlKey/u);
  assert.match(palette, /event\.key\.toLowerCase\(\) === "k"/u);
  assert.match(palette, /event\.preventDefault\(\)/u);
  assert.match(palette, /toggleQuickPanel\(\)/u);
  assert.match(palette, /window\.addEventListener\("keydown", handleShortcut\)/u);
  assert.match(provider, /quickPanelOpen: boolean/u);
  assert.match(provider, /openQuickPanel: \(\) => void/u);
  assert.match(provider, /closeQuickPanel: \(\) => void/u);
  assert.match(provider, /toggleQuickPanel: \(\) => void/u);
});

test("derives route, trusted-device and stored-activity results without fabricated records", async () => {
  const palette = await source("palette");

  for (const route of [
    "/dashboard",
    "/devices",
    "/automation",
    "/activity",
    "/analytics",
    "/settings",
    "/profile",
  ]) {
    assert.match(palette, new RegExp(route.replace("/", "\\/"), "u"));
  }

  assert.match(palette, /devices/u);
  assert.match(palette, /device\.id !== "device-waiting"/u);
  assert.match(palette, /encodeURIComponent\(device\.id\)/u);
  assert.match(palette, /device\.name/u);
  assert.match(palette, /device\.place/u);
  assert.match(palette, /device\.status/u);
  assert.match(palette, /activityFeed\.slice\(0, 20\)/u);
  assert.match(palette, /item\.title/u);
  assert.match(palette, /item\.description/u);
  assert.match(palette, /item\.status/u);
  assert.match(palette, /No route, trusted device or stored activity record matches this query/u);
  assert.doesNotMatch(
    palette,
    /Math\.random|fakeCommand|sampleDevice|sampleActivity|mockResult/u,
  );
});

test("executes only navigation, device selection and read-only activity search", async () => {
  const palette = await source("palette");

  assert.match(palette, /selectDevice\(item\.deviceId\)/u);
  assert.match(palette, /updateSearchQuery\(item\.activityQuery\)/u);
  assert.match(palette, /updateSearchQuery\(safeQuery\)/u);
  assert.match(palette, /router\.push\(item\.href\)/u);
  assert.match(palette, /router\.push\("\/activity"\)/u);
  assert.match(palette, /event\.target\.value\.slice\(0, 120\)/u);
  assert.match(palette, /Navigation and read-only search/u);
  assert.match(palette, /Hardware commands are not available in this palette/u);

  assert.doesNotMatch(
    palette,
    /startIrrigation|simulateThresholdEvent|updateDevice|removeDevice|pairDeviceByCode|createDevicePairingCode|updateAutomation|resetAutomation|markAllNotificationsRead/u,
  );
  assert.doesNotMatch(
    palette,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|firebase-greencloud|httpsCallable/u,
  );
  assert.doesNotMatch(
    palette,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
