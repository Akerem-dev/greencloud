import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  editor: new URL(
    "../../components/automation/gc2-automation-rule-editor.tsx",
    import.meta.url,
  ),
  launcher: new URL(
    "../../components/automation/gc2-automation-rule-editor-launcher.tsx",
    import.meta.url,
  ),
  dialog: new URL("../../components/ui/gc2-dialog.tsx", import.meta.url),
};

async function source(name) {
  return readFile(files[name], "utf8");
}

test("routes cancel, close button, Escape and backdrop through one guarded close request", async () => {
  const [editor, dialog] = await Promise.all([
    source("editor"),
    source("dialog"),
  ]);

  assert.match(editor, /function requestClose\(\)/u);
  assert.match(editor, /<Gc2Dialog[\s\S]*onClose=\{requestClose\}/u);
  assert.match(editor, /<Gc2Button variant="quiet" onClick=\{requestClose\}>[\s\S]*Cancel/u);

  assert.match(dialog, /const handleCancel = \(event: Event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*onClose\(\)/u);
  assert.match(dialog, /if \(event\.target === event\.currentTarget\) onClose\(\)/u);
  assert.match(dialog, /aria-label=\{closeLabel\}[\s\S]*onClick=\{onClose\}/u);
});

test("opens the warning only for a dirty local draft", async () => {
  const editor = await source("editor");

  assert.match(editor, /type EditorPhase = "edit" \| "confirm-discard"/u);
  assert.match(editor, /const dirty = JSON\.stringify\(draft\) !== JSON\.stringify\(original\)/u);
  assert.match(
    editor,
    /function requestClose\(\) \{[\s\S]*if \(dirty\) \{[\s\S]*setPhase\("confirm-discard"\);[\s\S]*return;[\s\S]*\}[\s\S]*onClose\(\)/u,
  );
  assert.match(editor, /Discard unsaved changes\?/u);
  assert.match(editor, /Unsaved automation changes/u);
  assert.match(editor, /No AppState update, Firebase write[\s\S]*or device command has been sent/u);
});

test("keeps the exact draft or discards it without saving", async () => {
  const [editor, launcher] = await Promise.all([
    source("editor"),
    source("launcher"),
  ]);

  assert.match(editor, /function keepEditing\(\) \{[\s\S]*setPhase\("edit"\)/u);
  assert.match(editor, /function discardChanges\(\) \{[\s\S]*onClose\(\)/u);
  assert.match(editor, /Keep editing/u);
  assert.match(editor, /Discard changes/u);
  assert.match(editor, /Keep editing returns to the exact draft values you entered/u);
  assert.match(editor, /closes the editor without saving or applying the draft/u);
  assert.match(launcher, /onClose=\{\(\) => setOpen\(false\)\}/u);

  const discardFunction = editor.match(
    /function discardChanges\(\) \{(?<body>[\s\S]*?)\n  \}/u,
  );
  assert.ok(discardFunction?.groups?.body);
  assert.doesNotMatch(
    discardFunction.groups.body,
    /onSave|updateAutomation|setDraft|firebase|resetAutomation|startIrrigation/u,
  );
});

test("closes after a validated explicit save without entering discard confirmation", async () => {
  const [editor, launcher] = await Promise.all([
    source("editor"),
    source("launcher"),
  ]);

  assert.match(editor, /const patch = validateDraft\(draft\)/u);
  assert.match(editor, /onSave\(patch\)/u);
  assert.match(editor, /Save automation rule/u);
  assert.match(launcher, /updateAutomation\(patch\)/u);
  assert.match(launcher, /setOpen\(false\)/u);

  const saveFunction = editor.match(
    /function saveRule\(event: FormEvent<HTMLFormElement>\) \{(?<body>[\s\S]*?)\n  \}/u,
  );
  assert.ok(saveFunction?.groups?.body);
  assert.doesNotMatch(saveFunction.groups.body, /confirm-discard|discardChanges/u);
});

test("keeps the warning local-only and free of physical or Firebase mutation paths", async () => {
  const editor = await source("editor");

  assert.doesNotMatch(editor, /useAppState/u);
  assert.doesNotMatch(
    editor,
    /startIrrigation|refreshTelemetry|removeDevice|updateDevice|resetAutomation/u,
  );
  assert.doesNotMatch(
    editor,
    /firebaseAuth|firebaseFunctions|realtimeDatabase|httpsCallable|set\(|update\(|remove\(/u,
  );
});
