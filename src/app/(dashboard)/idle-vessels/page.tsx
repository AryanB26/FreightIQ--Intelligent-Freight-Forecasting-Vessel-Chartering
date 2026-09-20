"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VesselClass } from "@/types";
import type {
  IdleAnalysisResult,
  FleetIdleOverview,
  VesselIdleSummary,
  AlternativeEmploymentOpportunity,
  IdleAction,
} from "@/types/idle-vessel";

const ACTION_CONFIG: Record<IdleAction, { label: string; color: string; bg: string; icon: string }> = {
  TAKE_ALTERNATIVE: { label: "TAKE ALTERNATIVE", color: "text-emerald-700", bg: "bg-emerald-100", icon: "🟢" },
  REPOSITION: { label: "REPOSITION", color: "text-blue-700", bg: "bg-blue-100", icon: "🔵" },
  WAIT: { label: "WAIT", color: "text-amber-700", bg: "bg-amber-100", icon: "🟡" },
  REASSESS: { label: "REASSESS", color: "text-slate-600", bg: "bg-slate-100", icon: "⚪" },
};

const RISK_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "LOW", color: "text-emerald-700", bg: "bg-emerald-50" },
  watch: { label: "WATCH", color: "text-amber-700", bg: "bg-amber-50" },
  idle_risk: { label: "IDLE RISK", color: "text-orange-700", bg: "bg-orange-50" },
  high: { label: "HIGH", color: "text-red-700", bg: "bg-red-50" },
};

export default function IdleVesselsPage() {
  const [fleetOverview, setFleetOverview] = useState<FleetIdleOverview | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IdleAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fleetLoading, setFleetLoading] = useState(true);

  // Load fleet overview on mount
  useEffect(() => {
    setFleetLoading(true);
    fetch("/api/idle/analyze?action=fleet")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setFleetOverview(d.data);
      })
      .catch(() => {})
      .finally(() => setFleetLoading(false));
  }, []);

  const analyzeVessel = useCallback(async (vesselId: string) => {
    setSelectedVesselId(vesselId);
    setLoading(true);
    try {
      const res = await fetch("/api/idle/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vesselId, planningHorizonDays: 30 }),
      });
      const d = await res.json();
      if (d.success && d.data) setAnalysis(d.data);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Idle Vessel Advisor</h1>
        <p className="text-sm text-muted-foreground">
          Minimize vessel idle time by identifying alternative employment opportunities
        </p>
      </div>

      {/* Fleet KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Total Vessels"
          value={fleetOverview?.totalVessels ?? "—"}
          loading={fleetLoading}
        />
        <KPICard
          label="Idle Vessels"
          value={fleetOverview?.idleVessels ?? "—"}
          loading={fleetLoading}
          accent={fleetOverview && fleetOverview.idleVessels > 0 ? "text-amber-600" : undefined}
        />
        <KPICard
          label="At Risk"
          value={fleetOverview?.atRiskVessels ?? "—"}
          loading={fleetLoading}
          accent={fleetOverview && fleetOverview.atRiskVessels > 0 ? "text-red-600" : undefined}
        />
        <KPICard
          label="Avg Idle Risk"
          value={fleetOverview ? `${fleetOverview.averageIdleRisk}/100` : "—"}
          loading={fleetLoading}
        />
      </div>

      {/* Main content: Fleet + Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet table */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Fleet Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {fleetLoading ? (
                <div className="text-sm text-muted-foreground py-4 text-center">Loading fleet...</div>
              ) : (
                <div className="space-y-2">
                  {fleetOverview?.vesselSummaries.map((v) => (
                    <VesselRow
                      key={v.vesselId}
                      vessel={v}
                      isSelected={v.vesselId === selectedVesselId}
                      onSelect={() => analyzeVessel(v.vesselId)}
                    />
                  ))}
                  {(fleetOverview?.vesselSummaries.length ?? 0) === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No vessels available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis panel */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-sm text-muted-foreground">Analyzing vessel employment opportunities...</div>
              </CardContent>
            </Card>
          )}

          {!loading && !analysis && selectedVesselId === null && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">⚓</div>
                <div className="text-sm text-muted-foreground">Select a vessel from the fleet to analyze idle risk and alternatives</div>
              </CardContent>
            </Card>
          )}

          {!loading && !analysis && selectedVesselId !== null && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-sm text-muted-foreground">Analysis complete — no data returned.</div>
              </CardContent>
            </Card>
          )}

          {!loading && analysis && (
            <>
              {/* Recommendation */}
              <RecommendationCard result={analysis} />

              {/* Idle Risk + Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IdleRiskCard result={analysis} />
                <TimelineCard result={analysis} />
              </div>

              {/* Opportunity comparison */}
              <ComparisonTable result={analysis} />

              {/* Alternative opportunities */}
              <OpportunitiesList opportunities={analysis.candidateOpportunities} />

              {/* Reasons & Warnings */}
              <ReasonsWarningsCard result={analysis} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KPICard({ label, value, loading, accent }: {
  label: string;
  value: string | number;
  loading?: boolean;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className={`text-2xl font-bold font-mono ${accent ?? ""}`}>
        {loading ? "—" : value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function VesselRow({ vessel, isSelected, onSelect }: {
  vessel: VesselIdleSummary;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const riskConfig = RISK_BADGE[vessel.idleRiskLevel] ?? RISK_BADGE.low;
  const statusLabel = vessel.status === "idle" ? "IDLE" : vessel.status === "at_risk" ? "AT RISK" : "ACTIVE";
  const statusColor = vessel.status === "idle" ? "text-amber-600" : vessel.status === "at_risk" ? "text-red-600" : "text-emerald-600";

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold truncate">{vessel.vesselName}</span>
        <Badge className={`${riskConfig.bg} ${riskConfig.color} border-0 text-[9px] font-semibold`}>
          {riskConfig.label}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{vessel.vesselClass} · {vessel.dwt.toLocaleString()} DWT</span>
        <span className={statusColor}>{statusLabel}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
        <span>Idle: ~{vessel.expectedIdleDays}d</span>
        <span>{vessel.opportunityCount} opps</span>
      </div>
      {vessel.recommendedRoute && (
        <p className="text-[10px] text-primary mt-1">→ {vessel.recommendedRoute}</p>
      )}
    </button>
  );
}

function RecommendationCard({ result }: { result: IdleAnalysisResult }) {
  const actionConfig = ACTION_CONFIG[result.recommendedAction];

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended Action</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{actionConfig.icon}</span>
              <h2 className={`text-xl font-bold ${actionConfig.color}`}>
                {actionConfig.label}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-bold font-mono">{result.recommendationScore}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{result.recommendationExplanation}</p>

        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground">Idle Reduction</p>
            <p className="text-sm font-semibold font-mono">{result.idleReductionDays} days</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Ballast Reduction</p>
            <p className="text-sm font-semibold font-mono">{result.deadheadingReductionNm.toLocaleString()} NM</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Economic Impact</p>
            <p className={`text-sm font-semibold font-mono ${result.estimatedEconomicImpact >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {result.estimatedEconomicImpact >= 0 ? "+" : ""}${result.estimatedEconomicImpact.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IdleRiskCard({ result }: { result: IdleAnalysisResult }) {
  const risk = result.idleRisk;
  const riskConfig = RISK_BADGE[risk.idleRiskLevel] ?? RISK_BADGE.low;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Idle Risk Assessment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Risk Score</span>
          <Badge className={`${riskConfig.bg} ${riskConfig.color} border-0 text-[10px] font-semibold`}>
            {riskConfig.label} — {risk.idleRiskScore}/100
          </Badge>
        </div>

        {/* Risk bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              risk.idleRiskScore >= 70 ? "bg-red-500" :
              risk.idleRiskScore >= 45 ? "bg-orange-500" :
              risk.idleRiskScore >= 25 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${risk.idleRiskScore}%` }}
          />
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected Idle</span>
            <span className="font-mono">{risk.expectedIdleDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available Date</span>
            <span className="font-mono">{risk.availableDate}</span>
          </div>
          {risk.currentRoute && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Route</span>
              <span className="font-mono">{risk.currentRoute}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next Employment</span>
            <span className="font-mono">{risk.hasConfirmedNextEmployment ? "Confirmed" : "None"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Local Demand</span>
            <span className="font-mono capitalize">{risk.localDemandLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Freight Outlook</span>
            <span className="font-mono capitalize">{risk.freightOutlook}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineCard({ result }: { result: IdleAnalysisResult }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {result.timeline.map((entry, i) => {
            const isLast = i === result.timeline.length - 1;
            const icon =
              entry.type === "voyage" ? "🚢" :
              entry.type === "discharge" ? "📦" :
              entry.type === "available" ? "✅" :
              entry.type === "idle" ? "⏳" :
              entry.type === "reposition" ? "🧭" :
              entry.type === "next_employment" ? "💼" : "•";

            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {icon}
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className={`pb-3 ${isLast ? "" : ""}`}>
                  <p className="text-xs font-medium">{entry.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{entry.date}</p>
                  {entry.durationDays && entry.durationDays > 0 && (
                    <p className="text-[10px] text-muted-foreground">{entry.durationDays} days</p>
                  )}
                  {entry.details && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{entry.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonTable({ result }: { result: IdleAnalysisResult }) {
  if (result.comparisonOptions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Option Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase">Option</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase">Idle</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase">Position</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase">Net Value</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase">Risk</th>
                <th className="px-3 py-2 text-right text-[10px] font-medium text-muted-foreground uppercase">Score</th>
              </tr>
            </thead>
            <tbody>
              {result.comparisonOptions.map((opt, i) => (
                <tr key={opt.id} className={`border-b last:border-0 ${i === 0 ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && <span className="text-[9px] text-primary font-bold">BEST</span>}
                      <span className="font-medium">{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{ACTION_CONFIG[opt.action]?.label}</p>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">{opt.expectedIdleDays}d</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {opt.positioningDistanceNm > 0 ? `${opt.positioningDistanceNm.toLocaleString()} NM` : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${opt.netOpportunityValue >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {opt.netOpportunityValue >= 0 ? "+" : ""}${opt.netOpportunityValue.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge className={`border-0 text-[9px] ${
                      opt.riskLevel === "low" ? "bg-emerald-50 text-emerald-700" :
                      opt.riskLevel === "medium" ? "bg-amber-50 text-amber-700" :
                      "bg-red-50 text-red-700"
                    }`}>
                      {opt.riskLevel.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">{opt.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunitiesList({ opportunities }: { opportunities: AlternativeEmploymentOpportunity[] }) {
  if (opportunities.length === 0) return null;

  const typeLabels: Record<string, string> = {
    same_route: "Same Route",
    nearby_trade: "Nearby Trade",
    backhaul: "Backhaul",
    triangulation: "Triangulation",
    strategic_reposition: "Strategic Reposition",
    wait: "Wait",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Alternative Employment ({opportunities.length})</CardTitle>
          <Badge className="bg-amber-50 text-amber-700 border-0 text-[9px]">SIMULATED</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {opportunities.slice(0, 6).map((opp) => (
          <div
            key={opp.id}
            className="p-3 rounded-lg border hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">
                  {opp.originPortName} → {opp.destinationPortName}
                </span>
                <Badge className="border-0 text-[9px] bg-muted text-muted-foreground">
                  {typeLabels[opp.type] ?? opp.type}
                </Badge>
              </div>
              <span className="text-xs font-bold font-mono">{opp.opportunityScore}</span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
              <div>
                <span className="block">Cargo</span>
                <span className="font-mono">{opp.cargoQuantityTonnes.toLocaleString()} MT</span>
              </div>
              <div>
                <span className="block">Freight</span>
                <span className="font-mono">${opp.estimatedFreightRate.toFixed(2)}/MT</span>
              </div>
              <div>
                <span className="block">Positioning</span>
                <span className="font-mono">{opp.positioningDistanceNm.toLocaleString()} NM</span>
              </div>
              <div>
                <span className="block">Net Benefit</span>
                <span className={`font-mono ${opp.netBenefit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {opp.netBenefit >= 0 ? "+" : ""}${opp.netBenefit.toLocaleString()}
                </span>
              </div>
            </div>

            {opp.reasons.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {opp.reasons.map((r, i) => (
                  <span key={i} className="text-[9px] text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">
                    ✓ {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ReasonsWarningsCard({ result }: { result: IdleAnalysisResult }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Why?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Warnings & Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.warnings.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider mb-1">Warnings</p>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-[11px] flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">⚠</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Assumptions</p>
              <ul className="space-y-1">
                {result.assumptions.slice(0, 5).map((a, i) => (
                  <li key={i} className="text-[10px] text-muted-foreground">• {a}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
