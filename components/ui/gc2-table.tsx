import type {
  HTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

export function Gc2Table({
  caption,
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & {
  caption?: string;
  children: ReactNode;
}) {
  return (
    <div className="gc2-table-wrap">
      <table className={cn("gc2-table", className)} {...props}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        {children}
      </table>
    </div>
  );
}

export function Gc2LedgerRow({
  time,
  title,
  detail,
  status,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  time: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  status?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[112px_minmax(0,1fr)_auto] items-start gap-4 border-b border-[var(--gc2-line)] px-4 py-3 last:border-b-0",
        className,
      )}
      {...props}
    >
      <div className="gc2-data text-xs text-[var(--gc2-ink-muted)]">{time}</div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[var(--gc2-ink)]">{title}</div>
        {detail ? (
          <div className="mt-1 text-xs leading-5 text-[var(--gc2-ink-soft)]">
            {detail}
          </div>
        ) : null}
      </div>
      {status ? <div className="justify-self-end">{status}</div> : null}
    </div>
  );
}
