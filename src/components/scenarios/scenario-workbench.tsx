"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Ship,
  Fuel,
  Anchor,
  Clock,
  DollarSign,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface RoutePreset {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceNm: number;
  baseTransitDays: number;
  originMaxDraft: number;
  destMaxDraft: number;
}

const ROUTES: RoutePreset[] = [
  {
    id: "hedland-paradip",
    name: "Port Hedland → Paradip",
    origin: "Port Hedland (Australia)",
    destination: "Paradip (India)",
    distanceNm: 3072,
    baseTransitDays: 10,
    originMaxDraft: 19.5,
    destMaxDraft: 16.5,
  },
  {
    id: "newcastle-vizag",
    name: "Newcastle → Visakhapatnam",
    origin: "Newcastle (Australia)",
    destination: "Visakhapatnam (India)",
    distanceNm: 5420,
    baseTransitDays: 17,
    originMaxDraft: 16.0,
    destMaxDraft: 17.5,
  },
  {
    id: "indonesia-dhamra",
    name: "Tanjung Api-Api → Dhamra",
    origin: "Tanjung Api-Api (Indonesia)",
    destination: "Dhamra (India)",
    distanceNm: 2240,
    baseTransitDays: 7,
    originMaxDraft: 14.0,
    destMaxDraft: 18.0,
  },
  {
    id: "beira-vizag",
    name: "Beira → Visakhapatnam",
    origin: "Beira (Mozambique)",
    destination: "Visakhapatnam (India)",
    distanceNm: 4180,
    baseTransitDays: 13,
    originMaxDraft: 12.0,
    destMaxDraft: 17.5,
  },
  {
    id: "vladivostok-paradip",
    name: "Vladivostok → Paradip",
    origin: "Vladivostok (Russia)",
    destination: "Paradip (India)",
    distanceNm: 4850,
    baseTransitDays: 15,
    originMaxDraft: 15.0,
    destMaxDraft: 16.5,
  },
];

interface VesselClassSpec {
  name: string;
  dwt: number;
  draft: number;
  baseDailyHire: number;
  fuelConsumptionLaden: number;
  portCostBase: number;
}

const VESSEL_SPECS: Record<string, VesselClassSpec> = {
  Handysize: {
    name: "Handysize",
    dwt: 35000,
    draft: 10.5,
    baseDailyHire: 11500,
    fuelConsumptionLaden: 22,
    portCostBase: 35000,
  },
  Supramax: {
    name: "Supramax",
    dwt: 52000,
    draft: 12.2,
    baseDailyHire: 13800,
    fuelConsumptionLaden: 28,
    portCostBase: 42000,
  },
  Panamax: {
    name: "Panamax",
    dwt: 75000,
    draft: 13.8,
    baseDailyHire: 16500,
    fuelConsumptionLaden: 34,
    portCostBase: 48000,
  },
  Capesize: {
    name: "Capesize",
    dwt: 180000,
    draft: 17.8,
    baseDailyHire: 24500,
    fuelConsumptionLaden: 50,
    portCostBase: 65000,
  },
};

type CongestionLevel = "normal" | "moderate" | "severe";

interface CongestionSpec {
  label: string;
  daysDelay: number;
  demurrageRatePerDay: number;
  description: string;
}

const CONGESTION_CONFIG: Record<CongestionLevel, CongestionSpec> = {
  normal: {
    label: "Normal",
    daysDelay: 1.5,
    demurrageRatePerDay: 15000,
    description: "Standard 1.5-day queue window",
  },
  moderate: {
    label: "Moderate",
    daysDelay: 3.5,
    demurrageRatePerDay: 16000,
    description: "Seasonal monsoon delay (+3.5 days)",
  },
  severe: {
    label: "Severe",
    daysDelay: 7.0,
    demurrageRatePerDay: 18500,
    description: "Berth bottleneck & congestion (+7.0 days)",
  },
};

interface PresetScenario {
  id: string;
  title: string;
  description: string;
  freightShift: number;
  bunkerShift: number;
  congestion: CongestionLevel;
}

const SCENARIO_PRESETS: PresetScenario[] = [
  {
    id: "baseline",
    title: "Market Baseline",
    description: "Zero variance, normal port turnaround",
    freightShift: 0,
    bunkerShift: 0,
    congestion: "normal",
  },
  {
    id: "fuel-spike",
    title: "Bunker Fuel Shock",
    description: "+25% VLSFO price, +10% hire rate",
    freightShift: 10,
    bunkerShift: 25,
    congestion: "normal",
  },
  {
    id: "monsoon-bottleneck",
    title: "Monsoon Congestion",
    description: "Severe berth queues, +15% freight",
    freightShift: 15,
    bunkerShift: 5,
    congestion: "severe",
  },
  {
    id: "market-slump",
    title: "Freight Rate Slump",
    description: "-20% freight rate, -10% fuel cost",
    freightShift: -20,
    bunkerShift: -10,
    congestion: "normal",
  },
];

export function ScenarioWorkbench() {
  // Input parameters
  const [selectedRouteId, setSelectedRouteId] = useState("hedland-paradip");
  const [selectedVesselClass, setSelectedVesselClass] = useState("Panamax");
  const [cargoVolume, setCargoVolume] = useState(70000);
  const [contractType] = useState<"spot" | "short_term" | "medium_term">("medium_term");
  const [freightRateShift, setFreightRateShift] = useState(0); // -30% to +30%
  const [bunkerCostShift, setBunkerCostShift] = useState(0); // -30% to +30%
  const [congestionLevel, setCongestionLevel] = useState<CongestionLevel>("normal");

  const route = ROUTES.find((r) => r.id === selectedRouteId) || ROUTES[0];
  const vesselSpec = VESSEL_SPECS[selectedVesselClass] || VESSEL_SPECS.Panamax;
  const congestionSpec = CONGESTION_CONFIG[congestionLevel];

  // Draft constraint check
  const isDraftConstrained = vesselSpec.draft > route.destMaxDraft;

  // Number of voyages needed
  const voyagesNeeded = Math.ceil(cargoVolume / vesselSpec.dwt);
  const cargoPerVoyage = Math.round(cargoVolume / voyagesNeeded);

  // Baseline Bunker Price
  const baseBunkerPrice = 580; // $/MT
  const scenarioBunkerPrice = Math.round(baseBunkerPrice * (1 + bunkerCostShift / 100));

  // BASE CASE CALCULATIONS
  const base = useMemo(() => {
    const transitDays = route.baseTransitDays;
    const baseCongestionDays = CONGESTION_CONFIG.normal.daysDelay;
    const turnaroundDays = 3.0 + baseCongestionDays;
    const roundTripDays = transitDays * 2 + turnaroundDays;

    const hireCost = vesselSpec.baseDailyHire * roundTripDays * voyagesNeeded;
    const bunkerCost =
      vesselSpec.fuelConsumptionLaden * (transitDays * 1.8) * baseBunkerPrice * voyagesNeeded;
    const portCost = (vesselSpec.portCostBase * 2 + baseCongestionDays * CONGESTION_CONFIG.normal.demurrageRatePerDay) * voyagesNeeded;
    const operatingCost = 4500 * roundTripDays * voyagesNeeded;

    const totalCost = Math.round(hireCost + bunkerCost + portCost + operatingCost);
    const unitCost = Math.round((totalCost / cargoVolume) * 100) / 100;
    const totalDays = Math.round(roundTripDays * voyagesNeeded);

    return {
      hireCost: Math.round(hireCost),
      bunkerCost: Math.round(bunkerCost),
      portCost: Math.round(portCost),
      operatingCost: Math.round(operatingCost),
      totalCost,
      unitCost,
      totalDays,
      transitDays,
      turnaroundDays: Math.round(turnaroundDays * 10) / 10,
    };
  }, [route, vesselSpec, cargoVolume, voyagesNeeded]);

  // SCENARIO CASE CALCULATIONS
  const scenario = useMemo(() => {
    const transitDays = route.baseTransitDays;
    const scenarioCongestionDays = congestionSpec.daysDelay;
    const turnaroundDays = 3.0 + scenarioCongestionDays;
    const roundTripDays = transitDays * 2 + turnaroundDays;

    const adjustedDailyHire = vesselSpec.baseDailyHire * (1 + freightRateShift / 100);
    const hireCost = adjustedDailyHire * roundTripDays * voyagesNeeded;
    const bunkerCost =
      vesselSpec.fuelConsumptionLaden * (transitDays * 1.8) * scenarioBunkerPrice * voyagesNeeded;
    const portCost = (vesselSpec.portCostBase * 2 + scenarioCongestionDays * congestionSpec.demurrageRatePerDay) * voyagesNeeded;
    const operatingCost = 4500 * roundTripDays * voyagesNeeded;

    const totalCost = Math.round(hireCost + bunkerCost + portCost + operatingCost);
    const unitCost = Math.round((totalCost / cargoVolume) * 100) / 100;
    const totalDays = Math.round(roundTripDays * voyagesNeeded);

    return {
      hireCost: Math.round(hireCost),
      bunkerCost: Math.round(bunkerCost),
      portCost: Math.round(portCost),
      operatingCost: Math.round(operatingCost),
      totalCost,
      unitCost,
      totalDays,
      transitDays,
      turnaroundDays: Math.round(turnaroundDays * 10) / 10,
    };
  }, [route, vesselSpec, cargoVolume, voyagesNeeded, freightRateShift, scenarioBunkerPrice, congestionSpec]);

  // Delta calculations
  const totalCostDelta = scenario.totalCost - base.totalCost;
  const totalCostDeltaPercent = Math.round((totalCostDelta / base.totalCost) * 1000) / 10;
  const unitCostDelta = Math.round((scenario.unitCost - base.unitCost) * 100) / 100;
  const daysDelta = scenario.totalDays - base.totalDays;

  // Risk Rating
  const riskRating = useMemo(() => {
    if (isDraftConstrained) return { level: "CRITICAL", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (totalCostDeltaPercent > 18 || congestionLevel === "severe") {
      return { level: "HIGH RISK", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    }
    if (totalCostDeltaPercent > 6 || congestionLevel === "moderate") {
      return { level: "MEDIUM RISK", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
    }
    if (totalCostDeltaPercent < -5) {
      return { level: "FAVORABLE", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
    }
    return { level: "BALANCED", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
  }, [totalCostDeltaPercent, congestionLevel, isDraftConstrained]);

  // Strategic Recommendation
  const recommendation = useMemo(() => {
    if (isDraftConstrained) {
      return {
        title: "Draft Incompatibility Warning",
        action: `Vessel draft (${vesselSpec.draft}m) exceeds ${route.destination} max limit (${route.destMaxDraft}m). Switch to Panamax or consider lightering at Sagar/Sandheads.`,
        urgency: "Immediate",
      };
    }

    if (bunkerCostShift >= 15 && freightRateShift >= 10) {
      return {
        title: "Lock In Medium-Term Charter Agreement",
        action: "Both bunker fuel and spot freight rates are surging. Contract fixed-rate medium-term COA to protect against further freight inflation.",
        urgency: "High Priority",
      };
    }

    if (congestionLevel === "severe") {
      return {
        title: "Mitigate Port Demurrage Exposure",
        action: `Estimated queue at ${route.destination} is ${congestionSpec.daysDelay} days. Inquire about alternative deep-water berths at Visakhapatnam/Gangavaram or enforce strict laytime caps.`,
        urgency: "Action Required",
      };
    }

    if (freightRateShift <= -15) {
      return {
        title: "Capitalize on Spot Market Softness",
        action: "Freight rates are discounted (-20%). Retain spot chartering or execute short-term contracts to capture depressed market rates.",
        urgency: "Opportunistic",
      };
    }

    return {
      title: "Optimal Baseline Execution",
      action: `Standard ${vesselSpec.name} deployment on ${route.name} remains cost-efficient at $${scenario.unitCost}/MT. Maintain standard scheduling.`,
      urgency: "Routine",
    };
  }, [isDraftConstrained, bunkerCostShift, freightRateShift, congestionLevel, vesselSpec, route, congestionSpec, scenario.unitCost]);

  // Apply preset
  const applyPreset = (preset: PresetScenario) => {
    setFreightRateShift(preset.freightShift);
    setBunkerCostShift(preset.bunkerShift);
    setCongestionLevel(preset.congestion);
  };

  // Reset to default
  const resetToDefault = () => {
    setFreightRateShift(0);
    setBunkerCostShift(0);
    setCongestionLevel("normal");
    setSelectedVesselClass("Panamax");
    setCargoVolume(70000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Preset Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Interactive Scenario Workbench</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Simulate the financial and operational impact of market volatility, bunker spikes, and port congestion
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium mr-1">Presets:</span>
          {SCENARIO_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-xs h-7 px-2.5 border-border/60 hover:border-primary/50"
            >
              {preset.title}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetToDefault}
            className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Main Grid: Control Panel & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls (5 cols) */}
        <Card className="lg:col-span-5 border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Scenario Parameters</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {contractType.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Adjust variables to simulate stress-test outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            {/* Route Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center justify-between">
                <span>Shipping Corridor</span>
                <span className="text-[10px] text-muted-foreground font-mono">{route.distanceNm} NM</span>
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-border/60 bg-background/80 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.distanceNm} NM)
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Class Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center justify-between">
                <span>Vessel Class</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  DWT: {vesselSpec.dwt.toLocaleString()} MT | Draft: {vesselSpec.draft}m
                </span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(VESSEL_SPECS).map((vClass) => (
                  <button
                    key={vClass}
                    onClick={() => setSelectedVesselClass(vClass)}
                    className={`py-2 px-1 text-xs rounded-md border transition-all text-center ${
                      selectedVesselClass === vClass
                        ? "border-primary bg-primary/15 text-primary font-semibold shadow-sm"
                        : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {vClass}
                  </button>
                ))}
              </div>
              {isDraftConstrained && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 mt-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Draft ({vesselSpec.draft}m) exceeds port draft limit ({route.destMaxDraft}m)!</span>
                </div>
              )}
            </div>

            {/* Cargo Quantity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Total Cargo Volume</span>
                <span className="font-mono text-primary font-semibold">{cargoVolume.toLocaleString()} MT</span>
              </div>
              <input
                type="range"
                min={30000}
                max={180000}
                step={5000}
                value={cargoVolume}
                onChange={(e) => setCargoVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>30k MT</span>
                <span>Requires {voyagesNeeded} {vesselSpec.name} voyage{voyagesNeeded > 1 ? "s" : ""}</span>
                <span>180k MT</span>
              </div>
            </div>

            {/* Freight Rate Shift Slider */}
            <div className="space-y-1.5 pt-1 border-t border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1">
                  <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                  Freight Rate Variance
                </span>
                <span className={`font-mono font-semibold ${freightRateShift > 0 ? "text-amber-400" : freightRateShift < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {freightRateShift > 0 ? `+${freightRateShift}%` : `${freightRateShift}%`}
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={freightRateShift}
                onChange={(e) => setFreightRateShift(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>-30% (Slump)</span>
                <span>Hire: ${Math.round(vesselSpec.baseDailyHire * (1 + freightRateShift / 100)).toLocaleString()}/day</span>
                <span>+30% (Surge)</span>
              </div>
            </div>

            {/* Bunker Cost Shift Slider */}
            <div className="space-y-1.5 pt-1 border-t border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                  Bunker Fuel Price Shift
                </span>
                <span className={`font-mono font-semibold ${bunkerCostShift > 0 ? "text-red-400" : bunkerCostShift < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {bunkerCostShift > 0 ? `+${bunkerCostShift}%` : `${bunkerCostShift}%`}
                </span>
              </div>
              <input
                type="range"
                min={-30}
                max={30}
                step={5}
                value={bunkerCostShift}
                onChange={(e) => setBunkerCostShift(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>$406/MT (-30%)</span>
                <span className="font-semibold text-foreground">${scenarioBunkerPrice}/MT</span>
                <span>$754/MT (+30%)</span>
              </div>
            </div>

            {/* Port Congestion Level */}
            <div className="space-y-1.5 pt-1 border-t border-border/30">
              <label className="text-xs font-medium flex items-center gap-1">
                <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                Destination Port Congestion Delay
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["normal", "moderate", "severe"] as CongestionLevel[]).map((level) => {
                  const cfg = CONGESTION_CONFIG[level];
                  const isSelected = congestionLevel === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setCongestionLevel(level)}
                      className={`p-2 rounded-md border text-left transition-all ${
                        isSelected
                          ? level === "severe"
                            ? "border-red-500 bg-red-500/15 text-red-300"
                            : level === "moderate"
                            ? "border-amber-500 bg-amber-500/15 text-amber-300"
                            : "border-primary bg-primary/15 text-primary"
                          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs font-semibold">{cfg.label}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">+{cfg.daysDelay}d queue</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Comparative Results & Visuals (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Impact KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] text-muted-foreground font-medium">Scenario Total Cost</span>
                <div className="text-lg font-bold mt-1 font-mono">${scenario.totalCost.toLocaleString()}</div>
                <div className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${totalCostDelta > 0 ? "text-red-400" : totalCostDelta < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {totalCostDelta > 0 ? <TrendingUp className="h-3 w-3" /> : totalCostDelta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                  <span>{totalCostDelta >= 0 ? `+$${totalCostDelta.toLocaleString()}` : `-$${Math.abs(totalCostDelta).toLocaleString()}`} ({totalCostDeltaPercent > 0 ? `+${totalCostDeltaPercent}%` : `${totalCostDeltaPercent}%`})</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] text-muted-foreground font-medium">Freight Rate / MT</span>
                <div className="text-lg font-bold mt-1 font-mono">${scenario.unitCost.toFixed(2)}</div>
                <div className={`text-[11px] font-medium mt-0.5 ${unitCostDelta > 0 ? "text-red-400" : unitCostDelta < 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
                  <span>{unitCostDelta >= 0 ? `+$${unitCostDelta.toFixed(2)}` : `-$${Math.abs(unitCostDelta).toFixed(2)}`}/MT vs base</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] text-muted-foreground font-medium">Total Execution Days</span>
                <div className="text-lg font-bold mt-1 font-mono">{scenario.totalDays}d</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{daysDelta > 0 ? `+${daysDelta}d delay` : "On schedule"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-3">
                <span className="text-[10px] text-muted-foreground font-medium">Scenario Risk Rating</span>
                <div className="mt-1.5">
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 font-bold ${riskRating.color}`}>
                    {riskRating.level}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground block mt-1.5">
                  {isDraftConstrained ? "Port limit breached" : congestionLevel === "severe" ? "Severe port delay" : "Operational tolerance OK"}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Side-by-Side Comparison Table */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Base Case vs. What-If Scenario Breakdown</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {voyagesNeeded} × {vesselSpec.name} ({cargoPerVoyage.toLocaleString()} MT/trip)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium">
                      <th className="py-2.5 px-4 text-left">Cost Component</th>
                      <th className="py-2.5 px-3 text-right">Base Case</th>
                      <th className="py-2.5 px-3 text-right">Scenario Case</th>
                      <th className="py-2.5 px-3 text-right">Variance ($)</th>
                      <th className="py-2.5 px-4 text-right">Variance (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 font-mono">
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-foreground flex items-center gap-1.5">
                        <Ship className="h-3.5 w-3.5 text-blue-400" />
                        Charter Hire / Freight
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">${base.hireCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">${scenario.hireCost.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 text-right ${scenario.hireCost >= base.hireCost ? "text-amber-400" : "text-emerald-400"}`}>
                        {scenario.hireCost >= base.hireCost ? `+$${(scenario.hireCost - base.hireCost).toLocaleString()}` : `-$${(base.hireCost - scenario.hireCost).toLocaleString()}`}
                      </td>
                      <td className="py-2.5 px-4 text-right">{freightRateShift > 0 ? `+${freightRateShift}%` : `${freightRateShift}%`}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-foreground flex items-center gap-1.5">
                        <Fuel className="h-3.5 w-3.5 text-amber-400" />
                        Bunker Fuel ({scenarioBunkerPrice}/MT)
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">${base.bunkerCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">${scenario.bunkerCost.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 text-right ${scenario.bunkerCost >= base.bunkerCost ? "text-amber-400" : "text-emerald-400"}`}>
                        {scenario.bunkerCost >= base.bunkerCost ? `+$${(scenario.bunkerCost - base.bunkerCost).toLocaleString()}` : `-$${(base.bunkerCost - scenario.bunkerCost).toLocaleString()}`}
                      </td>
                      <td className="py-2.5 px-4 text-right">{bunkerCostShift > 0 ? `+${bunkerCostShift}%` : `${bunkerCostShift}%`}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-foreground flex items-center gap-1.5">
                        <Anchor className="h-3.5 w-3.5 text-purple-400" />
                        Port & Demurrage ({congestionSpec.daysDelay}d)
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">${base.portCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">${scenario.portCost.toLocaleString()}</td>
                      <td className={`py-2.5 px-3 text-right ${scenario.portCost >= base.portCost ? "text-amber-400" : "text-emerald-400"}`}>
                        {scenario.portCost >= base.portCost ? `+$${(scenario.portCost - base.portCost).toLocaleString()}` : `-$${(base.portCost - scenario.portCost).toLocaleString()}`}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {Math.round(((scenario.portCost - base.portCost) / base.portCost) * 100)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-sans font-medium text-foreground flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-cyan-400" />
                        Operating & Canal Overhead
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">${base.operatingCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">${scenario.operatingCost.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">$0</td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">0%</td>
                    </tr>
                    <tr className="bg-muted/30 font-bold">
                      <td className="py-3 px-4 font-sans text-foreground">Total Voyage Cost</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">${base.totalCost.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-primary text-sm">${scenario.totalCost.toLocaleString()}</td>
                      <td className={`py-3 px-3 text-right ${totalCostDelta >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {totalCostDelta >= 0 ? `+$${totalCostDelta.toLocaleString()}` : `-$${Math.abs(totalCostDelta).toLocaleString()}`}
                      </td>
                      <td className={`py-3 px-4 text-right ${totalCostDeltaPercent >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {totalCostDeltaPercent > 0 ? `+${totalCostDeltaPercent}%` : `${totalCostDeltaPercent}%`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SVG Comparative Chart */}
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center justify-between">
                <span>Cost Component Comparison</span>
                <div className="flex items-center gap-3 text-[10px] font-normal">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm inline-block" />
                    Base Case
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-sm inline-block" />
                    Scenario Case
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3 font-mono text-xs">
                {/* Bar 1: Freight Hire */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-sans">
                    <span className="text-muted-foreground">Charter Hire</span>
                    <span>Base: ${base.hireCost.toLocaleString()} | Scenario: ${scenario.hireCost.toLocaleString()}</span>
                  </div>
                  <div className="h-5 w-full bg-muted/30 rounded flex overflow-hidden gap-1 p-0.5">
                    <div
                      className="h-full bg-blue-500/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (base.hireCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Base Hire: $${base.hireCost.toLocaleString()}`}
                    />
                    <div
                      className="h-full bg-amber-400/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (scenario.hireCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Scenario Hire: $${scenario.hireCost.toLocaleString()}`}
                    />
                  </div>
                </div>

                {/* Bar 2: Bunker Fuel */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-sans">
                    <span className="text-muted-foreground">Bunker Fuel</span>
                    <span>Base: ${base.bunkerCost.toLocaleString()} | Scenario: ${scenario.bunkerCost.toLocaleString()}</span>
                  </div>
                  <div className="h-5 w-full bg-muted/30 rounded flex overflow-hidden gap-1 p-0.5">
                    <div
                      className="h-full bg-blue-500/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (base.bunkerCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Base Bunker: $${base.bunkerCost.toLocaleString()}`}
                    />
                    <div
                      className="h-full bg-amber-400/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (scenario.bunkerCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Scenario Bunker: $${scenario.bunkerCost.toLocaleString()}`}
                    />
                  </div>
                </div>

                {/* Bar 3: Port & Demurrage */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-sans">
                    <span className="text-muted-foreground">Port & Demurrage</span>
                    <span>Base: ${base.portCost.toLocaleString()} | Scenario: ${scenario.portCost.toLocaleString()}</span>
                  </div>
                  <div className="h-5 w-full bg-muted/30 rounded flex overflow-hidden gap-1 p-0.5">
                    <div
                      className="h-full bg-blue-500/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (base.portCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Base Port: $${base.portCost.toLocaleString()}`}
                    />
                    <div
                      className="h-full bg-amber-400/80 rounded-sm transition-all duration-500"
                      style={{ width: `${Math.min(100, (scenario.portCost / Math.max(scenario.totalCost, base.totalCost)) * 100)}%` }}
                      title={`Scenario Port: $${scenario.portCost.toLocaleString()}`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actionable Strategic Recommendation Box */}
          <div className="p-4 rounded-lg border border-primary/40 bg-primary/10 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-primary">{recommendation.title}</h4>
                <Badge variant="outline" className="text-[10px] bg-primary/20 text-primary border-primary/30">
                  {recommendation.urgency}
                </Badge>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {recommendation.action}
              </p>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1.5">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Deterministic Engine
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-blue-400" />
                  Vessel Compatibility Checked
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
