import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Gauge,
  Lock,
  Radio,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import { Gc2PublicShell } from "@/components/layout/gc2-shells";
import { Gc2LinkButton } from "@/components/ui/gc2-button";
import { Gc2Status } from "@/components/ui/gc2-status";
import { Gc2Metric, Gc2Surface } from "@/components/ui/gc2-surface";

const publicNavigation = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
];

const workflow = [
  {
    number: "01",
    title: "Observe",
    description:
      "ESP32 collects soil, rain, water-level and hardware state from the garden.",
    icon: Gauge,
  },
  {
    number: "02",
    title: "Decide",
    description:
      "Threshold, cooldown and safety conditions are evaluated before irrigation.",
    icon: Activity,
  },
  {
    number: "03",
    title: "Irrigate",
    description:
      "Only an approved command can reach the relay and protected pump path.",
    icon: Droplets,
  },
  {
    number: "04",
    title: "Audit",
    description:
      "Telemetry, decisions, commands and outcomes remain visible in one timeline.",
    icon: ShieldCheck,
  },
];

const safeguards = [
  "Private six-character OLED pairing",
  "Firebase Authentication protected workspaces",
  "Rain, water-level and safe-mode lockouts",
  "Trusted unpair with queued factory reset",
];

function SystemTopology() {
  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--gc2-line)] px-5 py-4">
        <div>
          <p className="gc2-kicker">Live system topology</p>
          <h2 className="mt-1 text-base font-bold text-[var(--gc2-ink)]">
            Garden hardware to protected irrigation
          </h2>
        </div>
        <Gc2Status tone="success">All guards ready</Gc2Status>
      </div>

      <div className="overflow-x-auto px-4 py-5 sm:px-6">
        <svg
          viewBox="0 0 760 360"
          className="min-w-[650px]"
          role="img"
          aria-labelledby="topology-title topology-description"
        >
          <title id="topology-title">GreenCloud system topology</title>
          <desc id="topology-description">
            Soil, rain and water sensors report to an ESP32. The ESP32 synchronizes
            through Firebase to GreenCloud. Approved irrigation commands return to
            the relay and pump through a protected path.
          </desc>

          <defs>
            <marker
              id="gc2-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gc2-moss)" />
            </marker>
          </defs>

          <g
            fill="none"
            stroke="var(--gc2-line-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M 145 78 H 252" />
            <path d="M 145 180 H 252" />
            <path d="M 145 282 H 252" />
            <path d="M 368 180 H 474" markerEnd="url(#gc2-arrow)" />
            <path d="M 590 180 H 682 V 282 H 590" />
          </g>

          <g>
            <rect x="22" y="38" width="123" height="80" rx="10" fill="var(--gc2-surface)" stroke="var(--gc2-line)" />
            <circle cx="52" cy="68" r="12" fill="var(--gc2-moss-soft)" />
            <path d="M 52 60 C 46 66 46 76 52 80 C 58 76 58 66 52 60" fill="var(--gc2-moss)" />
            <text x="74" y="70" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">Soil</text>
            <text x="38" y="98" fill="var(--gc2-ink-muted)" fontSize="12">43% moisture</text>

            <rect x="22" y="140" width="123" height="80" rx="10" fill="var(--gc2-surface)" stroke="var(--gc2-line)" />
            <circle cx="52" cy="170" r="12" fill="var(--gc2-info-soft)" />
            <path d="M 52 159 C 44 170 44 176 52 181 C 60 176 60 170 52 159" fill="var(--gc2-info)" />
            <text x="74" y="172" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">Rain</text>
            <text x="38" y="200" fill="var(--gc2-ink-muted)" fontSize="12">Clear</text>

            <rect x="22" y="242" width="123" height="80" rx="10" fill="var(--gc2-surface)" stroke="var(--gc2-line)" />
            <circle cx="52" cy="272" r="12" fill="var(--gc2-info-soft)" />
            <path d="M 43 276 H 61 M 46 270 H 58 M 49 264 H 55" stroke="var(--gc2-info)" strokeWidth="2" strokeLinecap="round" />
            <text x="74" y="274" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">Tank</text>
            <text x="38" y="302" fill="var(--gc2-ink-muted)" fontSize="12">Water ready</text>
          </g>

          <g>
            <rect x="252" y="126" width="116" height="108" rx="12" fill="var(--gc2-forest)" stroke="var(--gc2-forest-line)" />
            <rect x="277" y="151" width="66" height="40" rx="6" fill="var(--gc2-forest-raised)" stroke="var(--gc2-forest-line)" />
            <circle cx="291" cy="171" r="4" fill="var(--gc2-moss-soft)" />
            <circle cx="309" cy="171" r="4" fill="var(--gc2-warning-soft)" />
            <circle cx="327" cy="171" r="4" fill="var(--gc2-info-soft)" />
            <text x="310" y="213" textAnchor="middle" fill="var(--gc2-ink-inverse)" fontSize="15" fontWeight="700">ESP32</text>
          </g>

          <g>
            <rect x="474" y="126" width="116" height="108" rx="12" fill="var(--gc2-surface-raised)" stroke="var(--gc2-line)" />
            <circle cx="532" cy="165" r="18" fill="var(--gc2-moss-soft)" />
            <path d="M 520 169 C 524 157 540 153 546 165 C 551 177 538 184 528 179 C 519 181 514 174 520 169" fill="var(--gc2-moss)" />
            <text x="532" y="207" textAnchor="middle" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">Firebase</text>
            <text x="532" y="224" textAnchor="middle" fill="var(--gc2-ink-muted)" fontSize="11">Auth · RTDB · Functions</text>
          </g>

          <g>
            <rect x="590" y="38" width="146" height="80" rx="10" fill="var(--gc2-surface)" stroke="var(--gc2-line)" />
            <text x="608" y="69" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">GreenCloud</text>
            <text x="608" y="91" fill="var(--gc2-ink-muted)" fontSize="12">Observe · decide · audit</text>

            <rect x="590" y="242" width="146" height="80" rx="10" fill="var(--gc2-warning-soft)" stroke="var(--gc2-warning)" />
            <text x="608" y="273" fill="var(--gc2-ink)" fontSize="15" fontWeight="700">Relay + pump</text>
            <text x="608" y="295" fill="var(--gc2-warning)" fontSize="12">Protected command path</text>
          </g>

          <g>
            <rect x="623" y="145" width="80" height="70" rx="10" fill="var(--gc2-success-soft)" stroke="var(--gc2-success)" />
            <path d="M 648 181 L 658 191 L 679 166" fill="none" stroke="var(--gc2-success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <text x="663" y="205" textAnchor="middle" fill="var(--gc2-success)" fontSize="11" fontWeight="700">APPROVED</text>
          </g>
        </svg>
      </div>

      <figcaption className="grid gap-4 border-t border-[var(--gc2-line)] px-5 py-4 sm:grid-cols-4">
        <Gc2Metric label="Soil" value="43%" detail="Live reading" />
        <Gc2Metric label="Signal" value="-61" detail="dBm" />
        <Gc2Metric label="Rain" value="Clear" detail="Lockout inactive" />
        <Gc2Metric label="Pump" value="Guarded" detail="Awaiting approval" />
      </figcaption>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <Gc2PublicShell
      navigation={publicNavigation}
      actions={
        <>
          <Gc2LinkButton href="/login" variant="quiet">
            Sign in
          </Gc2LinkButton>
          <Gc2LinkButton href="/register">
            Create account
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Gc2LinkButton>
        </>
      }
    >
      <main>
        <section id="product" className="gc2-container py-14 sm:py-20 lg:py-24">
          <div className="gc2-grid items-center">
            <div className="col-span-12 lg:col-span-5">
              <p className="gc2-kicker">Smart irrigation workspace</p>
              <h1 className="gc2-heading-xl mt-4 max-w-[12ch]">
                See the garden. Protect every watering decision.
              </h1>
              <p className="gc2-copy mt-6 max-w-xl text-base sm:text-lg">
                GreenCloud connects a trusted ESP32 node, live garden telemetry and
                protected irrigation controls in one auditable workspace.
              </p>

              <div className="gc2-cluster mt-8">
                <Gc2LinkButton href="/register">
                  Start a workspace
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Gc2LinkButton>
                <Gc2LinkButton href="#workflow" variant="secondary">
                  Review the workflow
                </Gc2LinkButton>
              </div>

              <dl className="mt-10 grid gap-5 border-t border-[var(--gc2-line)] pt-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div>
                  <dt className="gc2-kicker">Pairing</dt>
                  <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                    OLED verified
                  </dd>
                </div>
                <div>
                  <dt className="gc2-kicker">Telemetry</dt>
                  <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                    Private workspace
                  </dd>
                </div>
                <div>
                  <dt className="gc2-kicker">Irrigation</dt>
                  <dd className="mt-2 text-sm font-bold text-[var(--gc2-ink)]">
                    Guarded output
                  </dd>
                </div>
              </dl>
            </div>

            <Gc2Surface tone="raised" className="col-span-12 overflow-hidden p-0 lg:col-span-7">
              <SystemTopology />
            </Gc2Surface>
          </div>
        </section>

        <section id="workflow" className="border-y border-[var(--gc2-line)] bg-[var(--gc2-surface)]">
          <div className="gc2-container py-14 sm:py-18">
            <div className="gc2-grid">
              <div className="col-span-12 md:col-span-4">
                <p className="gc2-kicker">Operational workflow</p>
                <h2 className="gc2-heading-lg mt-3 max-w-[12ch]">
                  Four jobs. One continuous record.
                </h2>
                <p className="gc2-copy mt-4 max-w-md">
                  The interface follows the system itself instead of forcing garden
                  operations into a generic dashboard grid.
                </p>
              </div>

              <ol className="col-span-12 m-0 list-none divide-y divide-[var(--gc2-line)] border-y border-[var(--gc2-line)] p-0 md:col-span-8">
                {workflow.map((step) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.number}
                      className="grid gap-4 py-5 sm:grid-cols-[48px_44px_minmax(0,1fr)] sm:items-start"
                    >
                      <span className="gc2-data text-sm font-bold text-[var(--gc2-ink-muted)]">
                        {step.number}
                      </span>
                      <span className="grid h-10 w-10 place-items-center rounded-[var(--gc2-radius-md)] border border-[var(--gc2-line)] bg-[var(--gc2-canvas)] text-[var(--gc2-moss-strong)]">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="m-0 text-base font-bold text-[var(--gc2-ink)]">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--gc2-ink-soft)]">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section id="security" className="gc2-container py-14 sm:py-20">
          <div className="gc2-grid items-start">
            <div className="col-span-12 lg:col-span-5">
              <p className="gc2-kicker">Protected by design</p>
              <h2 className="gc2-heading-lg mt-3 max-w-[13ch]">
                Safety state is part of the product, not an afterthought.
              </h2>
              <p className="gc2-copy mt-4 max-w-xl">
                GreenCloud makes blocked commands, stale telemetry and hardware
                lockouts visible before the user assumes irrigation is safe.
              </p>
            </div>

            <Gc2Surface className="col-span-12 p-0 lg:col-span-7">
              <ul className="m-0 divide-y divide-[var(--gc2-line)] p-0">
                {safeguards.map((item) => (
                  <li key={item} className="flex items-center gap-3 px-5 py-4">
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-[var(--gc2-success)]"
                    />
                    <span className="text-sm font-semibold text-[var(--gc2-ink)]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="grid gap-4 border-t border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] px-5 py-5 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Wifi aria-hidden="true" className="h-5 w-5 text-[var(--gc2-moss)]" />
                  <span className="text-xs font-bold text-[var(--gc2-ink-soft)]">Live sync</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock aria-hidden="true" className="h-5 w-5 text-[var(--gc2-warning)]" />
                  <span className="text-xs font-bold text-[var(--gc2-ink-soft)]">Safe mode</span>
                </div>
                <div className="flex items-center gap-3">
                  <Radio aria-hidden="true" className="h-5 w-5 text-[var(--gc2-info)]" />
                  <span className="text-xs font-bold text-[var(--gc2-ink-soft)]">Audit trail</span>
                </div>
              </div>
            </Gc2Surface>
          </div>
        </section>

        <section className="border-t border-[var(--gc2-line)] bg-[var(--gc2-forest)] text-[var(--gc2-ink-inverse)]">
          <div className="gc2-container grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                GreenCloud workspace
              </p>
              <h2 className="mt-2 max-w-2xl text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                Pair one trusted node and make the first garden state visible.
              </h2>
            </div>
            <Gc2LinkButton href="/register" className="bg-[var(--gc2-surface)] text-[var(--gc2-ink)] hover:bg-white">
              Create account
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Gc2LinkButton>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--gc2-line)] bg-[var(--gc2-surface)]">
        <div className="gc2-container flex flex-col gap-3 py-6 text-xs text-[var(--gc2-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">GreenCloud · Secure ESP32 irrigation workspace</p>
          <p className="m-0">Observe · Decide · Irrigate · Audit</p>
        </div>
      </footer>
    </Gc2PublicShell>
  );
}
