"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  KeyRound,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
  Wifi,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import {
  Gc2Metric,
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";

function accountInitials(value: string) {
  const words = value
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2);

  return words.length > 0
    ? words.map((word) => Array.from(word)[0]?.toUpperCase() ?? "").join("")
    : "GC";
}

export default function Gc2AccountProfile() {
  const {
    devices,
    settings,
    session,
    updateProfileName,
    logoutFromWorkspace,
  } = useAppState();

  const profileName = session.userName || settings.ownerName || "Operator";
  const accountEmail = session.email || "";
  const accountEmailLabel = accountEmail || "No authenticated email exposed";

  const [displayName, setDisplayName] = useState(profileName);
  const [savedName, setSavedName] = useState(profileName);
  const [isSaving, setIsSaving] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const onlineCount = devices.filter((device) => device.status === "Online").length;
  const syncingCount = devices.filter((device) => device.status === "Syncing").length;
  const nameChanged = displayName !== savedName;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSavedMessage("");
    setIsSaving(true);

    try {
      await updateProfileName(displayName);
      setSavedName(displayName);
      setSavedMessage("Firebase Auth display name was updated safely.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Profile name could not be updated safely.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function discardDraft() {
    setDisplayName(savedName);
    setErrorMessage("");
    setSavedMessage("");
  }

  function confirmSignOut() {
    setSignOutOpen(false);
    logoutFromWorkspace();
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker="Account identity"
          title="Profile data should describe the operator, not the whole workspace."
          description="Manage the Firebase Auth display name, inspect the authenticated email and leave the session safely. Workspace labels and interface preferences remain in Settings."
          actions={
            <>
              <Gc2LinkButton href="/settings" variant="quiet">
                Workspace settings
              </Gc2LinkButton>
              <Gc2Button variant="danger" onClick={() => setSignOutOpen(true)}>
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </Gc2Button>
            </>
          }
        />

        {errorMessage ? (
          <Gc2Notice
            tone="danger"
            title="Profile change was blocked safely"
            icon={<AlertTriangle className="h-5 w-5" />}
          >
            {errorMessage}
          </Gc2Notice>
        ) : null}

        {savedMessage ? (
          <Gc2Notice
            tone="success"
            title="Account profile saved"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {savedMessage}
          </Gc2Notice>
        ) : null}

        <Gc2Surface tone="raised" className="overflow-hidden p-0">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.74fr)] lg:items-end">
            <div className="grid gap-5 sm:grid-cols-[96px_minmax(0,1fr)] sm:items-center">
              <div className="grid h-24 w-24 place-items-center rounded-[var(--gc2-radius-lg)] border border-[var(--gc2-line-strong)] bg-[var(--gc2-forest)] text-2xl font-black tracking-[0.08em] text-[var(--gc2-surface)]">
                {accountInitials(profileName)}
              </div>
              <div>
                <p className="gc2-kicker">Authenticated operator</p>
                <h2 className="gc2-heading-md mt-2">{profileName}</h2>
                <p className="mt-2 break-all text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  {accountEmailLabel}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Gc2Status tone={session.signedIn ? "success" : "danger"}>
                    <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                    {session.signedIn ? "Firebase session active" : "Session unavailable"}
                  </Gc2Status>
                  <Gc2Status tone="info">
                    <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                    Email identity is read-only here
                  </Gc2Status>
                  <Gc2Status tone={onlineCount > 0 ? "success" : "neutral"}>
                    <Wifi aria-hidden="true" className="h-3.5 w-3.5" />
                    {onlineCount} online
                  </Gc2Status>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Gc2Metric
                label="Paired devices"
                value={devices.length}
                detail="Devices under this workspace"
              />
              <Gc2Metric
                label="Online now"
                value={onlineCount}
                detail={`${syncingCount} currently syncing`}
              />
              <Gc2Metric
                label="Workspace"
                value={settings.workspaceName || "GreenCloud"}
                detail="Edited in Settings"
              />
              <Gc2Metric
                label="Profile draft"
                value={nameChanged ? "Unsaved" : "Saved"}
                detail={nameChanged ? "Review display name" : "Matches current account"}
              />
            </div>
          </div>
        </Gc2Surface>

        <div className="gc2-grid items-start">
          <form
            onSubmit={handleSave}
            className="col-span-12 grid gap-5 lg:col-span-7"
          >
            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Firebase display identity</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Edit only the visible account name
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                  The name is normalized, repeated whitespace is collapsed, unsafe control or Bidi characters are rejected and the final value is limited to 60 characters.
                </p>
              </header>

              <div className="mt-5 grid gap-5">
                <Gc2Input
                  label="Profile display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  required
                  hint="Stored as the Firebase Auth display name."
                />

                <Gc2Input
                  label="Account email"
                  value={accountEmail}
                  readOnly
                  type={accountEmail ? "email" : "text"}
                  autoComplete="email"
                  placeholder="No authenticated email exposed"
                  hint="GreenCloud does not expose an email-change operation in the current account adapter."
                />
              </div>
            </Gc2Surface>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Gc2Button
                variant="quiet"
                onClick={discardDraft}
                disabled={!nameChanged || isSaving}
              >
                Discard name draft
              </Gc2Button>
              <Gc2Button type="submit" disabled={!nameChanged || isSaving}>
                <Save aria-hidden="true" className="h-4 w-4" />
                {isSaving ? "Saving profile..." : "Save display name"}
              </Gc2Button>
            </div>
          </form>

          <aside className="col-span-12 grid gap-5 lg:col-span-5">
            <Gc2Surface className="p-5 sm:p-6">
              <header className="border-b border-[var(--gc2-line)] pb-5">
                <p className="gc2-kicker">Account boundaries</p>
                <h2 className="mt-2 text-lg font-bold text-[var(--gc2-ink)]">
                  What this screen can and cannot change
                </h2>
              </header>

              <div className="mt-5 divide-y divide-[var(--gc2-line)]">
                <div className="flex items-start gap-3 py-4 first:pt-0">
                  <UserRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Display name
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      Editable through the validated profile adapter and Firebase Auth update path.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-4">
                  <Mail aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Account email
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      Read-only because the current adapter does not expose verified email mutation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-4">
                  <Building2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Workspace identity
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      Workspace, project, owner and plant labels stay in the dedicated Settings screen.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-4 last:pb-0">
                  <KeyRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-warning)]" />
                  <div>
                    <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                      Password recovery
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                      Recovery remains a separate authentication workflow and is not simulated in Profile.
                    </p>
                  </div>
                </div>
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <div className="flex items-start gap-3">
                <Database aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-moss)]" />
                <div>
                  <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                    Authenticated persistence only
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                    Profile updates and sign-out use the existing AppState account actions. This screen does not import Firebase SDK functions directly.
                  </p>
                </div>
              </div>
            </Gc2Surface>

            <Gc2Surface className="p-5">
              <div className="flex items-start gap-3">
                <Cpu aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
                <div className="min-w-0">
                  <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">
                    Private workspace scope
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
                    {devices.length > 0
                      ? `${devices.length} paired device${devices.length === 1 ? "" : "s"} remain associated with the authenticated workspace after profile-name changes.`
                      : "No physical devices are currently associated with this workspace."}
                  </p>
                  <Gc2LinkButton href="/devices" variant="quiet" className="mt-4">
                    Review device scope
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>
              </div>
            </Gc2Surface>
          </aside>
        </div>

        {signOutOpen ? (
          <Gc2Dialog
            open
            onClose={() => setSignOutOpen(false)}
            title="Sign out of GreenCloud?"
            description="The current Firebase session will end on this browser. Paired devices and workspace data are not deleted."
            footer={
              <>
                <Gc2Button variant="quiet" onClick={() => setSignOutOpen(false)}>
                  Keep session
                </Gc2Button>
                <Gc2Button variant="danger" onClick={confirmSignOut}>
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Confirm sign out
                </Gc2Button>
              </>
            }
          >
            <Gc2Notice
              tone="warning"
              title="Session action only"
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              Signing out does not unpair ESP32 devices, clear activity or reset workspace settings.
            </Gc2Notice>
          </Gc2Dialog>
        ) : null}
      </div>
    </Gc2ProtectedShell>
  );
}
