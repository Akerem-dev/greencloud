"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert, X } from "lucide-react";

import { SETTINGS_PREFERENCE_BLOCKED_EVENT } from "@/lib/settings-preference-validation.mjs";

export default function SettingsPreferenceSafetyBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    function handleBlockedSetting(event: Event) {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      setMessage(
        customEvent.detail?.reason ??
          "The settings change was blocked by the preference safety boundary.",
      );
    }

    window.addEventListener(
      SETTINGS_PREFERENCE_BLOCKED_EVENT,
      handleBlockedSetting,
    );

    return () => {
      window.removeEventListener(
        SETTINGS_PREFERENCE_BLOCKED_EVENT,
        handleBlockedSetting,
      );
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => setMessage(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  return (
    <div data-settings-preference-boundary="validated-preference-contract">
      {children}

      {message ? (
        <div className="fixed bottom-5 right-5 z-[160] w-[min(440px,calc(100vw-40px))]">
          <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-warn)_42%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-warn)]">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--gc-text)]">
                  Settings change blocked safely
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--gc-soft)]">
                  {message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMessage("")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-[var(--gc-soft)] transition hover:bg-white/[0.07] hover:text-[var(--gc-text)]"
                aria-label="Dismiss settings safety notice"
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
