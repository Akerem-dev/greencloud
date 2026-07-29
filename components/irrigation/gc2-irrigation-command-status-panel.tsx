"use client";

import {
  CheckCircle2,
  Clock3,
  Droplets,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Dialog } from "@/components/ui/gc2-dialog";
import { Gc2Notice, Gc2Status } from "@/components/ui/gc2-status";
import { IRRIGATION_COMMAND_SUBMITTED_EVENT } from "@/lib/irrigation-command-ui-events.mjs";

type TrackingRequest = {
  deviceId: string;
  durationSeconds: number;
  previousCommandId: string;
};

type IrrigationSubmittedEvent = CustomEvent<TrackingRequest>;

type PanelTone = "info" | "success" | "warning" | "danger";

type PanelState = {
  title: string;
  description: string;
  label: string;
  tone: PanelTone;
  icon: ReactNode;
};

function derivePanelState({
  hasNewCommand,
  commandStatus,
  pumpState,
  relayState,
}: {
  hasNewCommand: boolean;
  commandStatus: string;
  pumpState: string;
  relayState: string;
}): PanelState {
  if (!hasNewCommand) {
    return {
      title: "Waiting for command record",
      description:
        "The protected request was accepted by the web application, but a new device command record is not visible yet.",
      label: "Awaiting sync",
      tone: "info",
      icon: <Clock3 className="h-5 w-5" />,
    };
  }

  if (commandStatus === "Blocked" || pumpState === "Blocked") {
    return {
      title: "Command blocked",
      description:
        "The device record reports that the irrigation command did not pass the active protection boundary.",
      label: "Blocked",
      tone: "danger",
      icon: <ShieldAlert className="h-5 w-5" />,
    };
  }

  if (commandStatus === "Dry-run") {
    return {
      title: "Command protected",
      description:
        "The request was recorded as a dry-run while pump or safe-mode protection remained active.",
      label: "Dry-run",
      tone: "info",
      icon: <ShieldCheck className="h-5 w-5" />,
    };
  }

  if (commandStatus === "Handled") {
    return {
      title: "Irrigation completed",
      description:
        "The latest device command record is marked handled. The panel does not infer water volume beyond that acknowledgement.",
      label: "Handled",
      tone: "success",
      icon: <CheckCircle2 className="h-5 w-5" />,
    };
  }

  if (pumpState === "Running" || relayState === "On") {
    return {
      title: "Irrigation active",
      description:
        "Current device telemetry reports an active pump or relay output for this command.",
      label: "Running",
      tone: "warning",
      icon: <Droplets className="h-5 w-5" />,
    };
  }

  if (commandStatus === "Pending") {
    return {
      title: "Waiting for device acknowledgement",
      description:
        "The command record is pending. GreenCloud is waiting for the ESP32 to publish the next authoritative state.",
      label: "Pending",
      tone: "warning",
      icon: <Clock3 className="h-5 w-5" />,
    };
  }

  return {
    title: "Waiting for telemetry evidence",
    description:
      "A new command exists, but the device has not published a definitive handled, running, protected or blocked state.",
    label: commandStatus === "None" ? "Awaiting telemetry" : commandStatus,
    tone: "info",
    icon: <Clock3 className="h-5 w-5" />,
  };
}

export default function Gc2IrrigationCommandStatusPanel({
  deviceId,
}: {
  deviceId: string;
}) {
  const { devices, refreshTelemetry } = useAppState();
  const [tracking, setTracking] = useState<TrackingRequest | null>(null);

  useEffect(() => {
    const handleSubmittedRequest = (event: Event) => {
      const submittedEvent = event as IrrigationSubmittedEvent;
      if (submittedEvent.detail?.deviceId !== deviceId) return;

      setTracking(submittedEvent.detail);
    };

    window.addEventListener(
      IRRIGATION_COMMAND_SUBMITTED_EVENT,
      handleSubmittedRequest,
    );

    return () =>
      window.removeEventListener(
        IRRIGATION_COMMAND_SUBMITTED_EVENT,
        handleSubmittedRequest,
      );
  }, [deviceId]);

  const device = devices.find((item) => item.id === deviceId);
  const currentCommandId = device?.lastCommand ?? "None";
  const hasNewCommand = Boolean(
    tracking &&
      currentCommandId !== "None" &&
      currentCommandId !== tracking.previousCommandId,
  );
  const commandStatus = hasNewCommand
    ? (device?.lastCommandStatus ?? "None")
    : "None";
  const pumpState = device?.pumpState ?? "Unknown";
  const relayState = device?.relayState ?? "Unknown";
  const panelState = device
    ? derivePanelState({
        hasNewCommand,
        commandStatus,
        pumpState,
        relayState,
      })
    : {
        title: "Device record unavailable",
        description:
          "The tracked device is no longer present in the current workspace state.",
        label: "Unavailable",
        tone: "danger" as const,
        icon: <ShieldAlert className="h-5 w-5" />,
      };

  function closePanel() {
    setTracking(null);
  }

  return (
    <Gc2Dialog
      open={Boolean(tracking)}
      onClose={closePanel}
      variant="drawer"
      closeLabel="Close irrigation status panel"
      title="Irrigation command status"
      description="Live command evidence from the selected device record."
      footer={
        <>
          <Gc2Button variant="quiet" onClick={closePanel}>
            Close panel
          </Gc2Button>
          {device ? (
            <Gc2Button
              variant="secondary"
              onClick={() => refreshTelemetry(device.id)}
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh telemetry
            </Gc2Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-5" aria-live="polite">
        <Gc2Notice
          tone={panelState.tone}
          title={panelState.title}
          icon={panelState.icon}
        >
          {panelState.description}
        </Gc2Notice>

        <div className="flex items-center justify-between gap-4 border-y border-[var(--gc2-line)] py-4">
          <div>
            <p className="gc2-kicker">Current result</p>
            <p className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {panelState.title}
            </p>
          </div>
          <Gc2Status tone={panelState.tone}>{panelState.label}</Gc2Status>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="gc2-kicker">Target device</dt>
            <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {device?.name ?? "Unavailable"}
            </dd>
            <p className="mt-1 text-xs text-[var(--gc2-ink-soft)]">
              {device?.place ?? deviceId}
            </p>
          </div>
          <div>
            <dt className="gc2-kicker">Configured duration</dt>
            <dd className="gc2-data mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {tracking?.durationSeconds ?? "—"}s
            </dd>
          </div>
          <div>
            <dt className="gc2-kicker">Command record</dt>
            <dd className="gc2-data mt-2 break-all text-xs font-bold text-[var(--gc2-ink)]">
              {hasNewCommand ? currentCommandId : "Awaiting new command ID"}
            </dd>
          </div>
          <div>
            <dt className="gc2-kicker">Command status</dt>
            <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {commandStatus}
            </dd>
          </div>
          <div>
            <dt className="gc2-kicker">Pump state</dt>
            <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {pumpState}
            </dd>
          </div>
          <div>
            <dt className="gc2-kicker">Relay state</dt>
            <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {relayState}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="gc2-kicker">Latest device update</dt>
            <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
              {device?.updatedAt ?? "Unavailable"}
            </dd>
          </div>
        </dl>

        <Gc2Notice
          tone="info"
          title="No estimated progress is fabricated"
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          The ESP32 does not publish a percentage or countdown, so this panel reports
          only the latest command, pump, relay and telemetry evidence.
        </Gc2Notice>
      </div>
    </Gc2Dialog>
  );
}
