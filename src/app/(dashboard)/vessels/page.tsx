"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { allPorts } from "@/data/seed/ports";
import type { VesselOptimizerResult, VesselRecommendation } from "@/types/port-vessel";

const destPorts = allPorts.filter((p) => p.isDestination);
const originPorts = allPorts.filter((p) => !p.isDestination);
const commodities = ["Iron Ore", "Coal", "Grain", "Fertilizer", "Bauxite", "Manganese", "Steel", "Petcoke"];

export default function VesselsPage() {
  const [result, setResult] = useState<VesselOptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    cargoQuantityTonnes: "",
    commodity: "",
    originPortId: "",
    destinationPortId: "",
    loadingDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.cargoQuantityTonnes || Number(form.cargoQuantityTonnes) <= 0) e.cargoQuantityTonnes = "Required";
    if (!form.commodity) e.commodity = "Required";
    if (!form.originPortId) e.originPortId = "Required";
    if (!form.destinationPortId) e.destinationPortId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAnalyze = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vessel-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargoQuantityTonnes: Number(form.cargoQuantityTonnes),
          commodity: form.commodity,
          originPortId: form.originPortId,
          destinationPortId: form.destinationPortId,
          loadingDate: form.loadingDate || new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch {
      setError("Failed to connect to analysis engine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Vessel Optimizer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Find the optimal vessel for your cargo — ranked by compatibility, cost, and utilization</p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cargo & Route Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Cargo (tonnes)</label>
              <Input
                type="number"
                placeholder="e.g. 55000"
                value={form.cargoQuantityTonnes}
                onChange={(e) => setForm({ ...form, cargoQuantityTonnes: e.target.value })}
                className={errors.cargoQuantityTonnes ? "border-red-400" : ""}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Commodity</label>
              <Select value={form.commodity} onValueChange={(v) => setForm({ ...form, commodity: v })}>
                <SelectTrigger className={errors.commodity ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {commodities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Origin</label>
              <Select value={form.originPortId} onValueChange={(v) => setForm({ ...form, originPortId: v })}>
                <SelectTrigger className={errors.originPortId ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {originPorts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Destination</label>
              <Select value={form.destinationPortId} onValueChange={(v) => setForm({ ...form, destinationPortId: v })}>
                <SelectTrigger className={errors.destinationPortId ? "border-red-400" : ""}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {destPorts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Loading Date</label>
              <Input
                type="date"
                value={form.loadingDate}
                onChange={(e) => setForm({ ...form, loadingDate: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={handleAnalyze} disabled={loading} size="sm">
              {loading ? "Analyzing..." : "Find Optimal Vessel"}
            </Button>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="py-3">
              <CardContent className="px-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Recommendations</p>
                <p className="text-xl font-bold font-mono">{result.recommendations.length}</p>
              </CardContent>
            </Card>
            <Card className="py-3">
              <CardContent className="px-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rejected</p>
                <p className="text-xl font-bold font-mono">{result.rejectedVessels.length}</p>
              </CardContent>
            </Card>
            <Card className="py-3">
              <CardContent className="px-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Best Cost/Tonne</p>
                <p className="text-xl font-bold font-mono text-primary">
                  ${result.recommendations[0]
                    ? (result.recommendations[0].estimatedCost / Number(form.cargoQuantityTonnes)).toFixed(2)
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="py-3">
              <CardContent className="px-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fastest Turnaround</p>
                <p className="text-xl font-bold font-mono">
                  {result.recommendations[0]?.estimatedTurnaroundDays ?? "—"}d
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranked Recommendations */}
          {result.recommendations.map((rec) => (
            <VesselRecommendationCard key={rec.vesselId} rec={rec} formQuantity={Number(form.cargoQuantityTonnes)} />
          ))}

          {/* Rejected Vessels */}
          {result.rejectedVessels.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Rejected Vessels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {result.rejectedVessels.map((r) => (
                    <div key={r.vesselId} className="flex items-start gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium">{r.vesselName}</span>
                        <span className="text-muted-foreground ml-2">{r.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Recommendation Card ----

function VesselRecommendationCard({ rec, formQuantity }: { rec: VesselRecommendation; formQuantity: number }) {
  const costPerTonne = (rec.estimatedCost / formQuantity).toFixed(2);

  const scoreColor =
    rec.totalScore >= 80 ? "text-emerald-600" :
    rec.totalScore >= 60 ? "text-amber-600" :
    "text-red-600";

  const rankBadge =
    rec.rank === 1 ? "bg-primary text-primary-foreground" :
    rec.rank === 2 ? "bg-muted text-foreground" :
    "bg-muted text-muted-foreground";

  return (
    <Card className={cn(rec.rank === 1 && "ring-1 ring-primary/20")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Rank */}
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0", rankBadge)}>
            #{rec.rank}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{rec.vesselName}</span>
              <Badge variant="secondary" className="text-[10px]">{rec.vesselClass}</Badge>
              <span className={cn("text-sm font-bold font-mono ml-auto", scoreColor)}>{rec.totalScore}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-5 gap-3 text-xs mt-2">
              <div>
                <span className="text-muted-foreground block">DWT</span>
                <span className="font-mono font-medium">{rec.dwt.toLocaleString()}t</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Utilization</span>
                <span className={cn("font-mono font-medium", rec.utilizationPercent >= 80 && rec.utilizationPercent <= 95 ? "text-emerald-600" : rec.utilizationPercent > 100 ? "text-red-600" : "")}>
                  {rec.utilizationPercent}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Compatibility</span>
                <span className="font-mono font-medium">{rec.compatibilityScore}%</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total Cost</span>
                <span className="font-mono font-medium">${rec.estimatedCost.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Cost/Tonne</span>
                <span className="font-mono font-medium">${costPerTonne}</span>
              </div>
            </div>

            {/* Turnaround */}
            <div className="mt-2 text-xs">
              <span className="text-muted-foreground">Est. turnaround: </span>
              <span className="font-mono font-medium">{rec.estimatedTurnaroundDays} days</span>
            </div>

            {/* Reasons & Warnings */}
            <div className="mt-3 space-y-1">
              {rec.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <svg className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-muted-foreground">{reason}</span>
                </div>
              ))}
              {rec.warnings.map((warning, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <svg className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  <span className="text-amber-600">{warning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
