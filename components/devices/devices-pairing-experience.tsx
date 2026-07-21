"use client";

import { useEffect, useRef, type ReactNode } from "react";

import ProtectedPairingStudio from "@/components/devices/protected-pairing-studio";

const LEGACY_ADD_BUTTON_LABEL = "Add ESP32";
const STUDIO_LAUNCHER_COPY = "Secure pairing";

function findButtonByCopy(copy: string) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.includes(copy),
  );
}

export default function DevicesPairingExperience({
  children,
}: {
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleLegacyPairingClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!button || button.textContent?.trim() !== LEGACY_ADD_BUTTON_LABEL) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      findButtonByCopy(STUDIO_LAUNCHER_COPY)?.click();
    };

    root.addEventListener("click", handleLegacyPairingClick, true);

    return () => {
      root.removeEventListener("click", handleLegacyPairingClick, true);
    };
  }, []);

  return (
    <div ref={rootRef} data-devices-pairing-experience="protected-single-entry">
      {children}
      <ProtectedPairingStudio />

      <style jsx global>{`
        [data-devices-pairing-experience="protected-single-entry"]
          .devices-page
          > *:has(input[placeholder="ABC123"][maxlength="6"]),
        [data-devices-pairing-experience="protected-single-entry"]
          .devices-page
          > *:has(.lucide-key-round) {
          display: none !important;
        }

        [data-devices-pairing-experience="protected-single-entry"]
          .devices-page
          > :first-child
          button.premium-btn {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
