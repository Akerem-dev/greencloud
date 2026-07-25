import { test as base, expect } from "@playwright/test";
import { resetFirebaseEmulators } from "./emulator-harness.mjs";

export const test = base.extend({
  emulatorState: [
    async ({ context }, use) => {
      await resetFirebaseEmulators();
      await context.clearCookies();
      await use({ projectId: "demo-greencloud" });
      await resetFirebaseEmulators();
    },
    { auto: true },
  ],
});

export { expect };
