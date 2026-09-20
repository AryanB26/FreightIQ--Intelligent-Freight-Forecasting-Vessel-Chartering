"use client";

import { useState } from "react";
import { Panel, PanelHeader, DataModeBadge, Tag, RiskBadge, ProgressStep } from "@/components/design-system/primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VesselClass } from "@/types";
import type {
  RiskAnalysisResult,
  RiskEvent,
  RiskCategoryScore,
  DisruptionEvent,
} from "@/types/risk-intelligence";

const SEVERITY_CONFIG: Record<string, { label: string; tagVariant: "green" | "amber" | "red" | "default"; color: string }> = {
  low: { label: "LOW", tagVariant: "green", color: "var(--color-positive)" },
  medium: { label: "MEDIUM", tagVariant: "amber", color: "var(--color-warning)" },
  high: { label: "HIGH", tagVariant: "red", color: "var(--color-danger)" },
  critical: { label: "CRITICAL", tagVariant: "red", color: "var(--color-danger)" },
};

const CATEGORY_ICONS: Record<string, string> = {
  freight_market: "📊",
  forecast_uncertainty: "📈",
  port_congestion: "🏗️",
  vessel_availability: "🚢",
  weather_disruption: "🌦️",
  schedule_risk: "⏰",
  positioning_deadheading: "🧭",
  cargo_delivery: "📦",
  data_quality: "📋",
  operational_compatibility: "⚙️",
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  immediate: { color: "text-red-700", bg: "bg-red-50" },
  high: { color: "text-orange-700", bg: "bg-orange-50" },
  medium: { color: "text-amber-700", bg: "bg-amber-50" },
  low: { color: "text-slate-600", bg: "bg-slate-50" },
};

// Pre-filled demo scenarios for quick access
const DEMO_SCENARIOS = [
  {
    label: "Australia → Paradip (Panamax)",
    route: { originPortId: "port-port-hedland", destinationPortId: "port-paradip" },
    cargo: { commodity: "Iron Ore", quantityTonnes: 75000 },
    vessel: { vesselClass: "Panamax" },
    contract: { duration: "short_term" as const, loadingWindowStart: "2026-09-15", loadingWindowEnd: "2026-10-15", deliveryDeadline: "2026-11-15" },
  },
  {
    label: "Indonesia → Dhamra (Supramax)",
    route: { originPortId: "port-tanjung-api", destinationPortId: "port-dhamra" },
    cargo: { commodity: "Coal", quantityTonnes: 50000 },
    vessel: { vesselClass: "Supramax" },
    contract: { duration: "short_term" as const, loadingWindowStart: "2026-09-20", loadingWindowEnd: "2026-10-20", deliveryDeadline: "2026-11-20" },
  },
  {
    label: "US → East Coast India (Panamax)",
    route: { originPortId: "port-new-orleans", destinationPortId: "port-haldia" },
    cargo: { commodity: "Grain", quantityTonnes: 60000 },
    vessel: { vesselClass: "Panamax" },
    contract: { duration: "medium_term" as const, loadingWindowStart: "2026-10-01", loadingWindowEnd: "2026-11-01", deliveryDeadline: "2026-12-15" },
  },
];

export default function RisksPage() {
  const [result, setResult] = useState<RiskAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "mitigations" | "timeline">("overview");

  // Form state (initialized from first demo scenario)
  const [form, setForm] = useState({
    originPortId: DEMO_SCENARIOS[0].route.originPortId,
    destinationPortId: DEMO_SCENARIOS[0].route.destinationPortId,
    commodity: DEMO_SCENARIOS[0].cargo.commodity,
    quantityTonnes: DEMO_SCENARIOS[0].cargo.quantityTonnes,
    vesselClass: DEMO_SCENARIOS[0].vessel.vesselClass,
    duration: DEMO_SCENARIOS[0].contract.duration,
    loadingWindowStart: DEMO_SCENARIOS[0].contract.loadingWindowStart,
    loadingWindowEnd: DEMO_SCENARIOS[0].contract.loadingWindowEnd,
    deliveryDeadline: DEMO_SCENARIOS[0].contract.deliveryDeadline,
  });

  const loadDemo = (idx: number) => {
    const s = DEMO_SCENARIOS[idx];
    setForm({
      originPortId: s.route.originPortId,
      destinationPortId: s.route.destinationPortId,
      commodity: s.cargo.commodity,
      quantityTonnes: s.cargo.quantityTonnes,
      vesselClass: s.vessel.vesselClass,
      duration: s.contract.duration,
      loadingWindowStart: s.contract.loadingWindowStart,
      loadingWindowEnd: s.contract.loadingWindowEnd,
      deliveryDeadline: s.contract.deliveryDeadline,
    });
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/risk-intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route: { originPortId: form.originPortId, destinationPortId: form.destinationPortId },
          cargo: { commodity: form.commodity, quantityTonnes: form.quantityTonnes },
          vessel: { vesselClass: form.vesselClass },
          contract: {
            duration: form.duration,
            loadingWindowStart: form.loadingWindowStart,
            loadingWindowEnd: form.loadingWindowEnd,
            deliveryDeadline: form.deliveryDeadline,
          },
        }),
      });
      const d = await res.json();
      if (d.success && d.data) setResult(d.data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const severityConfig = result ? SEVERITY_CONFIG[result.overallRiskLevel] ?? SEVERITY_CONFIG.medium : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            Risk & Disruption Intelligence
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Identify, score, and mitigate risks affecting freight rates, schedules, and operations
          </p>
        </div>
        <DataModeBadge mode="SIMULATED" />
      </div>

      {/* Input Form */}
      <Panel>
        <PanelHeader>
          <h3 className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Risk Analysis Input</h3>
          <div className="flex gap-1.5">
            {DEMO_SCENARIOS.map((s, i) => (
              <button
                key={i}
                className="btn-ghost text-[10px]"
                onClick={() => loadDemo(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </PanelHeader>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Origin", key: "originPortId", type: "select", options: [
                { value: "port-port-hedland", label: "Port Hedland (AU)" },
                { value: "port-tanjung-api", label: "Tanjung Api-Api (ID)" },
                { value: "port-new-orleans", label: "New Orleans (US)" },
                { value: "port-beira", label: "Beira (MZ)" },
                { value: "port-vladivostok", label: "Vladivostok (RU)" },
              ]},
              { label: "Destination", key: "destinationPortId", type: "select", options: [
                { value: "port-paradip", label: "Paradip (IN)" },
                { value: "port-dhamra", label: "Dhamra (IN)" },
                { value: "port-visakhapatnam", label: "Visakhapatnam (IN)" },
                { value: "port-gangavaram", label: "Gangavaram (IN)" },
                { value: "port-haldia", label: "Haldia (IN)" },
                { value: "port-sagar", label: "Sagar/Sandheads (IN)" },
                { value: "port-gopalpur", label: "Gopalpur (IN)" },
              ]},
              { label: "Commodity", key: "commodity", type: "text" },
              { label: "Quantity (MT)", key: "quantityTonnes", type: "number" },
              { label: "Vessel Class", key: "vesselClass", type: "select", options: [
                { value: "auto", label: "Auto" },
                { value: "Handysize", label: "Handysize" },
                { value: "Supramax", label: "Supramax" },
                { value: "Panamax", label: "Panamax" },
                { value: "Capesize", label: "Capesize" },
              ]},
              { label: "Contract", key: "duration", type: "select", options: [
                { value: "spot", label: "Spot" },
                { value: "short_term", label: "Short-term" },
                { value: "medium_term", label: "Medium-term" },
              ]},
              { label: "Loading Start", key: "loadingWindowStart", type: "date" },
              { label: "Delivery Deadline", key: "deliveryDeadline", type: "date" },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>{field.label}</label>
                {field.type === "select" ? (
                  <select
                    className="select-field mt-1"
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="input-field mt-1"
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button className="btn-primary" onClick={runAnalysis} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze Risks →"}
            </button>
          </div>
        </div>
      </Panel>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-sm text-muted-foreground">Analyzing risks across 10 categories...</div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Overall Risk Score */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall Risk Assessment</p>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-3xl font-bold font-mono ${severityConfig?.color}`}>
                      {result.overallRiskScore}/100
                    </h2>
                    <Tag variant={severityConfig?.tagVariant} className="text-[11px] px-2 py-0.5">
                      {severityConfig?.label}
                    </Tag>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <p className="text-sm font-semibold capitalize">{result.riskConfidence}</p>
                  <p className="text-xs text-muted-foreground mt-2">Events</p>
                  <p className="text-sm font-semibold">{result.riskEvents.length}</p>
                </div>
              </div>

              {/* Risk bar */}
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    result.overallRiskScore >= 75 ? "bg-red-500" :
                    result.overallRiskScore >= 50 ? "bg-orange-500" :
                    result.overallRiskScore >= 25 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${result.overallRiskScore}%` }}
                />
              </div>

              {/* Financial exposure */}
              <div className="grid grid-cols-3 gap-4 pt-3 border-t text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground">Financial Exposure</p>
                  <p className="text-sm font-semibold font-mono">${result.financialExposure.totalEstimatedExposure.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Max Single Event</p>
                  <p className="text-sm font-semibold font-mono">${result.financialExposure.maxSingleEventCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Potential Delay</p>
                  <p className="text-sm font-semibold font-mono">{result.timelineImpact.totalDelayDays} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {(["overview", "events", "mitigations", "timeline"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CategoryBreakdown categories={result.categoryScores} />
              <RouteRiskProfile profile={result.routeRisk} />
              <ReasonsWarnings reasons={result.reasons} warnings={result.warnings} assumptions={result.assumptions} />
              <DisruptionPanel events={result.riskEvents.filter((e) => e.category === "weather_disruption")} />
            </div>
          )}

          {activeTab === "events" && (
            <RiskEventsList events={result.riskEvents} />
          )}

          {activeTab === "mitigations" && (
            <MitigationsPanel result={result} />
          )}

          {activeTab === "timeline" && (
            <TimelinePanel result={result} />
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !result && (
        <Panel>
          <div className="py-12 text-center">
            <div className="text-[11px] mb-2" style={{ color: "var(--color-text-secondary)" }}>Select a scenario and click &quot;Analyze Risks&quot; to begin</div>
            <div className="text-[10px]" style={{ color: "var(--color-text-dim)" }}>The engine evaluates 10 risk categories with configurable weighting</div>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function CategoryBreakdown({ categories }: { categories: RiskCategoryScore[] }) {
  return (
    <Panel>
      <PanelHeader>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Risk Category Breakdown</h3>
      </PanelHeader>
      <div className="p-3 space-y-2">
        {categories
          .sort((a, b) => b.score - a.score)
          .map((cat) => {
            const sev = SEVERITY_CONFIG[cat.riskLevel] ?? SEVERITY_CONFIG.low;
            const barColor = cat.riskLevel === "critical" ? "var(--color-danger)" : cat.riskLevel === "high" ? "var(--color-warning)" : cat.riskLevel === "medium" ? "var(--color-warning)" : "var(--color-positive)";
            return (
              <div key={cat.category} className="flex items-center gap-3 text-[11px]">
                <span className="text-base w-6 text-center">{CATEGORY_ICONS[cat.category] ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{cat.label}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono" style={{ color: "var(--color-text-muted)" }}>{cat.score}</span>
                      <Tag variant={sev.tagVariant}>{sev.label}</Tag>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-bg)" }}>
                    <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: barColor }} />
                  </div>
                  <p className="text-[9px] mt-0.5 truncate" style={{ color: "var(--color-text-dim)" }}>{cat.explanation}</p>
                </div>
              </div>
            );
          })}
      </div>
    </Panel>
  );
}

function RouteRiskProfile({ profile }: { profile: any }) {
  return (
    <Panel>
      <PanelHeader>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Route Risk Profile</h3>
      </PanelHeader>
      <div className="p-3 space-y-3 text-[11px]">
        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{profile.routeLabel}</p>

        {[
          { label: "Corridor Risk", value: profile.corridorRisk },
          { label: "Weather Risk", value: profile.weatherRisk },
          { label: "Geopolitical Risk", value: profile.geopoliticalRisk },
        ].map((item) => {
          const sev = SEVERITY_CONFIG[item.value] ?? SEVERITY_CONFIG.low;
          return (
            <div key={item.label} className="flex items-center justify-between">
              <span style={{ color: "var(--color-text-muted)" }}>{item.label}</span>
              <Tag variant={sev.tagVariant}>{sev.label}</Tag>
            </div>
          );
        })}

        {/* Origin / Destination port details */}
        {[
          { label: "Origin", port: profile.originPortRisk },
          { label: "Destination", port: profile.destinationPortRisk },
        ].map(({ label, port }) => (
          <div key={label} className="p-2 rounded-md" style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{label}: {port.portName}</span>
              <Tag variant={port.congestionLevel === "high" || port.congestionLevel === "severe" ? "red" : port.congestionLevel === "moderate" ? "amber" : "green"}>
                {port.congestionLevel.toUpperCase()}
              </Tag>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px]" style={{ color: "var(--color-text-dim)" }}>
              <span>Waiting: ~{port.waitingTimeDays.toFixed(1)}d</span>
              <span>Berth: {port.berthOccupancy}%</span>
              <span>Status: {port.operationalStatus}</span>
              <span>Disruptions: {port.activeDisruptions.length}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RiskEventsList({ events }: { events: RiskEvent[] }) {
  return (
    <Panel>
      <PanelHeader>
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--color-text-primary)" }}>Risk Events ({events.length})</h3>
      </PanelHeader>
      <div className="p-3 space-y-2">
        {events.length === 0 && (
          <p className="text-[11px] text-center py-4" style={{ color: "var(--color-text-dim)" }}>No risk events identified</p>
        )}
        {events.map((event) => {
          const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low;
          return (
            <div key={event.id} className="p-3 rounded-md" style={{ border: "1px solid var(--color-border)" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_ICONS[event.category] ?? "•"}</span>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-primary)" }}>{event.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono font-bold" style={{ color: sev.color }}>{event.score}</span>
                  <Tag variant={sev.tagVariant}>{sev.label}</Tag>
                </div>
              </div>
              <p className="text-[10px] mb-1.5" style={{ color: "var(--color-text-muted)" }}>{event.description}</p>
              <div className="flex flex-wrap gap-1.5 text-[9px]">
                <span style={{ color: "var(--color-text-dim)" }}>Affects: {event.affectedEntityName}</span>
                {event.estimatedImpactDays > 0 && (
                  <span style={{ color: "var(--color-warning)" }}>Delay: +{event.estimatedImpactDays}d</span>
                )}
                {event.estimatedCostImpact > 0 && (
                  <span style={{ color: "var(--color-danger)" }}>Cost: ${event.estimatedCostImpact.toLocaleString()}</span>
                )}
                <span style={{ color: "var(--color-text-dim)" }} className="italic">{event.isSimulated ? "SIMULATED" : "LIVE"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function MitigationsPanel({ result }: { result: RiskAnalysisResult }) {
  const { mitigationSummary, financialExposure } = result;
  const allMitigations = result.riskEvents.map((e) => ({
    ...e.mitigation,
    riskTitle: e.title,
    riskScore: e.score,
    riskCategory: e.category,
  })).sort((a, b) => {
    const pOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
    return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Mitigation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-muted/30 text-center">
              <p className="text-lg font-bold font-mono">{mitigationSummary.totalMitigations}</p>
              <p className="text-[9px] text-muted-foreground">Total Actions</p>
            </div>
            <div className="p-2 rounded bg-red-50 text-center">
              <p className="text-lg font-bold font-mono text-red-700">{mitigationSummary.immediateActions.length}</p>
              <p className="text-[9px] text-muted-foreground">Immediate</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Estimated Mitigation Cost</p>
            <p className="font-mono font-semibold">${mitigationSummary.estimatedMitigationCost.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Risk Reduction</p>
            <p className="font-mono font-semibold">{mitigationSummary.estimatedRiskReduction}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Financial Exposure</p>
            <p className="font-mono font-semibold">${financialExposure.totalEstimatedExposure.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">{financialExposure.exposureLabel}</p>
          </div>
        </CardContent>
      </Card>

      {/* Mitigation list */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recommended Actions (by priority)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allMitigations.map((m, i) => {
              const pConfig = PRIORITY_CONFIG[m.priority] ?? PRIORITY_CONFIG.medium;
              return (
                <div key={i} className="p-3 rounded-lg border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${pConfig.bg} ${pConfig.color} border-0 text-[9px] font-semibold uppercase`}>
                        {m.priority}
                      </Badge>
                      <span className="font-medium">{m.action}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">Risk: {m.riskScore}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">{m.description}</p>
                  {m.estimatedBenefit && (
                    <p className="text-[9px] text-emerald-600">Benefit: {m.estimatedBenefit}</p>
                  )}
                  {m.alternatives.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.alternatives.map((alt, j) => (
                        <span key={j} className="text-[9px] bg-muted rounded px-1.5 py-0.5">{alt}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TimelinePanel({ result }: { result: RiskAnalysisResult }) {
  const { timelineImpact } = result;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Original Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timelineImpact.originalSchedule.map((entry, i) => (
              <TimelineEntry key={i} entry={entry} isLast={i === timelineImpact.originalSchedule.length - 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Risk-Adjusted Schedule</CardTitle>
            {timelineImpact.totalDelayDays > 0 && (
              <Badge className="bg-red-50 text-red-700 border-0 text-[9px]">
                +{timelineImpact.totalDelayDays}d delay
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timelineImpact.riskAdjustedSchedule.map((entry, i) => (
              <TimelineEntry
                key={i}
                entry={entry}
                isLast={i === timelineImpact.riskAdjustedSchedule.length - 1}
                isDelay={entry.type === "delay"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {timelineImpact.criticalPathRisks.length > 0 && (
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Critical Path Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {timelineImpact.criticalPathRisks.map((risk, i) => (
                  <span key={i} className="text-xs bg-amber-50 text-amber-700 rounded px-2 py-1">
                    ⚠ {risk}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TimelineEntry({ entry, isLast, isDelay }: { entry: any; isLast: boolean; isDelay?: boolean }) {
  const icons: Record<string, string> = {
    loading: "📦", transit: "🚢", discharge: "🏗️", turnaround: "🔄", delay: "⚠️", buffer: "🛡️",
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          isDelay ? "bg-red-100" : "bg-muted"
        }`}>
          {icons[entry.type] ?? "•"}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border my-1" />}
      </div>
      <div className="pb-3">
        <p className={`text-xs font-medium ${isDelay ? "text-red-600" : ""}`}>{entry.label}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{entry.date}</p>
        {entry.delayDays > 0 && (
          <p className="text-[10px] text-amber-600">+{entry.delayDays} days delay</p>
        )}
        {entry.riskSource && (
          <p className="text-[9px] text-muted-foreground mt-0.5">Source: {entry.riskSource}</p>
        )}
      </div>
    </div>
  );
}

function ReasonsWarnings({ reasons, warnings, assumptions }: { reasons: string[]; warnings: string[]; assumptions: string[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Assessment Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {reasons.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Key Findings</p>
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-amber-700 uppercase mb-1">Warnings</p>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Assumptions</p>
          <ul className="space-y-0.5">
            {assumptions.slice(0, 5).map((a, i) => (
              <li key={i} className="text-[9px] text-muted-foreground">• {a}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function DisruptionPanel({ events }: { events: RiskEvent[] }) {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Active Disruptions</CardTitle>
          <Badge className="bg-amber-50 text-amber-700 border-0 text-[9px]">SIMULATED</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.map((event) => {
          const sev = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low;
          return (
            <div key={event.id} className="p-2 rounded border bg-muted/10 text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-medium">{event.title}</span>
                <Tag variant={sev.tagVariant}>{sev.label}</Tag>
              </div>
              <p className="text-[10px] text-muted-foreground">{event.description}</p>
              <div className="flex gap-2 mt-1 text-[9px] text-muted-foreground">
                {event.estimatedImpactDays > 0 && <span>Delay: +{event.estimatedImpactDays}d</span>}
                {event.estimatedCostImpact > 0 && <span>Cost: ${event.estimatedCostImpact.toLocaleString()}</span>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
