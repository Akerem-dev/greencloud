"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Gc2AuthShell } from "@/components/layout/gc2-shells";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";
import {
  getAuthErrorMessage,
  requestPasswordReset,
} from "@/lib/firebase-auth";

export default function Gc2RecoveryScreen() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestComplete, setRequestComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setRequestComplete(true);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartRequest() {
    setRequestComplete(false);
    setErrorMessage("");
  }

  return (
    <Gc2AuthShell
      eyebrow="Account recovery"
      title="Recover access without exposing workspace identity."
      description="Request a Firebase password-reset link for the owner account. GreenCloud keeps account discovery private and does not change device ownership, workspace settings or irrigation history."
      context={
        <ul className="m-0 grid list-none gap-3 p-0 text-sm text-[var(--gc2-ink-soft)]">
          <li className="flex items-start gap-3">
            <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss-strong)]" />
            <span>The reset email is delivered by Firebase Authentication.</span>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-info)]" />
            <span>The response never confirms whether an account exists.</span>
          </li>
          <li className="flex items-start gap-3">
            <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-warning)]" />
            <span>Paired ESP32 devices and private workspace data remain untouched.</span>
          </li>
        </ul>
      }
    >
      <Gc2Surface tone="raised" className="p-5 sm:p-7">
        <header className="border-b border-[var(--gc2-line)] pb-5">
          <p className="gc2-kicker">Firebase owner account</p>
          <h2 className="gc2-heading-md mt-2">Request a reset link</h2>
          <p className="gc2-copy mt-2">
            Enter the email used for GreenCloud sign-in. For privacy, the result is intentionally identical whether or not an eligible account exists.
          </p>
        </header>

        {requestComplete ? (
          <div className="mt-6 grid gap-5">
            <Gc2Notice
              tone="success"
              title="Recovery request accepted"
              icon={<CheckCircle2 className="h-5 w-5" />}
            >
              If an eligible GreenCloud account exists for that address, Firebase will send password-reset instructions. Check the inbox and spam folder before requesting another link.
            </Gc2Notice>

            <div className="grid gap-3 sm:grid-cols-2">
              <Gc2Button variant="quiet" onClick={restartRequest}>
                <Mail aria-hidden="true" className="h-4 w-4" />
                Use another email
              </Gc2Button>
              <Link
                href="/login"
                className="gc2-button gc2-button--primary justify-center"
              >
                Return to sign in
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
            <div className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute right-3 top-[38px] h-5 w-5 text-[var(--gc2-ink-muted)]" />
              <Gc2Input
                id="recovery-email"
                label="Account email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                placeholder="operator@example.com"
                hint="Normalized and validated before Firebase receives the request."
                required
                className="pr-11"
              />
            </div>

            {errorMessage ? (
              <Gc2Notice
                tone="danger"
                title="Recovery request could not continue"
                icon={<KeyRound className="h-5 w-5" />}
              >
                {errorMessage}
              </Gc2Notice>
            ) : null}

            <Gc2Button
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Requesting secure link…" : "Send recovery link"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2Button>
          </form>
        )}

        <div className="mt-6 border-t border-[var(--gc2-line)] pt-5">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink-soft)] underline-offset-4 hover:text-[var(--gc2-ink)] hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </Gc2Surface>

      <div className="mt-4 flex items-start gap-3 px-1 text-xs leading-5 text-[var(--gc2-ink-muted)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-success)]" />
        GreenCloud sends no password itself and stores no secondary recovery credential.
      </div>
    </Gc2AuthShell>
  );
}
