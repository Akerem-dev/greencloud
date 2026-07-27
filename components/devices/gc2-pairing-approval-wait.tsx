"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Cpu,
  KeyRound,
  LockKeyhole,
  Radio,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import { Gc2Surface } from "@/components/ui/gc2-surface";

const APPROVAL_WINDOW_SECONDS = 90;

type PairingApprovalWaitProps = {
  code: string;
  deviceName: string;
  place: string;
  ownerLabel: string;
};

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function Gc2PairingApprovalWait({
  code,
  deviceName,
  place,
  ownerLabel,
}: PairingApprovalWaitProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(
        Math.min(
          APPROVAL_WINDOW_SECONDS,
          Math.floor((Date.now() - startedAt) / 1000),
        ),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingSeconds = Math.max(
    0,
    APPROVAL_WINDOW_SECONDS - elapsedSeconds,
  );
  const progress = useMemo(
    () => Math.min(100, (elapsedSeconds / APPROVAL_WINDOW_SECONDS) * 100),
    [elapsedSeconds],
  );

  const boundaries = [
    {
      label: "Signed-in owner",
      value: ownerLabel,
      icon: UserRound,
      tone: "success" as const,
    },
    {
      label: "Pending claim",
      value: code,
      icon: KeyRound,
      tone: "info" as const,
    },
    {
      label: "Hardware actor",
      value: "ESP32 approval required",
      icon: Cpu,
      tone: "warning" as const,
    },
    {
      label: "Canonical ownership",
      value: "Not written yet",
      icon: LockKeyhole,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="gc2-grid items-start">
      <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
        <header className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="gc2-kicker">Hardware confirmation</p>
              <h2 className="gc2-heading-md mt-2">Waiting for ESP32 approval.</h2>
              <p className="gc2-copy mt-3 max-w-2xl">
                The user-scoped claim exists, but GreenCloud will not finalize ownership until the verified controller approves it.
              </p>
            </div>
            <Gc2Status tone="info">Approval pending</Gc2Status>
          </div>
        </header>

        <div className="grid gap-6 p-5 sm:p-7">
          <div className="grid gap-4 border-b border-[var(--gc2-line)] pb-6 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
            <div>
              <p className="gc2-kicker">Active OLED code</p>
              <p className="gc2-data mt-2 text-3xl font-bold tracking-[0.24em] text-[var(--gc2-ink)]">
                {code}
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                {deviceName} · {place}
              </p>
            </div>
            <div className="rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-4 text-right">
              <div className="flex items-center justify-end gap-2 text-[var(--gc2-ink-muted)]">
                <Clock3 aria-hidden="true" className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.14em]">Local wait window</span>
              </div>
              <p className="gc2-data mt-2 text-2xl font-bold text-[var(--gc2-ink)]">
                {formatRemaining(remainingSeconds)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--gc2-ink-muted)]">
              <span>Claim listener active</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--gc2-canvas-muted)]">
              <div
                className="h-full rounded-full bg-[var(--gc2-info)] transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--gc2-ink-muted)]">
              The service waits for up to 90 seconds, or less if the active OLED code expires sooner.
            </p>
          </div>

          <Gc2Notice
            tone="info"
            title="Approve on the physical controller"
            icon={<Radio className="h-5 w-5" />}
          >
            Keep the ESP32 powered and online. Approval must come from the verified device actor; the browser cannot approve its own claim.
          </Gc2Notice>

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--gc2-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="m-0 max-w-xl text-xs leading-5 text-[var(--gc2-ink-muted)]">
              Leaving this screen does not delete the pending claim. The same signed-in owner can submit the still-active code again to resume it.
            </p>
            <Gc2LinkButton href="/devices" variant="quiet">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Leave this screen
            </Gc2LinkButton>
          </div>
        </div>
      </Gc2Surface>

      <div className="col-span-12 grid gap-5 lg:col-span-4">
        <Gc2Surface className="overflow-hidden p-0">
          <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
            <p className="gc2-kicker">Trust boundary</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
              What is true right now
            </h2>
          </div>
          <div className="divide-y divide-[var(--gc2-line)]">
            {boundaries.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="grid grid-cols-[40px_minmax(0,1fr)] gap-3 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-ink-soft)]">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--gc2-ink-muted)]">
                      {item.label}
                    </span>
                    <span className="mt-1 block break-words text-sm font-bold text-[var(--gc2-ink)]">
                      {item.value}
                    </span>
                    <span className="mt-2 block">
                      <Gc2Status tone={item.tone}>
                        {item.tone === "success"
                          ? "Verified"
                          : item.tone === "info"
                            ? "Watching"
                            : item.tone === "warning"
                              ? "Required"
                              : "Locked"}
                      </Gc2Status>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Gc2Surface>

        <Gc2Surface className="p-5 sm:p-6">
          <div className="flex gap-3">
            <ShieldCheck aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-[var(--gc2-success)]" />
            <div>
              <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">No ownership shortcut</p>
              <p className="mt-2 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                User workspace projection, canonical owner data and device commands remain unchanged until hardware approval and callable finalization both succeed.
              </p>
            </div>
          </div>
        </Gc2Surface>
      </div>
    </div>
  );
}
