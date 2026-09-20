"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface NavItem {
  label: string;
  href: string;
}

interface NavDropdown {
  label: string;
  items: NavItem[];
}

const dropdowns: NavDropdown[] = [
  {
    label: "Maritime",
    items: [
      { label: "3D Intelligence", href: "/intelligence" },
      { label: "Knowledge Graph", href: "/intelligence/knowledge-graph" },
      { label: "Vessels", href: "/vessels" },
      { label: "Port Intelligence", href: "/ports" },
    ],
  },
  {
    label: "Market",
    items: [
      { label: "Freight Market", href: "/freight-market" },
      { label: "Rate Forecasting", href: "/forecasting" },
      { label: "Arbitrage Radar", href: "/arbitrage" },
      { label: "Market Entry", href: "/market-entry" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Voyage Analysis", href: "/voyages" },
      { label: "Charter Planning", href: "/charter-planner" },
      { label: "Idle Fleet", href: "/idle-vessels" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Risk Monitor", href: "/risks" },
      { label: "Scenarios", href: "/scenarios" },
      { label: "Historical Data", href: "/history" },
      { label: "Shadow Ledger", href: "/history/shadow-ledger" },
    ],
  },
];

function isDropdownActive(dropdown: NavDropdown, pathname: string) {
  return dropdown.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
}

export function TopNav() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  function handleDropdownEnter(label: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(label);
  }

  function handleDropdownLeave() {
    timeoutRef.current = setTimeout(() => setOpenDropdown(null), 120);
  }

  function isDashboardActive() {
    return pathname === "/executive" || pathname.startsWith("/executive/");
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center border-b"
      style={{
        background: "var(--color-bg)",
        borderColor: "var(--color-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center w-full px-4" ref={navRef}>
        <Link href="/" className="flex items-center gap-2.5 mr-8 shrink-0">
          <img
            src="/logo.png"
            alt="FreightIQ"
            className="h-[26px] w-[26px] object-contain shrink-0"
            width={26}
            height={26}
          />
          <span
            className="text-[13px] font-bold tracking-tight hidden sm:block"
            style={{ color: "var(--color-text-primary)" }}
          >
            FreightIQ
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150"
            style={{
              background: pathname === "/" ? "var(--color-bg-raised)" : "transparent",
              color: pathname === "/" ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: pathname === "/" ? "1px solid var(--color-border)" : "1px solid transparent",
            }}
          >
            Home
          </Link>

          <Link
            href="/executive"
            className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150"
            style={{
              background: isDashboardActive() ? "var(--color-bg-raised)" : "transparent",
              color: isDashboardActive() ? "var(--color-text-primary)" : "var(--color-text-muted)",
              border: isDashboardActive() ? "1px solid var(--color-border)" : "1px solid transparent",
            }}
          >
            Dashboard
          </Link>

          {dropdowns.map((dropdown) => {
            const isOpen = openDropdown === dropdown.label;
            const active = isDropdownActive(dropdown, pathname);
            return (
              <div
                key={dropdown.label}
                className="relative"
                onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                onMouseLeave={handleDropdownLeave}
              >
                <button
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150"
                  style={{
                    background: active ? "var(--color-bg-raised)" : isOpen ? "var(--color-bg-raised)" : "transparent",
                    color: active || isOpen ? "var(--color-text-primary)" : "var(--color-text-muted)",
                    border: active || isOpen ? "1px solid var(--color-border)" : "1px solid transparent",
                  }}
                  onClick={() => setOpenDropdown(isOpen ? null : dropdown.label)}
                >
                  {dropdown.label}
                  <svg
                    className={cn("w-3 h-3 transition-transform duration-150", isOpen && "rotate-180")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-52 rounded-lg border overflow-hidden"
                    style={{
                      background: "var(--color-bg-elevated)",
                      borderColor: "var(--color-border)",
                      boxShadow: "0 16px 32px rgba(0,0,0,0.18)",
                    }}
                    onMouseEnter={() => handleDropdownEnter(dropdown.label)}
                    onMouseLeave={handleDropdownLeave}
                  >
                    {dropdown.items.map((item) => {
                      const itemActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12px] font-medium transition-all duration-100 border-b last:border-b-0"
                          style={{
                            background: itemActive ? "var(--color-bg-raised)" : "transparent",
                            color: itemActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                            borderColor: "var(--color-border)",
                          }}
                        >
                          {item.label}
                          {itemActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-text-primary)" }} />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <ThemeToggle />

          <span className="text-[10px] font-mono hidden md:block" style={{ color: "var(--color-text-dim)" }}>
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>

          <button
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: "var(--color-text-muted)", background: "transparent" }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed top-12 left-0 right-0 bottom-0 overflow-y-auto border-t"
          style={{
            background: "var(--color-bg)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="p-4 flex flex-col gap-1">
            <Link href="/" className="px-3 py-2.5 rounded-md text-[13px] font-medium" style={{ background: pathname === "/" ? "var(--color-bg-raised)" : "transparent", color: pathname === "/" ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              Home
            </Link>
            <Link href="/executive" className="px-3 py-2.5 rounded-md text-[13px] font-medium" style={{ background: isDashboardActive() ? "var(--color-bg-raised)" : "transparent", color: isDashboardActive() ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              Dashboard
            </Link>
            {dropdowns.map((dropdown) => (
              <div key={dropdown.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] px-3 pt-3 pb-1" style={{ color: "var(--color-text-dim)" }}>
                  {dropdown.label}
                </p>
                {dropdown.items.map((item) => {
                  const itemActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2.5 rounded-md text-[13px] font-medium"
                      style={{
                        background: itemActive ? "var(--color-bg-raised)" : "transparent",
                        color: itemActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
