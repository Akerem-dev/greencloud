"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
  Wifi,
} from "lucide-react";

import { Gc2AuthShell } from "@/components/layout/gc2-shells";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";
import {
  getAuthErrorMessage,
  loginWithEmailPassword,
  registerWithEmailPassword,
  subscribeToAuthState,
  type AuthMode,
} from "@/lib/firebase-auth";

type AuthScreenCopy = {
  eyebrow: string;
  title: string;
  description: string;
  formTitle: string;
  formDescription: string;
  submitLabel: string;
  submittingLabel: string;
  alternateLabel: string;
  alternateAction: string;
  alternateHref: string;
  successRoute: string;
  context: ReactNode;
};

const copy: Record<AuthMode, AuthScreenCopy> = {
  login: {
    eyebrow: "Secure workspace access",
    title: "Return to the garden control record.",
    description:
      "Sign in with the Firebase account that owns your paired devices, commands and private telemetry path.",
    formTitle: "Sign in",
    formDescription:
      "Continue to the live GreenCloud workspace associated with this account.",
    submitLabel: "Continue to workspace",
    submittingLabel: "Checking credentials…",
    alternateLabel: "New to GreenCloud?",
    alternateAction: "Create an account",
    alternateHref: "/register",
    successRoute: "/dashboard",
    context: (
      <ul className="m-0 grid list-none gap-3 p-0 text-sm text-[var(--gc2-ink-soft)]">
        <li className="flex items-start gap-3">
          <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss-strong)]" />
          <span>Your Firebase UID selects one private workspace path.</span>
        </li>
        <li className="flex items-start gap-3">
          <Database aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-info)]" />
          <span>Telemetry and commands remain separated from other accounts.</span>
        </li>
        <li className="flex items-start gap-3">
          <Lock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-warning)]" />
          <span>Unsafe irrigation actions stay blocked by the hardware safety state.</span>
        </li>
      </ul>
    ),
  },
  register: {
    eyebrow: "Create a private workspace",
    title: "Begin with an accountable owner identity.",
    description:
      "GreenCloud creates a Firebase account first, then guides the owner through workspace identity and trusted device pairing.",
    formTitle: "Create account",
    formDescription:
      "Use a real operator name. It becomes the accountable owner identity inside the workspace.",
    submitLabel: "Create private workspace",
    submittingLabel: "Creating account…",
    alternateLabel: "Already registered?",
    alternateAction: "Sign in instead",
    alternateHref: "/login",
    successRoute: "/setup/workspace",
    context: (
      <ol className="m-0 grid list-none gap-3 p-0 text-sm text-[var(--gc2-ink-soft)]">
        {[
          ["01", "Create the Firebase owner account"],
          ["02", "Name the workspace and primary garden zone"],
          ["03", "Choose essential operation preferences"],
          ["04", "Pair the first ESP32 with its OLED code"],
        ].map(([number, label]) => (
          <li key={number} className="grid grid-cols-[34px_minmax(0,1fr)] items-start gap-3">
            <span className="gc2-data text-xs font-bold text-[var(--gc2-ink-muted)]">{number}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    ),
  },
};

export default function Gc2AuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const screen = copy[mode];
  const isRegister = mode === "register";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return subscribeToAuthState(
      (user) => {
        if (user) {
          router.replace("/dashboard");
          return;
        }

        setIsCheckingSession(false);
      },
      () => {
        setIsCheckingSession(false);
        setErrorMessage("Firebase session checking failed. Check the connection and try again.");
      },
    );
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await registerWithEmailPassword({ email, password, displayName });
      } else {
        await loginWithEmailPassword({ email, password });
      }

      router.replace(screen.successRoute);
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Gc2AuthShell
      eyebrow={screen.eyebrow}
      title={screen.title}
      description={screen.description}
      context={screen.context}
    >
      <Gc2Surface tone="raised" className="p-5 sm:p-7">
        <header className="border-b border-[var(--gc2-line)] pb-5">
          <p className="gc2-kicker">GreenCloud account</p>
          <h2 className="gc2-heading-md mt-2">{screen.formTitle}</h2>
          <p className="gc2-copy mt-2">{screen.formDescription}</p>
        </header>

        {isCheckingSession ? (
          <div className="py-10" role="status" aria-live="polite">
            <div className="flex items-center gap-3 text-sm font-semibold text-[var(--gc2-ink-soft)]">
              <Wifi aria-hidden="true" className="h-5 w-5 text-[var(--gc2-moss)]" />
              Checking the existing Firebase session…
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
            {isRegister ? (
              <div className="relative">
                <UserRound aria-hidden="true" className="pointer-events-none absolute right-3 top-[38px] h-5 w-5 text-[var(--gc2-ink-muted)]" />
                <Gc2Input
                  id="displayName"
                  label="Workspace owner name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  maxLength={60}
                  placeholder="Garden operator"
                  hint="Used as the accountable owner identity. Maximum 60 characters."
                  required
                  className="pr-11"
                />
              </div>
            ) : null}

            <div className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute right-3 top-[38px] h-5 w-5 text-[var(--gc2-ink-muted)]" />
              <Gc2Input
                id="email"
                label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="operator@example.com"
                required
                className="pr-11"
              />
            </div>

            <div>
              <div className="relative">
                <KeyRound aria-hidden="true" className="pointer-events-none absolute right-3 top-[38px] h-5 w-5 text-[var(--gc2-ink-muted)]" />
                <Gc2Input
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  hint={isRegister ? "Firebase requires at least 6 characters." : undefined}
                  required
                  className="pr-11"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[var(--gc2-ink-soft)] underline-offset-4 hover:text-[var(--gc2-ink)] hover:underline"
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Eye aria-hidden="true" className="h-4 w-4" />
                )}
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            {errorMessage ? (
              <Gc2Notice tone="danger" title="Authentication could not continue" icon={<Lock className="h-5 w-5" />}>
                {errorMessage}
              </Gc2Notice>
            ) : null}

            <Gc2Button
              type="submit"
              disabled={isSubmitting}
              className="w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? screen.submittingLabel : screen.submitLabel}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2Button>
          </form>
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-[var(--gc2-line)] pt-5 text-sm text-[var(--gc2-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">
            {screen.alternateLabel}{" "}
            <Link href={screen.alternateHref} className="font-bold text-[var(--gc2-moss-strong)] underline-offset-4 hover:underline">
              {screen.alternateAction}
            </Link>
          </p>

          {!isRegister ? (
            <Link href="/recover" className="font-bold text-[var(--gc2-ink-soft)] underline-offset-4 hover:text-[var(--gc2-ink)] hover:underline">
              Recover account
            </Link>
          ) : null}
        </div>
      </Gc2Surface>

      <div className="mt-4 flex items-start gap-3 px-1 text-xs leading-5 text-[var(--gc2-ink-muted)]">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gc2-success)]" />
        Authentication is handled by Firebase. GreenCloud does not store a second local password.
      </div>
    </Gc2AuthShell>
  );
}
