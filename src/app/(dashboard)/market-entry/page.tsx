"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketEntryDecision, DecisionCategory } from "@/services/decision-engine/types";

// ---- Origin/Destination port options ----

const ORIGIN_PORTS = [
  { id: "port-port-hedland", label: "Port Hedland (Australia)" },
  { id: "port-tanjung-api", label: "Tanjung Api-Api (Indonesia)" },
  { id: "port-new-orleans", label: "New Orleans (USA)" },
  { id: "port-beira", label: "Beira (Mozambique)" },
  { id: "port-vladivostok", label: "Vladivostok (Russia)" },
];

const DEST_PORTS = [
  { id: "port-paradip", label: "Paradip" },
  { id: "port-visakhapatnam", label: "Visakhapatnam" },
  { id: "port-dhamra", label: "Dhamra" },
  { id: "port-gangavaram", label: "Gangavaram" },
  { id: "port-gopalpur", label: "Gopalpur" },
  { id: "port-haldia", label: "Haldia" },
  { id: "port-sagar", label: "Sagar/Sandheads" },
];

const VESSEL_CLASSES = [
  { id: "auto", label: "Auto (Recommended)" },
  { id: "Handysize", label: "Handysize" },
  { id: "Supramax", label: "Supramax" },
  { id: "Panamax", label: "Panamax" },
  { id: "Capesize", label: "Capesize" },
];

const DURATIONS = [
  { id: "spot", label: "Spot" },
  { id: "short_term", label: "Short-term" },
  { id: "medium_term", label: "Medium-term" },
];

const DECISION_STYLES: Record<DecisionCategory, { color: string; bg: string; icon: string }> = {
  CHARTER_NOW: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "🟢" },
  WAIT: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "🟡" },
  WATCH_MARKET: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: "🔵" },
  REASSESS: { color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: "⚪" },
};

const DECISION_LABELS: Record<DecisionCategory, string> = {
  CHARTER_NOW: "CHARTER NOW",
  WAIT: "WAIT",
  WATCH_MARKET: "WATCH MARKET",
  REASSESS: "REASSESS",
};

export default function MarketEntryPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketEntryDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [commodity, setCommodity] = useState("iron_ore");
  const [quantity, setQuantity] = useState("70000");
  const [origin, setOrigin] = useState("port-port-hedland");
  const [destination, setDestination] = useState("port-paradip");
  const [vesselClass, setVesselClass] = useState("auto");
  const [loadingStart, setLoadingStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [loadingEnd, setLoadingEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [contractDuration, setContractDuration] = useState("short_term");

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/market-entry/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargo: {
            commodity,
            commodityCategory: commodity,
            quantityTonnes: Number(quantity),
            loadingWindowStart: loadingStart,
            loadingWindowEnd: loadingEnd,
          },
          route: {
            originPortId: origin,
            destinationPortId: destination,
          },
          vessel: { vesselClass },
          contractDuration,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Analysis failed");
        return;
      }
      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Market Entry Advisor</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intelligent charter timing analysis — Phase 7 Decision Engine
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
          DECISION ENGINE
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cargo & Voyage Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Commodity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Commodity</label>
                <Select value={commodity} onValueChange={setCommodity}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iron_ore">Iron Ore</SelectItem>
                    <SelectItem value="coal">Coal</SelectItem>
                    <SelectItem value="grain">Grain</SelectItem>
                    <SelectItem value="fertilizer">Fertilizer</SelectItem>
                    <SelectItem value="bauxite">Bauxite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Quantity (MT)</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-8 text-xs"
                  min={1000}
                  step={1000}
                />
              </div>

              {/* Origin */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Origin Port</label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGIN_PORTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Destination Port</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_PORTS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vessel Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Vessel Class</label>
                <Select value={vesselClass} onValueChange={setVesselClass}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VESSEL_CLASSES.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Loading Window */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Loading Start</label>
                  <Input
                    type="date"
                    value={loadingStart}
                    onChange={(e) => setLoadingStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Loading End</label>
                  <Input
                    type="date"
                    value={loadingEnd}
                    onChange={(e) => setLoadingEnd(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Contract Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Contract Duration</label>
                <Select value={contractDuration} onValueChange={setContractDuration}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-2"
                size="sm"
              >
                {loading ? "Analyzing..." : "Analyze Market"}
              </Button>

              {error && (
                <div className="text-xs text-destructive mt-2 p-2 rounded bg-destructive/10">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {!result && !loading && !error && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center text-muted-foreground">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm font-medium">Enter cargo parameters and click Analyze</p>
                <p className="text-xs mt-1">The decision engine will evaluate market conditions and provide a recommendation.</p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Running decision engine...</p>
                <p className="text-xs text-muted-foreground mt-1">Analyzing forecast, vessel availability, port conditions...</p>
              </CardContent>
            </Card>
          )}

          {result && <DecisionResult result={result} />}
        </div>
      </div>
    </div>
  );
}

// ---- Decision Result Display ----

function DecisionResult({ result }: { result: MarketEntryDecision }) {
  const style = DECISION_STYLES[result.recommendation];

  return (
    <div className="space-y-4">
      {/* Main Decision Card */}
      <Card className={`border-2 ${style.bg}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Market Entry Recommendation</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl">{style.icon}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${style.color}`}>
                    {DECISION_LABELS[result.recommendation]}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {result.routeLabel} • {result.vesselClass}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase">Decision Score</p>
              <p className="text-3xl font-bold font-mono">{result.decisionScore}</p>
              <p className="text-xs text-muted-foreground">/ 100</p>
              <p className="text-xs text-muted-foreground mt-1">Confidence: {result.confidence}%</p>
            </div>
          </div>

          {/* Entry Windows */}
          {result.recommendedWindow && (
            <div className="mt-4 p-3 rounded-lg bg-white/50 border">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Recommended Window</p>
                  <p className="text-sm font-semibold">
                    {formatDisplayDate(result.recommendedWindow.startDate)} – {formatDisplayDate(result.recommendedWindow.endDate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{result.recommendedWindow.explanation}</p>
                </div>
                {result.secondaryWindow && (
                  <div className="border-l pl-4">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase">Secondary Window</p>
                    <p className="text-sm font-medium">
                      {formatDisplayDate(result.secondaryWindow.startDate)} – {formatDisplayDate(result.secondaryWindow.endDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expected Change */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Expected Freight Change:</span>
            <span className={`font-mono font-semibold ${result.expectedChangePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {result.expectedChangePercent >= 0 ? "+" : ""}{result.expectedChangePercent.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">
              (${result.currentFreight.toFixed(2)} → ${result.expectedFreight.toFixed(2)}/MT)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Signal Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SignalCard
          title="Forecast"
          score={result.signals.forecast.score}
          detail={result.signals.forecast.explanation}
          icon="📈"
        />
        <SignalCard
          title="Market Position"
          score={result.signals.marketPosition.score}
          detail={`${result.signals.marketPosition.percentile}th percentile`}
          icon="📊"
        />
        <SignalCard
          title="Vessel Supply"
          score={result.signals.vesselAvailability.score}
          detail={`${result.signals.vesselAvailability.availableVesselCount} compatible vessels`}
          icon="🚢"
        />
        <SignalCard
          title="Port Risk"
          score={result.signals.portRisk.score}
          detail={result.signals.portRisk.combinedRisk}
          icon="🏗"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SignalCard
          title="Deadline"
          score={result.signals.deadline.score}
          detail={result.signals.deadline.flexibilityLevel}
          icon="⏰"
        />
        <SignalCard
          title="Volatility"
          score={result.signals.volatility.score}
          detail={`${result.signals.volatility.volatilityPercent.toFixed(1)}%`}
          icon="↕️"
        />
        <SignalCard
          title="Economics"
          score={result.signals.economic.score}
          detail={`Net: $${result.signals.economic.netImpact.toLocaleString()}`}
          icon="💰"
        />
      </div>

      {/* Why Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Why?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5">
                  {r.direction === "positive" ? "↑" : r.direction === "negative" ? "↓" : "→"}
                </span>
                <span className="text-sm">{r.description}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Financial Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Freight</span>
                <span className="font-mono">${result.estimatedFinancialImpact.currentFreightPerTonne.toFixed(2)}/MT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Freight (30d)</span>
                <span className="font-mono">${result.estimatedFinancialImpact.expectedFreightPerTonne.toFixed(2)}/MT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cargo Quantity</span>
                <span className="font-mono">{result.estimatedFinancialImpact.cargoQuantityTonnes.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Freight Difference</span>
                <span className="font-mono font-semibold">
                  ${result.estimatedFinancialImpact.totalFreightDifference.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Waiting Cost Estimate</span>
                <span className="font-mono">${result.estimatedFinancialImpact.waitingCostEstimate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">Net Potential Impact</span>
                <span className="font-mono font-semibold text-primary">
                  ${result.estimatedFinancialImpact.netPotentialImpact.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                {result.estimatedFinancialImpact.label}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Duration Recommendations */}
      {result.contractRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contract Duration Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.contractRecommendations.map((cr) => {
                const crStyle = DECISION_STYLES[cr.recommendation];
                return (
                  <div key={cr.duration} className="flex items-center gap-3 p-2 rounded border">
                    <span className="text-sm font-medium w-28 capitalize">{cr.duration.replace("_", "-")}</span>
                    <Badge className={`${crStyle.bg} ${crStyle.color} border text-[10px]`}>
                      {DECISION_LABELS[cr.recommendation]}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-1">{cr.explanation}</span>
                    <span className="text-xs font-mono">{cr.score}/100</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500">⚠</span>
                  <span className="text-muted-foreground">{w}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assumptions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {result.assumptions.map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {a}</p>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 italic border-t pt-2">{result.disclaimer}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Signal Card ----

function SignalCard({
  title,
  score,
  detail,
  icon,
}: {
  title: string;
  score: number;
  detail: string;
  icon: string;
}) {
  const barColor = score >= 65 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className="py-3">
      <CardContent className="px-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono">{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 truncate">{detail}</p>
      </CardContent>
    </Card>
  );
}

// ---- Helpers ----

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
