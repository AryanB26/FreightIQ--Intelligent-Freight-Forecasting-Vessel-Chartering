"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Panel } from "@/components/design-system/primitives";

export default function ExecutiveDashboardPage() {
  const [lastUpdatedTime, setLastUpdatedTime] = useState("02:40 UTC");

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, "0");
    const minutes = String(now.getUTCMinutes()).padStart(2, "0");
    setLastUpdatedTime(`${hours}:${minutes} UTC`);
  }, []);

  // 1. General Freight Outlook across all major vessel classes
  const vesselClassOutlook = [
    {
      name: "Handysize",
      dwt: "10k–40k DWT",
      rate: "$12.10/t",
      movement: "+1.8%",
      trend: "rising" as const,
      outlook30d: "↑",
      outlookLabel: "Firm",
      outlookColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      name: "Supramax",
      dwt: "50k–60k DWT",
      rate: "$14.20/t",
      movement: "+3.4%",
      trend: "rising" as const,
      outlook30d: "↑",
      outlookLabel: "Rising",
      outlookColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      name: "Panamax",
      dwt: "65k–85k DWT",
      rate: "$18.40/t",
      movement: "+0.4%",
      trend: "stable" as const,
      outlook30d: "→",
      outlookLabel: "Stable",
      outlookColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      name: "Capesize",
      dwt: "150k+ DWT",
      rate: "$21.10/t",
      movement: "-1.2%",
      trend: "falling" as const,
      outlook30d: "↓",
      outlookLabel: "Easing",
      outlookColor: "text-red-600 dark:text-red-400",
    },
  ];

  // 2. General Market Signals (Macro dry bulk observations)
  const marketSignals = [
    {
      symbol: "↑",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: "Supramax activity increasing",
      description: "Inquiry volumes strengthening across mineral and agricultural bulk segments.",
    },
    {
      symbol: "→",
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      title: "Handysize market relatively stable",
      description: "Short-sea demand balanced against regional fleet positioning.",
    },
    {
      symbol: "↓",
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      title: "Capesize momentum easing",
      description: "Forward fixture velocity moderating following earlier cycle correction.",
    },
    {
      symbol: "⚠",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      title: "Freight market volatility elevated",
      description: "30-day implied volatility at 14.3%; short-term rate swings expected.",
    },
  ];

  // 3. Active General Alerts (Simulated for prototype)
  const activeAlerts = [
    {
      category: "WEATHER",
      severity: "alert-weather",
      badgeColor: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25",
      region: "Bay of Bengal",
      text: "Weather conditions may affect East Coast India operations. Tropical depression forming south of Paradip.",
      href: "/risks",
      actionLabel: "View Risk Radar →",
    },
    {
      category: "PORT CONGESTION",
      severity: "alert-congestion",
      badgeColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
      region: "East Coast India",
      text: "Congestion levels require monitoring. Moderate queues at Sagar/Sandheads and Paradip bulk berths.",
      href: "/ports",
      actionLabel: "View Port Conditions →",
    },
    {
      category: "MARKET VOLATILITY",
      severity: "alert-market",
      badgeColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
      region: "Dry Bulk Market",
      text: "Freight volatility has increased across Supramax and Panamax spot indices week-over-week.",
      href: "/freight-market",
      actionLabel: "View Market →",
    },
    {
      category: "SUPPLY / DEMAND",
      severity: "alert-supply",
      badgeColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25",
      region: "Global Fleet",
      text: "Changes in vessel availability being observed in Indian Ocean and Asia-Pacific ballast lanes.",
      href: "/vessels",
      actionLabel: "View Fleet →",
    },
  ];

  // 4. Regional Market Watch (Broad trade corridors)
  const regionalWatch = [
    {
      region: "Australia",
      activity: "↑",
      activityLabel: "RISING",
      activityColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      notes: "Iron ore and metallurgical coal export demand firm.",
    },
    {
      region: "Indonesia",
      activity: "→",
      activityLabel: "STABLE",
      activityColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      notes: "Thermal coal export inquiries steady across Kalimantan ports.",
    },
    {
      region: "Mozambique",
      activity: "↑",
      activityLabel: "RISING",
      activityColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      notes: "Coking coal parcel demand expanding to Indian destinations.",
    },
    {
      region: "United States",
      activity: "→",
      activityLabel: "STABLE",
      activityColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      notes: "Gulf grain and petcoke shipping activity balanced.",
    },
    {
      region: "Russia",
      activity: "→",
      activityLabel: "STABLE",
      activityColor: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      notes: "Far East coal and bulk carrier turnaround on schedule.",
    },
    {
      region: "East Coast India",
      activity: "⚠",
      activityLabel: "MONITOR",
      activityColor: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      notes: "Draft restrictions and turnaround times requiring observation.",
    },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-6">
      {/* ──────────────────────────────────────────
          HERO: TODAY'S FREIGHT BRIEF
         ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <h1
              className="text-[17px] font-bold tracking-tight font-mono uppercase"
              style={{ color: "var(--color-text-primary)" }}
            >
              Today&apos;s Freight Brief
            </h1>
          </div>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            One-minute view of freight markets, risks and chartering signals
          </p>
        </div>

        {/* Live Terminal Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-text-muted)]">
            <span>19 Sept 2026</span>
            <span>•</span>
            <span className="text-[var(--color-text-secondary)]">Updated {lastUpdatedTime}</span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────
          1. MARKET SNAPSHOT
         ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* BDI */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "var(--color-bg-raised)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            BDI
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-bold font-mono text-[var(--color-text-primary)]">
              3,628
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ↑ 4.2%
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] mt-1">Week-over-week</div>
        </div>

        {/* SUPRAMAX */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "var(--color-bg-raised)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Supramax
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-bold font-mono text-[var(--color-text-primary)]">
              $14.20<span className="text-[10px] text-[var(--color-text-muted)] font-normal">/t</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ↑ 3.4%
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] mt-1">Dry bulk benchmark</div>
        </div>

        {/* PANAMAX */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "var(--color-bg-raised)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Panamax
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-bold font-mono text-[var(--color-text-primary)]">
              $18.40<span className="text-[10px] text-[var(--color-text-muted)] font-normal">/t</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              ↑ 2.8%
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] mt-1">Dry bulk benchmark</div>
        </div>

        {/* CAPESIZE */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "var(--color-bg-raised)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Capesize
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-bold font-mono text-[var(--color-text-primary)]">
              $21.10<span className="text-[10px] text-[var(--color-text-muted)] font-normal">/t</span>
            </span>
            <span className="text-[11px] font-mono font-semibold text-red-600 dark:text-red-400">
              ↓ 1.2%
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] mt-1">Dry bulk benchmark</div>
        </div>

        {/* MARKET DIRECTION */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            borderColor: "rgba(16, 185, 129, 0.25)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            Market Direction
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[16px] font-bold font-mono text-emerald-700 dark:text-emerald-400 tracking-tight">
              RISING
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              BULLISH
            </span>
          </div>
          <div className="text-[9px] text-emerald-700/80 dark:text-emerald-500/80 mt-1">Current market trend</div>
        </div>

        {/* 7-DAY MOVEMENT */}
        <div
          className="p-3 rounded-lg border transition-all hover:border-[var(--color-border-light)]"
          style={{
            background: "var(--color-bg-raised)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            7-Day Movement
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[18px] font-bold font-mono text-cyan-600 dark:text-cyan-400">
              +6.2%
            </span>
            <span className="text-[10px] font-mono font-semibold text-cyan-700 dark:text-cyan-300">
              Accelerating
            </span>
          </div>
          <div className="text-[9px] text-[var(--color-text-muted)] mt-1">Recent market movement</div>
        </div>
      </div>

      {/* ──────────────────────────────────────────
          2 & 3: GENERAL FREIGHT OUTLOOK + MARKET SIGNALS
         ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* 2. GENERAL FREIGHT OUTLOOK (7 cols) */}
        <Panel className="lg:col-span-7 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <h3 className="text-[12px] font-bold tracking-wide uppercase font-mono text-[var(--color-text-primary)]">
                    30-Day Freight Outlook
                  </h3>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  General market benchmark levels and forward model outlook across vessel classes
                </p>
              </div>

              <Link
                href="/forecasting"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-opacity shrink-0"
              >
                View Forecast →
              </Link>
            </div>

            {/* Table of all major vessel classes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px] font-mono">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg-elevated)]">
                    <th className="py-2 px-2.5 font-semibold">Vessel Class</th>
                    <th className="py-2 px-2.5 font-semibold">Deadweight</th>
                    <th className="py-2 px-2.5 font-semibold text-right">Current Level</th>
                    <th className="py-2 px-2.5 font-semibold text-right">7-Day Movement</th>
                    <th className="py-2 px-2.5 font-semibold text-right">30D Outlook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text-secondary)]">
                  {vesselClassOutlook.map((v) => (
                    <tr key={v.name} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                      <td className="py-2.5 px-2.5 font-bold text-[var(--color-text-primary)]">
                        {v.name}
                      </td>
                      <td className="py-2.5 px-2.5 text-[var(--color-text-muted)] text-[11px]">
                        {v.dwt}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-bold text-[var(--color-text-primary)]">
                        {v.rate}
                      </td>
                      <td
                        className={`py-2.5 px-2.5 text-right font-semibold ${
                          v.trend === "rising"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : v.trend === "falling"
                            ? "text-red-600 dark:text-red-400"
                            : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {v.movement}
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <span className={`font-bold ${v.outlookColor}`}>
                          {v.outlook30d} {v.outlookLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)] flex items-center justify-between">
            <span>Model horizon: 30 days • Global dry-bulk index basis</span>
            <span className="text-[var(--color-text-dim)]">Confidence envelope: 80% CI</span>
          </div>
        </Panel>

        {/* 3. MARKET SIGNALS (5 cols) */}
        <Panel className="lg:col-span-5 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h3 className="text-[12px] font-bold tracking-wide uppercase font-mono text-[var(--color-text-primary)]">
                  Market Signals
                </h3>
              </div>

              <Link
                href="/freight-market"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-opacity shrink-0"
              >
                View Market →
              </Link>
            </div>

            <div className="space-y-2.5">
              {marketSignals.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border bg-[var(--color-bg-elevated)] border-[var(--color-border)] transition-colors hover:border-[var(--color-border-light)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-4 h-4 rounded text-[11px] font-bold font-mono border ${s.bg} ${s.color}`}
                    >
                      {s.symbol}
                    </span>
                    <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1 pl-6 leading-snug">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)] text-right">
            Broad sector intelligence • Updated daily
          </div>
        </Panel>
      </div>

      {/* ──────────────────────────────────────────
          4 & 5: ACTIVE ALERTS + REGIONAL MARKET WATCH
         ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* 4. ACTIVE ALERTS (6 cols) */}
        <Panel className="lg:col-span-6 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-[12px] font-bold tracking-wide uppercase font-mono text-[var(--color-text-primary)]">
                  Active Alerts
                </h3>
              </div>

              <Link
                href="/risks"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-opacity"
              >
                View Risk Radar →
              </Link>
            </div>

            <div className="space-y-2">
              {activeAlerts.map((a, idx) => (
                <Link
                  key={idx}
                  href={a.href}
                  className="block p-2.5 rounded-lg border bg-[var(--color-bg-elevated)] border-[var(--color-border)] transition-all hover:border-[var(--color-border-light)]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${a.badgeColor}`}
                    >
                      {a.category}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)] font-medium">
                      {a.region}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug mt-1">
                    {a.text}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] font-mono text-[var(--color-text-muted)]">
            <span>Prototype alerts</span>
            <Link href="/ports" className="text-cyan-600 dark:text-cyan-400 hover:underline">
              View Port Conditions →
            </Link>
          </div>
        </Panel>

        {/* 5. REGIONAL MARKET WATCH (6 cols) */}
        <Panel className="lg:col-span-6 flex flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <h3 className="text-[12px] font-bold tracking-wide uppercase font-mono text-[var(--color-text-primary)]">
                    Regional Market Watch
                  </h3>
                </div>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  General trade flow pace and cargo activity across key bulk origin/destination areas
                </p>
              </div>

              <Link
                href="/freight-market"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-opacity shrink-0"
              >
                Market Depth →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {regionalWatch.map((r) => (
                <div
                  key={r.region}
                  className="p-2.5 rounded-lg border bg-[var(--color-bg-elevated)] border-[var(--color-border)]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-[var(--color-text-primary)] font-mono">
                      {r.region}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${r.activityColor}`}
                    >
                      {r.activity} {r.activityLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-text-secondary)] leading-snug">
                    {r.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)]">
            Broad regional summary • Not specific fixture recommendations
          </div>
        </Panel>
      </div>

      {/* ──────────────────────────────────────────
          6. QUICK MARKET SUMMARY (MARKET BRIEF)
         ────────────────────────────────────────── */}
      <Panel className="p-4 border-[var(--color-border)] bg-[var(--color-bg-raised)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                Market Brief
              </span>
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
                Executive Synthesis
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
              Dry bulk freight markets are showing mixed movement across vessel classes. Recent volatility and regional congestion remain important factors to monitor. Use <strong>Market</strong> and <strong>Analytics</strong> for detailed rate analysis and forecasts, and <strong>Charter Planner</strong> for voyage-specific decisions.
            </p>
          </div>

          {/* Quick Hub Navigation */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/freight-market"
              className="px-3 py-1.5 rounded text-[11px] font-mono font-semibold border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              View Market →
            </Link>
            <Link
              href="/forecasting"
              className="px-3 py-1.5 rounded text-[11px] font-mono font-semibold border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              View Forecast →
            </Link>
            <Link
              href="/ports"
              className="px-3 py-1.5 rounded text-[11px] font-mono font-semibold border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              View Port Conditions →
            </Link>
            <Link
              href="/charter-planner"
              className="px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-all duration-150 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90"
            >
              Open Charter Planner →
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
