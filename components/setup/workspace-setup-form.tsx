"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Database, Leaf, ShieldCheck } from "lucide-react";

import SetupShell from "@/components/setup/setup-shell";
import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";

export default function WorkspaceSetupForm() {
  const router = useRouter();
  const { settings, session, saveWorkspaceIdentity } = useAppState();

  const [workspaceName, setWorkspaceName] = useState(settings.workspaceName);
  const [projectName, setProjectName] = useState(settings.projectName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [mainPlantLabel, setMainPlantLabel] = useState(settings.mainPlantLabel);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (ownerName === "Operator" && session.userName) {
      setOwnerName(session.userName);
    }
  }, [ownerName, session.userName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      saveWorkspaceIdentity({
        workspaceName,
        projectName,
        ownerName,
        mainPlantLabel,
      });
      router.push("/setup/preferences");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Workspace identity could not be saved safely.",
      );
      setIsSaving(false);
    }
  }

  return (
    <SetupShell
      currentStep={1}
      title="Define the workspace context."
      description="These labels appear across telemetry, device management and the activity record. They can be edited later in Settings."
    >
      <div className="gc2-grid items-start">
        <form
          onSubmit={handleSubmit}
          className="col-span-12 grid gap-5 lg:col-span-7"
        >
          <Gc2Surface tone="raised" className="grid gap-5 p-5 sm:p-7">
            <Gc2Input
              label="Workspace name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Home greenhouse"
              autoComplete="organization"
              maxLength={80}
              required
              hint="The private operating space that owns devices, rules and activity."
            />

            <Gc2Input
              label="Garden or project name"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Balcony growing project"
              maxLength={80}
              required
              hint="A readable project label used in summaries and reports."
            />

            <Gc2Input
              label="Workspace owner"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              placeholder="Garden operator"
              autoComplete="name"
              maxLength={60}
              required
              hint="The person responsible for this GreenCloud workspace."
            />

            <Gc2Input
              label="Primary plant or zone"
              value={mainPlantLabel}
              onChange={(event) => setMainPlantLabel(event.target.value)}
              placeholder="Tomato bed A"
              maxLength={80}
              required
              hint="The first label shown before a physical ESP32 is paired."
            />
          </Gc2Surface>

          {errorMessage ? (
            <Gc2Notice tone="danger" title="Workspace setup was blocked">
              {errorMessage}
            </Gc2Notice>
          ) : null}

          <div className="flex justify-end">
            <Gc2Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving workspace..." : "Save and continue"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2Button>
          </div>
        </form>

        <aside className="col-span-12 grid gap-4 lg:col-span-5">
          <Gc2Surface className="p-5">
            <div className="flex items-start gap-3">
              <Database
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]"
              />
              <div>
                <h3 className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                  One private data path
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  Workspace labels are stored with the authenticated Firebase user,
                  not shared with other GreenCloud accounts.
                </p>
              </div>
            </div>
          </Gc2Surface>

          <Gc2Surface className="p-5">
            <div className="flex items-start gap-3">
              <Leaf
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]"
              />
              <div>
                <h3 className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                  Labels before telemetry
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  The first dashboard can explain what is missing before any sensor
                  reading exists.
                </p>
              </div>
            </div>
          </Gc2Surface>

          <Gc2Surface className="p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-success)]"
              />
              <div>
                <h3 className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                  Strict text validation
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  Unsupported control characters and oversized identity fields are
                  rejected before they reach the workspace state.
                </p>
              </div>
            </div>
          </Gc2Surface>
        </aside>
      </div>
    </SetupShell>
  );
}
