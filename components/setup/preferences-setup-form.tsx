"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  Gauge,
  Monitor,
  Moon,
  Radio,
  Sparkles,
  SunMedium,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import SetupShell from "@/components/setup/setup-shell";
import {
  type NotificationMode,
  type ThemePreset,
  useAppState,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Status } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";
import { cn } from "@/lib/utils";

type NextDestination = "pair" | "dashboard";

const appearanceOptions: Array<{
  value: ThemePreset;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "golden-hour",
    label: "Warm technical",
    description: "The current GreenCloud default with warm operational contrast.",
    icon: SunMedium,
  },
  {
    value: "forest-mist",
    label: "Balanced botanical",
    description: "Soft contrast for regular daytime operation.",
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
    description: "A cooler system tone for telemetry-heavy surfaces.",
    icon: Radio,
  },
];

function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
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

export default function PreferencesSetupForm() {
  const router = useRouter();
  const { settings, updateSettings } = useAppState();

  const [themePreset, setThemePreset] = useState<ThemePreset>(settings.themePreset);
  const [notificationMode, setNotificationMode] = useState<NotificationMode>(
    settings.notificationMode,
  );
  const [animations, setAnimations] = useState(settings.animations);
  const [compactMode, setCompactMode] = useState(settings.compactMode);
  const [destination, setDestination] = useState<NextDestination>("pair");
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    updateSettings({
      themePreset,
      notificationMode,
      animations,
      compactMode,
    });

    router.push(destination === "pair" ? "/devices/add" : "/dashboard");
  }

  return (
    <SetupShell
      currentStep={2}
      title="Choose the essential operating preferences."
      description="Only the settings needed for the first session appear here. Advanced appearance, ambience and data controls remain in Settings."
    >
      <form onSubmit={handleSubmit} className="grid gap-6">
        <Gc2Surface tone="raised" className="p-5 sm:p-7">
          <header className="border-b border-[var(--gc2-line)] pb-5">
            <p className="gc2-kicker">Appearance</p>
            <h3 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
              Select an operating contrast.
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
              GreenCloud keeps the same product structure in every mode; only the
              environmental contrast changes.
            </p>
          </header>

          <div className="mt-5 grid gap-3 xl:grid-cols-4">
            {appearanceOptions.map((option) => (
              <ChoiceCard
                key={option.value}
                selected={themePreset === option.value}
                onClick={() => setThemePreset(option.value)}
                title={option.label}
                description={option.description}
                icon={option.icon}
              />
            ))}
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-7">
            <header className="border-b border-[var(--gc2-line)] pb-5">
              <p className="gc2-kicker">Daily behavior</p>
              <h3 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                Keep feedback useful, not ornamental.
              </h3>
            </header>

            <div className="mt-5 grid gap-3">
              <ChoiceCard
                selected={notificationMode === "priority"}
                onClick={() => setNotificationMode("priority")}
                title="Priority notifications"
                description="Surface pump, sensor and safety events before routine updates."
                icon={Bell}
              />
              <ChoiceCard
                selected={notificationMode === "all"}
                onClick={() => setNotificationMode("all")}
                title="All workspace notifications"
                description="Include routine telemetry and every recorded workspace event."
                icon={BellRing}
              />
            </div>

            <div className="mt-5 divide-y divide-[var(--gc2-line)] border-y border-[var(--gc2-line)]">
              <label className="flex cursor-pointer items-start justify-between gap-5 py-4">
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink)]">
                    <Sparkles aria-hidden="true" className="h-4 w-4 text-[var(--gc2-moss)]" />
                    Interface motion
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--gc2-ink-soft)]">
                    Use brief 120–200 ms transitions for state and disclosure changes.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={animations}
                  onChange={(event) => setAnimations(event.target.checked)}
                  className="mt-1 h-5 w-5 accent-[var(--gc2-moss)]"
                />
              </label>

              <label className="flex cursor-pointer items-start justify-between gap-5 py-4">
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-[var(--gc2-ink)]">
                    <Gauge aria-hidden="true" className="h-4 w-4 text-[var(--gc2-moss)]" />
                    Compact data density
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--gc2-ink-soft)]">
                    Reduce row spacing where long device and activity lists appear.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(event) => setCompactMode(event.target.checked)}
                  className="mt-1 h-5 w-5 accent-[var(--gc2-moss)]"
                />
              </label>
            </div>
          </Gc2Surface>

          <Gc2Surface className="col-span-12 p-5 sm:p-6 lg:col-span-5">
            <header className="border-b border-[var(--gc2-line)] pb-5">
              <p className="gc2-kicker">First device hand-off</p>
              <h3 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                What should open next?
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                Pairing is always a dedicated full-screen workflow, never a hidden
                card below the dashboard.
              </p>
            </header>

            <div className="mt-5 grid gap-3">
              <ChoiceCard
                selected={destination === "pair"}
                onClick={() => setDestination("pair")}
                title="Pair the first ESP32 now"
                description="Open the secure OLED-code pairing studio."
                icon={Wifi}
              />
              <ChoiceCard
                selected={destination === "dashboard"}
                onClick={() => setDestination("dashboard")}
                title="Continue without a device"
                description="Open the empty workspace state and pair later."
                icon={Monitor}
              />
            </div>
          </Gc2Surface>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--gc2-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Gc2LinkButton href="/setup/workspace" variant="quiet">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to workspace
          </Gc2LinkButton>
          <Gc2Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving preferences..." : "Finish setup"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Gc2Button>
        </div>
      </form>
    </SetupShell>
  );
}
