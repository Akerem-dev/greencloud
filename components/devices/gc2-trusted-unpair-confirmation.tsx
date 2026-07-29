"use client";

import { CheckCircle2, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  type Device,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import {
  requestTrustedDeviceUnpair,
  type TrustedDeviceUnpairResult,
} from "@/lib/trusted-device-unpair-client";

type UnpairPhase = "confirm" | "pending" | "success";

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/gu, " ") ?? "";
}

export default function Gc2TrustedUnpairConfirmation({
  deviceId,
}: {
  deviceId: string;
}) {
  const router = useRouter();
  const { devices } = useAppState();
  const currentDevice = devices.find((item) => item.id === deviceId);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<UnpairPhase>("confirm");
  const [target, setTarget] = useState<Device | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrustedDeviceUnpairResult | null>(null);

  useEffect(() => {
    const handleRemoveCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (button.title !== "Remove device") return;
      if (buttonLabel(button) !== "Remove device") return;
      if (!currentDevice) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setTarget(currentDevice);
      setConfirmation("");
      setError("");
      setResult(null);
      setPhase("confirm");
      setOpen(true);
    };

    document.addEventListener("click", handleRemoveCapture, true);
    return () =>
      document.removeEventListener("click", handleRemoveCapture, true);
  }, [currentDevice]);

  function closeModal() {
    if (phase === "pending") return;
    setOpen(false);
  }

  async function confirmUnpair(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || phase === "pending") return;

    if (confirmation.trim() !== target.name) {
      setError(`Type ${target.name} exactly to confirm trusted removal.`);
      return;
    }

    setError("");
    setPhase("pending");

    try {
      const trusted = await requestTrustedDeviceUnpair({
        devices,
        deviceId: target.id,
      });

      setTarget(trusted.target);
      setResult(trusted.result);
      setPhase("success");
    } catch (unpairError) {
      setError(
        unpairError instanceof Error
          ? unpairError.message
          : "The device could not be removed securely.",
      );
      setPhase("confirm");
    }
  }

  const confirmationMatches = Boolean(
    target && confirmation.trim() === target.name,
  );

  return (
    <Gc2Dialog
      open={open}
      onClose={closeModal}
      closeLabel="Close trusted unpair confirmation"
      title={
        phase === "success"
          ? "Trusted unpair accepted"
          : phase === "pending"
            ? "Verifying trusted removal"
            : "Unpair trusted device"
      }
      description={
        phase === "success"
          ? "The trusted callable returned a validated ownership result and queued the device reset request."
          : "This action detaches the device from the signed-in workspace after server-side ownership verification."
      }
      footer={
        phase === "success" ? (
          <Gc2Button onClick={() => router.push("/devices")}>
            Return to devices
          </Gc2Button>
        ) : (
          <>
            <Gc2Button
              variant="quiet"
              onClick={closeModal}
              disabled={phase === "pending"}
            >
              Cancel
            </Gc2Button>
            <Gc2Button
              type="submit"
              form="gc2-trusted-unpair-form"
              variant="danger"
              disabled={!confirmationMatches || phase === "pending"}
              aria-busy={phase === "pending"}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {phase === "pending"
                ? "Verifying ownership…"
                : "Unpair trusted device"}
            </Gc2Button>
          </>
        )
      }
    >
      {phase === "success" && target && result ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="success"
            title="Server-side ownership verified"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {result.idempotent
              ? `${target.name} was already unpaired, and the trusted result was recovered safely.`
              : `${target.name} was detached from this workspace by the trusted callable.`}
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Device</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {target.name}
              </dd>
              <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">
                {target.place}
              </p>
            </div>
            <div>
              <dt className="gc2-kicker">Factory-reset request</dt>
              <dd className="mt-2">
                <Gc2Status tone="warning">Queued</Gc2Status>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="gc2-kicker">Trusted request ID</dt>
              <dd className="gc2-data mt-2 break-all text-xs font-bold text-[var(--gc2-ink)]">
                {result.requestId}
              </dd>
            </div>
          </dl>

          <Gc2Notice
            tone="info"
            title="Hardware reset is not claimed complete"
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            The callable confirmed that the factory-reset command was queued. The web
            application does not claim that the ESP32 has already received or completed
            that reset.
          </Gc2Notice>
        </div>
      ) : (
        <form
          id="gc2-trusted-unpair-form"
          onSubmit={confirmUnpair}
          className="grid gap-5"
          aria-busy={phase === "pending"}
        >
          <Gc2Notice
            tone="danger"
            title="This removes workspace trust"
            icon={<ShieldAlert className="h-5 w-5" />}
          >
            The device will stop belonging to this workspace after the trusted callable
            verifies the signed-in owner. Historical activity records are not presented
            as deleted by this action.
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Target device</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {target?.name ?? "Unavailable"}
              </dd>
              <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">
                {target?.place ?? "Unknown zone"}
              </p>
            </div>
            <div>
              <dt className="gc2-kicker">Immutable device ID</dt>
              <dd className="gc2-data mt-2 break-all text-xs font-bold text-[var(--gc2-ink)]">
                {target?.id ?? deviceId}
              </dd>
            </div>
          </dl>

          <Gc2Input
            label={`Type ${target?.name ?? "the device name"} to confirm`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={phase === "pending"}
            autoComplete="off"
            error={error || undefined}
          />

          <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            This overlay calls only the trusted unpair client boundary. It does not
            delete Realtime Database paths directly or report a factory reset before
            device acknowledgement.
          </p>
        </form>
      )}
    </Gc2Dialog>
  );
}
