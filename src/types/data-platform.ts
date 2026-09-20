// ============================================================
// FreightIQ — Phase 12: Data Intelligence, Data Pipeline &
// Real-World Data Readiness Types
// ============================================================

import type { VesselClass, CongestionLevel } from "@/types";

// ---- Provider Mode ----

export type DataProviderMode = "demo" | "real";

// ---- Data Status ----

export type DataStatus = "LIVE" | "HISTORICAL" | "FORECAST" | "SIMULATED" | "ASSUMED";

// ---- Freshness ----

export type FreshnessLevel = "FRESH" | "AGING" | "STALE";

export interface FreshnessConfig {
  freshThresholdHours: number;
  agingThresholdHours: number;
  staleThresholdHours: number;
}

// ---- Data Source Metadata ----

export interface DataSourceMetadata {
  source: string;
  sourceType: "demo" | "real" | "historical";
  retrievedAt: string;
  effectiveAt: string;
  dataStatus: DataStatus;
  recordCount: number;
  qualityScore: number;
}

// ---- Provider Interface ----

export interface DataProvider {
  name: string;
  mode: DataProviderMode;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR" | "DEMO";
  lastUpdated: string;
  recordCount: number;
}

// ---- Freight Data ----

export interface FreightDataRecord {
  id: string;
  date: string;
  routeId: string;
  originPortId: string;
  destinationPortId: string;
  vesselClass: VesselClass;
  ratePerTonne: number;
  tcePerDay: number;
  currency: string;
  unit: string;
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Vessel Data ----

export interface VesselDataRecord {
  vesselId: string;
  vesselName: string;
  vesselClass: VesselClass;
  dwt: number;
  draft: number;
  loa: number;
  beam: number;
  currentLat: number;
  currentLon: number;
  currentPortId?: string;
  availability: "available" | "in_voyage" | "maintenance";
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Port Data ----

export interface PortDataRecord {
  portId: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  maxDraft: number;
  maxLOA: number;
  maxBeam: number;
  handlingRate: number;
  berthCount: number;
  congestionLevel: CongestionLevel;
  congestionIndex: number;
  avgTurnaroundDays: number;
  vesselClasses: VesselClass[];
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Commodity Data ----

export interface CommodityDataRecord {
  commodity: string;
  price: number;
  unit: string;
  currency: string;
  date: string;
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Fuel Data ----

export interface FuelDataRecord {
  fuelType: string;
  price: number;
  unit: string;
  currency: string;
  location: string;
  date: string;
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Economic Data ----

export interface EconomicDataRecord {
  indicator: string;
  value: number;
  unit: string;
  date: string;
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Disruption Data ----

export interface DisruptionDataRecord {
  id: string;
  type: "weather" | "port_disruption" | "canal_disruption" | "geopolitical" | "strike" | "infrastructure";
  title: string;
  location: { lat: number; lon: number; portId?: string };
  severity: "info" | "warning" | "critical";
  startDate: string;
  endDate: string;
  estimatedDelayDays: number;
  estimatedCostImpact: number;
  affectedRoutes: string[];
  status: "active" | "monitoring" | "resolved";
  source: string;
  metadata: DataSourceMetadata;
}

// ---- Validation ----

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number;
}

export interface ValidationError {
  field: string;
  value: unknown;
  reason: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  field: string;
  value: unknown;
  reason: string;
}

// ---- Data Quality ----

export interface DataQualityReport {
  overallScore: number;
  overallLevel: "HIGH" | "MEDIUM" | "LOW";
  categoryScores: DataQualityCategoryScore[];
  generatedAt: string;
}

export interface DataQualityCategoryScore {
  category: string;
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  recordCount: number;
  missingCount: number;
  duplicateCount: number;
  invalidCount: number;
  staleCount: number;
  explanation: string;
}

// ---- Ingestion ----

export interface IngestionJob {
  id: string;
  provider: string;
  category: string;
  status: "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsAccepted: number;
  recordsRejected: number;
  durationMs: number;
  errors: string[];
}

// ---- Unit Normalization ----

export type CanonicalUnit = "MT" | "USD_per_MT" | "NM" | "knots" | "metres" | "days";

// ---- Currency ----

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  date: string;
  source: string;
}

// ---- Data Platform Config ----

export interface DataPlatformConfig {
  mode: DataProviderMode;
  freshness: FreshnessConfig;
  currencies: CurrencyRate[];
  validation: {
    maxFreightRate: number;
    minFreightRate: number;
    maxLatitude: number;
    minLatitude: number;
    maxLongitude: number;
    minLongitude: number;
    maxDraft: number;
    maxDWT: number;
  };
}
