// ============================================================
// FreightIQ — Dashboard Seed Data (Phase 2)
// ============================================================

// ---- Market Overview ----

export interface MarketOverview {
  status: "bullish" | "bearish" | "neutral";
  statusLabel: string;
  freightTrend: "rising" | "falling" | "stable";
  trendDescription: string;
  volatility: "low" | "moderate" | "high";
  volatilityPercent: number;
  activeRoutes: number;
  congestionAlerts: number;
  forecastConfidence: number; // 0-100
  lastUpdated: string;
}

export const marketOverview: MarketOverview = {
  status: "bullish",
  statusLabel: "Market Bullish — Rates Rising",
  freightTrend: "rising",
  trendDescription: "BDI up 4.2% week-over-week. Supramax and Panamax leading gains on Australia-India iron ore and coal routes. Capesize stabilizing after last week's correction.",
  volatility: "moderate",
  volatilityPercent: 14.3,
  activeRoutes: 24,
  congestionAlerts: 3,
  forecastConfidence: 82,
  lastUpdated: new Date().toISOString(),
};

// ---- KPI Data ----

export interface DashboardKPIItem {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  change: number;
  changeLabel: string;
  trend: "rising" | "falling" | "stable" | "volatile";
  sparkline?: number[];
}

export const dashboardKPIs: DashboardKPIItem[] = [
  {
    id: "kpi-avg-rate",
    label: "Avg Freight Rate",
    value: "$14.20",
    subValue: "/tonne",
    change: 0.85,
    changeLabel: "vs prev week",
    trend: "rising",
    sparkline: [11.2, 11.5, 12.1, 11.8, 12.5, 13.0, 13.4, 13.8, 14.2],
  },
  {
    id: "kpi-7d-change",
    label: "7-Day Change",
    value: "+6.2%",
    change: 2.1,
    changeLabel: "accelerating",
    trend: "rising",
  },
  {
    id: "kpi-30d-forecast",
    label: "30-Day Forecast",
    value: "$15.10",
    subValue: "/tonne",
    change: 6.3,
    changeLabel: "confidence 78%",
    trend: "rising",
  },
  {
    id: "kpi-volatility",
    label: "Market Volatility",
    value: "14.3%",
    subValue: "30d IV",
    change: -1.2,
    changeLabel: "vs prev month",
    trend: "falling",
  },
  {
    id: "kpi-congestion",
    label: "Port Congestion",
    value: "Moderate",
    change: 1,
    changeLabel: "alerts active",
    trend: "stable",
  },
  {
    id: "kpi-charter-window",
    label: "Charter Window",
    value: "5–7 days",
    subValue: "optimal entry",
    change: 0,
    changeLabel: "favorable",
    trend: "rising",
  },
];

// ---- Route Intelligence ----

export interface RouteIntelligenceRow {
  id: string;
  origin: string;
  originCode: string;
  destination: string;
  destCode: string;
  vesselType: string;
  currentFreight: number;
  forecastFreight: number;
  change7d: number;
  forecast30d: number;
  congestion: "low" | "moderate" | "high";
  recommendation: "charter_now" | "wait" | "hedge" | "urgent";
  recommendationLabel: string;
}

export const routeIntelligence: RouteIntelligenceRow[] = [
  {
    id: "ri-001",
    origin: "Australia",
    originCode: "AU",
    destination: "Paradip",
    destCode: "IN-PAR",
    vesselType: "Capesize",
    currentFreight: 9.2,
    forecastFreight: 9.8,
    change7d: 3.4,
    forecast30d: 10.1,
    congestion: "moderate",
    recommendation: "charter_now",
    recommendationLabel: "Charter Now",
  },
  {
    id: "ri-002",
    origin: "Australia",
    originCode: "AU",
    destination: "Visakhapatnam",
    destCode: "IN-VIZ",
    vesselType: "Supramax",
    currentFreight: 11.5,
    forecastFreight: 12.0,
    change7d: 4.1,
    forecast30d: 12.3,
    congestion: "low",
    recommendation: "charter_now",
    recommendationLabel: "Charter Now",
  },
  {
    id: "ri-003",
    origin: "Indonesia",
    originCode: "ID",
    destination: "Paradip",
    destCode: "IN-PAR",
    vesselType: "Handysize",
    currentFreight: 10.2,
    forecastFreight: 9.8,
    change7d: -2.1,
    forecast30d: 9.5,
    congestion: "moderate",
    recommendation: "wait",
    recommendationLabel: "Wait",
  },
  {
    id: "ri-004",
    origin: "Indonesia",
    originCode: "ID",
    destination: "Dhamra",
    destCode: "IN-DHR",
    vesselType: "Supramax",
    currentFreight: 9.8,
    forecastFreight: 10.2,
    change7d: 1.5,
    forecast30d: 10.5,
    congestion: "moderate",
    recommendation: "charter_now",
    recommendationLabel: "Charter Now",
  },
  {
    id: "ri-005",
    origin: "United States",
    originCode: "US",
    destination: "East Coast India",
    destCode: "IN-ECoI",
    vesselType: "Panamax",
    currentFreight: 20.5,
    forecastFreight: 19.2,
    change7d: -3.8,
    forecast30d: 18.5,
    congestion: "low",
    recommendation: "wait",
    recommendationLabel: "Wait",
  },
  {
    id: "ri-006",
    origin: "Mozambique",
    originCode: "MZ",
    destination: "East Coast India",
    destCode: "IN-ECoI",
    vesselType: "Handysize",
    currentFreight: 14.1,
    forecastFreight: 14.8,
    change7d: 2.3,
    forecast30d: 15.2,
    congestion: "low",
    recommendation: "hedge",
    recommendationLabel: "Hedge",
  },
];

// ---- Market Opportunities ----

export interface MarketOpportunity {
  id: string;
  type: "favorable_entry" | "rising_freight" | "declining_freight" | "high_volatility" | "congestion_risk";
  typeLabel: string;
  title: string;
  description: string;
  route?: string;
  vesselClass?: string;
  potentialSaving?: number;
  urgency: "high" | "medium" | "low";
}

export const marketOpportunities: MarketOpportunity[] = [
  {
    id: "opp-001",
    type: "favorable_entry",
    typeLabel: "Favorable Entry",
    title: "Supramax charter window — Australia to Vizag",
    description: "Supramax rates on AU→VIZ are 8% below 30-day average. Market indicators suggest rates will rise 5-7% in the next 10 days as Australian iron ore exports peak. Charter now to lock in favorable rates.",
    route: "AU → Visakhapatnam",
    vesselClass: "Supramax",
    potentialSaving: 42000,
    urgency: "high",
  },
  {
    id: "opp-002",
    type: "rising_freight",
    typeLabel: "Freight Rising",
    title: "Panamax rates expected to increase on US→ECoI",
    description: "US grain export season starting in 2 weeks. Historical pattern shows 12-18% rate increase on US Gulf routes. Current rates are at cycle low.",
    route: "US → East Coast India",
    vesselClass: "Panamax",
    urgency: "medium",
  },
  {
    id: "opp-003",
    type: "declining_freight",
    typeLabel: "Freight Declining",
    title: "Capesize correction expected — 7-10% drop",
    description: "Capesize BDI sub-index peaked 3 days ago. Mean-reversion model predicts 7-10% correction over next 14 days. Consider delaying Capesize charters.",
    vesselClass: "Capesize",
    urgency: "medium",
  },
  {
    id: "opp-004",
    type: "high_volatility",
    typeLabel: "High Volatility",
    title: "Handysize rates volatile on Indonesia routes",
    description: "Indonesian coal export policy uncertainty causing 18% rate swings. Consider fixed-rate contracts or hedging for ID→IN routes until policy clarifies.",
    route: "ID → East Coast India",
    vesselClass: "Handysize",
    urgency: "low",
  },
  {
    id: "opp-005",
    type: "congestion_risk",
    typeLabel: "Congestion Risk",
    title: "Sagar/Sandheads berth congestion rising",
    description: "Vessel queue increased to 12 ships. Average wait time 3.2 days. Divert to Dhamra (berths available, 18m draft) for time-sensitive cargo.",
    route: "→ Sagar/Sandheads",
    urgency: "high",
  },
];

// ---- Port Status ----

export interface PortStatusRow {
  id: string;
  name: string;
  code: string;
  congestion: "low" | "moderate" | "high" | "severe";
  congestionLabel: string;
  berthOccupancy: number; // 0-100
  draftLimit: number; // metres
  berthAvailable: number;
  totalBerths: number;
  turnaroundDays: number;
  maxVesselClass: string;
  lastUpdated: string;
}

export const portStatusData: PortStatusRow[] = [
  { id: "ps-001", name: "Paradip", code: "INPAR", congestion: "moderate", congestionLabel: "Moderate", berthOccupancy: 68, draftLimit: 16.5, berthAvailable: 4, totalBerths: 12, turnaroundDays: 3.5, maxVesselClass: "Capesize", lastUpdated: "2h ago" },
  { id: "ps-002", name: "Visakhapatnam", code: "INVIZ", congestion: "low", congestionLabel: "Low", berthOccupancy: 42, draftLimit: 17.5, berthAvailable: 14, totalBerths: 24, turnaroundDays: 2.8, maxVesselClass: "Capesize", lastUpdated: "1h ago" },
  { id: "ps-003", name: "Gangavaram", code: "INGGV", congestion: "low", congestionLabel: "Low", berthOccupancy: 35, draftLimit: 18.5, berthAvailable: 10, totalBerths: 16, turnaroundDays: 2.5, maxVesselClass: "Capesize", lastUpdated: "45m ago" },
  { id: "ps-004", name: "Gopalpur", code: "INGOP", congestion: "low", congestionLabel: "Low", berthOccupancy: 28, draftLimit: 12.5, berthAvailable: 4, totalBerths: 5, turnaroundDays: 2.0, maxVesselClass: "Supramax", lastUpdated: "3h ago" },
  { id: "ps-005", name: "Dhamra", code: "INDHR", congestion: "moderate", congestionLabel: "Moderate", berthOccupancy: 62, draftLimit: 18.0, berthAvailable: 3, totalBerths: 9, turnaroundDays: 2.2, maxVesselClass: "Capesize", lastUpdated: "1h ago" },
  { id: "ps-006", name: "Sagar/Sandheads", code: "INSAG", congestion: "high", congestionLabel: "High", berthOccupancy: 89, draftLimit: 14.0, berthAvailable: 2, totalBerths: 18, turnaroundDays: 3.0, maxVesselClass: "Panamax", lastUpdated: "30m ago" },
  { id: "ps-007", name: "Haldia", code: "INHAL", congestion: "moderate", congestionLabel: "Moderate", berthOccupancy: 72, draftLimit: 13.5, berthAvailable: 4, totalBerths: 14, turnaroundDays: 3.2, maxVesselClass: "Panamax", lastUpdated: "1h ago" },
];

// ---- Risk Summary ----

export interface RiskSummaryItem {
  id: string;
  category: "freight_volatility" | "congestion" | "weather" | "vessel_availability" | "geopolitical";
  categoryLabel: string;
  severity: "low" | "medium" | "high";
  title: string;
  detail: string;
  trend: "improving" | "worsening" | "stable";
}

export const riskSummaryData: RiskSummaryItem[] = [
  { id: "rs-001", category: "freight_volatility", categoryLabel: "Freight Volatility", severity: "medium", title: "Supramax 30d volatility elevated", detail: "14.3% implied volatility vs 11.2% average. Driven by Australian iron ore supply uncertainty.", trend: "worsening" },
  { id: "rs-002", category: "congestion", categoryLabel: "Congestion", severity: "high", title: "Sagar/Sandheads — 12 vessels queued", detail: "Berth occupancy 89%. Average wait 3.2 days. Monsoon-related draft restrictions in effect.", trend: "worsening" },
  { id: "rs-003", category: "weather", categoryLabel: "Weather", severity: "medium", title: "Cyclone warning — Bay of Bengal", detail: "IMD advisory: tropical cyclone forming. Expected to affect Paradip and Dhamra within 48-72 hours.", trend: "worsening" },
  { id: "rs-004", category: "vessel_availability", categoryLabel: "Vessel Availability", severity: "low", title: "Adequate Supramax supply", detail: "14 idle Supramax vessels in Asia-Pacific. 3 available within 7 days at competitive rates.", trend: "improving" },
  { id: "rs-005", category: "geopolitical", categoryLabel: "Geopolitical", severity: "low", title: "Route — no major disruptions", detail: "Suez Canal normal operations. No new sanctions affecting bulk carrier routes to India.", trend: "stable" },
];

// ---- Chart Data (historical + forecast) ----

export interface ChartDataPoint {
  date: string;
  historical: number | null;
  forecast: number | null;
  confidenceUpper: number | null;
  confidenceLower: number | null;
}

export function generateChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const baseRate = 11.8;
  const today = new Date();

  // 60 days historical
  for (let d = 59; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const noise = Math.sin(d * 0.15) * 0.6 + Math.cos(d * 0.08) * 0.3;
    const trend = (59 - d) * 0.04;
    const rate = Math.round((baseRate + trend + noise) * 100) / 100;
    data.push({
      date: date.toISOString().split("T")[0],
      historical: rate,
      forecast: null,
      confidenceUpper: null,
      confidenceLower: null,
    });
  }

  // 30 days forecast
  const lastHistorical = data[data.length - 1].historical!;
  for (let d = 1; d <= 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const trend = d * 0.03;
    const noise = Math.sin(d * 0.2) * 0.2;
    const forecast = Math.round((lastHistorical + trend + noise) * 100) / 100;
    const spread = d * 0.08;
    data.push({
      date: date.toISOString().split("T")[0],
      historical: null,
      forecast,
      confidenceUpper: Math.round((forecast + spread) * 100) / 100,
      confidenceLower: Math.round((forecast - spread) * 100) / 100,
    });
  }

  return data;
}
