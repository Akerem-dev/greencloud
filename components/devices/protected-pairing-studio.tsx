"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Radio,
  RefreshCw,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { useAppState } from "@/components/providers/app-state-provider";
import { cn } from "@/lib/utils";

type PairingStage =
  | "idle"
  | "invalid"
  | "requesting"
  | "awaiting"
  | "success"
  | "rejected"
  | "timeout"
  | "error";

type FlowStep = {
  label: string;
  detail: string;
  icon: LucideIcon;
};

const FLOW_STEPS: FlowStep[] = [
  {
    label: "OLED code",
    detail: "Validate the six-character hardware code.",
    icon: KeyRound,
  },
  {
    label: "Secure claim",
    detail: "Create a user-scoped protected pairing request.",
    icon: ShieldCheck,
  },
  {
    label: "ESP32 approval",
    detail: "The verified device actor approves the request.",
    icon: Radio,
  },
  {
    label: "Workspace",
    detail: "Finalize ownership and project the device safely.",
    icon: CheckCircle2,
  },
];

const DEFAULT_NAME = "GreenCloud Device";
const DEFAULT_PLACE = "Plant zone";

function normalizeCode(value: string) {
  return value
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
}

function pairingErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "";

  const cause = error.cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === "string") return code.toLowerCase();
  }

  const directCode = (error as Error & { code?: unknown }).code;
  return typeof directCode === "string" ? directCode.toLowerCase() : "";
}

function stageStepIndex(stage: PairingStage) {
  if (stage === "success") return 3;
  if (
    stage === "awaiting" ||
    stage === "rejected" ||
    stage === "timeout" ||
    stage === "error"
  ) {
    return 2;
  }
  if (stage === "requesting") return 1;
  return 0;
}

function stageCopy(stage: PairingStage) {
  if (stage === "invalid") {
    return {
      eyebrow: "Code required",
      title: "Enter the complete OLED code.",
      body: "The protected flow accepts exactly six letters or numbers.",
      tone: "warning" as const,
    };
  }

  if (stage === "requesting") {
    return {
      eyebrow: "Protected request",
      title: "Creating a secure claim.",
      body: "GreenCloud is validating the code and creating your user-scoped request.",
      tone: "active" as const,
    };
  }

  if (stage === "awaiting") {
    return {
      eyebrow: "Device confirmation",
      title: "Waiting for ESP32 approval.",
      body: "Keep the device powered on and approve the request from the verified hardware flow.",
      tone: "active" as const,
    };
  }

  if (stage === "success") {
    return {
      eyebrow: "Pairing complete",
      title: "Device connected securely.",
      body: "Ownership was finalized by the trusted callable and projected into your workspace.",
      tone: "success" as const,
    };
  }

  if (stage === "rejected") {
    return {
      eyebrow: "Request rejected",
      title: "The ESP32 declined this claim.",
      body: "Confirm the device and code, then create a fresh protected request.",
      tone: "danger" as const,
    };
  }

  if (stage === "timeout") {
    return {
      eyebrow: "Approval timed out",
      title: "The request is still resumable.",
      body: "Approve the pending claim on the ESP32 and submit the same code again.",
      tone: "warning" as const,
    };
  }

  if (stage === "error") {
    return {
      eyebrow: "Pairing interrupted",
      title: "The protected flow could not finish.",
      body: "Review the message below, confirm the OLED code and try again.",
      tone: "danger" as const,
    };
  }

  return {
    eyebrow: "Protected pairing",
    title: "Connect hardware with visible trust steps.",
    body: "Enter the OLED code, send a scoped claim, approve it on the ESP32 and finalize ownership.",
    tone: "idle" as const,
  };
}

function toneClasses(tone: ReturnType<typeof stageCopy>["tone"]) {
  if (tone === "success") {
    return "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_11%,black)]";
  }

  if (tone === "active") {
    return "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,black)]";
  }

  if (tone === "warning") {
    return "border-[color-mix(in_srgb,var(--gc-warn)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-warn)_10%,black)]";
  }

  if (tone === "danger") {
    return "border-[color-mix(in_srgb,var(--gc-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--gc-danger)_10%,black)]";
  }

  return "border-[color-mix(in_srgb,var(--gc-border)_66%,transparent)] bg-[color-mix(in_srgb,var(--gc-bg)_88%,black)]";
}

export default function ProtectedPairingStudio() {
  const { devices, pairDeviceByCode } = useAppState();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState(DEFAULT_NAME);
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [stage, setStage] = useState<PairingStage>("idle");
  const [message, setMessage] = useState("");

  const currentStep = stageStepIndex(stage);
  const copy = stageCopy(stage);
  const busy = stage === "requesting" || stage === "awaiting";

  const buttonLabel = useMemo(() => {
    if (stage === "requesting") return "Creating secure request...";
    if (stage === "awaiting") return "Waiting for ESP32 approval...";
    if (stage === "success") return "Pair another device";
    if (stage === "rejected" || stage === "timeout" || stage === "error") {
      return "Try protected pairing again";
    }
    return "Start protected pairing";
  }, [stage]);

  function resetFlow() {
    setCode("");
    setName(DEFAULT_NAME);
    setPlace(DEFAULT_PLACE);
    setStage("idle");
    setMessage("");
  }

  async function handlePair() {
    if (stage === "success") {
      resetFlow();
      return;
    }

    const safeCode = normalizeCode(code);
    setCode(safeCode);

    if (safeCode.length !== 6) {
      setStage("invalid");
      setMessage("Enter the complete six-character OLED code.");
      return;
    }

    setMessage("");
    setStage("requesting");

    await Promise.resolve();
    setStage("awaiting");

    try {
      const paired = await pairDeviceByCode(
        safeCode,
        name.trim() || DEFAULT_NAME,
        place.trim() || DEFAULT_PLACE,
      );

      if (!paired) {
        setStage("error");
        setMessage("Pairing completed without a valid device result.");
        return;
      }

      setStage("success");
      setMessage(`${paired.name} is now available in your protected workspace.`);
    } catch (error) {
      const errorCode = pairingErrorCode(error);
      const errorMessage = error instanceof Error ? error.message : "Pairing failed.";

      if (errorCode.includes("rejected")) {
        setStage("rejected");
      } else if (errorCode.includes("timeout")) {
        setStage("timeout");
      } else {
        setStage("error");
      }

      setMessage(errorMessage);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[125] flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3">
      {open ? (
        <section
          aria-label="Protected pairing studio"
          className="premium-noise relative w-[min(430px,calc(100vw-2.5rem))] overflow-hidden rounded-[28px] border border-[color-mix(in_srgb,var(--gc-border)_72%,transparent)] bg-[linear-gradient(155deg,color-mix(in_srgb,var(--gc-bg)_96%,black),color-mix(in_srgb,var(--gc-panel)_86%,black))] shadow-[0_28px_90px_rgba(0,0,0,0.52),0_0_36px_var(--gc-glow)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--gc-accent)_14%,transparent),transparent_38%),radial-gradient(circle_at_100%_100%,color-mix(in_srgb,var(--gc-accent-2)_11%,transparent),transparent_38%)]" />

          <div className="relative z-10 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-accent-2)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure Pairing Studio
                </div>

                <h2 className="mt-4 text-[clamp(1.9rem,5vw,2.7rem)] font-semibold leading-[0.94] tracking-[-0.07em] text-[var(--gc-text)]">
                  Visible trust, step by step.
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close protected pairing studio"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="premium-btn-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div
              aria-live="polite"
              className={cn("mt-5 rounded-[22px] border p-4", toneClasses(copy.tone))}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  {busy ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-[var(--gc-accent-2)]" />
                  ) : stage === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-[var(--gc-accent)]" />
                  ) : stage === "idle" ? (
                    <ShieldCheck className="h-5 w-5 text-[var(--gc-accent-2)]" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-[var(--gc-warn)]" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                    {copy.eyebrow}
                  </p>
                  <p className="mt-2 text-lg font-semibold tracking-[-0.035em] text-[var(--gc-text)]">
                    {copy.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--gc-soft)]">
                    {copy.body}
                  </p>
                  {message ? (
                    <p className="mt-2 text-xs font-semibold leading-5 text-[var(--gc-text)]">
                      {message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {FLOW_STEPS.map((step, index) => {
                const Icon = step.icon;
                const completed = stage === "success" || index < currentStep;
                const active = index === currentStep && stage !== "success";

                return (
                  <div
                    key={step.label}
                    className={cn(
                      "rounded-[18px] border p-3 transition duration-300",
                      completed
                        ? "border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_8%,transparent)]"
                        : active
                          ? "border-[color-mix(in_srgb,var(--gc-accent-2)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent-2)_9%,transparent)] shadow-[0_0_22px_var(--gc-glow)]"
                          : "border-[color-mix(in_srgb,var(--gc-border)_58%,transparent)] bg-black/15",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gc-muted)]">
                        0{index + 1}
                      </span>
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--gc-accent)]" />
                      ) : active && busy ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-[var(--gc-accent-2)]" />
                      ) : (
                        <Icon className="h-4 w-4 text-[var(--gc-soft)]" />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--gc-text)]">
                      {step.label}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--gc-soft)]">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gc-muted)]">
                  Six-character OLED code
                </span>
                <input
                  value={code}
                  maxLength={6}
                  disabled={busy}
                  onChange={(event) => {
                    setCode(normalizeCode(event.target.value));
                    if (!busy && stage !== "idle") {
                      setStage("idle");
                      setMessage("");
                    }
                  }}
                  placeholder="ABC123"
                  className="mt-2 h-12 w-full rounded-[18px] border border-[color-mix(in_srgb,var(--gc-border)_68%,transparent)] bg-black/20 px-4 font-mono text-lg font-bold uppercase tracking-[0.24em] text-[var(--gc-text)] outline-none transition placeholder:tracking-[0.12em] placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] disabled:opacity-55"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={name}
                  maxLength={80}
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Device name"
                  className="h-11 rounded-[16px] border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-black/16 px-4 text-sm text-[var(--gc-text)] outline-none placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] disabled:opacity-55"
                />
                <input
                  value={place}
                  maxLength={120}
                  disabled={busy}
                  onChange={(event) => setPlace(event.target.value)}
                  placeholder="Plant zone"
                  className="h-11 rounded-[16px] border border-[color-mix(in_srgb,var(--gc-border)_62%,transparent)] bg-black/16 px-4 text-sm text-[var(--gc-text)] outline-none placeholder:text-[var(--gc-muted)] focus:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] disabled:opacity-55"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handlePair()}
              className="premium-btn mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-65"
            >
              {busy ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : stage === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {buttonLabel}
            </button>
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="premium-noise group relative overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--gc-bg)_92%,black),color-mix(in_srgb,var(--gc-accent)_10%,black))] px-4 py-3 text-left shadow-[0_18px_52px_rgba(0,0,0,0.42),0_0_28px_var(--gc-glow)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--gc-accent)_48%,transparent)]"
      >
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,color-mix(in_srgb,var(--gc-accent-2)_16%,transparent),transparent_52%)]" />
        <span className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_12%,transparent)] text-[var(--gc-accent-2)] shadow-[0_0_20px_var(--gc-glow)]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gc-muted)]">
              New protected flow
            </span>
            <span className="mt-0.5 block text-sm font-semibold text-[var(--gc-text)]">
              Secure pairing · {devices.length} connected
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
