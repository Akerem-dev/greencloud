"use client";

import {
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Notice, Gc2Status, type Gc2StatusTone } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";

type FailureStage = "rejected" | "timeout" | "error";
type RecoveryAction = "same-code" | "fresh-code" | "inventory" | "login";

type RecoveryProfile = {
  kicker: string;
  title: string;
  summary: string;
  tone: Exclude<Gc2StatusTone, "neutral">;
  action: RecoveryAction;
  actionLabel: string;
  checks: string[];
};

type PairingFailureRecoveryProps = {
  stage: FailureStage;
  failureCode: string;
  message: string;
  code: string;
  deviceName: string;
  place: string;
  ownerLabel: string;
  onRetrySameDetails: () => void;
  onUseFreshCode: () => void;
};

function includesAny(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function recoveryProfile(stage: FailureStage, failureCode: string): RecoveryProfile {
  const code = failureCode.toLowerCase();

  if (stage === "rejected" || code.includes("rejected")) {
    return {
      kicker: "Hardware rejection",
      title: "The ESP32 declined this ownership claim.",
      summary:
        "GreenCloud did not finalize ownership. Confirm that the physical controller is the intended device, then generate a fresh OLED code before trying again.",
      tone: "danger",
      action: "fresh-code",
      actionLabel: "Enter a fresh OLED code",
      checks: [
        "Confirm the controller displaying the code is the device you intend to add.",
        "Restart or reopen pairing on the ESP32 to generate a fresh code.",
        "Do not reuse a claim the hardware already rejected.",
      ],
    };
  }

  if (stage === "timeout" || code.includes("timeout")) {
    return {
      kicker: "Approval window closed",
      title: "The browser stopped waiting before hardware approval arrived.",
      summary:
        "No trusted device result was returned. If the OLED code is still active, the same signed-in owner can reopen the request; otherwise generate a fresh code.",
      tone: "warning",
      action: "same-code",
      actionLabel: "Review and retry this code",
      checks: [
        "Keep the ESP32 powered and connected to its configured network.",
        "Check whether the same six-character code is still visible.",
        "Use a fresh code if the controller has rotated or expired it.",
      ],
    };
  }

  if (
    includesAny(code, [
      "expired",
      "not-found",
      "unavailable",
      "invalid-pairing",
      "claim-missing",
    ])
  ) {
    return {
      kicker: "Code unavailable",
      title: "The submitted OLED code can no longer open a trusted claim.",
      summary:
        "The code is missing, expired, unavailable or no longer backed by a valid pairing record. GreenCloud left ownership unchanged.",
      tone: "warning",
      action: "fresh-code",
      actionLabel: "Enter a fresh OLED code",
      checks: [
        "Return to the physical controller and open its pairing display.",
        "Read all six characters from the current OLED code.",
        "Avoid codes copied from an earlier controller session.",
      ],
    };
  }

  if (includesAny(code, ["permission-denied", "claim-conflict"])) {
    return {
      kicker: "Claim boundary blocked",
      title: "This session cannot safely continue the submitted claim.",
      summary:
        "The code may already belong to another claim or the current session may not have permission to read it. No ownership overwrite was attempted.",
      tone: "danger",
      action: "fresh-code",
      actionLabel: "Start with a fresh code",
      checks: [
        "Verify that the intended GreenCloud owner account is signed in.",
        "Generate a new code on the physical ESP32.",
        "Do not repeatedly guess or reuse a code claimed elsewhere.",
      ],
    };
  }

  if (code.includes("unauthenticated")) {
    return {
      kicker: "Owner session unavailable",
      title: "Firebase Authentication is required before pairing can continue.",
      summary:
        "The protected service could not bind this request to a current owner session. Sign in again before submitting any device code.",
      tone: "danger",
      action: "login",
      actionLabel: "Return to sign in",
      checks: [
        "Restore the intended owner session.",
        "Confirm the workspace account before entering another code.",
        "No device ownership was written while the session was unavailable.",
      ],
    };
  }

  if (code.includes("invalid-response")) {
    return {
      kicker: "Ownership result unconfirmed",
      title: "The final response could not be trusted.",
      summary:
        "GreenCloud will not claim success from mismatched ownership data. Check the device inventory before retrying because finalization may have reached the server without a trustworthy client result.",
      tone: "danger",
      action: "inventory",
      actionLabel: "Check device inventory",
      checks: [
        "Look for the device in the protected inventory before another attempt.",
        "Do not assume ownership succeeded from an invalid response.",
        "Do not repeat finalization until the current workspace state is known.",
      ],
    };
  }

  if (includesAny(code, ["firebase-error", "network", "invalid-config"])) {
    return {
      kicker: "Protected service unavailable",
      title: "The pairing service could not complete this request.",
      summary:
        "The browser did not receive a trusted completion result. Check connectivity and service availability, then retry only while the current OLED code remains active.",
      tone: "danger",
      action: "same-code",
      actionLabel: "Review and retry this code",
      checks: [
        "Confirm this computer has a stable network connection.",
        "Keep the ESP32 online while retrying.",
        "Use a fresh OLED code if the current one expires during recovery.",
      ],
    };
  }

  return {
    kicker: "Pairing interrupted safely",
    title: "The protected flow ended without a trusted device result.",
    summary:
      "GreenCloud did not add a device from this screen. Review the service message and the physical controller before deciding whether the same code is still safe to retry.",
    tone: "danger",
    action: "same-code",
    actionLabel: "Review pairing details",
    checks: [
      "Confirm the active code directly on the ESP32 OLED.",
      "Verify the signed-in owner and intended plant zone.",
      "Generate a fresh code when the current device state is uncertain.",
    ],
  };
}

export default function Gc2PairingFailureRecovery({
  stage,
  failureCode,
  message,
  code,
  deviceName,
  place,
  ownerLabel,
  onRetrySameDetails,
  onUseFreshCode,
}: PairingFailureRecoveryProps) {
  const profile = recoveryProfile(stage, failureCode);

  const primaryAction =
    profile.action === "inventory" ? (
      <Gc2LinkButton href="/devices">
        {profile.actionLabel}
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Gc2LinkButton>
    ) : profile.action === "login" ? (
      <Gc2LinkButton href="/login">
        {profile.actionLabel}
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      </Gc2LinkButton>
    ) : (
      <Gc2Button
        onClick={
          profile.action === "fresh-code"
            ? onUseFreshCode
            : onRetrySameDetails
        }
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        {profile.actionLabel}
      </Gc2Button>
    );

  return (
    <div className="gc2-grid items-start">
      <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
        <header className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="gc2-kicker">{profile.kicker}</p>
              <h2 className="gc2-heading-md mt-2">{profile.title}</h2>
              <p className="gc2-copy mt-3 max-w-2xl">{profile.summary}</p>
            </div>
            <Gc2Status tone={profile.tone}>Recovery required</Gc2Status>
          </div>
        </header>

        <div className="grid gap-6 p-5 sm:p-7">
          <Gc2Notice
            tone={profile.tone}
            title="Protected service report"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            {message || "Pairing ended without a trusted completion result."}
          </Gc2Notice>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
              <p className="gc2-kicker">Submitted request</p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">OLED code</dt>
                  <dd className="gc2-data mt-1 text-lg font-bold tracking-[0.18em] text-[var(--gc2-ink)]">{code || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">Device</dt>
                  <dd className="mt-1 font-bold text-[var(--gc2-ink)]">{deviceName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">Zone</dt>
                  <dd className="mt-1 font-bold text-[var(--gc2-ink)]">{place}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4">
              <p className="gc2-kicker">Trust result</p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">Owner session</dt>
                  <dd className="mt-1 break-words font-bold text-[var(--gc2-ink)]">{ownerLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">Failure code</dt>
                  <dd className="gc2-data mt-1 break-words font-bold text-[var(--gc2-ink)]">{failureCode || "pairing-error"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">Canonical ownership</dt>
                  <dd className="mt-1 font-bold text-[var(--gc2-danger)]">Unconfirmed</dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <p className="gc2-kicker">Recovery checklist</p>
            <ol className="mt-4 grid gap-3 p-0">
              {profile.checks.map((check, index) => (
                <li
                  key={check}
                  className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 border-b border-[var(--gc2-line)] pb-3 text-sm leading-6 text-[var(--gc2-ink-soft)] last:border-b-0 last:pb-0"
                >
                  <span className="gc2-data grid h-8 w-8 place-items-center rounded-[var(--gc2-radius-sm)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-xs font-bold text-[var(--gc2-ink-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{check}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--gc2-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 max-w-xl text-xs leading-5 text-[var(--gc2-ink-muted)]">
              No device is presented as trusted by this recovery screen. Physical output and workspace commands remain unchanged.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {profile.action !== "inventory" ? (
                <Gc2LinkButton href="/devices" variant="quiet">
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Device inventory
                </Gc2LinkButton>
              ) : null}
              {primaryAction}
            </div>
          </div>
        </div>
      </Gc2Surface>

      <aside className="col-span-12 grid gap-5 lg:col-span-4">
        <Gc2Surface className="p-5 sm:p-6">
          <div className="flex gap-3">
            <LockKeyhole aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--gc2-warning)]" />
            <div>
              <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Fail closed</p>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                A rejected, expired, interrupted or unverifiable request never unlocks irrigation controls from this client screen.
              </p>
            </div>
          </div>
        </Gc2Surface>

        <Gc2Surface className="p-5 sm:p-6">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
            <div>
              <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Existing workspace preserved</p>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Previously trusted devices, activity records, settings and automation policy are not reset by a failed pairing attempt.
              </p>
            </div>
          </div>
        </Gc2Surface>

        <Gc2Surface className="p-5 sm:p-6">
          <div className="flex gap-3">
            <KeyRound aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--gc2-info)]" />
            <div>
              <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">Fresh-code rule</p>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Rejected, expired, missing or conflicting claims require a new code from the physical ESP32 rather than a guessed replacement.
              </p>
            </div>
          </div>
        </Gc2Surface>
      </aside>
    </div>
  );
}
