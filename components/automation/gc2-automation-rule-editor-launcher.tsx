"use client";

import { CheckCircle2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import Gc2AutomationRuleEditor from "@/components/automation/gc2-automation-rule-editor";
import { useAppState } from "@/components/providers/app-state-provider";
import { Gc2Button } from "@/components/ui/gc2-button";
import { Gc2Status } from "@/components/ui/gc2-status";

export default function Gc2AutomationRuleEditorLauncher() {
  const {
    automation,
    devices,
    selectedDevice,
    updateAutomation,
  } = useAppState();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const device =
    devices.find((item) => item.id === selectedDevice.id) ?? devices[0];

  if (!device) return null;

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[120] flex items-center gap-3 rounded-[var(--gc2-radius-lg)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas)] p-2 shadow-[var(--gc2-shadow-lg)]">
        {saved ? (
          <Gc2Status tone="success">
            <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
            Rule saved
          </Gc2Status>
        ) : null}
        <Gc2Button
          onClick={() => {
            setSaved(false);
            setOpen(true);
          }}
          aria-label="Edit automation rule"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Edit automation rule
        </Gc2Button>
      </div>

      {open ? (
        <Gc2AutomationRuleEditor
          automation={automation}
          onClose={() => setOpen(false)}
          onSave={(patch) => {
            updateAutomation(patch);
            setOpen(false);
            setSaved(true);
          }}
        />
      ) : null}
    </>
  );
}
