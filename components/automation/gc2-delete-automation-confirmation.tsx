"use client";

import { CheckCircle2, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";

const CONFIRMATION_PHRASE = "DELETE RULE";

type DeletePhase = "confirm" | "success";

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/gu, " ") ?? "";
}

export default function Gc2DeleteAutomationConfirmation() {
  const { automation, resetAutomation } = useAppState();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DeletePhase>("confirm");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleResetCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (buttonLabel(button) !== "Reset policy") return;
      if (button.closest('[role="dialog"]')) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setConfirmation("");
      setError("");
      setPhase("confirm");
      setOpen(true);
    };

    document.addEventListener("click", handleResetCapture, true);
    return () =>
      document.removeEventListener("click", handleResetCapture, true);
  }, []);

  function closeModal() {
    setOpen(false);
  }

  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (confirmation.trim() !== CONFIRMATION_PHRASE) {
      setError(`Type ${CONFIRMATION_PHRASE} exactly to replace this rule.`);
      return;
    }

    setError("");
    resetAutomation();
    setPhase("success");
  }

  const phraseMatches = confirmation.trim() === CONFIRMATION_PHRASE;

  return (
    <Gc2Dialog
      open={open}
      onClose={closeModal}
      closeLabel="Close automation rule deletion"
      title={
        phase === "success"
          ? "Custom automation rule replaced"
          : "Delete custom automation rule"
      }
      description={
        phase === "success"
          ? "The active AppState policy now uses the protected default profile."
          : "GreenCloud requires an automation policy object, so deletion safely replaces the custom rule with protected defaults."
      }
      footer={
        phase === "success" ? (
          <Gc2Button onClick={closeModal}>Close</Gc2Button>
        ) : (
          <>
            <Gc2Button variant="quiet" onClick={closeModal}>
              Cancel
            </Gc2Button>
            <Gc2Button
              type="submit"
              form="gc2-delete-automation-form"
              variant="danger"
              disabled={!phraseMatches}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Replace with protected defaults
            </Gc2Button>
          </>
        )
      }
    >
      {phase === "success" ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="success"
            title="Protected defaults applied through AppState"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            The current custom policy was replaced through the existing
            resetAutomation boundary. Remote persistence remains managed by the
            existing AppState and Firebase adapter.
          </Gc2Notice>

          <Gc2Notice
            tone="info"
            title="No hardware or history was deleted"
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            Devices, telemetry, Activity records and physical ESP32 state are not
            presented as deleted by this policy reset.
          </Gc2Notice>
        </div>
      ) : (
        <form
          id="gc2-delete-automation-form"
          onSubmit={confirmDelete}
          className="grid gap-5"
        >
          <Gc2Notice
            tone="danger"
            title="Current custom values will be replaced"
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            This is the supported delete-equivalent for automation. It does not remove
            the selected device, its telemetry or Activity history.
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Current mode</dt>
              <dd className="mt-2">
                <Gc2Status tone={automation.mode === "Automatic" ? "success" : "info"}>
                  {automation.mode}
                </Gc2Status>
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Moisture threshold</dt>
              <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.moistureThreshold}%
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Cooldown</dt>
              <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.cooldownMinutes} min
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Requested pump duration</dt>
              <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.pumpDurationSeconds}s
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Automatic irrigation</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.autoIrrigationEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Manual override</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.manualOverrideEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="gc2-kicker">Quiet hours</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {automation.quietHoursEnabled
                  ? `${automation.quietHoursStart}–${automation.quietHoursEnd}`
                  : "Disabled"}
              </dd>
            </div>
          </dl>

          <Gc2Input
            label={`Type ${CONFIRMATION_PHRASE} to confirm`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
            error={error || undefined}
          />

          <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            The confirmation calls only resetAutomation(). It does not send irrigation,
            mutate a device, remove database paths or claim any hardware reset.
          </p>
        </form>
      )}
    </Gc2Dialog>
  );
}
