"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Droplets,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import { AUTOMATION_COMMAND_BLOCKED_EVENT } from "@/lib/automation-safety.mjs";

type IrrigationPhase = "confirm" | "submitted";
type AutomationCommandEvent = CustomEvent<{ reason?: string }>;

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/gu, " ") ?? "";
}

function percent(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${Math.round(value)}%`
    : "Unavailable";
}

export default function Gc2ManualIrrigationConfirmation({
  deviceId,
}: {
  deviceId: string;
}) {
  const { devices, automation, startIrrigation } = useAppState();
  const device = devices.find((item) => item.id === deviceId);
  const commandBlockedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<IrrigationPhase>("confirm");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleIrrigationCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (buttonLabel(button) !== "Protected irrigation command") return;
      if (!device) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      commandBlockedRef.current = false;
      setError("");
      setPhase("confirm");
      setOpen(true);
    };

    document.addEventListener("click", handleIrrigationCapture, true);
    return () =>
      document.removeEventListener("click", handleIrrigationCapture, true);
  }, [device]);

  useEffect(() => {
    const handleBlockedCommand = (event: Event) => {
      const commandEvent = event as AutomationCommandEvent;
      commandBlockedRef.current = true;
      setError(
        commandEvent.detail?.reason ??
          "The irrigation request was blocked by protected application state.",
      );
      setPhase("confirm");
      setOpen(true);
    };

    window.addEventListener(
      AUTOMATION_COMMAND_BLOCKED_EVENT,
      handleBlockedCommand,
    );

    return () =>
      window.removeEventListener(
        AUTOMATION_COMMAND_BLOCKED_EVENT,
        handleBlockedCommand,
      );
  }, []);

  function closeModal() {
    setOpen(false);
  }

  function confirmIrrigation() {
    if (!device) return;

    commandBlockedRef.current = false;
    setError("");
    startIrrigation(device.id);

    if (commandBlockedRef.current) return;

    setPhase("submitted");
  }

  if (!device) return null;

  const rainStatus =
    device.rainStatus ?? (device.rainDetected ? "Detected" : "Pending");
  const waterStatus = device.waterLevelStatus ?? "Pending";
  const durationSeconds = automation.pumpDurationSeconds;

  return (
    <Gc2Dialog
      open={open}
      onClose={closeModal}
      closeLabel="Close irrigation confirmation"
      title={
        phase === "submitted"
          ? "Irrigation request submitted"
          : "Confirm protected irrigation"
      }
      description={
        phase === "submitted"
          ? "The request passed the web-side safety boundary and was handed to the existing command adapter."
          : "Review the current field evidence before requesting a physical pump command."
      }
      footer={
        phase === "submitted" ? (
          <Gc2Button onClick={closeModal}>Done</Gc2Button>
        ) : (
          <>
            <Gc2Button variant="quiet" onClick={closeModal}>
              Cancel
            </Gc2Button>
            <Gc2Button onClick={confirmIrrigation}>
              <Droplets aria-hidden="true" className="h-4 w-4" />
              Send protected command
            </Gc2Button>
          </>
        )
      }
    >
      {phase === "submitted" ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="success"
            title="Command accepted by protected application state"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            The {durationSeconds}-second request for {device.name} was forwarded to
            the existing irrigation command adapter.
          </Gc2Notice>

          <Gc2Notice
            tone="info"
            title="Hardware acknowledgement is still required"
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            This screen does not claim that the relay energized or that watering
            completed. Confirm the device acknowledgement in live telemetry and the
            activity ledger.
          </Gc2Notice>
        </div>
      ) : (
        <div className="grid gap-5">
          <Gc2Notice
            tone="warning"
            title="Confirmation required"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            This request can energize a physical pump. GreenCloud will re-check the
            signed-in user, device ownership, live telemetry, rain, tank level and
            manual-override policy after you confirm.
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Target device</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {device.name}
              </dd>
              <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">
                {device.place}
              </p>
            </div>
            <div>
              <dt className="gc2-kicker">Command duration</dt>
              <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {durationSeconds}s
              </dd>
              <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">
                Existing automation setting
              </p>
            </div>
            <div>
              <dt className="gc2-kicker">Soil moisture</dt>
              <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {percent(device.moisture)}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Connection</dt>
              <dd className="mt-2">
                <Gc2Status
                  tone={device.status === "Online" ? "success" : "warning"}
                >
                  {device.status}
                </Gc2Status>
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Rain lockout</dt>
              <dd className="mt-2">
                <Gc2Status
                  tone={rainStatus === "Clear" ? "success" : "warning"}
                >
                  {rainStatus}
                </Gc2Status>
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Tank protection</dt>
              <dd className="mt-2">
                <Gc2Status
                  tone={waterStatus === "OK" ? "success" : "warning"}
                >
                  {waterStatus}
                </Gc2Status>
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Manual override</dt>
              <dd className="mt-2">
                <Gc2Status
                  tone={
                    automation.manualOverrideEnabled ? "success" : "danger"
                  }
                >
                  {automation.manualOverrideEnabled ? "Enabled" : "Disabled"}
                </Gc2Status>
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Immutable device ID</dt>
              <dd className="gc2-data mt-2 break-all text-xs font-bold text-[var(--gc2-ink)]">
                {device.id}
              </dd>
            </div>
          </dl>

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
            The modal cannot bypass AppState safety or write directly to Firebase,
            the relay or the pump.
          </div>
        </div>
      )}
    </Gc2Dialog>
  );
}
