// ============================================================
// FreightIQ — Phase 4: Freight Market Data & Analytics Types
// ============================================================

import type { VesselClass, CargoType, CongestionLevel } from "@/types";

// ---- Freight Observation (richer than basic FreightRate) ----

export interface FreightObservation {
  id: string;
  date: string;               // ISO date YYYY-MM-DD
  originPortId: string;
  destinationPortId: string;
  routeId: string;
  vesselClass: VesselClass;
  cargoType: CargoType;
  cargoQuantityTonnes: number;
  /** Rate in USD per tonne */
  ratePerTonne: number;
  /** Time charter equivalent in USD/day */
  tcePerDay: number;
  currency: string;
  source: string;
  quality: DataQuality;
}

export interface DataQuality {
  status: "verified" | "estimated" | "provisional" | "missing";
  confidence: number;         // 0-1
  isSynthetic: boolean;
  missingFields?: string[];
}

// ---- Route (extended) ----

export interface FreightRoute {
  id: string;
  originPortId: string;
  originPortName: string;
  originCountry: string;
  originLat: number;
  originLon: number;
  destinationPortId: string;
  destinationPortName: string;
  destinationCountry: string;
  destinationLat: number;
  destinationLon: number;
  distanceNm: number;
  typicalTransitDays: number;
  canalFees: number;
  vesselClasses: VesselClass[];
  isActive: boolean;
}

// ---- Port Congestion History ----

export interface PortCongestionObservation {
  id: string;
  portId: string;
  date: string;
  congestionIndex: number;     // 0-100
  congestionLevel: CongestionLevel;
  vesselQueueLength: number;
  estimatedWaitingDays: number;
  berthUtilization: number;    // percentage
  turnaroundDays: number;
  operationalStatus: "operational" | "restricted" | "closed";
}

// ---- Market Indicator History ----

export interface MarketIndicatorObservation {
  id: string;
  indicatorId: string;
  date: string;
  value: number;
  change: number;
  changePercent: number;
  source: string;
}

// ---- Analytics Results ----

export interface RouteAnalytics {
  routeId: string;
  routeLabel: string;
  vesselClass: string;
  currentRate: number;
  previousRate: number;
  change7d: number;
  change7dPercent: number;
  change30d: number;
  change30dPercent: number;
  change90d: number;
  change90dPercent: number;
  average90d: number;
  average30d: number;
  min90d: number;
  max90d: number;
  volatility: number;         // coefficient of variation * 100
  volatilityLevel: "low" | "moderate" | "high";
  trend: "rising" | "falling" | "stable";
  trendStrength: number;      // 0-100
  percentile: number;         // where current rate sits in 90d range (0-100)
  observationCount: number;
  dateRange: { from: string; to: string };
}

export interface RouteComparison {
  routes: RouteAnalytics[];
  relativeValue: number;      // cheapest vs most expensive
  spread: number;             // max - min current rate
}

export interface VesselClassComparison {
  vesselClasses: RouteAnalytics[];
  classSpread: number;
  cheapestClass: string;
  mostExpensiveClass: string;
}

// ---- Chart Data ----

export interface TimeSeriesPoint {
  date: string;
  value: number;
  movingAverage?: number;
  upperBand?: number;
  lowerBand?: number;
}

export interface MultiSeriesData {
  label: string;
  color: string;
  data: TimeSeriesPoint[];
}

// ---- Forecasting Interface (Phase 6) ----

export interface ForecastInput {
  routeId: string;
  vesselClass: VesselClass;
  historicalData: FreightObservation[];
  marketIndicators: MarketIndicatorObservation[];
  congestionData: PortCongestionObservation[];
  horizon: "30d" | "60d" | "90d" | "180d";
}

export interface ForecastOutput {
  generatedAt: string;
  routeId: string;
  vesselClass: VesselClass;
  horizon: string;
  /** Array of predicted rates by date */
  predictions: { date: string; predictedRate: number; confidenceLower: number; confidenceUpper: number }[];
  confidenceLevel: number;
  methodology: string;
  modelMetadata: Record<string, unknown>;
}

// ---- API Response Wrappers ----

export interface MarketDataResponse<T> {
  data: T;
  success: boolean;
  timestamp: string;
  meta?: {
    total: number;
    filtered: boolean;
    dateRange?: { from: string; to: string };
  };
}

// ---- Filter Parameters ----

export interface FreightFilter {
  originPortId?: string;
  destinationPortId?: string;
  routeId?: string;
  vesselClass?: VesselClass;
  cargoType?: CargoType;
  dateFrom?: string;
  dateTo?: string;
}
