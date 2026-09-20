"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Features", href: "#features" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass mx-auto mt-4 max-w-6xl rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-heading font-bold text-sm">
              FS
            </div>
            <span className="font-heading font-bold text-lg text-foreground">
              FlowSync
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
            >
              Sign in
            </a>
            <a
              href="#pricing"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary/90 transition-colors duration-200 cursor-pointer"
            >
              Get Started
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-foreground transition-transform duration-200 ${mobileOpen ? "translate-y-1 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-transform duration-200 ${mobileOpen ? "-translate-y-1 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 border-t border-border pt-4 pb-2 flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#pricing"
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary text-center hover:bg-primary/90 transition-colors cursor-pointer"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </a>
          </div>
        )}
      </nav>
    </header>
  );
}
