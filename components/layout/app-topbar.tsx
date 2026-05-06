"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Cpu,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { useAppState } from "@/components/providers/app-state-provider";
import {
  logoutFromGreenCloud,
  subscribeToAuthState,
  type GreenCloudAuthUser,
} from "@/lib/firebase-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type AppTopbarProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  description?: string;
  onOpenMobileSidebar?: () => void;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Devices", href: "/devices", icon: Cpu },
  { label: "Automation", href: "/automation", icon: SlidersHorizontal },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

function NavButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border text-[10.5px] font-semibold leading-none transition duration-300",
        "min-w-8 px-2.5 min-[1500px]:px-3 min-[1500px]:text-xs",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-text)] shadow-[0_10px_22px_color-mix(in_srgb,var(--gc-glow)_42%,transparent)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)] bg-black/[0.16] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.03] hover:text-[var(--gc-text)]",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />

      <span
        className={cn(
          "whitespace-nowrap",
          active ? "inline" : "hidden min-[1550px]:inline",
        )}
      >
        {item.label}
      </span>
    </Link>
  );
}

function IconButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-text)] shadow-[0_10px_22px_color-mix(in_srgb,var(--gc-glow)_42%,transparent)]"
          : "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)] bg-black/[0.16] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.03] hover:text-[var(--gc-text)]",
      )}
    >
      {children}
    </button>
  );
}

export default function AppTopbar({
  title = "Control Center",
  subtitle,
  eyebrow = "GREENCLOUD WORKSPACE",
  description = "Live telemetry, protected irrigation and connected ESP32 device control.",
  onOpenMobileSidebar,
}: AppTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    notifications,
    openNotifications,
    notificationsOpen,
    openQuickPanel,
    quickPanelOpen,
    searchQuery,
    setSearchQuery,
    settings,
  } = useAppState();

  const [authUser, setAuthUser] = useState<GreenCloudAuthUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await logoutFromGreenCloud();
      router.replace("/auth");
    } finally {
      setIsSigningOut(false);
    }
  }

  const unreadCount = notifications.filter((item) => !item.read).length;
  const finalDescription = subtitle ?? description;
  const profileActive = pathname.startsWith("/profile");

  const accountLabel =
    authUser?.displayName || authUser?.email || settings.ownerName || "ahmet";

  return (
    <header className="sticky top-4 z-40 w-full">
      <div
        className={cn(
          "premium-noise relative overflow-hidden rounded-[24px] border",
          "border-[color-mix(in_srgb,var(--gc-border)_54%,transparent)]",
          "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--gc-bg)_90%,black),color-mix(in_srgb,var(--gc-bg)_84%,black))]",
          "shadow-[0_18px_50px_rgba(0,0,0,0.26),0_0_24px_color-mix(in_srgb,var(--gc-glow)_26%,transparent),inset_0_1px_0_rgba(255,255,255,0.014)]",
          "backdrop-blur-2xl",
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,color-mix(in_srgb,var(--gc-accent)_6%,transparent),transparent_35%),radial-gradient(circle_at_88%_4%,color-mix(in_srgb,var(--gc-accent-2)_4%,transparent),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--gc-accent-2)_18%,transparent)] to-transparent" />
        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--gc-border)_38%,transparent)] to-transparent" />

        <div className="relative z-10 flex min-h-[74px] min-w-0 items-center gap-2 px-3 py-2.5 lg:px-4">
          {onOpenMobileSidebar ? (
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="premium-btn-secondary hidden h-8 w-8 shrink-0 items-center justify-center rounded-full max-xl:flex"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          ) : null}

          <div className="min-w-0 shrink-0 basis-[152px] min-[1450px]:basis-[185px] min-[1650px]:basis-[245px]">
            <p className="truncate text-[8.5px] font-bold uppercase tracking-[0.22em] text-[var(--gc-muted)]">
              {eyebrow}
            </p>

            <h1 className="mt-1 block max-w-full truncate text-[clamp(1rem,1.2vw,1.45rem)] font-semibold leading-none tracking-[-0.058em] text-[var(--gc-text)]">
              {title}
            </h1>

            <p className="mt-1.5 hidden max-w-full truncate text-[10px] leading-4 text-[var(--gc-soft)] min-[1500px]:block min-[1650px]:text-xs">
              {finalDescription}
            </p>
          </div>

          <nav className="flex min-w-0 flex-1 flex-nowrap items-center justify-start gap-1.5 overflow-x-auto overscroll-x-contain pr-1 [scrollbar-width:none] min-[1500px]:justify-center min-[1500px]:gap-2 [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return <NavButton key={item.href} item={item} active={active} />;
            })}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5">
            <div className="relative hidden w-[190px] shrink-0 min-[1500px]:block min-[1650px]:w-[240px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gc-muted)]" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search workspace..."
                className={cn(
                  "h-8 w-full rounded-full border py-1.5 pl-9 pr-3 text-xs outline-none transition",
                  "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)]",
                  "bg-black/[0.18] text-[var(--gc-text)] placeholder:text-[var(--gc-muted)]",
                  "focus:border-[color-mix(in_srgb,var(--gc-accent)_28%,transparent)] focus:bg-black/[0.24] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--gc-accent)_7%,transparent)]",
                )}
              />
            </div>

            <IconButton
              label="Open quick controls"
              onClick={openQuickPanel}
              active={quickPanelOpen}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </IconButton>

            <IconButton
              label="Open alerts"
              onClick={openNotifications}
              active={notificationsOpen}
            >
              <Bell className="h-3.5 w-3.5" />

              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-bg)_88%,black)] bg-[var(--gc-accent)] px-1 text-[9px] font-bold text-[#11160d] shadow-[0_0_14px_var(--gc-glow)]">
                  {unreadCount}
                </span>
              ) : null}
            </IconButton>

            <Link
              href="/profile"
              className={cn(
                "flex h-8 w-8 min-w-0 items-center justify-center gap-1.5 rounded-full border p-1 transition duration-300 min-[1450px]:w-auto min-[1450px]:max-w-[125px] min-[1450px]:justify-start min-[1450px]:pl-1 min-[1450px]:pr-2 min-[1650px]:max-w-[155px]",
                profileActive
                  ? "border-[color-mix(in_srgb,var(--gc-accent)_34%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_14%,transparent)] text-[var(--gc-text)] shadow-[0_10px_22px_color-mix(in_srgb,var(--gc-glow)_42%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)] bg-black/[0.16] text-[var(--gc-soft)] hover:border-[color-mix(in_srgb,var(--gc-accent)_22%,transparent)] hover:bg-white/[0.03] hover:text-[var(--gc-text)]",
              )}
              title="Open profile"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--gc-accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--gc-accent)_9%,transparent)] text-[var(--gc-accent-2)]">
                <UserRound className="h-3 w-3" />
              </span>

              <span className="hidden truncate text-xs font-semibold min-[1450px]:block">
                {accountLabel}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={cn(
                "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition duration-300",
                "border-[color-mix(in_srgb,var(--gc-border)_52%,transparent)] bg-black/[0.16] text-[var(--gc-soft)]",
                "hover:border-[color-mix(in_srgb,var(--gc-danger)_26%,transparent)] hover:bg-[color-mix(in_srgb,var(--gc-danger)_7%,transparent)] hover:text-[var(--gc-text)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden min-[1680px]:inline">
                {isSigningOut ? "Signing out..." : "Sign out"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}