"use client";

import {
  Save,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import type { AutomationState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input, Gc2Select } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";

type AutomationDraft = {
  mode: AutomationState["mode"];
  moistureThreshold: string;
  cooldownMinutes: string;
  pumpDurationSeconds: string;
  autoIrrigationEnabled: boolean;
  manualOverrideEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

type AutomationRulePatch = Pick<
  AutomationState,
  | "mode"
  | "moistureThreshold"
  | "cooldownMinutes"
  | "pumpDurationSeconds"
  | "autoIrrigationEnabled"
  | "manualOverrideEnabled"
  | "manualOverride"
  | "quietHoursEnabled"
  | "quietHoursStart"
  | "quietHoursEnd"
  | "quietStart"
  | "quietEnd"
>;

type EditorPhase = "edit" | "confirm-discard";

const CLOCK_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/u;

function initialDraft(automation: AutomationState): AutomationDraft {
  return {
    mode: automation.mode,
    moistureThreshold: String(automation.moistureThreshold),
    cooldownMinutes: String(automation.cooldownMinutes),
    pumpDurationSeconds: String(automation.pumpDurationSeconds),
    autoIrrigationEnabled: automation.autoIrrigationEnabled,
    manualOverrideEnabled: automation.manualOverrideEnabled,
    quietHoursEnabled: automation.quietHoursEnabled,
    quietHoursStart: automation.quietHoursStart,
    quietHoursEnd: automation.quietHoursEnd,
  };
}

function parseInteger(
  value: string,
  label: string,
  min: number,
  max: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  }

  return parsed;
}

function validateDraft(draft: AutomationDraft): AutomationRulePatch {
  const moistureThreshold = parseInteger(
    draft.moistureThreshold,
    "Moisture threshold",
    15,
    80,
  );
  const cooldownMinutes = parseInteger(
    draft.cooldownMinutes,
    "Cooldown window",
    5,
    120,
  );
  const pumpDurationSeconds = parseInteger(
    draft.pumpDurationSeconds,
    "Pump duration",
    2,
    60,
  );

  if (draft.mode !== "Automatic" && draft.mode !== "Manual") {
    throw new Error("Select a supported automation mode.");
  }

  if (
    draft.quietHoursEnabled &&
    (!CLOCK_PATTERN.test(draft.quietHoursStart) ||
      !CLOCK_PATTERN.test(draft.quietHoursEnd))
  ) {
    throw new Error("Quiet hours must use a valid 24-hour HH:MM time.");
  }

  return {
    mode: draft.mode,
    moistureThreshold,
    cooldownMinutes,
    pumpDurationSeconds,
    autoIrrigationEnabled: draft.autoIrrigationEnabled,
    manualOverrideEnabled: draft.manualOverrideEnabled,
    manualOverride: draft.manualOverrideEnabled,
    quietHoursEnabled: draft.quietHoursEnabled,
    quietHoursStart: draft.quietHoursStart,
    quietHoursEnd: draft.quietHoursEnd,
    quietStart: draft.quietHoursStart,
    quietEnd: draft.quietHoursEnd,
  };
}

function RuleToggle({
  title,
  description,
  active,
  onToggle,
}: {
  title: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[var(--gc2-line)] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
          {description}
        </p>
      </div>
      <Gc2Button
        type="button"
        variant={active ? "primary" : "quiet"}
        aria-pressed={active}
        onClick={onToggle}
        className="shrink-0"
      >
        {active ? "Enabled" : "Disabled"}
      </Gc2Button>
    </div>
  );
}

export default function Gc2AutomationRuleEditor({
  automation,
  onClose,
  onSave,
}: {
  automation: AutomationState;
  onClose: () => void;
  onSave: (patch: AutomationRulePatch) => void;
}) {
  const [draft, setDraft] = useState<AutomationDraft>(() =>
    initialDraft(automation),
  );
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<EditorPhase>("edit");

  const original = initialDraft(automation);
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);

  function requestClose() {
    setError("");

    if (dirty) {
      setPhase("confirm-discard");
      return;
    }

    onClose();
  }

  function keepEditing() {
    setPhase("edit");
  }

  function discardChanges() {
    onClose();
  }

  function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const patch = validateDraft(draft);
      setError("");
      onSave(patch);
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "The automation rule could not be validated.",
      );
    }
  }

  const confirmingDiscard = phase === "confirm-discard";

  return (
    <Gc2Dialog
      open
      onClose={requestClose}
      closeLabel="Close automation rule editor"
      title={confirmingDiscard ? "Discard unsaved changes?" : "Edit automation rule"}
      description={
        confirmingDiscard
          ? "The active automation policy has not changed. Choose whether to keep editing or discard only this local draft."
          : "Review the complete policy as one draft. AppState is updated only after an explicit save."
      }
      footer={
        confirmingDiscard ? (
          <>
            <Gc2Button variant="quiet" onClick={keepEditing}>
              Keep editing
            </Gc2Button>
            <Gc2Button variant="danger" onClick={discardChanges}>
              Discard changes
            </Gc2Button>
          </>
        ) : (
          <>
            <Gc2Button variant="quiet" onClick={requestClose}>
              Cancel
            </Gc2Button>
            <Gc2Button
              type="submit"
              form="gc2-automation-rule-editor-form"
              disabled={!dirty}
            >
              <Save aria-hidden="true" className="h-4 w-4" />
              Save automation rule
            </Gc2Button>
          </>
        )
      }
    >
      {confirmingDiscard ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="warning"
            title="Unsaved automation changes"
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            Your draft is still held in this dialog. No AppState update, Firebase write
            or device command has been sent.
          </Gc2Notice>

          <div className="border-y border-[var(--gc2-line)] py-4">
            <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
              Discarding affects only the local editor draft.
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
              The currently active automation rule, devices, telemetry and Activity
              history remain unchanged.
            </p>
          </div>

          <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            Keep editing returns to the exact draft values you entered. Discard changes
            closes the editor without calling onSave or updateAutomation.
          </p>
        </div>
      ) : (
        <form
          id="gc2-automation-rule-editor-form"
          onSubmit={saveRule}
          className="grid gap-6"
        >
          <Gc2Notice
            tone="info"
            title="Draft changes are isolated"
            icon={<SlidersHorizontal className="h-5 w-5" />}
          >
            Moving a control in this dialog does not change the active policy. One
            normalized AppState patch is sent only after Save automation rule.
          </Gc2Notice>

          <div className="grid gap-5 sm:grid-cols-2">
            <Gc2Select
              label="Policy mode"
              value={draft.mode}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  mode: event.target.value as AutomationState["mode"],
                }))
              }
            >
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </Gc2Select>

            <div className="gc2-field">
              <span className="gc2-label">Draft status</span>
              <div className="flex min-h-11 items-center">
                <Gc2Status tone={dirty ? "warning" : "neutral"}>
                  {dirty ? "Unsaved changes" : "Matches active policy"}
                </Gc2Status>
              </div>
            </div>

            <Gc2Input
              label="Moisture threshold (%)"
              type="number"
              min={15}
              max={80}
              step={1}
              value={draft.moistureThreshold}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  moistureThreshold: event.target.value,
                }))
              }
              required
            />
            <Gc2Input
              label="Cooldown window (minutes)"
              type="number"
              min={5}
              max={120}
              step={1}
              value={draft.cooldownMinutes}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  cooldownMinutes: event.target.value,
                }))
              }
              required
            />
            <Gc2Input
              label="Requested pump duration (seconds)"
              type="number"
              min={2}
              max={60}
              step={1}
              value={draft.pumpDurationSeconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pumpDurationSeconds: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="border-y border-[var(--gc2-line)] py-4">
            <RuleToggle
              title="Automatic irrigation"
              description="Allows automatic requests only after the existing safety guards pass."
              active={draft.autoIrrigationEnabled}
              onToggle={() =>
                setDraft((current) => ({
                  ...current,
                  autoIrrigationEnabled: !current.autoIrrigationEnabled,
                }))
              }
            />
            <RuleToggle
              title="Manual override"
              description="Allows protected manual requests; it does not bypass telemetry, rain or tank checks."
              active={draft.manualOverrideEnabled}
              onToggle={() =>
                setDraft((current) => ({
                  ...current,
                  manualOverrideEnabled: !current.manualOverrideEnabled,
                }))
              }
            />
            <RuleToggle
              title="Quiet hours"
              description="Adds the configured overnight boundary to automatic evaluation."
              active={draft.quietHoursEnabled}
              onToggle={() =>
                setDraft((current) => ({
                  ...current,
                  quietHoursEnabled: !current.quietHoursEnabled,
                }))
              }
            />
          </div>

          {draft.quietHoursEnabled ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <Gc2Input
                label="Quiet start"
                type="time"
                value={draft.quietHoursStart}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quietHoursStart: event.target.value,
                  }))
                }
                required
              />
              <Gc2Input
                label="Quiet end"
                type="time"
                value={draft.quietHoursEnd}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quietHoursEnd: event.target.value,
                  }))
                }
                required
              />
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="m-0 rounded-[var(--gc2-radius-md)] border border-[var(--gc2-danger)] bg-[var(--gc2-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--gc2-danger)]"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-start gap-3 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            This editor changes policy configuration only. It cannot send irrigation,
            energize the relay, control the pump or write directly to Firebase.
          </div>
        </form>
      )}
    </Gc2Dialog>
  );
}
