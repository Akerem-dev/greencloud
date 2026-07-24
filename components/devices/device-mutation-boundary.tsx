"use client";

import { CheckCircle2, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { firebaseAuth, firebaseFunctions } from "@/lib/firebase";
import {
  DEVICE_MUTATION_BLOCKED_EVENT,
  assertDeviceMutationTarget,
  validateDeviceIdentityInput,
} from "@/lib/device-mutation-safety.mjs";
import { unpairDeviceWithTrustedCallable } from "@/lib/firebase-device-unpair.mjs";

type DeviceMutationEvent = CustomEvent<{ reason?: string }>;
type NoticeKind = "error" | "pending" | "success";
type NoticeState = {
  kind: NoticeKind;
  title: string;
  reason: string;
};

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/g, " ") ?? "";
}

function stopMutation(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function findDeviceIdForRemoveButton(button: HTMLButtonElement) {
  let container: HTMLElement | null = button.parentElement;

  while (container && container !== document.body) {
    const idChip = container.querySelector('button[title="Copy device ID"]');

    if (idChip instanceof HTMLButtonElement) {
      return buttonLabel(idChip);
    }

    container = container.parentElement;
  }

  return "";
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The device change was blocked safely.";
}

export default function DeviceMutationBoundary() {
  const { devices } = useAppState();
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const dismissTimer = useRef<number | null>(null);
  const pendingDeviceId = useRef("");
  const removalInFlight = useRef(false);

  const showNotice = useCallback((nextNotice: NoticeState) => {
    setNotice(nextNotice);

    if (dismissTimer.current !== null) {
      window.clearTimeout(dismissTimer.current);
    }

    if (nextNotice.kind === "pending") {
      dismissTimer.current = null;
      return;
    }

    dismissTimer.current = window.setTimeout(() => {
      setNotice(null);
      dismissTimer.current = null;
    }, 4800);
  }, []);

  useEffect(() => {
    const handleMutationEvent = (event: Event) => {
      const mutationEvent = event as DeviceMutationEvent;
      showNotice({
        kind: "error",
        title: "Device change blocked safely",
        reason:
          mutationEvent.detail?.reason ??
          "The device change was blocked safely.",
      });
    };

    const runTrustedRemoval = async (
      event: MouseEvent,
      button: HTMLButtonElement,
    ) => {
      stopMutation(event);

      if (removalInFlight.current) return;

      const user = firebaseAuth.currentUser;
      const deviceId = pendingDeviceId.current;
      const originalLabel = buttonLabel(button) || "Remove device";

      try {
        const target = assertDeviceMutationTarget({
          authenticated: Boolean(user),
          userId: user?.uid,
          devices,
          deviceId,
        });

        if (!user) {
          throw new Error("Sign in before removing a device.");
        }

        removalInFlight.current = true;
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        button.textContent = "Removing securely…";

        showNotice({
          kind: "pending",
          title: "Secure removal in progress",
          reason: `Verifying ownership and queuing factory reset for ${target.name}.`,
        });

        const result = await unpairDeviceWithTrustedCallable({
          functions: firebaseFunctions,
          userId: user.uid,
          deviceId: target.id,
        });

        showNotice({
          kind: "success",
          title: "Device removed securely",
          reason: result.idempotent
            ? `${target.name} was already removed. The trusted result was restored safely.`
            : `${target.name} was removed from the workspace and its factory-reset command was queued.`,
        });

        pendingDeviceId.current = "";

        const backdrop = document.querySelector(
          '[aria-label="Close delete confirmation"]',
        );

        if (backdrop instanceof HTMLButtonElement) {
          backdrop.click();
        }
      } catch (error) {
        showNotice({
          kind: "error",
          title: "Secure removal failed",
          reason: mutationErrorMessage(error),
        });
      } finally {
        removalInFlight.current = false;

        if (button.isConnected) {
          button.disabled = false;
          button.removeAttribute("aria-busy");
          button.textContent = originalLabel;
        }
      }
    };

    const handleClickCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;

      const label = buttonLabel(button);
      const deleteModalBackdrop = document.querySelector(
        '[aria-label="Close delete confirmation"]',
      );

      if (button.title === "Remove device" && !deleteModalBackdrop) {
        pendingDeviceId.current = findDeviceIdForRemoveButton(button);
        return;
      }

      if (label === "Remove device" && deleteModalBackdrop) {
        void runTrustedRemoval(event, button);
        return;
      }

      if (
        button.getAttribute("aria-label") === "Close delete confirmation" ||
        (label === "Cancel" && deleteModalBackdrop)
      ) {
        pendingDeviceId.current = "";
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
        showNotice({
          kind: "error",
          title: "Device change blocked safely",
          reason:
            error instanceof Error
              ? error.message
              : "The device label was blocked safely.",
        });
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
  }, [devices, showNotice]);

  if (!notice) return null;

  const NoticeIcon =
    notice.kind === "success"
      ? CheckCircle2
      : notice.kind === "pending"
        ? LoaderCircle
        : ShieldAlert;

  return (
    <div
      role="alert"
      aria-live={notice.kind === "pending" ? "polite" : "assertive"}
      className="fixed bottom-5 right-5 z-[170] w-[min(420px,calc(100vw-2.5rem))] rounded-[24px] border border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_94%,black)] p-4 text-[var(--gc-text)] shadow-[0_28px_90px_rgba(0,0,0,0.5),0_0_34px_rgba(217,154,117,0.16)] backdrop-blur-2xl"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_13%,transparent)] text-[var(--gc-warn)]">
          <NoticeIcon
            className={`h-5 w-5 ${notice.kind === "pending" ? "animate-spin" : ""}`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{notice.title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
            {notice.reason}
          </p>
        </div>

        {notice.kind !== "pending" ? (
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/18 text-[var(--gc-soft)] transition hover:text-[var(--gc-text)]"
            aria-label="Dismiss device mutation notice"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
