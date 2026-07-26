"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  BellRing,
  CheckCircle2,
  Database,
  Gauge,
  Leaf,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Wind,
  type LucideIcon,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  type AmbienceMode,
  type NotificationMode,
  type ThemePreset,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";
import { cn } from "@/lib/utils";

const APPEARANCE_OPTIONS: Array<{
  value: ThemePreset;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "golden-hour",
    label: "Warm technical",
    description: "Warm field-journal contrast for everyday operation.",
    icon: SunMedium,
  },
  {
    value: "forest-mist",
    label: "Balanced botanical",
    description: "Softer green contrast for long monitoring sessions.",
    icon: Monitor,
  },
  {
    value: "midnight-moss",
    label: "Low-light console",
    description: "Deeper contrast for dim rooms and night checks.",
    icon: Moon,
  },
  {
    value: "rain-glass",
    label: "Cool technical",
    description: "A cooler telemetry-oriented operating contrast.",
    icon: Gauge,
  },
];

const AMBIENCE_OPTIONS: Array<{
  value: AmbienceMode;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "calm",
    label: "Calm",
    description: "No ambient background cue.",
    icon: ShieldCheck,
  },
  {
    value: "leaves",
    label: "Leaves",
    description: "A restrained botanical cue where supported.",
    icon: Leaf,
  },
  {
    value: "rain",
    label: "Rain",
    description: "A restrained rain cue where supported.",
    icon: Sparkles,
  },
  {
    value: "mist",
    label: "Mist",
    description: "A low-contrast mist cue where supported.",
    icon: Monitor,
  },
  {
    value: "wind",
    label: "Wind",
    description: "A subtle motion cue where supported.",
    icon: Wind,
  },
];

function ChoiceCard({
  selected,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "grid w-full grid-cols-[40px_minmax(0,1fr)_auto] gap-3 rounded-[var(--gc2-radius-md)] border p-4 text-left transition",
        selected
          ? "border-[var(--gc2-moss)] bg-[var(--gc2-moss-soft)]"
          : "border-[var(--gc2-line)] bg-[var(--gc2-surface)] hover:border-[var(--gc2-line-strong)]",
      )}
    >
      <span className="grid h-10 w-10 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-surface-raised)] text-[var(--gc2-moss-strong)]">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--gc2-ink)]">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-[var(--gc2-ink-soft)]">
          {description}
        </span>
      </span>
      <Gc2Status tone={selected ? "success" : "neutral"}>
        {selected ? "Selected" : "Choose"}
      </Gc2Status>
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 border-b border-[var(--gc2-line)] py-4 first:pt-0 last:border-b-0 last:pb-0">
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink)]">
          <span className="text-[var(--gc2-moss)]">{icon}</span>
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-[var(--gc2-ink-soft)]">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--gc2-moss)]"
      />
    </label>
  );
}

export default function Gc2WorkspaceSettings() {
  const { settings, updateSettings, saveWorkspaceIdentity } = useAppState();

  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [projectName, setProjectName] = useState(settings.projectName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [mainPlantLabel, setMainPlantLabel] = useState(settings.mainPlantLabel);
  const [themePreset, setThemePreset] = useState<ThemePreset>(settings.themePreset);
  const [notificationMode, setNotificationMode] = useState<NotificationMode>(
    settings.notificationMode,
  );
  const [animations, setAnimations] = useState(settings.animations);
  const [compactMode, setCompactMode] = useState(settings.compactMode);
  const [leafAmbience, setLeafAmbience] = useState(settings.leafAmbience);
  const [ambienceMode, setAmbienceMode] = useState<AmbienceMode>(
    settings.ambienceMode,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const identityChanged =
    workspaceName !== settings.workspaceName ||
    projectName !== settings.projectName ||
    ownerName !== settings.ownerName ||
    mainPlantLabel !== settings.mainPlantLabel;

  const preferencesChanged =
    themePreset !== settings.themePreset ||
    notificationMode !== settings.notificationMode ||
    animations !== settings.animations ||
    compactMode !== settings.compactMode ||
    leafAmbience !== settings.leafAmbience ||
    ambienceMode !== settings.ambienceMode;

  const hasChanges = identityChanged || preferencesChanged;

  function restoreDraft() {
    setWorkspaceName(settings.workspaceName);
    setProjectName(settings.projectName);
    setOwnerName(settings.ownerName);
    setMainPlantLabel(settings.mainPlantLabel);
    setThemePreset(settings.themePreset);
    setNotificationMode(settings.notificationMode);
    setAnimations(settings.animations);
    setCompactMode(settings.compactMode);
    setLeafAmbience(settings.leafAmbience);
    setAmbienceMode(settings.ambienceMode);
    setErrorMessage("");
    setSavedMessage("");
  }

  function useCalmDefaults() {
    setThemePreset("golden-hour");
    setNotificationMode("priority");
    setAnimations(true);
    setCompactMode(false);
    setLeafAmbience(false);
    setAmbienceMode("calm");
    setSavedMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSavedMessage("");
    setIsSaving(true);

    try {
      saveWorkspaceIdentity({
        workspaceName,
        projectName,
        ownerName,
        mainPlantLabel,
      });

      updateSettings({
        themePreset,
        notificationMode,
        animations,
        compactMode,
        leafAmbience,
        ambienceMode,
      });

      setSavedMessage("Workspace identity and operating preferences were saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Workspace settings could not be saved safely.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Gc2ProtectedShell>
      <form onSubmit={handleSubmit} className="gc2-stack">
        <Gc2SectionHeading
          kicker="Workspace settings"
          title="Configuration should stay separated from physical control."
          description="Edit workspace identity, notification behavior and interface preferences here. Automation policy and device safety remain in their dedicated operational screens."
          actions={
            <>
              <Gc2LinkButton href="/automation" variant="quiet">
                Automation policy
              </Gc2LinkButton>
              <Gc2LinkButton href="/profile" variant="secondary">
                Profile
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Gc2LinkButton>
            </>
          }
        />

        {errorMessage ? (
          <Gc2Notice tone="danger" title="Settings change was blocked safely">
            {errorMessage}
          </Gc2Notice>
        ) : null}

        {savedMessage ? (
          <Gc2Notice
            tone="success"
            title="Workspace settings saved"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {savedMessage}
          </Gc2Notice>
        ) : null}

        <Gc2Surface tone="raised" className="overflow-hidden p-0">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)] lg:items-end">
            <div>
              <p className="gc2-kicker">Current configuration draft</p>
              <h2 className="gc2-heading-md mt-2">{workspaceName || "Unnamed workspace"}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Changes remain local to this form until Save settings is pressed. Identity text is validated before persistence, and preference enums and booleans pass through the existing settings adapter.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Gc2Metric
                label="Draft state"
                value={hasChanges ? "Unsaved" : "Saved"}
                detail={hasChanges ? "Review and save changes" : "Matches AppState"}
              />
              <Gc2Metric
                label="Notification scope"
                value={notificationMode === "priority" ? "Priority" : "All"}
                detail="Workspace event visibility"
              />
              <Gc2Metric
                label="Interface density"
                value={compactMode ? "Compact" : "Comfortable"}
                detail="List and table spacing"
              />
              <Gc2Metric
                label="Ambient cue"
                value={leafAmbience ? ambienceMode : "Calm"}
                detail="Optional supported background layer"
              />
            </div>
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <div className="col-span-12 grid gap-5 lg:col-span-7">
            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Workspace identity</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Labels used across devices, activity and reports
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  Required fields are normalized, whitespace is collapsed, and unsupported control or Bidi characters are rejected before saving.
                </p>
              </header>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Gc2Input
                  label="Workspace name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  maxLength={80}
                  required
                  autoComplete="organization"
                  hint="Maximum 80 characters."
                />
                <Gc2Input
                  label="Garden or project name"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  maxLength={80}
                  required
                  hint="Maximum 80 characters."
                />
                <Gc2Input
                  label="Workspace owner"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  maxLength={60}
                  required
                  autoComplete="name"
                  hint="Maximum 60 characters."
                />
                <Gc2Input
                  label="Primary plant or zone"
                  value={mainPlantLabel}
                  onChange={(event) => setMainPlantLabel(event.target.value)}
                  maxLength={80}
                  required
                  hint="Maximum 80 characters."
                />
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Operating contrast</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Choose one deliberate interface preset
                </h2>
              </header>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {APPEARANCE_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={themePreset === option.value}
                    title={option.label}
                    description={option.description}
                    icon={option.icon}
                    onClick={() => setThemePreset(option.value)}
                  />
                ))}
              </div>
            </Gc2Surface>
          </div>

          <aside className="col-span-12 grid gap-5 lg:col-span-5">
            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Daily behavior</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Feedback and information density
                </h2>
              </header>

              <div className="mt-5 grid gap-3">
                <ChoiceCard
                  selected={notificationMode === "priority"}
                  title="Priority notifications"
                  description="Surface pump, sensor and safety events before routine updates."
                  icon={Bell}
                  onClick={() => setNotificationMode("priority")}
                />
                <ChoiceCard
                  selected={notificationMode === "all"}
                  title="All workspace notifications"
                  description="Include routine telemetry and every recorded workspace event."
                  icon={BellRing}
                  onClick={() => setNotificationMode("all")}
                />
              </div>

              <div className="mt-5 border-y border-[var(--gc2-line)] py-4">
                <ToggleRow
                  title="Interface motion"
                  description="Use brief state and disclosure transitions."
                  checked={animations}
                  onChange={setAnimations}
                  icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
                />
                <ToggleRow
                  title="Compact data density"
                  description="Reduce row spacing for long device and activity lists."
                  checked={compactMode}
                  onChange={setCompactMode}
                  icon={<Gauge aria-hidden="true" className="h-4 w-4" />}
                />
                <ToggleRow
                  title="Ambient background cue"
                  description="Enable the selected restrained cue only on surfaces that support it."
                  checked={leafAmbience}
                  onChange={setLeafAmbience}
                  icon={<Leaf aria-hidden="true" className="h-4 w-4" />}
                />
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Optional ambient cue</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                  Keep decorative effects subordinate
                </h2>
              </header>
              <div className="mt-5 grid gap-3">
                {AMBIENCE_OPTIONS.map((option) => (
                  <ChoiceCard
                    key={option.value}
                    selected={ambienceMode === option.value}
                    title={option.label}
                    description={option.description}
                    icon={option.icon}
                    onClick={() => {
                      setAmbienceMode(option.value);
                      setLeafAmbience(option.value !== "calm");
                    }}
                  />
                ))}
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Database aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Existing persistence boundary
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      This screen does not write directly to Firebase. It uses the existing authenticated AppState adapters.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-[var(--gc2-line)] pt-4">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Strict safe-save contract
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      Unknown fields, invalid enums, conflicting aliases and malformed booleans are blocked before persistence.
                    </p>
                  </div>
                </div>
              </div>
            </Gc2Surface>
          </aside>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--gc2-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Gc2Button type="button" variant="quiet" onClick={restoreDraft} disabled={!hasChanges}>
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Discard draft
            </Gc2Button>
            <Gc2Button type="button" variant="secondary" onClick={useCalmDefaults}>
              Calm interface defaults
            </Gc2Button>
          </div>
          <Gc2Button type="submit" disabled={isSaving || !hasChanges}>
            <Save aria-hidden="true" className="h-4 w-4" />
            {isSaving ? "Saving settings..." : "Save settings"}
          </Gc2Button>
        </div>
      </form>
    </Gc2ProtectedShell>
  );
}
