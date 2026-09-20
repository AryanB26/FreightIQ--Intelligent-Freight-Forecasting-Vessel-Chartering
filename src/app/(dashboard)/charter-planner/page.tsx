"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CharterOptimizationResult, CharterStrategy } from "@/types/charter-planner";
import { getVesselSpecs } from "@/data/seed/vessel-specs";

const ORIGIN_PORTS = [
  { id: "port-port-hedland", name: "Port Hedland (Australia)" },
  { id: "port-new-orleans", name: "New Orleans (USA)" },
  { id: "port-beira", name: "Beira (Mozambique)" },
  { id: "port-vladivostok", name: "Vladivostok (Russia)" },
  { id: "port-tanjung-api", name: "Tanjung Api-Api (Indonesia)" },
];

const DESTINATION_PORTS = [
  { id: "port-paradip", name: "Paradip" },
  { id: "port-visakhapatnam", name: "Visakhapatnam" },
  { id: "port-gangavaram", name: "Gangavaram" },
  { id: "port-gopalpur", name: "Gopalpur" },
  { id: "port-dhamra", name: "Dhamra" },
  { id: "port-sagar", name: "Sagar/Sandheads" },
  { id: "port-haldia", name: "Haldia" },
];

const PRIORITY_OPTIONS = [
  { value: "cost", label: "Cost Priority", description: "Minimize total charter cost" },
  { value: "balanced", label: "Balanced", description: "Balance cost, time, and risk" },
  { value: "utilization", label: "Utilization Priority", description: "Maximize vessel utilization" },
  { value: "risk", label: "Risk Priority", description: "Minimize operational risk" },
];

import { LighterageOptimizerSection } from "./lighterage-optimizer";
import type { LighteragePlanResult } from "@/services/lighterage/optimizer";

export default function CharterPlannerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CharterOptimizationResult | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<CharterStrategy | null>(null);
  const [triangulationOpportunities, setTriangulationOpportunities] = useState<any[]>([]);
  const [lighterageResult, setLighterageResult] = useState<LighteragePlanResult | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    commodity: "iron_ore",
    totalQuantityTonnes: 70000,
    originPortId: "port-port-hedland",
    destinationPortId: "port-paradip",
    cargoReadyDate: new Date().toISOString().split("T")[0],
    deliveryDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    duration: "medium_term" as "spot" | "short_term" | "medium_term",
    priority: "balanced" as "cost" | "balanced" | "utilization" | "risk",
  });

  useEffect(() => {
    handleOptimize();
  }, []);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/charter/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cargo: {
            commodity: formData.commodity,
            commodityCategory: formData.commodity,
            totalQuantityTonnes: formData.totalQuantityTonnes,
            cargoType: "dry_bulk",
          },
          route: {
            originPortId: formData.originPortId,
            destinationPortId: formData.destinationPortId,
          },
          contract: {
            duration: formData.duration,
            planningHorizonDays: 90,
            cargoReadyDate: formData.cargoReadyDate,
            deliveryDeadline: formData.deliveryDeadline,
          },
          vessel: {
            selectionMode: "auto",
          },
          optimization: {
            priority: formData.priority,
            includePositioning: true,
            multiVoyageMode: true,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setSelectedStrategy(data.data.recommendedStrategy);
      }

      // Fetch triangulation opportunities
      const triResponse = await fetch("/api/triangulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originPortId: formData.originPortId,
          destinationPortId: formData.destinationPortId
        })
      });
      const triData = await triResponse.json();
      if (triData.success) {
        setTriangulationOpportunities(triData.data);
      }

      // Fetch Lighterage
      // We will mock portMaxDraftMeters based on destination
      const isShallowPort = formData.destinationPortId.includes("haldia");
      const portMaxDraftMeters = isShallowPort ? 12 : 18;
      const draftRequiredMeters = formData.totalQuantityTonnes > 100000 ? 18.5 : 
                                  formData.totalQuantityTonnes > 60000 ? 14 : 11;

      const lightResponse = await fetch("/api/lighterage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vesselSizeMt: formData.totalQuantityTonnes,
          draftRequiredMeters,
          portMaxDraftMeters,
          cargoTotalMt: formData.totalQuantityTonnes
        })
      });
      const lightData = await lightResponse.json();
      if (lightData.success) {
        setLighterageResult(lightData.data);
      }

    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Charter Planner</h1>
        <p className="text-sm text-muted-foreground">
          Optimize vessel allocation for multiple-voyage charter contracts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cargo & Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Commodity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Commodity</label>
              <select
                value={formData.commodity}
                onChange={(e) => setFormData({ ...formData, commodity: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="iron_ore">Iron Ore</option>
                <option value="coal">Coal</option>
                <option value="grain">Grain</option>
                <option value="fertilizer">Fertilizer</option>
                <option value="bauxite">Bauxite</option>
              </select>
            </div>

            {/* Total Quantity */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Total Cargo (MT)</label>
              <input
                type="number"
                value={formData.totalQuantityTonnes}
                onChange={(e) => setFormData({ ...formData, totalQuantityTonnes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                min={10000}
                step={10000}
              />
            </div>

            {/* Origin Port */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Origin Port</label>
              <select
                value={formData.originPortId}
                onChange={(e) => setFormData({ ...formData, originPortId: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                {ORIGIN_PORTS.map((port) => (
                  <option key={port.id} value={port.id}>{port.name}</option>
                ))}
              </select>
            </div>

            {/* Destination Port */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Destination Port</label>
              <select
                value={formData.destinationPortId}
                onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                {DESTINATION_PORTS.map((port) => (
                  <option key={port.id} value={port.id}>{port.name}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Cargo Ready</label>
                <input
                  type="date"
                  value={formData.cargoReadyDate}
                  onChange={(e) => setFormData({ ...formData, cargoReadyDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Delivery Deadline</label>
                <input
                  type="date"
                  value={formData.deliveryDeadline}
                  onChange={(e) => setFormData({ ...formData, deliveryDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                />
              </div>
            </div>

            {/* Contract Duration */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Contract Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="spot">Spot</option>
                <option value="short_term">Short-term</option>
                <option value="medium_term">Medium-term</option>
              </select>
            </div>

            {/* Optimization Priority */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Optimization Priority</label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, priority: opt.value as any })}
                    className={`p-2 text-left text-xs border rounded-md transition-colors ${
                      formData.priority === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted hover:bg-muted/50"
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optimize Button */}
            <Button 
              onClick={handleOptimize} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Optimizing..." : "Run Charter Optimization"}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Running optimization engine...</p>
              </CardContent>
            </Card>
          )}

          {!loading && !result && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Configure your cargo and route, then click "Run Charter Optimization"
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && result && (
            <>
              {/* Strategy Overview */}
              <StrategyOverview strategy={result.recommendedStrategy} />

              {/* Strategy Comparison */}
              {result.alternativeStrategies.length > 0 && (
                <StrategyComparison
                  strategies={[result.recommendedStrategy, ...result.alternativeStrategies]}
                  selectedId={selectedStrategy?.id}
                  onSelect={setSelectedStrategy}
                />
              )}

              {/* Selected Strategy Details */}
              {selectedStrategy && (
                <StrategyDetails strategy={selectedStrategy} />
              )}

              {/* Voyage Schedule */}
              {selectedStrategy && selectedStrategy.voyageSchedule.length > 0 && (
                <VoyageSchedule schedule={selectedStrategy.voyageSchedule} />
              )}

              {/* Spot Comparison */}
              {selectedStrategy?.vsSpotComparison && (
                <SpotComparison comparison={selectedStrategy.vsSpotComparison} />
              )}

              {/* Triangulation Opportunities */}
              {triangulationOpportunities.length > 0 && (
                <TriangulationSection opportunities={triangulationOpportunities} />
              )}

              {/* Lighterage Section */}
              {lighterageResult && (
                <LighterageOptimizerSection result={lighterageResult} />
              )}

              {/* Disclaimer */}
              <Card>
                <CardContent className="py-4">
                  <p className="text-[10px] text-muted-foreground text-center">
                    {result.disclaimer}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function StrategyOverview({ strategy }: { strategy: CharterStrategy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recommended Strategy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{strategy.totalVoyages}</p>
            <p className="text-xs text-muted-foreground">Voyages</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{strategy.coveragePercent}%</p>
            <p className="text-xs text-muted-foreground">Coverage</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{strategy.averageUtilization}%</p>
            <p className="text-xs text-muted-foreground">Utilization</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold">{strategy.strategyScore}</p>
            <p className="text-xs text-muted-foreground">Score</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Strategy:</span>
            <span className="ml-2 font-medium">{strategy.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Est. Total Cost:</span>
            <span className="ml-2 font-medium">${strategy.estimatedTotalCost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cost per MT:</span>
            <span className="ml-2 font-medium">${strategy.estimatedCostPerTonne.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Risk Level:</span>
            <Badge className={`ml-2 ${
              strategy.riskLevel === "low" ? "bg-emerald-100 text-emerald-700" :
              strategy.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {strategy.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyComparison({
  strategies,
  selectedId,
  onSelect,
}: {
  strategies: CharterStrategy[];
  selectedId?: string;
  onSelect: (s: CharterStrategy) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Compare Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Strategy</th>
                <th className="pb-2 font-medium">Cost</th>
                <th className="pb-2 font-medium">Util.</th>
                <th className="pb-2 font-medium">Risk</th>
                <th className="pb-2 font-medium">Score</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => (
                <tr
                  key={strategy.id}
                  className={`border-b last:border-0 cursor-pointer hover:bg-muted/30 ${
                    selectedId === strategy.id ? "bg-muted/50" : ""
                  }`}
                  onClick={() => onSelect(strategy)}
                >
                  <td className="py-3 font-medium">{strategy.name}</td>
                  <td className="py-3">${strategy.estimatedTotalCost.toLocaleString()}</td>
                  <td className="py-3">{strategy.averageUtilization}%</td>
                  <td className="py-3">
                    <Badge className={
                      strategy.riskLevel === "low" ? "bg-emerald-100 text-emerald-700" :
                      strategy.riskLevel === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }>
                      {strategy.riskLevel}
                    </Badge>
                  </td>
                  <td className="py-3 font-semibold">{strategy.strategyScore}</td>
                  <td className="py-3">
                    {selectedId === strategy.id && (
                      <Badge className="bg-primary/10 text-primary">Selected</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function StrategyDetails({ strategy }: { strategy: CharterStrategy }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Strategy Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Breakdown */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Cost Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">Freight</p>
              <p className="text-sm font-medium">${strategy.costBreakdown.freightCost.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">Bunker</p>
              <p className="text-sm font-medium">${strategy.costBreakdown.bunkerCost.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">Operating</p>
              <p className="text-sm font-medium">${strategy.costBreakdown.operatingCost.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">Port</p>
              <p className="text-sm font-medium">${strategy.costBreakdown.portCost.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-muted/30 rounded text-center">
              <p className="text-xs text-muted-foreground">Positioning</p>
              <p className="text-sm font-medium">${strategy.costBreakdown.positioningCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Objective Scores */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Objective Scores</h4>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-sm font-bold">{strategy.objectiveScores.cost}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Cost</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-sm font-bold">{strategy.objectiveScores.utilization}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Utilization</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-sm font-bold">{strategy.objectiveScores.time}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Time</p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary flex items-center justify-center">
                <span className="text-sm font-bold">{strategy.objectiveScores.risk}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Risk</p>
            </div>
          </div>
        </div>

        {/* Capacity Opportunity */}
        <CapacityOpportunitySection strategy={strategy} />

        {/* Reasons */}
        {strategy.reasons.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Why this strategy?</h4>
            <ul className="space-y-1">
              {strategy.reasons.map((reason, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {strategy.warnings.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Warnings</h4>
            <ul className="space-y-1">
              {strategy.warnings.map((warning, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Capacity Opportunity Sub-Component ----

interface CompatibleCargoOpportunity {
  id: string;
  shipperLabel: string;
  commodity: string;
  commodityName: string;
  quantity: number;
  originPortId: string;
  originPortName: string;
  destinationPortId: string;
  destinationPortName: string;
  compatibleVesselClasses: string[];
  compatibilityScore: number;
}

const DEMO_CARGO_OPPORTUNITIES: CompatibleCargoOpportunity[] = [
  {
    id: "opp-01",
    shipperLabel: "Shipper B (Parcel #01)",
    commodity: "iron_ore",
    commodityName: "Iron Ore",
    quantity: 18000,
    originPortId: "port-port-hedland",
    originPortName: "Port Hedland",
    destinationPortId: "port-paradip",
    destinationPortName: "Paradip",
    compatibleVesselClasses: ["Panamax", "Capesize"],
    compatibilityScore: 94,
  },
  {
    id: "opp-02",
    shipperLabel: "Shipper C (Parcel #02)",
    commodity: "coal",
    commodityName: "Thermal Coal",
    quantity: 15000,
    originPortId: "port-new-orleans",
    originPortName: "New Orleans",
    destinationPortId: "port-paradip",
    destinationPortName: "Paradip",
    compatibleVesselClasses: ["Panamax", "Capesize"],
    compatibilityScore: 91,
  },
  {
    id: "opp-03",
    shipperLabel: "Shipper D (Parcel #03)",
    commodity: "bauxite",
    commodityName: "Bauxite",
    quantity: 12000,
    originPortId: "port-beira",
    originPortName: "Beira",
    destinationPortId: "port-dhamra",
    destinationPortName: "Dhamra",
    compatibleVesselClasses: ["Supramax", "Panamax"],
    compatibilityScore: 88,
  },
];

function CapacityOpportunitySection({ strategy }: { strategy: CharterStrategy }) {
  const [showOpportunityDetails, setShowOpportunityDetails] = useState(false);

  const primaryVessel = strategy.vessels[0];
  if (!primaryVessel) return null;

  // Use existing vessel specs / capacity calculation
  const specs = getVesselSpecs(primaryVessel.vesselId);
  const singleVoyageCapacity = specs ? specs.cargoVolume : primaryVessel.dwt;
  const numberOfVoyages = primaryVessel.numberOfVoyages || 1;
  const totalVesselCapacity = singleVoyageCapacity * numberOfVoyages;
  const currentCargo = strategy.totalCargoTonnes || primaryVessel.cargoAllocationTonnes;

  const availableCapacity = Math.max(0, totalVesselCapacity - currentCargo);
  if (availableCapacity <= 0) return null;

  // Derive route and commodity context from existing voyage schedule or vessel allocation
  const firstVoyage = primaryVessel.estimatedVoyages?.[0];
  const originPortId = firstVoyage?.originPortId;
  const destinationPortId = firstVoyage?.destinationPortId;
  const commodity = firstVoyage?.commodity || "iron_ore";
  const originPortName = firstVoyage?.originPortName || "Port Hedland";
  const destinationPortName = firstVoyage?.destinationPortName || "Paradip";

  // Match compatible cargo opportunity based on route, commodity, vessel class, and capacity
  const match = DEMO_CARGO_OPPORTUNITIES.find((opp) => {
    if (opp.originPortId !== originPortId || opp.destinationPortId !== destinationPortId) {
      return false;
    }
    if (opp.commodity !== commodity) {
      return false;
    }
    if (!opp.compatibleVesselClasses.includes(primaryVessel.vesselClass)) {
      return false;
    }
    if (opp.quantity > availableCapacity) {
      return false;
    }
    return true;
  });

  // Only display when existing planning inputs produce a compatible cargo match
  if (!match) return null;

  const currentUtilization = strategy.averageUtilization;
  const potentialCargo = currentCargo + match.quantity;
  const potentialUtilization = Math.round((potentialCargo / totalVesselCapacity) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-muted-foreground">Capacity Opportunity</h4>
        <Badge
          variant="outline"
          className="text-[10px] font-mono py-0 h-4 border-white/20 text-slate-300 font-normal"
        >
          Compatible cargo identified
        </Badge>
      </div>

      <div className="p-3 bg-muted/20 border border-border rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div>
            <span className="text-muted-foreground">Unused capacity detected: </span>
            <span className="font-semibold text-foreground">
              {availableCapacity.toLocaleString()} MT available
            </span>
            <span className="text-muted-foreground ml-1">on selected vessel</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {originPortName} → {destinationPortName}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center pt-1 border-t border-border/40">
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Compatible Cargo</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {match.quantity.toLocaleString()} MT
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Current Utilization</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {currentUtilization}%
            </p>
          </div>
          <div className="p-2 bg-muted/30 rounded">
            <p className="text-[10px] text-muted-foreground">Potential Utilization</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {potentialUtilization}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[11px] text-muted-foreground">
            {match.commodityName} • Compatibility Score: {match.compatibilityScore}%
          </span>
          <button
            type="button"
            onClick={() => setShowOpportunityDetails(!showOpportunityDetails)}
            className="text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {showOpportunityDetails ? "Hide Opportunity Details ↑" : "View Opportunity →"}
          </button>
        </div>

        {showOpportunityDetails && (
          <div className="p-2.5 bg-black/50 border border-border/70 rounded text-xs space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Shipper / Source:</span>
              <span className="text-slate-200">{match.shipperLabel}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Loading Window:</span>
              <span className="text-slate-200">Aligned with Voyage 1 laycan</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Consolidation Mode:</span>
              <span className="text-slate-200">Co-charter / Remaining hold parcel</span>
            </div>
            <div className="pt-1 text-[10px] text-slate-500 italic">
              Baseline charter strategy remains unchanged. Consolidation requires separate co-loading agreement.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VoyageSchedule({ schedule }: { schedule: CharterScheduleEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Voyage Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedule.map((voyage, idx) => (
            <div key={idx} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/10 text-primary">Voyage {voyage.voyageNumber}</Badge>
                  <span className="text-sm font-medium">{voyage.vesselName}</span>
                </div>
                <Badge className="bg-muted text-muted-foreground">{voyage.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground">Origin</p>
                  <p className="font-medium">{voyage.originPortName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Destination</p>
                  <p className="font-medium">{voyage.destinationPortName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Cargo</p>
                  <p className="font-medium">{voyage.cargoQuantityTonnes.toLocaleString()} MT</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Transit</p>
                  <p className="font-medium">{voyage.transitDays} days</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div>
                  <span>Loading:</span>
                  <span className="ml-1">{voyage.loadingStartDate}</span>
                </div>
                <div>
                  <span>Departure:</span>
                  <span className="ml-1">{voyage.departureDate}</span>
                </div>
                <div>
                  <span>Arrival:</span>
                  <span className="ml-1">{voyage.arrivalDate}</span>
                </div>
                <div>
                  <span>Discharge:</span>
                  <span className="ml-1">{voyage.dischargeEndDate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SpotComparison({ comparison }: { comparison: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Spot vs Multi-Voyage Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Spot */}
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Spot Chartering</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Cost:</span>
                <span className="font-medium">${comparison.spotEstimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Exposure:</span>
                <Badge className="bg-red-100 text-red-700">High</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planning Stability:</span>
                <Badge className="bg-red-100 text-red-700">Low</Badge>
              </div>
            </div>
          </div>

          {/* Multi-Voyage */}
          <div className="p-4 border-2 border-primary rounded-lg">
            <h4 className="text-sm font-medium mb-3">Multi-Voyage Contract</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Cost:</span>
                <span className="font-medium">${comparison.multiVoyageEstimatedCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Exposure:</span>
                <Badge className="bg-emerald-100 text-emerald-700">{comparison.multiVoyageMarketExposure}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planning Stability:</span>
                <Badge className="bg-emerald-100 text-emerald-700">High</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-primary font-semibold">Savings:</span>
            <span className="text-lg font-bold text-primary">${comparison.costDifference.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">({comparison.costDifferencePercent}%)</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{comparison.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TriangulationSection({ opportunities }: { opportunities: any[] }) {
  return (
    <Card className="border-blue-500/30">
      <CardHeader className="bg-blue-500/5 pb-4">
        <CardTitle className="text-sm font-medium text-blue-400 flex justify-between items-center">
          Ballast-Leg Minimizer (Triangulation Engine)
          <Badge className="bg-blue-500 text-white">Advanced Strategy</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground mb-4">
          Instead of returning empty (ballast), consider these triangulated routes to subsidize your medium-term contract.
        </p>
        <div className="space-y-4">
          {opportunities.map((opp, idx) => (
            <div key={idx} className="p-3 bg-muted/30 border rounded-lg flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Opportunity {idx + 1}</span>
                <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
                  Save ~${opp.estimatedSavingsPerVoyage.toLocaleString()} / voyage
                </Badge>
              </div>
              
              <div className="flex items-center text-xs text-muted-foreground mt-2">
                <span className="font-semibold text-foreground mr-2">Legs:</span>
                {opp.primaryLeg.originPortId.replace("port-","").toUpperCase()} → {opp.primaryLeg.destinationPortId.replace("port-","").toUpperCase()}
                {opp.subsequentLegs.map((leg: any, i: number) => (
                   <span key={i} className="ml-1">
                     → {leg.destinationPortId.replace("port-","").toUpperCase()} {leg.cargoAvailable ? "(Cargo)" : "(Ballast)"}
                   </span>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                 <div className="p-2 border rounded">
                   <p className="text-muted-foreground">Total Distance</p>
                   <p className="font-semibold">{opp.totalDistanceNm.toLocaleString()} nm</p>
                 </div>
                 <div className="p-2 border rounded">
                   <p className="text-muted-foreground">Ballast Distance</p>
                   <p className="font-semibold">{opp.ballastDistanceNm.toLocaleString()} nm</p>
                 </div>
                 <div className="p-2 border rounded">
                   <p className="text-muted-foreground">Ballast %</p>
                   <p className={`font-semibold ${opp.ballastPercentage < 30 ? "text-emerald-500" : "text-amber-500"}`}>{opp.ballastPercentage}%</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Fix type name
type CharterScheduleEntry = VoyageScheduleEntry;
import type { VoyageScheduleEntry } from "@/types/charter-planner";
