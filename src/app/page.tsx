"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TopNav } from "@/components/layout/top-nav";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".reveal").forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Icons ─── */
const Icons = {
  Forecast: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  MarketEntry: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  Vessel: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  Voyage: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 2.499l2.118 2.118a1.5 1.5 0 01-2.118 2.117l-2.118-2.117m-1.5-1.5l2.118-2.118a1.5 1.5 0 012.118 0l2.118 2.118" />
    </svg>
  ),
  Idle: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
    </svg>
  ),
  Risk: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  Port: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  Scenario: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  ),
  Arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Chevron: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
};

const problems = [
  "Reactive daily freight-market decisions with no forward visibility",
  "Freight-rate volatility — a 10% swing on 300K MT costs ~$900K",
  "Difficulty matching vessel type to port draft and infrastructure",
  "Vessel idle time between voyages draining charter budgets",
  "Port congestion causing unexpected demurrage and delays",
  "Weather and market disruptions with no early-warning system",
  "Dependence on multiple single spot-market contracts",
];

const capabilities = [
  { icon: Icons.Forecast, title: "Freight Forecasting", desc: "Predict future freight-rate trends using ML models trained on historical data across 10 routes and 4 vessel classes." },
  { icon: Icons.MarketEntry, title: "Optimal Market Entry", desc: "Identify favorable windows to enter the market and secure vessels at the best possible timing." },
  { icon: Icons.Vessel, title: "Vessel Optimization", desc: "Recommend the right vessel class based on cargo volume, route constraints, port limitations and cost." },
  { icon: Icons.Voyage, title: "Voyage Analysis", desc: "Evaluate routes, transit characteristics and operational efficiency for every cargo movement." },
  { icon: Icons.Idle, title: "Idle Fleet Management", desc: "Detect upcoming idle vessel periods and suggest alternative employment to reduce dead time." },
  { icon: Icons.Risk, title: "Risk Monitoring", desc: "Highlight port congestion, freight volatility, weather events and schedule exposure before they hit." },
  { icon: Icons.Port, title: "Port Intelligence", desc: "Consider draft, berth availability, turnaround time and vessel-size limits for every Indian East Coast port." },
  { icon: Icons.Scenario, title: "Scenario Analysis", desc: "Compare base, bull and bear scenarios to stress-test charter strategies against market conditions." },
];

const flowSteps = [
  "Cargo Requirements",
  "Market Analysis",
  "Freight Rate Forecast",
  "Vessel Optimization",
  "Voyage & Route Analysis",
  "Risk Analysis",
  "Charter Recommendation",
];

const vesselClasses = [
  { name: "Handysize", dwt: "10K – 40K", ports: "Gopalpur, Haldia", desc: "Smaller ports with draft or infrastructure constraints" },
  { name: "Supramax", dwt: "40K – 60K", ports: "Paradip, Dhamra, Gopalpur", desc: "Versatile mid-size class for varied cargo" },
  { name: "Panamax", dwt: "60K – 80K", ports: "Paradip, Vizag, Dhamra", desc: "Large-volume coal and iron ore imports" },
  { name: "Capesize", dwt: "80K – 200K+", ports: "Paradip, Vizag, Gangavaram, Dhamra", desc: "Maximum capacity for deep-draft berths" },
];

/* ─── Page ─── */
export default function HomePage() {
  const heroRef = useScrollReveal();
  const problemRef = useScrollReveal();
  const solutionRef = useScrollReveal();
  const capsRef = useScrollReveal();
  const compareRef = useScrollReveal();
  const vesselRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* ── Nav ── */}
      <TopNav />

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-12"
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10"
          style={{ background: "var(--color-bg-raised)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] opacity-5"
          style={{ background: "var(--color-bg-elevated)" }}
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6 reveal">
          <h1
            className="text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-tight leading-[1.1] mb-5"
            style={{ color: "var(--color-text-primary)" }}
          >
            Freight<span style={{ color: "var(--color-text-muted)" }}>IQ</span>
          </h1>

          <p
            className="text-[clamp(1rem,2vw,1.25rem)] font-light leading-relaxed mb-8"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Intelligent Freight Forecasting &amp; Vessel Chartering
          </p>

          <p
            className="text-[14px] leading-relaxed max-w-xl mx-auto mb-10"
            style={{ color: "var(--color-text-muted)" }}
          >
            FreightIQ helps bulk-cargo charterers move from reactive spot-market decisions toward proactive,
            data-driven short-term and medium-term charter planning — optimizing cost, timing, vessel selection and risk.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/executive"
              className="btn-hero-dashboard inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-md"
            >
              Explore Dashboard
              {Icons.Arrow}
            </Link>
            <Link
              href="/forecasting"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[13px] font-medium transition-all duration-200 hover:bg-[var(--color-surface-hover)] cursor-pointer"
              style={{ color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
            >
              Rate Forecasting
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scroll-indicator-wrap">
          <span className="text-[10px] uppercase tracking-widest font-bold scroll-indicator-text">
            Scroll
          </span>
          <div className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5 scroll-indicator-mouse">
            <div className="w-1.5 h-2.5 rounded-full animate-bounce scroll-indicator-dot" />
          </div>
        </div>
      </section>

      {/* ── The Problem ── */}
      <section ref={problemRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--color-cyan)" }}>
              The Challenge
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Why Freight Decisions Are Hard
            </h2>
            <p className="text-[14px] max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              Indian importers move millions of tonnes of coal, iron ore and commodities by sea.
              Every charter decision carries millions of dollars in exposure.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {problems.map((problem, i) => (
              <div
                key={i}
                className="reveal flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:border-[var(--color-border-light)]"
                style={{
                  background: "var(--color-bg-raised)",
                  borderColor: "var(--color-border)",
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                <div
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}
                >
                  ✕
                </div>
                <span className="text-[13px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                  {problem}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Solution / How It Works ── */}
      <section ref={solutionRef} className="py-24 px-6" style={{ background: "var(--color-bg-raised)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--color-cyan)" }}>
              Our Approach
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              How FreightIQ Works
            </h2>
            <p className="text-[14px] max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              Enter your cargo requirement once. FreightIQ runs the complete analysis pipeline and delivers a data-driven charter recommendation.
            </p>
          </div>

          <div className="flex flex-col items-center gap-0">
            {flowSteps.map((step, i) => (
              <div key={i} className="reveal w-full max-w-md" style={{ transitionDelay: `${i * 80}ms` }}>
                <div
                  className="flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:border-[var(--color-cyan-dim)]"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                    style={{ background: "rgba(6,182,212,0.12)", color: "var(--color-cyan)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-[13px] font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {step}
                  </span>
                  <span className="ml-auto text-[11px] font-mono" style={{ color: "var(--color-text-dim)" }}>
                    {i < 2 ? "PHASE 4-6" : i < 4 ? "PHASE 3,8" : i < 5 ? "PHASE 10" : "PHASE 7-8"}
                  </span>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <svg
                      className="w-4 h-4 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      style={{ color: "var(--color-cyan-dim)" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m0 0l6-6m-6 6l-6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Capabilities ── */}
      <section ref={capsRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--color-cyan)" }}>
              Capabilities
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              What FreightIQ Provides
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap, i) => (
              <div
                key={i}
                className="reveal p-5 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-cyan-dim)] group"
                style={{
                  background: "var(--color-bg-raised)",
                  borderColor: "var(--color-border)",
                  transitionDelay: `${i * 50}ms`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors duration-200"
                  style={{ background: "rgba(6,182,212,0.08)", color: "var(--color-cyan)" }}
                >
                  {cap.icon}
                </div>
                <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>
                  {cap.title}
                </h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section ref={compareRef} className="py-24 px-6" style={{ background: "var(--color-bg-raised)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--color-cyan)" }}>
              Transformation
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold" style={{ color: "var(--color-text-primary)" }}>
              From Reactive to Proactive
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 reveal">
            {/* Before */}
            <div
              className="p-6 rounded-xl border"
              style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[12px]"
                  style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}
                >
                  ✕
                </div>
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-danger)" }}>
                  Current Approach
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {["Multiple spot contracts", "Daily market checking", "Reactive decisions", "Higher uncertainty"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-danger)" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div
              className="p-6 rounded-xl border"
              style={{ background: "var(--color-bg)", borderColor: "rgba(6,182,212,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[12px]"
                  style={{ background: "rgba(16,185,129,0.1)", color: "var(--color-positive)" }}
                >
                  ✓
                </div>
                <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-positive)" }}>
                  FreightIQ Approach
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Data + Market Intelligence",
                  "ML-powered Forecasting",
                  "Optimization & Risk Analysis",
                  "Proactive charter planning",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-positive)" }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vessel Classes ── */}
      <section ref={vesselRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: "var(--color-cyan)" }}>
              Vessel Intelligence
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
              Right Vessel for Every Port
            </h2>
            <p className="text-[14px] max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              Different cargoes and ports require different vessel classes. FreightIQ considers cargo quantity,
              route, port draft, berth size, and infrastructure to recommend the optimal vessel.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {vesselClasses.map((v, i) => (
              <div
                key={i}
                className="reveal p-5 rounded-xl border transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: "var(--color-bg-raised)",
                  borderColor: "var(--color-border)",
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--color-cyan)" }}>
                  {v.name}
                </h3>
                <p className="text-[11px] font-mono mb-3" style={{ color: "var(--color-text-dim)" }}>
                  {v.dwt} DWT
                </p>
                <p className="text-[12px] mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {v.desc}
                </p>
                <p className="text-[11px]" style={{ color: "var(--color-text-dim)" }}>
                  Ports: {v.ports}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section ref={ctaRef} className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyan) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto reveal">
          <h2
            className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            Make Freight Decisions{" "}
            <span style={{ color: "var(--color-cyan)" }}>Before the Market Moves</span>
          </h2>
          <p className="text-[14px] mb-8" style={{ color: "var(--color-text-muted)" }}>
            Enter your cargo requirements, run the complete intelligence pipeline, and receive a data-driven charter recommendation — forecast, timing, vessel, risk and cost — all in one place.
          </p>
          <Link
            href="/executive"
            className="btn-hero-dashboard inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-[14px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer"
          >
            Open FreightIQ Dashboard
            {Icons.Arrow}
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="py-6 px-6 border-t text-center"
        style={{ borderColor: "var(--color-border)" }}
      >
        <p className="text-[11px] font-mono" style={{ color: "var(--color-text-dim)" }}>
          FreightIQ v1.2 — Phase 12 &middot; SIH 2025 Maritime Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
