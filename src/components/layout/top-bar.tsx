"use client";

import { useState } from "react";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-11 items-center gap-4 border-b px-5 shrink-0"
      style={{
        background: "var(--color-bg-raised)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <div>
          <h1
            className="text-[13px] font-semibold tracking-tight leading-none"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title || "FreightIQ"}
          </h1>
          {subtitle && (
            <p
              className="text-[10px] mt-0.5 leading-none"
              style={{ color: "var(--color-text-muted)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative max-w-sm w-full">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: "var(--color-text-dim)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search vessels, ports, routes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md text-[11px] outline-none transition-colors"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-cyan)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(6,182,212,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <kbd
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1 py-0.5 rounded"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text-dim)",
              border: "1px solid var(--color-border)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Data status + utilities */}
      <div className="flex items-center gap-3">

        {/* Notification bell */}
        <button
          className="relative p-1.5 rounded-md transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-bg-elevated)";
            e.currentTarget.style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--color-text-muted)";
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
            style={{ background: "var(--color-danger)" }}
          />
        </button>

        {/* Date */}
        <span
          className="text-[10px] font-mono hidden sm:block"
          style={{ color: "var(--color-text-dim)" }}
        >
          {new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </header>
  );
}
