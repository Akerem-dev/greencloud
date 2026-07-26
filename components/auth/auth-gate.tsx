"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";

import { Gc2Surface } from "@/components/ui/gc2-surface";
import {
  getCurrentGreenCloudUser,
  subscribeToAuthState,
  type GreenCloudAuthUser,
} from "@/lib/firebase-auth";

const publicAuthPaths = new Set(["/auth", "/login", "/register", "/recover"]);

type AuthGateProps = {
  children: ReactNode;
};

function SessionStateCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="gc2-page grid min-h-screen place-items-center px-4 py-10">
      <Gc2Surface tone="raised" className="w-full max-w-[480px] p-6 text-center sm:p-8">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-moss-strong)]">
          {icon}
        </div>
        <p className="gc2-kicker mt-6">GreenCloud secure session</p>
        <h1 className="gc2-heading-md mt-3">{title}</h1>
        <p className="gc2-copy mt-3">{description}</p>
      </Gc2Surface>
    </main>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicAuthPath = publicAuthPaths.has(pathname);

  const [user, setUser] = useState<GreenCloudAuthUser | null>(() =>
    getCurrentGreenCloudUser(),
  );
  const [isChecking, setIsChecking] = useState(() => !isPublicAuthPath);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      setIsChecking(false);
    }, 2500);

    const unsubscribe = subscribeToAuthState(
      (nextUser) => {
        window.clearTimeout(fallbackTimer);
        setUser(nextUser);
        setIsChecking(false);

        if (nextUser && isPublicAuthPath) {
          router.replace("/dashboard");
          return;
        }

        if (!nextUser && !isPublicAuthPath) {
          router.replace("/login");
        }
      },
      () => {
        window.clearTimeout(fallbackTimer);
        setUser(null);
        setIsChecking(false);

        if (!isPublicAuthPath) {
          router.replace("/login");
        }
      },
    );

    return () => {
      window.clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [isPublicAuthPath, router]);

  if (isChecking && !isPublicAuthPath) {
    return (
      <SessionStateCard
        icon={<ShieldCheck aria-hidden="true" className="h-5 w-5" />}
        title="Checking secure session..."
        description="GreenCloud is verifying the Firebase Authentication session before opening private workspace data."
      />
    );
  }

  if (!user && !isPublicAuthPath) {
    return (
      <SessionStateCard
        icon={<LockKeyhole aria-hidden="true" className="h-5 w-5" />}
        title="Sign in required."
        description="Redirecting to the dedicated GreenCloud login screen. No private workspace action is available without authentication."
      />
    );
  }

  return <>{children}</>;
}
