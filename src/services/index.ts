import type {
  Port,
  Vessel,
  Cargo,
  Route,
  FreightRate,
  MarketIndicator,
  Forecast,
  Recommendation,
  RiskEvent,
  DashboardKPI,
  ApiResponse,
} from "@/types";
import { allPorts } from "@/data/seed/ports";
import { sampleVessels } from "@/data/seed/vessels";
import { sampleRoutes, sampleFreightRates, sampleMarketIndicators } from "@/data/seed/freight-rates";

// ---- Ports ----

export async function getPorts(): Promise<ApiResponse<Port[]>> {
  return { data: allPorts, success: true, timestamp: new Date().toISOString() };
}

export async function getPortById(id: string): Promise<ApiResponse<Port | null>> {
  const port = allPorts.find((p) => p.id === id) ?? null;
  return { data: port, success: !!port, timestamp: new Date().toISOString() };
}

export async function getDestinationPorts(): Promise<ApiResponse<Port[]>> {
  return { data: allPorts.filter((p) => p.isDestination), success: true, timestamp: new Date().toISOString() };
}

export async function getOriginPorts(): Promise<ApiResponse<Port[]>> {
  return { data: allPorts.filter((p) => !p.isDestination), success: true, timestamp: new Date().toISOString() };
}

// ---- Vessels ----

export async function getVessels(): Promise<ApiResponse<Vessel[]>> {
  return { data: sampleVessels, success: true, timestamp: new Date().toISOString() };
}

export async function getVesselById(id: string): Promise<ApiResponse<Vessel | null>> {
  const vessel = sampleVessels.find((v) => v.id === id) ?? null;
  return { data: vessel, success: !!vessel, timestamp: new Date().toISOString() };
}

export async function getIdleVessels(): Promise<ApiResponse<Vessel[]>> {
  return { data: sampleVessels.filter((v) => v.status === "idle"), success: true, timestamp: new Date().toISOString() };
}

// ---- Routes ----

export async function getRoutes(): Promise<ApiResponse<Route[]>> {
  return { data: sampleRoutes, success: true, timestamp: new Date().toISOString() };
}

// ---- Freight Rates ----

export async function getFreightRates(): Promise<ApiResponse<FreightRate[]>> {
  return { data: sampleFreightRates, success: true, timestamp: new Date().toISOString() };
}

export async function getFreightRatesByRoute(routeId: string): Promise<ApiResponse<FreightRate[]>> {
  return { data: sampleFreightRates.filter((r) => r.routeId === routeId), success: true, timestamp: new Date().toISOString() };
}

export async function getLatestRates(): Promise<ApiResponse<FreightRate[]>> {
  const latestDate = sampleFreightRates.reduce((max, r) => (r.date > max ? r.date : max), "");
  return { data: sampleFreightRates.filter((r) => r.date === latestDate), success: true, timestamp: new Date().toISOString() };
}

// ---- Market Indicators ----

export async function getMarketIndicators(): Promise<ApiResponse<MarketIndicator[]>> {
  return { data: sampleMarketIndicators, success: true, timestamp: new Date().toISOString() };
}

// ---- Forecasts (placeholder) ----

export async function getForecasts(): Promise<ApiResponse<Forecast[]>> {
  return { data: [], success: true, timestamp: new Date().toISOString() };
}

// ---- Recommendations (placeholder) ----

export async function getRecommendations(): Promise<ApiResponse<Recommendation[]>> {
  // Demo recommendations
  const demo: Recommendation[] = [
    {
      id: "rec-001",
      type: "charter",
      title: "Charter MV Iron Horizon for Iron Ore Shipment",
      description: "Supramax vessel idle at Singapore with competitive daily rate. Optimal for Visakhapatnam iron ore route.",
      confidence: 0.87,
      riskLevel: "low",
      estimatedSavings: 45000,
      validUntil: "2026-09-20",
      createdAt: "2026-08-31",
      reasoning: ["Vessel available within 15 days", "Rate 12% below 30-day average", "Port congestion at destination is low"],
      factors: ["Market trend: Supramax rates rising", "Bunker prices declining", "Iron ore demand steady"],
    },
    {
      id: "rec-002",
      type: "wait",
      title: "Wait 5-7 Days for Capesize Rate Correction",
      description: "Capesize rates peaked 3 days ago. Historical pattern suggests 8-10% correction expected.",
      confidence: 0.72,
      riskLevel: "medium",
      estimatedSavings: 78000,
      validUntil: "2026-09-10",
      createdAt: "2026-08-31",
      reasoning: ["BDI Capesize sub-index shows mean-reversion pattern", "Seasonal trend supports late-September softening", "3 active vessels in region may add supply"],
      factors: ["Weather: No disruptions forecasted", "Australian iron ore exports stable", "Chinese port inventory rising"],
    },
    {
      id: "rec-003",
      type: "split_cargo",
      title: "Split Coal Shipment Across Two Handysize Vessels",
      description: "Port congestion at Haldia may delay single Panamax. Two Handysize vessels reduce turnaround risk.",
      confidence: 0.79,
      riskLevel: "low",
      estimatedSavings: 22000,
      validUntil: "2026-09-05",
      createdAt: "2026-08-31",
      reasoning: ["Haldia berth occupancy at 82%", "Handysize rates favorable this week", "Faster loading per vessel"],
      factors: ["Coal buyer flexible on partial deliveries", "Weather window favorable", "Pilot availability confirmed"],
    },
  ];
  return { data: demo, success: true, timestamp: new Date().toISOString() };
}

// ---- Risks (placeholder) ----

export async function getRisks(): Promise<ApiResponse<RiskEvent[]>> {
  const demo: RiskEvent[] = [
    { id: "risk-001", title: "Cyclone Warning — Bay of Bengal", description: "Tropical cyclone forming in Bay of Bengal, expected to intensify. May affect Paradip and Dhamra ports.", severity: "warning", category: "weather", affectedEntities: ["port-paradip", "port-dhamra"], latitude: 16.5, longitude: 88.0, radiusNm: 300, startedAt: "2026-08-30", estimatedEndAt: "2026-09-03", source: "IMD India", active: true },
    { id: "risk-002", title: "Port Congestion Alert — Sagar/Sandheads", description: "Vessel queue at Sagar/Sandheads has increased to 12 vessels. Average waiting time: 3.2 days.", severity: "warning", category: "port_disruption", affectedEntities: ["port-sagar"], startedAt: "2026-08-28", source: "Port Authority", active: true },
    { id: "risk-003", title: "Bunker Price Volatility", description: "VLSFO prices swung ±5% this week due to Middle East supply concerns. Hedge recommended for large shipments.", severity: "info", category: "market", affectedEntities: [], startedAt: "2026-08-29", source: "Platts", active: true },
  ];
  return { data: demo, success: true, timestamp: new Date().toISOString() };
}

// ---- Dashboard KPIs ----

export async function getDashboardKPIs(): Promise<ApiResponse<DashboardKPI[]>> {
  return {
    data: [
      { label: "Active Voyages", value: 12, change: 2, changeLabel: "vs last month", trend: "rising" },
      { label: "Avg Freight Rate", value: "$14.20", change: 0.85, changeLabel: "vs prev week", trend: "rising" },
      { label: "Idle Fleet", value: 3, change: -1, changeLabel: "vessels", trend: "falling" },
      { label: "Port Congestion", value: "Moderate", change: 0, changeLabel: "no change", trend: "stable" },
      { label: "Forecast Accuracy", value: "87%", change: 3, changeLabel: "percentage points", trend: "rising" },
      { label: "Monthly Savings", value: "$145K", change: 12, changeLabel: "vs last month", trend: "rising" },
    ],
    success: true,
    timestamp: new Date().toISOString(),
  };
}
