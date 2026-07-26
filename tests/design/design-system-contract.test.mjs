import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  css: new URL("../../app/greencloud-design-system.css", import.meta.url),
  layout: new URL("../../app/layout.tsx", import.meta.url),
  eslint: new URL("../../eslint.config.mjs", import.meta.url),
  buttons: new URL("../../components/ui/gc2-button.tsx", import.meta.url),
  fields: new URL("../../components/ui/gc2-field.tsx", import.meta.url),
  surfaces: new URL("../../components/ui/gc2-surface.tsx", import.meta.url),
  status: new URL("../../components/ui/gc2-status.tsx", import.meta.url),
  table: new URL("../../components/ui/gc2-table.tsx", import.meta.url),
  dialog: new URL("../../components/ui/gc2-dialog.tsx", import.meta.url),
  shells: new URL("../../components/layout/gc2-shells.tsx", import.meta.url),
  navigation: new URL(
    "../../lib/ui/greencloud-navigation.ts",
    import.meta.url,
  ),
  documentation: new URL("../../docs/product/DESIGN_SYSTEM.md", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("defines the warm field-notebook token foundation", async () => {
  const css = await source("css");
  const layout = await source("layout");

  assert.match(css, /--gc2-canvas:\s*#f4f1e8/u);
  assert.match(css, /--gc2-forest:\s*#143523/u);
  assert.match(css, /--gc2-moss:\s*#4f773f/u);
  assert.match(css, /--gc2-warning:\s*#9a5e2f/u);
  assert.match(css, /--gc2-danger:\s*#9b3f35/u);
  assert.match(css, /--gc2-radius-md:\s*8px/u);
  assert.match(css, /--gc2-radius-lg:\s*12px/u);
  assert.match(css, /--gc2-font-data/u);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/u);
  assert.match(css, /prefers-reduced-motion:\s*reduce/u);
  assert.match(css, /\[data-motion="off"\]/u);

  assert.match(layout, /import "\.\/greencloud-design-system\.css"/u);
  assert.match(layout, /data-design-system="greencloud-2"/u);
});

test("provides consistent action, form, surface and feedback primitives", async () => {
  const buttons = await source("buttons");
  const fields = await source("fields");
  const surfaces = await source("surfaces");
  const status = await source("status");
  const table = await source("table");

  assert.match(buttons, /export function Gc2Button/u);
  assert.match(buttons, /export function Gc2LinkButton/u);
  assert.match(buttons, /primary.*secondary.*quiet.*danger/su);
  assert.match(buttons, /type = "button"/u);

  assert.match(fields, /htmlFor=\{id\}/u);
  assert.match(fields, /aria-invalid=\{Boolean\(error\)\}/u);
  assert.match(fields, /aria-describedby/u);
  assert.match(fields, /role="alert"/u);

  assert.match(surfaces, /export function Gc2Surface/u);
  assert.match(surfaces, /export function Gc2SectionHeading/u);
  assert.match(surfaces, /export function Gc2Metric/u);

  assert.match(status, /export function Gc2Status/u);
  assert.match(status, /export function Gc2Notice/u);
  assert.match(status, /success.*warning.*danger.*info/su);

  assert.match(table, /<table/u);
  assert.match(table, /<caption className="sr-only">/u);
  assert.match(table, /export function Gc2LedgerRow/u);
});

test("provides public, authentication and protected application shells", async () => {
  const shells = await source("shells");
  const navigation = await source("navigation");

  assert.match(shells, /export function Gc2PublicShell/u);
  assert.match(shells, /export function Gc2AuthShell/u);
  assert.match(shells, /export function Gc2AppShell/u);
  assert.match(shells, /aria-label="Public navigation"/u);
  assert.match(shells, /Primary application navigation/u);
  assert.match(shells, /Account and settings navigation/u);
  assert.match(shells, /aria-current=\{active \? "page"/u);

  for (const route of [
    "/dashboard",
    "/devices",
    "/automation",
    "/activity",
    "/analytics",
    "/settings",
    "/profile",
  ]) {
    assert.match(navigation, new RegExp(route.replace("/", "\\/"), "u"));
  }
});

test("uses native modal behavior and records anti-vibe constraints", async () => {
  const dialog = await source("dialog");
  const documentation = await source("documentation");

  assert.match(dialog, /<dialog/u);
  assert.match(dialog, /showModal\(\)/u);
  assert.match(dialog, /addEventListener\("cancel"/u);
  assert.match(dialog, /aria-labelledby/u);
  assert.match(dialog, /aria-describedby/u);
  assert.match(dialog, /variant === "drawer"/u);

  assert.match(documentation, /Anti-AI \/ anti-vibe-code constraints/u);
  assert.match(documentation, /Uniform grids of interchangeable cards are forbidden/u);
  assert.match(documentation, /decorative charts without source data/u);
  assert.match(documentation, /hidden primary actions below oversized hero regions/u);
});

test("keeps generated browser-test reports outside lint scope", async () => {
  const eslint = await source("eslint");

  assert.match(eslint, /"playwright-report\/\*\*"/u);
  assert.match(eslint, /"test-results\/\*\*"/u);
  assert.match(eslint, /"blob-report\/\*\*"/u);
});
