"use client";

import { CheckCircle2, Pencil, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  useAppState,
  type Device,
} from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice } from "@/components/ui/gc2-status";
import {
  DEVICE_MUTATION_BLOCKED_EVENT,
  DEVICE_NAME_MAX_LENGTH,
  DEVICE_PLACE_MAX_LENGTH,
  validateDeviceIdentityInput,
} from "@/lib/device-mutation-safety.mjs";

type RenamePhase = "editing" | "saved";
type DeviceMutationEvent = CustomEvent<{ reason?: string }>;

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/gu, " ") ?? "";
}

function normalizedIdentityMatches(device: Device, name: string, place: string) {
  return (
    device.name === name &&
    device.place === place &&
    (device.location ?? device.place) === place
  );
}

export default function Gc2RenameDeviceModal({
  deviceId,
}: {
  deviceId: string;
}) {
  const { devices, updateDevice } = useAppState();
  const device = devices.find((item) => item.id === deviceId);
  const mutationBlockedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<RenamePhase>("editing");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [savedIdentity, setSavedIdentity] = useState<{
    name: string;
    place: string;
  } | null>(null);

  useEffect(() => {
    const handleRenameCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (buttonLabel(button) !== "Rename") return;
      if (!device) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      mutationBlockedRef.current = false;
      setName(device.name);
      setPlace(device.place);
      setError("");
      setSavedIdentity(null);
      setPhase("editing");
      setOpen(true);
    };

    document.addEventListener("click", handleRenameCapture, true);
    return () => document.removeEventListener("click", handleRenameCapture, true);
  }, [device]);

  useEffect(() => {
    const handleBlockedMutation = (event: Event) => {
      const mutationEvent = event as DeviceMutationEvent;
      mutationBlockedRef.current = true;
      setError(
        mutationEvent.detail?.reason ??
          "The device label change was blocked safely.",
      );
      setPhase("editing");
    };

    window.addEventListener(
      DEVICE_MUTATION_BLOCKED_EVENT,
      handleBlockedMutation,
    );

    return () =>
      window.removeEventListener(
        DEVICE_MUTATION_BLOCKED_EVENT,
        handleBlockedMutation,
      );
  }, []);

  function closeModal() {
    setOpen(false);
  }

  function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!device) return;

    mutationBlockedRef.current = false;
    setError("");

    try {
      const normalized = validateDeviceIdentityInput(name, place);

      if (
        normalizedIdentityMatches(
          device,
          normalized.name,
          normalized.place,
        )
      ) {
        setError("Change the device name or plant zone before saving.");
        return;
      }

      updateDevice(device.id, normalized);

      if (mutationBlockedRef.current) return;

      setName(normalized.name);
      setPlace(normalized.place);
      setSavedIdentity(normalized);
      setPhase("saved");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The device label change was blocked safely.",
      );
    }
  }

  if (!device) return null;

  return (
    <Gc2Dialog
      open={open}
      onClose={closeModal}
      closeLabel="Close rename device modal"
      title={phase === "saved" ? "Device labels updated" : "Rename trusted device"}
      description={
        phase === "saved"
          ? "The human-readable labels were accepted by protected application state and handed to the existing workspace sync adapter."
          : "Change only the device name and plant-zone label. Controller identity, ownership and safety state remain immutable."
      }
      footer={
        phase === "saved" ? (
          <Gc2Button onClick={closeModal}>Done</Gc2Button>
        ) : (
          <>
            <Gc2Button variant="quiet" onClick={closeModal}>
              Cancel
            </Gc2Button>
            <Gc2Button type="submit" form="gc2-rename-device-form">
              Save changes
            </Gc2Button>
          </>
        )
      }
    >
      {phase === "saved" && savedIdentity ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="success"
            title="Workspace labels accepted"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {savedIdentity.name} now identifies the {savedIdentity.place} plant
            zone in application state. Remote persistence remains managed by the
            existing Firebase adapter.
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Device name</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {savedIdentity.name}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Plant zone</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {savedIdentity.place}
              </dd>
            </div>
          </dl>

          <div className="flex items-start gap-3 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            <ShieldCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            Device ID {device.id}, Firebase ownership, pairing trust, telemetry
            and hardware protection were not changed.
          </div>
        </div>
      ) : (
        <form
          id="gc2-rename-device-form"
          onSubmit={saveIdentity}
          className="grid gap-5"
          noValidate
        >
          <div className="flex items-start gap-3 border-y border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] px-4 py-4 text-sm leading-6 text-[var(--gc2-ink-soft)]">
            <Pencil
              aria-hidden="true"
              className="mt-1 h-4 w-4 shrink-0 text-[var(--gc2-moss-strong)]"
            />
            <p className="m-0">
              Renaming changes workspace labels only. It cannot modify the
              controller ID, owner, pairing code, relay, pump or safety guards.
            </p>
          </div>

          <Gc2Input
            label="Device name"
            value={name}
            onChange={(event) =>
              setName(event.target.value.slice(0, DEVICE_NAME_MAX_LENGTH))
            }
            maxLength={DEVICE_NAME_MAX_LENGTH}
            autoComplete="off"
            required
          />

          <Gc2Input
            label="Plant zone or location"
            value={place}
            onChange={(event) =>
              setPlace(event.target.value.slice(0, DEVICE_PLACE_MAX_LENGTH))
            }
            maxLength={DEVICE_PLACE_MAX_LENGTH}
            autoComplete="off"
            required
          />

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
            Immutable device ID: {device.id}. The protected adapter verifies the
            authenticated workspace before accepting label changes.
          </div>
        </form>
      )}
    </Gc2Dialog>
  );
}
