"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert, X } from "lucide-react";

import { AUTH_SESSION_BLOCKED_EVENT } from "@/lib/auth-session-integrity.mjs";

export default function AuthSessionSafetyBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleBlockedSession(event: Event) {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      setMessage(
        customEvent.detail?.reason ??
          "The authentication session change was blocked safely.",
      );
    }

    window.addEventListener(
      AUTH_SESSION_BLOCKED_EVENT,
      handleBlockedSession,
    );

    return () => {
      window.removeEventListener(
        AUTH_SESSION_BLOCKED_EVENT,
        handleBlockedSession,
      );
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <div data-auth-session-safety-boundary="firebase-auth-only">
      {children}

      {message ? (
        <div className="fixed bottom-5 right-5 z-[190] w-[min(440px,calc(100vw-40px))]">
          <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-warn)_42%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--gc-text)]">
                  Authentication change blocked safely
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMessage("")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-[var(--gc-soft)] transition hover:bg-white/[0.07] hover:text-[var(--gc-text)]"
                aria-label="Dismiss authentication safety notice"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
