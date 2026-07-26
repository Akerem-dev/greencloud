import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavigationItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

function GreenCloudWordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-sm font-bold tracking-[-0.02em] no-underline",
        inverse ? "text-[var(--gc2-ink-inverse)]" : "text-[var(--gc2-ink)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid h-7 w-7 place-items-center rounded-[var(--gc2-radius-md)] border text-[11px]",
          inverse
            ? "border-[var(--gc2-line-inverse)] bg-white/5"
            : "border-[var(--gc2-line)] bg-[var(--gc2-surface)]",
        )}
      >
        GC
      </span>
      GreenCloud
    </Link>
  );
}

export function Gc2PublicShell({
  navigation,
  actions,
  children,
}: {
  navigation: NavigationItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="gc2-page">
      <header className="border-b border-[var(--gc2-line)] bg-[var(--gc2-surface)]">
        <div className="gc2-container flex min-h-16 items-center justify-between gap-6">
          <GreenCloudWordmark />
          <nav aria-label="Public navigation" className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-[var(--gc2-ink-soft)] no-underline hover:text-[var(--gc2-ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {actions ? <div className="gc2-cluster shrink-0">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}

export function Gc2AuthShell({
  eyebrow,
  title,
  description,
  context,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  context?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="gc2-page grid min-h-screen lg:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
      <aside className="relative hidden overflow-hidden border-r border-[var(--gc2-line)] bg-[var(--gc2-canvas-muted)] p-10 lg:flex lg:flex-col lg:justify-between">
        <GreenCloudWordmark />
        <div className="max-w-md py-16">
          {eyebrow ? <p className="gc2-kicker">{eyebrow}</p> : null}
          <h1 className="gc2-heading-lg mt-3">{title}</h1>
          <p className="gc2-copy mt-4">{description}</p>
        </div>
        <div>{context}</div>
      </aside>

      <section className="grid min-h-screen place-items-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[560px]">
          <div className="mb-8 lg:hidden">
            <GreenCloudWordmark />
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}

export function Gc2AppShell({
  primaryNavigation,
  secondaryNavigation,
  currentPath,
  topbar,
  children,
}: {
  primaryNavigation: NavigationItem[];
  secondaryNavigation?: NavigationItem[];
  currentPath: string;
  topbar?: ReactNode;
  children: ReactNode;
}) {
  const navigation = (items: NavigationItem[], label: string) => (
    <nav aria-label={label} className="grid gap-1">
      {items.map((item) => {
        const active =
          currentPath === item.href ||
          (item.href !== "/" && currentPath.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="gc2-nav-item"
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="gc2-page lg:grid lg:grid-cols-[var(--gc2-sidebar-width)_minmax(0,1fr)]">
      <aside className="gc2-sidebar flex flex-col px-4 py-5">
        <div className="px-2">
          <GreenCloudWordmark inverse />
        </div>
        <div className="mt-8 flex-1">
          {navigation(primaryNavigation, "Primary application navigation")}
        </div>
        {secondaryNavigation?.length ? (
          <div className="mt-8 border-t border-[var(--gc2-line-inverse)] pt-4">
            {navigation(secondaryNavigation, "Account and settings navigation")}
          </div>
        ) : null}
      </aside>

      <div className="min-w-0">
        <header className="gc2-topbar flex items-center justify-end px-4 md:px-6">
          {topbar}
        </header>
        <main className="gc2-container py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
