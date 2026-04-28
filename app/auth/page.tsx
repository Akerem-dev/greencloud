"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/auth-card";
import AmbientOrbs from "@/components/effects/ambient-orbs";
import LeafFallOverlay from "@/components/effects/leaf-fall-overlay";
import { subscribeToAuthState } from "@/lib/firebase-auth";
import { useAppState } from "@/components/providers/app-state-provider";

export default function AuthPage() {
  const router = useRouter();
  const { settings } = useAppState();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
      <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

      <AmbientOrbs themePreset={settings.themePreset} />

      {settings.leafAmbience ? (
        <LeafFallOverlay mode={settings.ambienceMode} />
      ) : null}

      {isCheckingAuth ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_78%,black)] px-6 py-5 text-center shadow-[0_0_38px_var(--gc-glow)] backdrop-blur-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--gc-muted)]">
              GreenCloud
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--gc-text)]">
              Checking session...
            </p>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <AuthCard onSuccess={() => router.replace("/dashboard")} />
        </div>
      )}
    </main>
  );
}