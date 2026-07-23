"use client";

import { ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEVICE_MUTATION_BLOCKED_EVENT,
  DEVICE_REMOVAL_BLOCKED_MESSAGE,
  validateDeviceIdentityInput,
} from "@/lib/device-mutation-safety.mjs";

type DeviceMutationEvent = CustomEvent<{ reason?: string }>;

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/g, " ") ?? "";
}

function stopMutation(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export default function DeviceMutationBoundary() {
  const [notice, setNotice] = useState("");
  const dismissTimer = useRef<number | null>(null);

  const showNotice = useCallback((reason: string) => {
    setNotice(reason);

    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current);
    }

    dismissTimer.current = window.setTimeout(() => {
      setNotice("");
      dismissTimer.current = null;
    }, 4800);
  }, []);

  useEffect(() => {
    const handleMutationEvent = (event: Event) => {
      const mutationEvent = event as DeviceMutationEvent;
      showNotice(
        mutationEvent.detail?.reason ??
          "The device change was blocked safely.",
      );
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;

      const label = buttonLabel(button);

      const deleteModalBackdrop = document.querySelector(
        '[aria-label="Close delete confirmation"]',
      );

      if (label === "Remove device" && deleteModalBackdrop) {
        stopMutation(event);
        showNotice(DEVICE_REMOVAL_BLOCKED_MESSAGE);
        return;
      }

      const editModalBackdrop = document.querySelector(
        '[aria-label="Close edit device modal"]',
      );

      if (label !== "Save changes" || !editModalBackdrop) return;

      const modal = editModalBackdrop.closest(".fixed");
      const inputs = modal?.querySelectorAll("input");

      if (!inputs || inputs.length < 2) return;

      try {
        validateDeviceIdentityInput(inputs[0].value, inputs[1].value);
      } catch (error) {
        stopMutation(event);
        showNotice(
          error instanceof Error
            ? error.message
            : "The device label was blocked safely.",
        );
      }
    };

    window.addEventListener(
      DEVICE_MUTATION_BLOCKED_EVENT,
      handleMutationEvent,
    );
    document.addEventListener("click", handleClickCapture, true);

    return () => {
      window.removeEventListener(
        DEVICE_MUTATION_BLOCKED_EVENT,
        handleMutationEvent,
      );
      document.removeEventListener("click", handleClickCapture, true);

      if (dismissTimer.current !== null) {
        window.clearTimeout(dismissTimer.current);
      }
    };
  }, [showNotice]);

  if (!notice) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-[170] w-[min(420px,calc(100vw-2.5rem))] rounded-[24px] border border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_94%,black)] p-4 text-[var(--gc-text)] shadow-[0_28px_90px_rgba(0,0,0,0.5),0_0_34px_rgba(217,154,117,0.16)] backdrop-blur-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_13%,transparent)] text-[var(--gc-warn)]">
          <ShieldAlert className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Device change blocked safely</p>
          <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
            {notice}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNotice("")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/18 text-[var(--gc-soft)] transition hover:text-[var(--gc-text)]"
          aria-label="Dismiss device mutation notice"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
