"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/shared/brand-mark";
import GlassCard from "@/components/shared/glass-card";
import {
  getCurrentGreenCloudUser,
  subscribeToAuthState,
  type GreenCloudAuthUser,
} from "@/lib/firebase-auth";

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === "/auth";

  const [user, setUser] = useState<GreenCloudAuthUser | null>(() =>
    getCurrentGreenCloudUser(),
  );

  const [isChecking, setIsChecking] = useState(() => pathname !== "/auth");

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setIsChecking(false);
    }, 2500);

    const unsubscribe = subscribeToAuthState(
      (nextUser) => {
        window.clearTimeout(fallbackTimer);

        setUser(nextUser);
        setIsChecking(false);

        if (nextUser && pathname === "/auth") {
          router.replace("/dashboard");
          return;
        }

        if (!nextUser && pathname !== "/auth") {
          router.replace("/auth");
        }
      },
      () => {
        window.clearTimeout(fallbackTimer);

        setUser(null);
        setIsChecking(false);

        if (pathname !== "/auth") {
          router.replace("/auth");
        }
      },
    );

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [pathname, router]);

  if (isChecking && !isAuthPage) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[var(--gc-bg)] px-4 text-[var(--gc-text)]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

        <GlassCard className="w-full max-w-[460px] p-7 text-center">
          <div className="flex justify-center">
            <BrandMark title="GreenCloud" subtitle="Secure session" compact />
          </div>

          <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-[24px] border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] shadow-[0_0_34px_var(--gc-glow)]">
            <ShieldCheck className="h-7 w-7 text-[var(--gc-accent-2)]" />
          </div>

          <h1 className="mt-7 text-3xl font-semibold tracking-[-0.06em]">
            Checking secure session...
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--gc-soft)]">
            GreenCloud is verifying your Firebase Authentication session before
            opening the private workspace.
          </p>
        </GlassCard>
      </main>
    );
  }

  if (!user && !isAuthPage) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-[var(--gc-bg)] px-4 text-[var(--gc-text)]">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

        <GlassCard className="w-full max-w-[460px] p-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-[color-mix(in_srgb,var(--gc-danger)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)]">
            <Lock className="h-7 w-7 text-[var(--gc-text)]" />
          </div>

          <h1 className="mt-7 text-3xl font-semibold tracking-[-0.06em]">
            Login required.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--gc-soft)]">
            Redirecting to the GreenCloud authentication page.
          </p>
        </GlassCard>
      </main>
    );
  }

  return <>{children}</>;
}