import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  drawer: new URL(
    "../../components/notifications/gc2-notification-center-drawer.tsx",
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

test("opens one accessible notification drawer from the protected topbar", async () => {
  const shell = await source("shell");

  assert.match(shell, /Gc2NotificationCenterDrawer/u);
  assert.match(shell, /<Gc2NotificationCenterDrawer\s*\/>/u);
  assert.match(shell, /notificationsOpen/u);
  assert.match(shell, /openNotifications/u);
  assert.match(shell, /onClick=\{openNotifications\}/u);
  assert.match(shell, /aria-haspopup="dialog"/u);
  assert.match(shell, /aria-expanded=\{notificationsOpen\}/u);
  assert.match(shell, /Math\.min\(unreadNotifications, 99\)/u);
});

test("renders only stored AppState notification records in the native drawer", async () => {
  const drawer = await source("drawer");

  assert.match(drawer, /Gc2Dialog/u);
  assert.match(drawer, /variant="drawer"/u);
  assert.match(drawer, /open=\{notificationsOpen\}/u);
  assert.match(drawer, /onClose=\{closeNotifications\}/u);
  assert.match(drawer, /notifications\.map\(\(item\)/u);
  assert.match(drawer, /item\.title/u);
  assert.match(drawer, /item\.description/u);
  assert.match(drawer, /item\.body/u);
  assert.match(drawer, /item\.createdAt/u);
  assert.match(drawer, /item\.read/u);
  assert.match(drawer, /The workspace notification ledger is empty/u);
});

test("keeps read-state mutation inside the existing AppState and Firebase adapter boundary", async () => {
  const [drawer, provider] = await Promise.all([
    source("drawer"),
    source("provider"),
  ]);

  assert.match(drawer, /markAllNotificationsRead/u);
  assert.match(drawer, /disabled=\{unreadNotifications === 0\}/u);
  assert.match(provider, /markAllNotificationsReadInFirebase/u);
  assert.match(provider, /notifications: current\.notifications\.map/u);
  assert.match(provider, /read: true/u);
});

test("offers truthful navigation without delete, fabricated records or direct Firebase access", async () => {
  const drawer = await source("drawer");

  assert.match(drawer, /href="\/activity"/u);
  assert.match(drawer, /href="\/settings"/u);
  assert.match(drawer, /This drawer does not clear activity history/u);
  assert.doesNotMatch(
    drawer,
    /deleteNotification|clearNotifications|removeNotification|Math\.random|fakeNotification|sampleNotification/u,
  );
  assert.doesNotMatch(
    drawer,
    /firebaseAuth|realtimeDatabase|firebaseFunctions|firebase-greencloud|httpsCallable/u,
  );
  assert.doesNotMatch(
    drawer,
    /GlassCard|AmbientOrbs|backdrop-blur|shadow-\[0_0_/u,
  );
});
