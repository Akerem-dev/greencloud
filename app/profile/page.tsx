"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Home,
  Leaf,
  LogOut,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import AuthGate from "@/components/auth/auth-gate";
import AmbientOrbs from "@/components/effects/ambient-orbs";
import LeafFallOverlay from "@/components/effects/leaf-fall-overlay";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import BrandMark from "@/components/shared/brand-mark";
import { useAppState } from "@/components/providers/app-state-provider";
import { logoutFromGreenCloud } from "@/lib/firebase-auth";
import { cn } from "@/lib/utils";

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

function displayStatus(value: string) {
  const lower = value.toLowerCase();

  if (lower === "pending" || lower === "none") return "Ready";
  if (lower === "idle") return "Standby";
  if (lower === "dry-run" || lower.includes("dry-run")) return "Protected";
  if (lower === "locked" || lower === "safe") return "Protected";
  if (lower === "handled") return "Completed";
  if (lower === "sensor check") return "Calibrating";
  if (lower === "ok") return "Safe";

  return value;
}

function statusTone(value: string): Tone {
  const lower = value.toLowerCase();

  if (
    lower.includes("online") ||
    lower.includes("live") ||
    lower.includes("ready") ||
    lower.includes("active") ||
    lower.includes("clear") ||
    lower.includes("ok") ||
    lower.includes("handled") ||
    lower.includes("seen") ||
    lower.includes("completed")
  ) {
    return "live";
  }

  if (
    lower.includes("safe") ||
    lower.includes("locked") ||
    lower.includes("dry-run") ||
    lower.includes("dry run") ||
    lower.includes("protected") ||
    lower.includes("guarded")
  ) {
    return "safe";
  }

  if (lower.includes("offline") || lower.includes("no signal")) {
    return "offline";
  }

  if (
    lower.includes("low") ||
    lower.includes("empty") ||
    lower.includes("detected") ||
    lower.includes("sensor check") ||
    lower.includes("blocked") ||
    lower.includes("calibrating")
  ) {
    return "warning";
  }

  return "pending";
}

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_32%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_11%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_36%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_11%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-black/[0.16] text-[var(--gc-soft)]";
}

function StatusPill({
  label,
  tone,
  icon: Icon,
}: {
  label: string;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  const visibleLabel = displayStatus(label);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.018)]",
        toneClass(tone ?? statusTone(visibleLabel)),
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="truncate">{visibleLabel}</span>
    </span>
  );
}

function HeaderNavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="premium-btn-secondary inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function ProfileInput({
  label,
  name,
  defaultValue,
  placeholder,
  readOnly = false,
  type = "text",
  className,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  readOnly?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "group relative block min-w-0 overflow-hidden rounded-[26px] border p-4",
        "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.016))]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_16px_34px_rgba(0,0,0,0.14)]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,color-mix(in_srgb,var(--gc-accent)_7%,transparent),transparent_42%)] opacity-0 transition duration-300 group-focus-within:opacity-100" />

      <span className="relative z-10 block truncate text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
        {label}
      </span>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "relative z-10 mt-3 h-12 w-full rounded-[18px] border px-4 text-sm font-semibold outline-none transition",
          "border-[color-mix(in_srgb,var(--gc-border)_66%,transparent)]",
          "bg-black/[0.22] placeholder:text-[var(--gc-muted)]",
          readOnly
            ? "cursor-not-allowed text-[var(--gc-soft)] opacity-80"
            : "text-[var(--gc-text)] focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-black/[0.28] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_7%,transparent)]",
        )}
      />
    </label>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "pending",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-0.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_18px_38px_rgba(0,0,0,0.16)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.014))]"
          : toneClass(tone),
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,color-mix(in_srgb,var(--gc-accent)_8%,transparent),transparent_40%)] opacity-0 transition duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p
        className="relative z-10 mt-5 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.9rem,3vw,3rem)] font-semibold leading-none tracking-[-0.065em] text-[var(--gc-text)]"
        title={String(value)}
      >
        {value}
      </p>

      <p className="relative z-10 mt-3 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </div>
  );
}

function InfoTile({
  title,
  description,
  icon: Icon,
  tone = "pending",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[26px] border p-5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_16px_34px_rgba(0,0,0,0.14)]",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.014))]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-black/18 text-[var(--gc-accent-2)]">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <h4 className="truncate text-base font-semibold tracking-[-0.045em] text-[var(--gc-text)]">
            {title}
          </h4>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gc-soft)]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function SaveButton({
  isSaving,
  children,
}: {
  isSaving: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className={cn(
        "premium-btn inline-flex min-h-14 items-center justify-center gap-3 rounded-[22px] px-7 py-4 text-sm font-semibold",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {isSaving ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <Save className="h-5 w-5" />
      )}
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const {
    devices,
    selectedDevice,
    settings,
    session,
    updateProfileName,
    updateSetting,
  } = useAppState();

  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profileName = session.userName || settings.ownerName || "Operator";
  const accountEmail = session.email || "No email";
  const connectedCount = devices.length;
  const onlineCount = devices.filter((device) => device.status === "Online").length;

  const formKey = useMemo(
    () =>
      [
        profileName,
        accountEmail,
        settings.workspaceName,
        settings.projectName,
        settings.mainPlantLabel,
      ].join("|"),
    [
      profileName,
      accountEmail,
      settings.workspaceName,
      settings.projectName,
      settings.mainPlantLabel,
    ],
  );

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const nextName = String(formData.get("profileName") ?? "").trim();
    const nextWorkspaceName = String(formData.get("workspaceName") ?? "").trim();
    const nextProjectName = String(formData.get("projectName") ?? "").trim();
    const nextMainPlantLabel = String(
      formData.get("mainPlantLabel") ?? "",
    ).trim();

    if (!nextName) {
      setError("Profile name is required.");
      setFeedback("");
      return;
    }

    setIsSaving(true);
    setError("");
    setFeedback("");

    try {
      await updateProfileName(nextName);

      updateSetting(
        "workspaceName",
        nextWorkspaceName || settings.workspaceName || "GreenCloud",
      );

      updateSetting(
        "projectName",
        nextProjectName || settings.projectName || "GreenCloud",
      );

      updateSetting(
        "mainPlantLabel",
        nextMainPlantLabel || settings.mainPlantLabel || "Primary plant",
      );

      setFeedback("Profile updated successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profile update failed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logoutFromGreenCloud();
      router.replace("/auth");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <AuthGate>
      <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
        <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),radial-gradient(circle_at_82%_18%,color-mix(in_srgb,var(--gc-accent-2)_10%,transparent),transparent_28%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

        <AmbientOrbs themePreset={settings.themePreset} />

        <div className="fixed inset-0 -z-30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-accent)_5%,transparent),transparent_24%,color-mix(in_srgb,var(--gc-accent-2)_4%,transparent)_74%,transparent)]" />

        {settings.leafAmbience ? (
          <LeafFallOverlay mode={settings.ambienceMode} />
        ) : null}

        <div className="relative z-10 mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8">
          <header className="premium-noise sticky top-4 z-40 overflow-hidden rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_86%,black)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.38),0_0_44px_var(--gc-glow)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_srgb,var(--gc-accent)_8%,transparent),transparent_36%),radial-gradient(circle_at_86%_0%,color-mix(in_srgb,var(--gc-accent-2)_6%,transparent),transparent_36%)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="min-w-0 shrink-0">
                <BrandMark
                  title={settings.workspaceName || "GreenCloud"}
                  subtitle="SMART IRRIGATION WORKSPACE"
                  compact
                  card
                />
              </Link>

              <nav className="flex flex-wrap items-center gap-2">
                <HeaderNavLink href="/" label="Home" icon={Home} />
                <HeaderNavLink href="/dashboard" label="Dashboard" icon={Cpu} />
                <HeaderNavLink href="/settings" label="Settings" icon={Settings2} />

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-white/[0.035] px-4 text-sm font-semibold text-[var(--gc-soft)] transition hover:border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] hover:text-[var(--gc-text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </button>
              </nav>
            </div>
          </header>

          <div className="mt-6 space-y-5">
            <GlassCard className="overflow-hidden p-0">
              <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_srgb,var(--gc-accent)_10%,transparent),transparent_38%),radial-gradient(circle_at_90%_12%,color-mix(in_srgb,var(--gc-accent-2)_8%,transparent),transparent_34%)]" />

                <div className="relative z-10 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SectionBadge>User profile</SectionBadge>

                    <Link
                      href="/dashboard"
                      className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to app
                    </Link>
                  </div>

                  <h1 className="mt-5 max-w-[14ch] text-[clamp(3rem,5.8vw,6.4rem)] font-semibold leading-[0.88] tracking-[-0.085em] text-[var(--gc-text)]">
                    Account and workspace identity.
                  </h1>

                  <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                    Update the visible profile name, workspace labels and
                    account metadata used across GreenCloud.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <StatusPill
                      label={session.signedIn ? "Signed in" : "Offline"}
                      tone={session.signedIn ? "live" : "offline"}
                      icon={ShieldCheck}
                    />

                    <StatusPill
                      label="Firebase profile"
                      tone="safe"
                      icon={Database}
                    />

                    <StatusPill
                      label="Private workspace"
                      tone="safe"
                      icon={UserRound}
                    />
                  </div>
                </div>

                <div className="relative z-10 grid min-w-0 gap-4 sm:grid-cols-2">
                  <SummaryCard
                    label="Profile"
                    value={profileName}
                    detail="Visible account display name."
                    icon={UserRound}
                    tone="live"
                  />

                  <SummaryCard
                    label="Email"
                    value={accountEmail}
                    detail="Firebase Auth account email."
                    icon={Mail}
                    tone="safe"
                  />

                  <SummaryCard
                    label="Devices"
                    value={connectedCount}
                    detail="Paired ESP32 devices."
                    icon={Cpu}
                    tone={connectedCount > 0 ? "live" : "pending"}
                  />

                  <SummaryCard
                    label="Online"
                    value={onlineCount}
                    detail="Devices currently online."
                    icon={Wifi}
                    tone={onlineCount > 0 ? "live" : "pending"}
                  />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <SectionBadge>Edit profile</SectionBadge>

                  <h2 className="mt-4 text-[clamp(2.4rem,4.2vw,4.6rem)] font-semibold leading-none tracking-[-0.075em] text-[var(--gc-text)]">
                    Update account details
                  </h2>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--gc-soft)] sm:text-base">
                    Profile name updates Firebase Auth display name. Workspace
                    and plant labels update GreenCloud UI labels instantly.
                  </p>
                </div>

                <StatusPill label="Editable" tone="live" icon={Sparkles} />
              </div>

              <form key={formKey} onSubmit={handleSaveProfile} className="mt-7">
                <div className="grid gap-4 xl:grid-cols-2">
                  <ProfileInput
                    label="Profile name"
                    name="profileName"
                    defaultValue={profileName}
                    placeholder="Ahmet"
                  />

                  <ProfileInput
                    label="Account email"
                    name="email"
                    defaultValue={accountEmail}
                    placeholder="you@example.com"
                    readOnly
                    type="email"
                  />

                  <ProfileInput
                    label="Workspace name"
                    name="workspaceName"
                    defaultValue={settings.workspaceName || "GreenCloud"}
                    placeholder="GreenCloud Workspace"
                  />

                  <ProfileInput
                    label="Project name"
                    name="projectName"
                    defaultValue={settings.projectName || "GreenCloud"}
                    placeholder="GreenCloud"
                  />

                  <ProfileInput
                    label="Main plant label"
                    name="mainPlantLabel"
                    defaultValue={settings.mainPlantLabel || "Primary plant"}
                    placeholder="Main Pot"
                    className="xl:col-span-2"
                  />
                </div>

                {error ? (
                  <div className="mt-5 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-warn)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_11%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--gc-text)]">
                    {error}
                  </div>
                ) : null}

                {!error && feedback ? (
                  <div className="mt-5 rounded-[22px] border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_11%,transparent)] px-4 py-3 text-sm font-semibold text-[var(--gc-text)]">
                    {feedback}
                  </div>
                ) : null}

                <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap gap-2">
                    <StatusPill
                      label={selectedDevice.name}
                      tone="safe"
                      icon={Leaf}
                    />

                    <StatusPill
                      label={selectedDevice.status}
                      tone={statusTone(selectedDevice.status)}
                      icon={Wifi}
                    />
                  </div>

                  <SaveButton isSaving={isSaving}>
                    {isSaving ? "Saving..." : "Save profile"}
                  </SaveButton>
                </div>
              </form>
            </GlassCard>

            <div className="grid gap-5 lg:grid-cols-3">
              <InfoTile
                title="Private UID"
                description="Your paired devices, settings and activity stay under your Firebase account path."
                icon={ShieldCheck}
                tone="safe"
              />

              <InfoTile
                title="Workspace labels"
                description="Labels appear across dashboard, devices, automation, settings and landing pages."
                icon={Leaf}
                tone="live"
              />

              <InfoTile
                title="Firebase sync"
                description="Profile changes are saved through the GreenCloud state provider."
                icon={Database}
                tone="pending"
              />
            </div>
          </div>
        </div>
      </main>
    </AuthGate>
  );
}