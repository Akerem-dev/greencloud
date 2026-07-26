import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SurfaceTone = "default" | "raised" | "inset";

const toneClass: Record<SurfaceTone, string> = {
  default: "gc2-surface",
  raised: "gc2-surface-raised",
  inset: "gc2-inset",
};

export function Gc2Surface({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: SurfaceTone }) {
  return <div className={cn(toneClass[tone], className)} {...props} />;
}

export function Gc2SectionHeading({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--gc2-line)] pb-5 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {kicker ? <p className="gc2-kicker">{kicker}</p> : null}
        <h1 className="gc2-heading-lg mt-2">{title}</h1>
        {description ? <p className="gc2-copy mt-3">{description}</p> : null}
      </div>
      {actions ? <div className="gc2-cluster shrink-0">{actions}</div> : null}
    </header>
  );
}

export function Gc2Metric({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 border-l border-[var(--gc2-line)] pl-4", className)}>
      <p className="gc2-kicker">{label}</p>
      <div className="gc2-data mt-2 text-2xl font-semibold text-[var(--gc2-ink)]">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs leading-5 text-[var(--gc2-ink-muted)]">
          {detail}
        </div>
      ) : null}
    </div>
  );
}
