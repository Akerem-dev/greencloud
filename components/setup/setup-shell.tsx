import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Leaf, SlidersHorizontal, Wifi } from "lucide-react";

const steps = [
  {
    number: 1,
    label: "Workspace identity",
    description: "Name the garden, project and primary plant zone.",
    icon: Leaf,
  },
  {
    number: 2,
    label: "Preferences",
    description: "Choose essential display and notification behavior.",
    icon: SlidersHorizontal,
  },
  {
    number: 3,
    label: "First device",
    description: "Pair a trusted ESP32 now or continue without one.",
    icon: Wifi,
  },
] as const;

export default function SetupShell({
  currentStep,
  title,
  description,
  children,
}: {
  currentStep: 1 | 2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="gc2-page min-h-screen lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="gc2-sidebar flex min-h-full flex-col px-6 py-7 lg:sticky lg:top-0 lg:h-screen">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-sm font-bold text-[var(--gc2-ink-inverse)] no-underline"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line-inverse)] bg-white/5 text-xs">
            GC
          </span>
          GreenCloud
        </Link>

        <div className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
            Initial setup
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-white">
            Build the workspace before the first reading arrives.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/65">
            GreenCloud keeps identity, preferences and device pairing in one
            deliberate setup path.
          </p>
        </div>

        <ol className="mt-10 grid list-none gap-2 p-0" aria-label="Setup progress">
          {steps.map((step) => {
            const Icon = step.icon;
            const complete = step.number < currentStep;
            const active = step.number === currentStep;

            return (
              <li
                key={step.number}
                aria-current={active ? "step" : undefined}
                className={`grid grid-cols-[36px_minmax(0,1fr)] gap-3 rounded-[var(--gc2-radius-md)] border px-3 py-3 ${
                  active
                    ? "border-white/20 bg-white/10"
                    : "border-transparent bg-transparent"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-[var(--gc2-radius-md)] border ${
                    complete || active
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/10 text-white/45"
                  }`}
                >
                  {complete ? (
                    <Check aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-bold ${
                      active || complete ? "text-white" : "text-white/55"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-white/45">
                    {step.description}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <Link
          href="/dashboard"
          className="mt-auto pt-8 text-xs font-semibold text-white/55 underline-offset-4 hover:text-white hover:underline"
        >
          Exit setup and open dashboard
        </Link>
      </aside>

      <section className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto w-full max-w-[900px]">
          <header className="border-b border-[var(--gc2-line)] pb-6">
            <p className="gc2-kicker">Step {currentStep} of 2</p>
            <h2 className="gc2-heading-lg mt-3">{title}</h2>
            <p className="gc2-copy mt-3 max-w-2xl">{description}</p>
          </header>
          <div className="py-7">{children}</div>
        </div>
      </section>
    </main>
  );
}
