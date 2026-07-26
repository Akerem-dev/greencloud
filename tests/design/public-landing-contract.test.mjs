import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const landingUrl = new URL(
  "../../components/marketing/landing-page.tsx",
  import.meta.url,
);
const loginUrl = new URL("../../app/login/page.tsx", import.meta.url);
const registerUrl = new URL("../../app/register/page.tsx", import.meta.url);

async function source(url) {
  return readFile(url, "utf8");
}

test("uses the shared public shell and deliberate product navigation", async () => {
  const landing = await source(landingUrl);

  assert.match(landing, /Gc2PublicShell/u);
  assert.match(landing, /Product.*#product/su);
  assert.match(landing, /Workflow.*#workflow/su);
  assert.match(landing, /Security.*#security/su);
  assert.match(landing, /href="\/login"/u);
  assert.match(landing, /href="\/register"/u);
});

test("explains the real GreenCloud system without a decorative dashboard", async () => {
  const landing = await source(landingUrl);

  for (const term of [
    "ESP32",
    "Firebase",
    "Soil",
    "Rain",
    "Relay + pump",
    "Protected command path",
    "Observe",
    "Decide",
    "Irrigate",
    "Audit",
  ]) {
    assert.match(landing, new RegExp(term.replace("+", "\\+"), "u"));
  }

  assert.match(landing, /<svg/u);
  assert.match(landing, /role="img"/u);
  assert.match(landing, /aria-labelledby="topology-title topology-description"/u);
  assert.match(landing, /Private six-character OLED pairing/u);
  assert.match(landing, /Trusted unpair with queued factory reset/u);
});

test("removes the previous glass, ambience and theme-demo landing behavior", async () => {
  const landing = await source(landingUrl);

  for (const forbidden of [
    "AmbientOrbs",
    "LeafFallOverlay",
    "GlassCard",
    "SectionBadge",
    "themePreset",
    "ambienceMode",
    "backdrop-blur",
    "shadow-[0_0_",
  ]) {
    assert.doesNotMatch(landing, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
  }
});

test("keeps login and registration routes safe during staged migration", async () => {
  const login = await source(loginUrl);
  const register = await source(registerUrl);

  assert.match(login, /redirect\("\/auth"\)/u);
  assert.match(register, /redirect\("\/auth"\)/u);
});
