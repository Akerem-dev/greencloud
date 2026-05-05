"use client";

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Cpu,
  Home,
  Leaf,
  LogOut,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import AmbientOrbs from "@/components/effects/ambient-orbs";
import LeafFallOverlay from "@/components/effects/leaf-fall-overlay";
import GlassCard from "@/components/shared/glass-card";
import SectionBadge from "@/components/shared/section-badge";
import { useAppState } from "@/components/providers/app-state-provider";
import { logoutFromGreenCloud } from "@/lib/firebase-auth";
import { cn } from "@/lib/utils";

type Tone = "live" | "safe" | "pending" | "warning" | "offline";

function toneClass(tone: Tone) {
  if (tone === "live") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_13%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "safe") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_12%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_14%,transparent)] text-[var(--gc-text)]";
  }

  if (tone === "offline") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_12%,transparent)] text-[var(--gc-text)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] text-[var(--gc-soft)]";
}

function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        toneClass(tone),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

function ProfileField({
  label,
  name,
  defaultValue,
  placeholder,
  readOnly = false,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="block rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-4">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gc-muted)]">
        {label}
      </span>

      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "mt-3 h-12 w-full rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-black/18 px-4 text-sm outline-none transition placeholder:text-[var(--gc-muted)]",
          readOnly
            ? "text-[var(--gc-soft)]"
            : "text-[var(--gc-text)] focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:bg-white/[0.045]",
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
        "min-w-0 rounded-[26px] border p-5",
        tone === "pending"
          ? "border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)]"
          : toneClass(tone),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] opacity-75">
          {label}
        </p>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.8rem,2.8vw,3rem)] font-semibold leading-none tracking-[-0.06em] text-[var(--gc-text)]">
        {value}
      </p>

      <p className="mt-2 line-clamp-2 text-sm leading-6 opacity-75">
        {detail}
      </p>
    </div>
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
    const nextMainPlantLabel = String(formData.get("mainPlantLabel") ?? "").trim();

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
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--gc-bg)] text-[var(--gc-text)]">
      <div className="fixed inset-0 -z-40 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--gc-accent)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--gc-bg-2),var(--gc-bg))]" />

      <AmbientOrbs themePreset={settings.themePreset} />

      {settings.leafAmbience ? (
        <LeafFallOverlay mode={settings.ambienceMode} />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="premium-noise sticky top-4 z-40 rounded-[30px] border border-[color-mix(in_srgb,var(--gc-border)_94%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_82%,black)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.38),0_0_44px_var(--gc-glow)] backdrop-blur-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link
  href="/"
  className="group flex min-w-0 items-center gap-4 rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_94%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_10%,transparent),color-mix(in_srgb,var(--gc-bg)_82%,black))] px-5 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.28),0_0_26px_var(--gc-glow)] transition hover:border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] hover:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-accent)_14%,transparent),color-mix(in_srgb,var(--gc-bg)_88%,black))]"
>
  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] shadow-[0_0_26px_var(--gc-glow)]">
    <Image
      src="/logo.png"
      alt="GreenCloud logo"
      fill
      sizes="56px"
      className="object-contain p-2.5"
      priority
    />
  </div>

  <div className="min-w-0">
    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.30em] text-[var(--gc-muted)]">
      SMART IRRIGATION WORKSPACE
    </p>

    <h1 className="truncate text-[clamp(1.7rem,2.2vw,2.25rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
      GreenCloud
    </h1>
  </div>
</Link>

            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>

              <Link
                href="/dashboard"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Cpu className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/settings"
                className="premium-btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Settings2 className="h-4 w-4" />
                Settings
              </Link>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-white/[0.035] px-4 py-2 text-sm font-semibold text-[var(--gc-soft)] transition hover:border-[color-mix(in_srgb,var(--gc-danger)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--gc-danger)_10%,transparent)] hover:text-[var(--gc-text)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </nav>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
              <div className="min-w-0">
                <SectionBadge>User profile</SectionBadge>

                <h2 className="mt-5 max-w-[13ch] text-[clamp(2.8rem,5vw,5.8rem)] font-semibold leading-[0.88] tracking-[-0.08em] text-[var(--gc-text)]">
                  Account and workspace identity.
                </h2>

                <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--gc-soft)] sm:text-lg">
                  Update the profile name shown on the landing page, app header,
                  workspace cards, and account badge.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <StatusPill
                    label={session.signedIn ? "Signed in" : "Offline"}
                    tone={session.signedIn ? "live" : "offline"}
                  />
                  <StatusPill label="Firebase profile" tone="safe" />
                  <StatusPill label="Private workspace" tone="safe" />
                </div>
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
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

                <h3 className="mt-4 text-[clamp(2rem,3vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--gc-text)]">
                  Update account details
                </h3>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--gc-soft)]">
                  Profile name updates Firebase Auth display name. Workspace
                  labels update GreenCloud UI labels.
                </p>
              </div>

              <StatusPill label="Editable" tone="live" />
            </div>

            <form key={formKey} onSubmit={handleSaveProfile} className="mt-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <ProfileField
                  label="Profile name"
                  name="profileName"
                  defaultValue={profileName}
                  placeholder="Ahmet"
                />

                <ProfileField
                  label="Account email"
                  name="email"
                  defaultValue={accountEmail}
                  placeholder="you@example.com"
                  readOnly
                  type="email"
                />

                <ProfileField
                  label="Workspace name"
                  name="workspaceName"
                  defaultValue={settings.workspaceName || "GreenCloud"}
                  placeholder="GreenCloud Workspace"
                />

                <ProfileField
                  label="Project name"
                  name="projectName"
                  defaultValue={settings.projectName || "GreenCloud"}
                  placeholder="GreenCloud"
                />

                <div className="lg:col-span-2">
                  <ProfileField
                    label="Main plant label"
                    name="mainPlantLabel"
                    defaultValue={settings.mainPlantLabel || "Primary plant"}
                    placeholder="Main Pot"
                  />
                </div>
              </div>

              {error ? (
                <p className="mt-4 text-sm font-semibold text-[var(--gc-warn)]">
                  {error}
                </p>
              ) : null}

              {!error && feedback ? (
                <p className="mt-4 text-sm font-semibold text-[var(--gc-accent-2)]">
                  {feedback}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={selectedDevice.name} tone="safe" />
                  <StatusPill label={selectedDevice.status} tone="pending" />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="premium-btn inline-flex items-center justify-center gap-3 rounded-[22px] px-6 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <ShieldCheck className="h-5 w-5 text-[var(--gc-accent-2)]" />
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                  Private UID
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                  Your devices and settings stay under your Firebase account.
                </p>
              </div>

              <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <Leaf className="h-5 w-5 text-[var(--gc-accent-2)]" />
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                  Workspace labels
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                  Labels appear across dashboard, devices, settings and landing.
                </p>
              </div>

              <div className="rounded-[24px] border border-[color-mix(in_srgb,var(--gc-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_72%,black)] p-5">
                <Wifi className="h-5 w-5 text-[var(--gc-accent-2)]" />
                <h4 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[var(--gc-text)]">
                  Firebase sync
                </h4>
                <p className="mt-2 text-sm leading-6 text-[var(--gc-soft)]">
                  Changes are saved through the GreenCloud state provider.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}   