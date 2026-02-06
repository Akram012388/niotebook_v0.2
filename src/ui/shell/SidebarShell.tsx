"use client";

import { useCallback, useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { storageAdapter } from "@/infra/storageAdapter";
import { ThemeToggle } from "@/ui/shared/ThemeToggle";

const SIDEBAR_KEY = "niotebook.sidebar";

interface SidebarShellProps {
  children: React.ReactNode;
}

/* ---------------------------------------------------------------------------
   Inline SVG icons — 20×20, stroke currentColor, strokeWidth 1.5
   --------------------------------------------------------------------------- */

function GridIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

function GearIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
    </svg>
  );
}

function SignOutIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3" />
      <path d="M13 14l4-4-4-4" />
      <path d="M17 10H7" />
    </svg>
  );
}

function ChevronLeftIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4l-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon(): ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 4l6 6-6 6" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Nav items config
   --------------------------------------------------------------------------- */

interface NavItem {
  href: string;
  label: string;
  icon: ReactElement;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { href: "/courses", label: "Courses", icon: <GridIcon /> },
  { href: "/settings", label: "Settings", icon: <GearIcon />, disabled: true },
];

/* ---------------------------------------------------------------------------
   SidebarShell
   --------------------------------------------------------------------------- */

export function SidebarShell({ children }: SidebarShellProps): ReactElement {
  const pathname = usePathname();
  const { signOut } = useClerk();

  // SSR default: expanded. Client hydration corrects via rAF (like ThemeToggle).
  const [isExpanded, setIsExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration guard — read localStorage + responsive check after first paint
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const stored = storageAdapter.getItem(SIDEBAR_KEY);
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      if (isMobile) {
        setIsExpanded(false);
      } else if (stored === "collapsed") {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }

      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-collapse on narrow viewports
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent): void => {
      if (e.matches) {
        setIsExpanded(false);
        storageAdapter.setItem(SIDEBAR_KEY, "collapsed");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      storageAdapter.setItem(SIDEBAR_KEY, next ? "expanded" : "collapsed");
      return next;
    });
  }, []);

  const handleSignOut = useCallback(() => {
    void signOut();
  }, [signOut]);

  // Check if a nav item is active (exact or prefix match for nested routes)
  const isActive = (href: string): boolean => {
    if (href === "/courses") {
      return pathname === "/courses" || pathname.startsWith("/courses/");
    }
    return pathname === href;
  };

  const sidebarWidth = isExpanded ? 240 : 56;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        aria-label="Application sidebar"
        className="fixed top-0 left-0 z-30 flex h-screen flex-col border-r border-border bg-surface"
        style={{
          width: sidebarWidth,
          transition: mounted
            ? "width 200ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      >
        {/* Wordmark area */}
        <div className="flex h-14 shrink-0 items-center overflow-hidden px-3">
          {isExpanded ? (
            <Link
              href="/"
              className="inline-flex shrink-0 items-center"
              aria-label="niotebook — home"
            >
              <span
                className="font-display whitespace-nowrap text-lg font-bold leading-none tracking-tight text-foreground"
              >
                n
                <span className="text-accent" style={{ fontSize: "1.05em" }}>
                  i
                </span>
                otebook
              </span>
            </Link>
          ) : (
            <Link
              href="/"
              className="flex w-full items-center justify-center"
              aria-label="niotebook — home"
            >
              <span className="font-display text-lg font-bold leading-none text-foreground">
                n
              </span>
            </Link>
          )}
        </div>

        {/* Toggle button */}
        <div className="px-2">
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-controls="sidebar-nav"
            className="flex h-8 w-full items-center justify-center rounded-md text-text-muted transition-colors duration-100 hover:bg-surface-muted hover:text-foreground"
            title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </button>
        </div>

        {/* Nav items */}
        <nav id="sidebar-nav" className="mt-2 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const baseClasses =
              "flex h-11 items-center rounded-md transition-colors duration-100";
            const activeClasses =
              "bg-accent-muted border-l-[3px] border-l-accent text-foreground font-medium";
            const inactiveClasses =
              "text-text-muted hover:bg-surface-muted hover:text-foreground";
            const disabledClasses = "text-text-subtle cursor-not-allowed";

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={`${baseClasses} ${disabledClasses} ${
                    isExpanded ? "gap-3 px-3" : "justify-center"
                  }`}
                  aria-disabled="true"
                  title={item.label}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isExpanded && (
                    <span className="truncate text-sm">{item.label}</span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${
                  isExpanded ? "gap-3 px-3" : "justify-center"
                }`}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <span className="shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="truncate text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom section */}
        <div className="flex flex-col gap-1 border-t border-border px-2 py-3">
          {/* Theme toggle */}
          <div
            className={`flex items-center ${isExpanded ? "justify-start px-1" : "justify-center"}`}
          >
            <ThemeToggle />
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            className={`flex h-11 items-center rounded-md text-text-muted transition-colors duration-100 hover:bg-surface-muted hover:text-foreground ${
              isExpanded ? "gap-3 px-3" : "justify-center"
            }`}
            title="Sign out"
          >
            <span className="shrink-0">
              <SignOutIcon />
            </span>
            {isExpanded && <span className="truncate text-sm">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content with matching margin transition */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          marginLeft: sidebarWidth,
          transition: mounted
            ? "margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1)"
            : "none",
        }}
      >
        {children}
      </main>
    </div>
  );
}
