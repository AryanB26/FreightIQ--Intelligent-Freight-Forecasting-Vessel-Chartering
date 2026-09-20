// ============================================================
// FreightIQ — Domain Type Definitions
// ============================================================

// ---- Enums & Literals ----

export type VesselClass = "Handysize" | "Supramax" | "Panamax" | "Capesize";

export type VesselStatus = "active" | "idle" | "chartered" | "under_maintenance" | "off_hire";

export type CargoType = "dry_bulk" | "liquid_bulk" | "break_bulk" | "container";

export type CommodityCategory =
  | "iron_ore"
  | "coal"
  | "grain"
  | "fertilizer"
  | "bauxite"
  | "manganese"
  | "steel"
  | "cement"
  | "petcoke"
  | "sugar"
  | "other";

export type ForecastHorizon = "short_term" | "medium_term" | "long_term";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type MarketTrend = "rising" | "falling" | "stable" | "volatile";

export type RecommendationType = "charter" | "wait" | "divert" | "hedge" | "split_cargo";

export type AlertSeverity = "info" | "warning" | "critical";

export type CongestionLevel = "low" | "moderate" | "high" | "severe";

// ---- Core Entities ----

export interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  /** Indian East Coast ports marked true */
  isDestination: boolean;
  maxLOA: number;       // metres
  maxBeam: number;      // metres
  maxDraft: number;     // metres
  cargoHandlingRate: number; // tonnes/hour
  berthCount: number;
  avgTurnaroundDays: number;
  congestionLevel: CongestionLevel;
  timezone: string;
  /** Acceptable vessel classes at this port */
  vesselClasses: VesselClass[];
}

export interface VesselType {
  id: string;
  name: string;
  vesselClass: VesselClass;
  dwtRange: [number, number];     // deadweight tonnage range
  avgSpeed: number;               // knots
  fuelConsumption: number;        // tonnes/day at laden speed
  typicalLOA: number;             // metres
  typicalBeam: number;
  typicalDraft: number;
}

export interface Vessel {
  id: string;
  name: string;
  imoNumber: string;
  vesselTypeId: string;
  vesselClass: VesselClass;
  dwt: number;                    // actual deadweight
  loa: number;
  beam: number;
  draft: number;
  buildYear: number;
  flag: string;
  status: VesselStatus;
  currentLat?: number;
  currentLon?: number;
  currentPortId?: string;
  /** Daily hire rate in USD */
  dailyHireRate: number;
  /** Operating cost per day in USD */
  dailyOperatingCost: number;
  lastDryDock?: string;           // ISO date
  nextAvailableDate?: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: CommodityCategory;
  /** Density in t/m³ */
  density: number;
  /** Typical cargo size range in tonnes */
  typicalCargoRange: [number, number];
  /** Stowage factor */
  stowageFactor: number;
}

export interface Cargo {
  id: string;
  commodityId: string;
  commodity?: Commodity;
  originPortId: string;
  originPort?: Port;
  destinationPortId: string;
  destinationPort?: Port;
  quantityTonnes: number;
  cargoType: CargoType;
  /** Required vessel class */
  requiredVesselClass: VesselClass;
  /** Target delivery date (ISO) */
  targetDeliveryDate: string;
  /** Required loading rate in tonnes/hour */
  requiredLoadingRate?: number;
}

export interface Route {
  id: string;
  originPortId: string;
  originPort?: Port;
  destinationPortId: string;
  destinationPort?: Port;
  /** Great-circle distance in nautical miles */
  distanceNm: number;
  /** Estimated sea days at avg speed */
  estimatedSeaDays: number;
  /** Suez Canal / other transit fees */
  canalFees?: number;
  /** Bunker cost estimate at current prices */
  bunkerCostEstimate: number;
}

export interface FreightRate {
  id: string;
  routeId: string;
  route?: Route;
  vesselClass: VesselClass;
  /** Date of observation */
  date: string;
  /** Rate in USD per tonne */
  ratePerTonne: number;
  /** Time charter equivalent in USD/day */
  tcePerDay: number;
  source: string;
}

export interface MarketIndicator {
  id: string;
  name: string;
  category: "bunker" | "currency" | "index" | "commodity" | "geopolitical";
  value: number;
  unit: string;
  change: number;           // absolute change
  changePercent: number;
  lastUpdated: string;
  trend: MarketTrend;
}

export interface PortCongestion {
  id: string;
  portId: string;
  port?: Port;
  date: string;
  waitingTimeDays: number;
  berthOccupancy: number;   // percentage
  vesselQueueLength: number;
  congestionLevel: CongestionLevel;
}

// ---- Forecast & Recommendation ----

export interface Forecast {
  id: string;
  routeId: string;
  route?: Route;
  vesselClass: VesselClass;
  horizon: ForecastHorizon;
  /** Forecast generated date */
  generatedAt: string;
  /** Target date for prediction */
  targetDate: string;
  predictedRate: number;
  confidenceLower: number;
  confidenceUpper: number;
  confidenceLevel: number;  // e.g. 0.80, 0.95
  /** 0-100 score */
  accuracy: number;
  methodology: string;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  cargoId?: string;
  cargo?: Cargo;
  routeId?: string;
  route?: Route;
  vesselId?: string;
  vessel?: Vessel;
  /** Human-readable title */
  title: string;
  description: string;
  /** Confidence score 0-1 */
  confidence: number;
  riskLevel: RiskLevel;
  /** Financial impact estimate in USD */
  estimatedSavings?: number;
  estimatedCost?: number;
  /** Recommended action deadline */
  validUntil: string;
  createdAt: string;
  reasoning: string[];
  factors: string[];
}

export interface RiskEvent {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: "weather" | "geopolitical" | "port_disruption" | "market" | "regulatory" | "vessel";
  /** Affected routes, ports, or vessels */
  affectedEntities: string[];
  latitude?: number;
  longitude?: number;
  radiusNm?: number;
  startedAt: string;
  estimatedEndAt?: string;
  source: string;
  active: boolean;
}

export interface Voyage {
  id: string;
  cargoId: string;
  cargo?: Cargo;
  vesselId: string;
  vessel?: Vessel;
  routeId: string;
  route?: Route;
  status: "planned" | "loading" | "in_transit" | "discharging" | "completed" | "delayed";
  departureDate?: string;
  arrivalDate?: string;
  /** Actual cost breakdown */
  totalCost?: number;
  freightRevenue?: number;
  pnl?: number;
  notes?: string;
}

// ---- Scenario & Analysis ----

export interface ScenarioParameter {
  id: string;
  name: string;
  description: string;
  type: "number" | "range" | "select";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  defaultValue: number | string;
}

export interface ScenarioResult {
  id: string;
  scenarioName: string;
  parameters: Record<string, number | string>;
  predictedCost: number;
  predictedSavings: number;
  riskScore: number;
  recommendation: string;
  generatedAt: string;
}

export interface HistoricalDataPoint {
  date: string;
  ratePerTonne: number;
  tcePerDay: number;
  volume?: number;
}

// ---- API Response Wrappers ----

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

// ---- Dashboard ----

export interface DashboardKPI {
  label: string;
  value: string | number;
  unit?: string;
  change: number;
  changeLabel: string;
  trend: MarketTrend;
}

export interface DashboardAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  read: boolean;
}
