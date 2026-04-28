"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  type AuthMode,
  getAuthErrorMessage,
  loginWithEmailPassword,
  registerWithEmailPassword,
} from "@/lib/firebase-auth";
import BrandMark from "@/components/shared/brand-mark";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

type AuthCardProps = {
  onSuccess?: () => void;
};

export default function AuthCard({ onSuccess }: AuthCardProps) {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isRegisterMode = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await registerWithEmailPassword({
          email,
          password,
          displayName,
        });
      } else {
        await loginWithEmailPassword({
          email,
          password,
        });
      }

      onSuccess?.();
      router.replace("/dashboard");
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage("");
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1180px] items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <GlassCard className="flex min-h-[620px] flex-col justify-between p-6 sm:p-8">
          <div>
            <BrandMark title="GreenCloud" subtitle="Secure workspace" />

            <div className="mt-10">
              <SectionBadge>Private irrigation layer</SectionBadge>

              <h1 className="mt-7 max-w-2xl text-6xl font-semibold leading-[0.9] tracking-[-0.08em] text-[var(--gc-text)] sm:text-7xl">
                Sign in to your{" "}
                <span className="bg-gradient-to-r from-[var(--gc-accent)] to-[var(--gc-accent-2)] bg-clip-text text-transparent">
                  smart plant system.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--gc-soft)]">
                Every user gets a private Firebase workspace. Your ESP32,
                devices, commands, automation rules, alerts, and settings stay
                separated from other users.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Private UID",
                text: "Each account owns its own data path.",
                icon: ShieldCheck,
              },
              {
                title: "Live control",
                text: "Commands go only to your workspace.",
                icon: Sparkles,
              },
              {
                title: "Safe demo",
                text: "Works before pump hardware is enabled.",
                icon: Lock,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5"
                >
                  <Icon className="h-5 w-5 text-[var(--gc-accent-2)]" />

                  <h3 className="mt-5 text-lg font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="flex min-h-[620px] items-center p-5 sm:p-8">
          <div className="w-full">
            <div className="mx-auto w-full max-w-[520px]">
              <div className="mb-6 inline-flex rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-1">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition",
                    mode === "login"
                      ? "bg-[color-mix(in_srgb,var(--gc-accent)_18%,transparent)] text-[var(--gc-text)] shadow-[0_0_22px_var(--gc-glow)]"
                      : "text-[var(--gc-soft)] hover:text-[var(--gc-text)]",
                  )}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={cn(
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition",
                    mode === "register"
                      ? "bg-[color-mix(in_srgb,var(--gc-accent)_18%,transparent)] text-[var(--gc-text)] shadow-[0_0_22px_var(--gc-glow)]"
                      : "text-[var(--gc-soft)] hover:text-[var(--gc-text)]",
                  )}
                >
                  Register
                </button>
              </div>

              <h2 className="text-5xl font-semibold tracking-[-0.07em] text-[var(--gc-text)]">
                {isRegisterMode ? "Create workspace." : "Welcome back."}
              </h2>

              <p className="mt-4 text-base leading-7 text-[var(--gc-soft)]">
                {isRegisterMode
                  ? "Create a GreenCloud account. Firebase will generate your private user ID automatically."
                  : "Sign in to continue to your private GreenCloud dashboard."}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                {isRegisterMode ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-[var(--gc-soft)]">
                      Workspace owner name
                    </span>

                    <span className="relative block">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--gc-muted)]" />

                      <input
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Kerem"
                        autoComplete="name"
                        className="w-full rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_74%,black)] py-4 pl-12 pr-4 text-base font-semibold text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_42%,transparent)] focus:shadow-[0_0_28px_var(--gc-glow)]"
                      />
                    </span>
                  </label>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--gc-soft)]">
                    Email
                  </span>

                  <span className="relative block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--gc-muted)]" />

                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      required
                      className="w-full rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_74%,black)] py-4 pl-12 pr-4 text-base font-semibold text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_42%,transparent)] focus:shadow-[0_0_28px_var(--gc-glow)]"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--gc-soft)]">
                    Password
                  </span>

                  <span className="relative block">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--gc-muted)]" />

                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      autoComplete={
                        isRegisterMode ? "new-password" : "current-password"
                      }
                      required
                      minLength={6}
                      className="w-full rounded-[22px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_74%,black)] py-4 pl-12 pr-14 text-base font-semibold text-[var(--gc-text)] outline-none transition placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_42%,transparent)] focus:shadow-[0_0_28px_var(--gc-glow)]"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl text-[var(--gc-soft)] transition hover:bg-white/[0.06] hover:text-[var(--gc-text)]"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </span>
                </label>

                {errorMessage ? (
                  <div className="rounded-[22px] border border-[color-mix(in_srgb,var(--gc-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)] p-4 text-sm font-semibold leading-6 text-[var(--gc-text)]">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="premium-btn flex w-full items-center justify-center gap-3 rounded-[24px] px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Please wait..."
                    : isRegisterMode
                      ? "Create account"
                      : "Sign in"}

                  <LogIn className="h-5 w-5" />
                </button>
              </form>

              <div className="mt-6 rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <p className="text-sm leading-7 text-[var(--gc-soft)]">
                  {isRegisterMode
                    ? "Already have an account?"
                    : "Do not have an account yet?"}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      switchMode(isRegisterMode ? "login" : "register")
                    }
                    className="font-semibold text-[var(--gc-accent-2)] underline-offset-4 hover:underline"
                  >
                    {isRegisterMode ? "Login instead." : "Create one."}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}