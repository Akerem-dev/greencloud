"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { Gc2Button } from "@/components/ui/gc2-button";

type Gc2DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "dialog" | "drawer";
  closeLabel?: string;
  className?: string;
};

export function Gc2Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "dialog",
  closeLabel = "Close dialog",
  className,
}: Gc2DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "gc2-dialog",
        variant === "drawer" && "gc2-drawer",
        className,
      )}
      onClick={handleBackdropClick}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="grid min-h-full grid-rows-[auto_minmax(0,1fr)_auto]">
        <header className="flex items-start justify-between gap-5 border-b border-[var(--gc2-line)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="gc2-heading-md" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="gc2-copy mt-2" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Gc2Button
            variant="quiet"
            iconOnly
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Gc2Button>
        </header>

        <div className="min-h-0 overflow-auto px-5 py-5">{children}</div>

        {footer ? (
          <footer className="gc2-cluster justify-end border-t border-[var(--gc2-line)] px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
