import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Gc2StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneClass: Record<Gc2StatusTone, string> = {
  neutral: "",
  success: "gc2-status-success",
  warning: "gc2-status-warning",
  danger: "gc2-status-danger",
  info: "gc2-status-info",
};

export function Gc2Status({
  tone = "neutral",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Gc2StatusTone }) {
  return (
    <span className={cn("gc2-status", toneClass[tone], className)} {...props}>
      {children}
    </span>
  );
}

export function Gc2Notice({
  tone = "info",
  icon,
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: Exclude<Gc2StatusTone, "neutral">;
  icon?: ReactNode;
  title: string;
}) {
  const noticeToneClass: Record<Exclude<Gc2StatusTone, "neutral">, string> = {
    success:
      "border-[color-mix(in_srgb,var(--gc2-success)_30%,var(--gc2-line))] bg-[var(--gc2-success-soft)]",
    warning:
      "border-[color-mix(in_srgb,var(--gc2-warning)_30%,var(--gc2-line))] bg-[var(--gc2-warning-soft)]",
    danger:
      "border-[color-mix(in_srgb,var(--gc2-danger)_30%,var(--gc2-line))] bg-[var(--gc2-danger-soft)]",
    info:
      "border-[color-mix(in_srgb,var(--gc2-info)_30%,var(--gc2-line))] bg-[var(--gc2-info-soft)]",
  };

  return (
    <div
      className={cn("gc2-notice", noticeToneClass[tone], className)}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      <div aria-hidden="true">{icon}</div>
      <div className="min-w-0">
        <p className="m-0 text-sm font-bold text-[var(--gc2-ink)]">{title}</p>
        <div className="mt-1 text-sm leading-6 text-[var(--gc2-ink-soft)]">
          {children}
        </div>
      </div>
    </div>
  );
}
