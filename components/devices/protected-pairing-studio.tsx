"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cpu,
  KeyRound,
  LoaderCircle,
  Radio,
  ShieldCheck,
} from "lucide-react";

import Gc2ProtectedShell from "@/components/layout/gc2-protected-shell";
import {
  useAppState,
  type Device,
} from "@/components/providers/app-state-provider";
import { Gc2Button, Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Input } from "@/components/ui/gc2-field";
import { Gc2Notice, Gc2Status, type Gc2StatusTone } from "@/components/ui/gc2-status";
import {
  Gc2SectionHeading,
  Gc2Surface,
} from "@/components/ui/gc2-surface";


type PairingStage =
  | "idle"
  | "invalid"
  | "requesting"
  | "awaiting"
  | "success"
  | "rejected"
  | "timeout"
  | "error";

type PairingStep = {
  label: string;
  detail: string;
  icon: typeof KeyRound;
};

const steps: PairingStep[] = [
  {
    label: "OLED code",
    detail: "Validate the six-character code shown by the controller.",
    icon: KeyRound,
  },
  {
    label: "Secure claim",
    detail: "Create a request scoped to the signed-in Firebase user.",
    icon: ShieldCheck,
  },
  {
    label: "ESP32 approval",
    detail: "Approve request on ESP32 through the verified hardware flow.",
    icon: Radio,
  },
  {
    label: "Workspace",
    detail: "Finalize ownership and project the trusted node into GreenCloud.",
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

function errorCode(error: unknown) {
  if (!(error instanceof Error)) return "";

  const cause = error.cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = (cause as { code?: unknown }).code;
    if (typeof code === "string") return code.toLowerCase();
  }

  const directCode = (error as Error & { code?: unknown }).code;
  return typeof directCode === "string" ? directCode.toLowerCase() : "";
}

function stageIndex(stage: PairingStage) {
  if (stage === "success") return 3;
  if (["awaiting", "rejected", "timeout", "error"].includes(stage)) return 2;
  if (stage === "requesting") return 1;
  return 0;
}

function stageStatus(stage: PairingStage): {
  kicker: string;
  title: string;
  detail: string;
  tone: Exclude<Gc2StatusTone, "neutral">;
} {
  if (stage === "invalid") {
    return {
      kicker: "Code incomplete",
      title: "Enter all six OLED characters.",
      detail: "Only letters and numbers are accepted by the protected pairing contract.",
      tone: "warning",
    };
  }

  if (stage === "requesting") {
    return {
      kicker: "Secure claim",
      title: "Creating the user-scoped request.",
      detail: "GreenCloud is validating the code before asking the device actor for approval.",
      tone: "info",
    };
  }

  if (stage === "awaiting") {
    return {
      kicker: "Hardware confirmation",
      title: "Waiting for ESP32 approval.",
      detail: "Keep the controller powered on and approve the pending claim on the verified device flow.",
      tone: "info",
    };
  }

  if (stage === "success") {
    return {
      kicker: "Ownership finalized",
      title: "The device is now trusted by this workspace.",
      detail: "The callable verified ownership and projected the node into the signed-in user path.",
      tone: "success",
    };
  }

  if (stage === "rejected") {
    return {
      kicker: "Claim rejected",
      title: "The ESP32 declined this request.",
      detail: "Confirm the physical controller and submit a fresh code from its OLED display.",
      tone: "danger",
    };
  }

  if (stage === "timeout") {
    return {
      kicker: "Approval timeout",
      title: "The device did not approve in time.",
      detail: "The request can be retried after the controller is online and displaying the same active code.",
      tone: "warning",
    };
  }

  if (stage === "error") {
    return {
      kicker: "Pairing interrupted",
      title: "The protected flow could not finish.",
      detail: "Review the reported message, confirm the OLED code and try the request again.",
      tone: "danger",
    };
  }

  return {
    kicker: "Ready for hardware",
    title: "Begin with the code shown on the ESP32 OLED.",
    detail: "No ownership is written until the trusted hardware actor approves the request.",
    tone: "info",
  };
}

export default function ProtectedPairingStudio() {
  const { devices, pairDeviceByCode } = useAppState();
  const [code, setCode] = useState("");
  const [name, setName] = useState(DEFAULT_NAME);
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [stage, setStage] = useState<PairingStage>("idle");
  const [message, setMessage] = useState("");
  const [pairedDevice, setPairedDevice] = useState<Device | null>(null);

  const activeStep = stageIndex(stage);
  const status = stageStatus(stage);
  const busy = stage === "requesting" || stage === "awaiting";

  const submitLabel = useMemo(() => {
    if (stage === "requesting") return "Creating secure request...";
    if (stage === "awaiting") return "Waiting for ESP32...";
    if (stage === "success") return "Pair another device";
    if (["rejected", "timeout", "error"].includes(stage)) return "Retry protected pairing";
    return "Start protected pairing";
  }, [stage]);

  function reset() {
    setCode("");
    setName(DEFAULT_NAME);
    setPlace(DEFAULT_PLACE);
    setStage("idle");
    setMessage("");
    setPairedDevice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (stage === "success") {
      reset();
      return;
    }

    const safeCode = normalizeCode(code);
    setCode(safeCode);
    setMessage("");
    setPairedDevice(null);

    if (safeCode.length !== 6) {
      setStage("invalid");
      setMessage("Enter the complete six-character OLED code.");
      return;
    }

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
        setMessage("Pairing finished without a valid device result.");
        return;
      }

      setPairedDevice(paired);
      setStage("success");
      setMessage(`${paired.name} is available in your protected workspace.`);
    } catch (error) {
      const codeValue = errorCode(error);

      if (codeValue.includes("rejected")) {
        setStage("rejected");
      } else if (codeValue.includes("timeout")) {
        setStage("timeout");
      } else {
        setStage("error");
      }

      setMessage(error instanceof Error ? error.message : "Pairing failed safely.");
    }
  }

  return (
    <Gc2ProtectedShell>
      <div className="gc2-stack">
        <Gc2SectionHeading
          kicker="Protected device claim"
          title="Pair an ESP32 with visible trust steps."
          description="The OLED code identifies the pending hardware request. Firebase ownership is finalized only after the verified device actor approves the claim."
          actions={
            <Gc2LinkButton href="/devices" variant="quiet">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back to devices
            </Gc2LinkButton>
          }
        />

        <div className="gc2-grid items-start">
          <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-8">
            <div className="border-b border-[var(--gc2-line)] p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="gc2-kicker">{status.kicker}</p>
                  <h2 className="gc2-heading-md mt-2">{status.title}</h2>
                  <p className="gc2-copy mt-3 max-w-2xl">{status.detail}</p>
                </div>
                <Gc2Status tone={status.tone}>
                  {stage === "success" ? "Connected" : busy ? "In progress" : "Protected"}
                </Gc2Status>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Gc2Input
                    label="Six-character OLED code"
                    value={code}
                    onChange={(event) => setCode(normalizeCode(event.target.value))}
                    placeholder="ABC123"
                    autoComplete="off"
                    inputMode="text"
                    maxLength={6}
                    required
                    disabled={busy}
                    className="gc2-data text-lg uppercase tracking-[0.24em]"
                    hint="Read the active code directly from the powered ESP32 display."
                    error={stage === "invalid" ? message : undefined}
                  />
                </div>
                <Gc2Input
                  label="Device name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  required
                  disabled={busy}
                  hint="A clear operational label, such as Balcony Controller."
                />
                <Gc2Input
                  label="Plant zone or location"
                  value={place}
                  onChange={(event) => setPlace(event.target.value)}
                  maxLength={80}
                  required
                  disabled={busy}
                  hint="Used throughout telemetry and the activity record."
                />
              </div>

              {message && stage !== "invalid" ? (
                <Gc2Notice
                  tone={status.tone}
                  title={stage === "success" ? "Pairing complete" : "Pairing status"}
                  icon={
                    stage === "success" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : stage === "awaiting" || stage === "requesting" ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )
                  }
                >
                  {message}
                </Gc2Notice>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--gc2-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-xs leading-5 text-[var(--gc2-ink-muted)]">
                  {devices.length} device{devices.length === 1 ? "" : "s"} currently trusted by this workspace.
                </p>
                <Gc2Button type="submit" disabled={busy}>
                  {submitLabel}
                  {busy ? (
                    <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  )}
                </Gc2Button>
              </div>
            </form>
          </Gc2Surface>

          <div className="col-span-12 grid gap-5 lg:col-span-4">
            <Gc2Surface className="overflow-hidden p-0">
              <div className="border-b border-[var(--gc2-line)] p-5 sm:p-6">
                <p className="gc2-kicker">Trust sequence</p>
                <h2 className="mt-2 text-xl font-bold text-[var(--gc2-ink)]">
                  Four explicit boundaries
                </h2>
              </div>
              <ol className="m-0 list-none p-0">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const completed = stage === "success" || index < activeStep;
                  const active = index === activeStep && stage !== "success";

                  return (
                    <li
                      key={step.label}
                      className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-3 border-b border-[var(--gc2-line)] p-4 last:border-b-0"
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-[var(--gc2-radius-md)] border ${
                        completed
                          ? "border-[var(--gc2-success)] bg-[var(--gc2-success-soft)] text-[var(--gc2-success)]"
                          : active
                            ? "border-[var(--gc2-info)] bg-[var(--gc2-info-soft)] text-[var(--gc2-info)]"
                            : "border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] text-[var(--gc2-ink-muted)]"
                      }`}>
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-[var(--gc2-ink)]">{step.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--gc2-ink-soft)]">{step.detail}</span>
                      </span>
                      <Gc2Status tone={completed ? "success" : active ? "info" : "neutral"}>
                        {completed ? "Done" : active ? "Current" : "Next"}
                      </Gc2Status>
                    </li>
                  );
                })}
              </ol>
            </Gc2Surface>

            <Gc2Surface className="p-5 sm:p-6">
              <p className="gc2-kicker">Hardware checklist</p>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                <p className="m-0 flex gap-3"><Cpu className="mt-1 h-4 w-4 shrink-0 text-[var(--gc2-moss)]" />ESP32 is powered and connected to its configured network.</p>
                <p className="m-0 flex gap-3"><KeyRound className="mt-1 h-4 w-4 shrink-0 text-[var(--gc2-moss)]" />OLED is displaying a fresh six-character code.</p>
                <p className="m-0 flex gap-3"><Radio className="mt-1 h-4 w-4 shrink-0 text-[var(--gc2-moss)]" />The device remains online while the approval request is pending.</p>
              </div>

              {pairedDevice ? (
                <div className="mt-5 border-t border-[var(--gc2-line)] pt-5">
                  <Gc2LinkButton href={`/devices/${encodeURIComponent(pairedDevice.id)}`} className="w-full justify-center">
                    Open {pairedDevice.name}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Gc2LinkButton>
                </div>
              ) : null}
            </Gc2Surface>
          </div>
        </div>
      </div>
    </Gc2ProtectedShell>
  );
}
