"use client";

import Link from "next/link";
import { Panel, PanelHeader } from "@/components/design-system/primitives";

export function ExecutiveActionRadar() {
  return (
    <Panel className="h-full flex flex-col justify-between">
      <PanelHeader>
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <h3
              className="text-[13px] font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Morning Command Radar
            </h3>
          </div>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Live tactical alerts &amp; 1-click deep-dive actions
          </p>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{
            background: "rgba(6, 182, 212, 0.08)",
            color: "var(--color-cyan)",
            border: "1px solid rgba(6, 182, 212, 0.2)",
          }}
        >
          3 PRIORITY SIGNALS
        </span>
      </PanelHeader>

      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        {/* Signal 1: Weather & Cyclone Alert */}
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.06), rgba(245, 158, 11, 0.04))",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-danger)" }}
              >
                Weather Alert — Bay of Bengal
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--color-danger)" }}
            >
              48–72h ETA
            </span>
          </div>
          <p
            className="text-[12px] font-medium leading-snug"
            style={{ color: "var(--color-text-primary)" }}
          >
            Tropical depression forming south of Paradip
          </p>
          <p
            className="text-[11px] mt-1 leading-normal"
            style={{ color: "var(--color-text-muted)" }}
          >
            Affects Paradip &amp; Dhamra approaches. Swells 4m+, potential 2–3 day berthing delays &amp; monsoon draft cuts.
          </p>
          <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-[10px] font-mono text-slate-400">IMD Advisory #04</span>
            <Link
              href="/risks"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Analyze Weather &amp; Risks →
            </Link>
          </div>
        </div>

        {/* Signal 2: Top Tactical Charter Opportunity */}
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(6, 182, 212, 0.04))",
            borderColor: "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-positive)" }}
              >
                Charter Window Open
              </span>
            </div>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--color-positive)" }}
            >
              SAVE ~$42,000
            </span>
          </div>
          <p
            className="text-[12px] font-medium leading-snug"
            style={{ color: "var(--color-text-primary)" }}
          >
            Supramax AU → Vizag: 5–7 Day Entry Window
          </p>
          <p
            className="text-[11px] mt-1 leading-normal"
            style={{ color: "var(--color-text-muted)" }}
          >
            Rates currently at $14.20/t. AI forecast predicts rate climb to $15.10/t (+6.3%). Lock spot or 3mo period now.
          </p>
          <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-[10px] font-mono text-emerald-400">78% AI Confidence</span>
            <Link
              href="/charter-planner"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Open in Charter Planner →
            </Link>
          </div>
        </div>

        {/* Signal 3: Port Congestion Bottleneck */}
        <div
          className="p-3 rounded-lg border transition-all"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-warning)" }}
              >
                Port Congestion Flash
              </span>
            </div>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--color-warning)" }}
            >
              Sagar: 3.2d Wait
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] block text-slate-400">Sagar / Sandheads</span>
              <span className="text-[12px] font-bold font-mono text-amber-400">12 Queued</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] block text-slate-400">Paradip</span>
              <span className="text-[12px] font-bold font-mono text-slate-200">7 Queued</span>
            </div>
            <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] block text-slate-400">Vizag Harbor</span>
              <span className="text-[12px] font-bold font-mono text-emerald-400">3 Queued</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <span className="text-[10px] font-mono text-slate-400">Berth Occupancy 89%</span>
            <Link
              href="/ports"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Inspect Port Berths →
            </Link>
          </div>
        </div>
      </div>
    </Panel>
  );
}
