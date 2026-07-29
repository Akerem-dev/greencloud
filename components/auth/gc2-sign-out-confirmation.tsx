"use client";

import { CheckCircle2, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import { AUTH_SESSION_BLOCKED_EVENT } from "@/lib/auth-session-integrity.mjs";

type SignOutPhase = "confirm" | "pending" | "failed";

type BlockedSessionDetail = {
  reason?: string;
};

function buttonLabel(button: HTMLButtonElement) {
  return button.textContent?.trim().replace(/\s+/gu, " ") ?? "";
}

export default function Gc2SignOutConfirmation() {
  const { devices, logoutFromWorkspace, session, settings } = useAppState();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<SignOutPhase>("confirm");
  const [error, setError] = useState("");

  const sessionEnded = phase === "pending" && !session.signedIn;
  const pending = phase === "pending" && session.signedIn;
  const operatorName = session.userName || settings.ownerName || "Operator";
  const accountEmail = session.email || "No authenticated email exposed";

  useEffect(() => {
    const handleSignOutCapture = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest("button");
      if (!(button instanceof HTMLButtonElement)) return;
      if (buttonLabel(button) !== "Sign out") return;
      if (button.closest("dialog")) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      setError("");
      setPhase("confirm");
      setOpen(true);
    };

    document.addEventListener("click", handleSignOutCapture, true);
    return () =>
      document.removeEventListener("click", handleSignOutCapture, true);
  }, []);

  useEffect(() => {
    const handleBlockedSession = (event: Event) => {
      if (!open) return;

      const detail = (event as CustomEvent<BlockedSessionDetail>).detail;
      setError(
        detail?.reason ||
          "GreenCloud could not verify that the Firebase session ended.",
      );
      setPhase("failed");
    };

    window.addEventListener(AUTH_SESSION_BLOCKED_EVENT, handleBlockedSession);
    return () =>
      window.removeEventListener(AUTH_SESSION_BLOCKED_EVENT, handleBlockedSession);
  }, [open]);

  function closeModal() {
    if (pending) return;
    setOpen(false);
  }

  function confirmSignOut() {
    if (pending || sessionEnded) return;
    setError("");
    setPhase("pending");
    logoutFromWorkspace();
  }

  return (
    <Gc2Dialog
      open={open}
      onClose={closeModal}
      closeLabel="Close sign-out confirmation"
      title={sessionEnded ? "Firebase session ended" : "Sign out of GreenCloud?"}
      description={
        sessionEnded
          ? "Firebase Auth no longer reports an active GreenCloud session in this browser."
          : "Review the authenticated account before ending this browser session. Workspace records remain associated with the account."
      }
      footer={
        sessionEnded ? (
          <Gc2Button onClick={closeModal}>Continue to sign in</Gc2Button>
        ) : (
          <>
            <Gc2Button variant="quiet" onClick={closeModal} disabled={pending}>
              Keep session
            </Gc2Button>
            <Gc2Button variant="danger" onClick={confirmSignOut} disabled={pending}>
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {pending ? "Ending Firebase session..." : "Confirm sign out"}
            </Gc2Button>
          </>
        )
      }
    >
      {sessionEnded ? (
        <div className="grid gap-5">
          <Gc2Notice
            tone="success"
            title="Sign-out verified by session state"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            GreenCloud shows completion only after the subscribed Firebase Auth state
            reports that no user is signed in.
          </Gc2Notice>

          <Gc2Notice
            tone="info"
            title="Workspace data was not deleted"
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            Paired devices, telemetry, Activity history, automation policy and workspace
            settings remain stored under the account.
          </Gc2Notice>
        </div>
      ) : (
        <div className="grid gap-5">
          <Gc2Notice
            tone="warning"
            title="Session action only"
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            Signing out ends authentication in this browser. It does not unpair ESP32
            devices, erase telemetry, clear Activity history or reset workspace settings.
          </Gc2Notice>

          <dl className="grid gap-4 border-y border-[var(--gc2-line)] py-4 sm:grid-cols-2">
            <div>
              <dt className="gc2-kicker">Authenticated operator</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {operatorName}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Account email</dt>
              <dd className="mt-2 break-all text-sm font-bold text-[var(--gc2-ink)]">
                {accountEmail}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Workspace</dt>
              <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                {settings.workspaceName || "GreenCloud"}
              </dd>
            </div>
            <div>
              <dt className="gc2-kicker">Paired device scope</dt>
              <dd className="mt-2">
                <Gc2Status tone={devices.length > 0 ? "info" : "neutral"}>
                  {devices.length} paired
                </Gc2Status>
              </dd>
            </div>
          </dl>

          {phase === "failed" && error ? (
            <p
              role="alert"
              className="m-0 rounded-[var(--gc2-radius-md)] border border-[var(--gc2-danger)] bg-[var(--gc2-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--gc2-danger)]"
            >
              {error}
            </p>
          ) : null}

          <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
            Confirm sign out calls only the existing AppState session action. This
            dialog does not import Firebase SDK functions or mutate workspace data.
          </p>
        </div>
      )}
    </Gc2Dialog>
  );
}
