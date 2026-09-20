// ============================================================
// FreightIQ — Market Analytics Service (Phase 4)
// Deterministic calculations — no LLM, no randomness.
// ============================================================

import type {
  FreightObservation,
  RouteAnalytics,
  RouteComparison,
  VesselClassComparison,
  TimeSeriesPoint,
  MultiSeriesData,
  FreightFilter,
  MarketIndicatorObservation,
} from "@/types/freight-market";
import type { VesselClass } from "@/types";

// ---- Core analytics calculation ----

export function calculateRouteAnalytics(
  observations: FreightObservation[],
  routeId: string,
  vesselClass: VesselClass,
  dateFrom?: string,
  dateTo?: string,
): RouteAnalytics | null {
  // Filter observations
  let filtered = observations.filter(
    (o) => o.routeId === routeId && o.vesselClass === vesselClass
  );

  if (dateFrom) filtered = filtered.filter((o) => o.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((o) => o.date <= dateTo);

  // Sort by date
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) return null;

  const rates = filtered.map((o) => o.ratePerTonne);
  const current = rates[rates.length - 1];
  const previous = rates.length > 1 ? rates[rates.length - 2] : current;

  // 7-day, 30-day, 90-day changes
  const change7d = getChangeOverDays(rates, 7);
  const change30d = getChangeOverDays(rates, 30);
  const change90d = getChangeOverDays(rates, 90);

  // Averages
  const last30 = rates.slice(-30);
  const last90 = rates.slice(-90);
  const avg30 = mean(last30);
  const avg90 = mean(last90);

  // Min/Max
  const min90 = Math.min(...last90);
  const max90 = Math.max(...last90);

  // Volatility (coefficient of variation of daily returns)
  const volatility = calculateVolatility(last90);

  // Volatility level
  let volatilityLevel: "low" | "moderate" | "high" = "low";
  if (volatility > 15) volatilityLevel = "high";
  else if (volatility > 8) volatilityLevel = "moderate";

  // Trend (linear regression slope direction)
  const { direction, strength } = calculateTrend(last30);

  // Percentile (where current sits in 90d range)
  const range = max90 - min90;
  const percentile = range > 0 ? Math.round(((current - min90) / range) * 100) : 50;

  return {
    routeId,
    routeLabel: `${filtered[0]?.originPortId ?? ""} → ${filtered[0]?.destinationPortId ?? ""}`,
    vesselClass,
    currentRate: round2(current),
    previousRate: round2(previous),
    change7d: round2(change7d.value),
    change7dPercent: round2(change7d.percent),
    change30d: round2(change30d.value),
    change30dPercent: round2(change30d.percent),
    change90d: round2(change90d.value),
    change90dPercent: round2(change90d.percent),
    average90d: round2(avg90),
    average30d: round2(avg30),
    min90d: round2(min90),
    max90d: round2(max90),
    volatility: round2(volatility),
    volatilityLevel,
    trend: direction,
    trendStrength: strength,
    percentile,
    observationCount: filtered.length,
    dateRange: {
      from: filtered[0].date,
      to: filtered[filtered.length - 1].date,
    },
  };
}

// ---- Route comparison ----

export function compareRoutes(
  observations: FreightObservation[],
  routeIds: string[],
  vesselClass: VesselClass,
  dateFrom?: string,
  dateTo?: string,
): RouteComparison {
  const analytics = routeIds
    .map((routeId) => calculateRouteAnalytics(observations, routeId, vesselClass, dateFrom, dateTo))
    .filter((a): a is RouteAnalytics => a !== null);

  const rates = analytics.map((a) => a.currentRate);
  const spread = rates.length > 0 ? Math.max(...rates) - Math.min(...rates) : 0;

  return {
    routes: analytics,
    relativeValue: rates.length > 1 ? Math.round((Math.min(...rates) / Math.max(...rates)) * 100) / 100 : 1,
    spread: round2(spread),
  };
}

// ---- Vessel class comparison ----

export function compareVesselClasses(
  observations: FreightObservation[],
  routeId: string,
  dateFrom?: string,
  dateTo?: string,
): VesselClassComparison {
  const classes: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
  const analytics = classes
    .map((vc) => calculateRouteAnalytics(observations, routeId, vc, dateFrom, dateTo))
    .filter((a): a is RouteAnalytics => a !== null);

  const rates = analytics.map((a) => ({ class: a.vesselClass, rate: a.currentRate }));
  const cheapest = rates.length > 0 ? rates.reduce((min, r) => (r.rate < min.rate ? r : min)).class : "";
  const expensive = rates.length > 0 ? rates.reduce((max, r) => (r.rate > max.rate ? r : max)).class : "";
  const classSpread = rates.length > 1
    ? Math.max(...rates.map((r) => r.rate)) - Math.min(...rates.map((r) => r.rate))
    : 0;

  return {
    vesselClasses: analytics,
    classSpread: round2(classSpread),
    cheapestClass: cheapest,
    mostExpensiveClass: expensive,
  };
}

// ---- Time series for charts ----

export function getTimeSeries(
  observations: FreightObservation[],
  routeId: string,
  vesselClass: VesselClass,
  dateFrom?: string,
  dateTo?: string,
  includeMovingAverage: boolean = true,
  maWindow: number = 7,
): TimeSeriesPoint[] {
  let filtered = observations.filter(
    (o) => o.routeId === routeId && o.vesselClass === vesselClass
  );
  if (dateFrom) filtered = filtered.filter((o) => o.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((o) => o.date <= dateTo);

  filtered.sort((a, b) => a.date.localeCompare(b.date));

  const points: TimeSeriesPoint[] = filtered.map((o, i) => {
    const point: TimeSeriesPoint = { date: o.date, value: o.ratePerTonne };

    if (includeMovingAverage && i >= maWindow - 1) {
      const window = filtered.slice(i - maWindow + 1, i + 1).map((f) => f.ratePerTonne);
      point.movingAverage = round2(mean(window));
    }

    return point;
  });

  // Add volatility bands around moving average
  if (includeMovingAverage) {
    for (let i = maWindow - 1; i < points.length; i++) {
      const window = points.slice(i - maWindow + 1, i + 1).map((p) => p.value);
      const std = standardDeviation(window);
      points[i].upperBand = round2((points[i].movingAverage ?? points[i].value) + std);
      points[i].lowerBand = round2((points[i].movingAverage ?? points[i].value) - std);
    }
  }

  return points;
}

// ---- Multi-series data for vessel class comparison ----

export function getVesselClassTimeSeries(
  observations: FreightObservation[],
  routeId: string,
  dateFrom?: string,
  dateTo?: string,
): MultiSeriesData[] {
  const colors: Record<VesselClass, string> = {
    Handysize: "#3B82F6",
    Supramax: "#10B981",
    Panamax: "#F59E0B",
    Capesize: "#EF4444",
  };

  const classes: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];

  const series: MultiSeriesData[] = [];
  for (const vc of classes) {
    const ts = getTimeSeries(observations, routeId, vc, dateFrom, dateTo, true, 7);
    if (ts.length > 0) {
      series.push({ label: vc, color: colors[vc], data: ts });
    }
  }
  return series;
}

// ---- Indicator analytics ----

export function getIndicatorAnalytics(
  indicators: MarketIndicatorObservation[],
  indicatorId: string,
  dateFrom?: string,
  dateTo?: string,
): { current: number; change7d: number; change30d: number; avg30d: number; trend: string } | null {
  let filtered = indicators.filter((i) => i.indicatorId === indicatorId);
  if (dateFrom) filtered = filtered.filter((i) => i.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((i) => i.date <= dateTo);

  filtered.sort((a, b) => a.date.localeCompare(b.date));
  if (filtered.length === 0) return null;

  const values = filtered.map((i) => i.value);
  const current = values[values.length - 1];

  return {
    current: round2(current),
    change7d: round2(getChangeOverDays(values, 7).value),
    change30d: round2(getChangeOverDays(values, 30).value),
    avg30d: round2(mean(values.slice(-30))),
    trend: calculateTrend(values.slice(-30)).direction,
  };
}

// ---- Helper: mean ----

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ---- Helper: standard deviation ----

function standardDeviation(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ---- Helper: round to 2 decimal places ----

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---- Helper: change over N days ----

function getChangeOverDays(
  rates: number[],
  days: number,
): { value: number; percent: number } {
  if (rates.length < 2) return { value: 0, percent: 0 };
  const current = rates[rates.length - 1];
  const pastIndex = Math.max(0, rates.length - days - 1);
  const past = rates[pastIndex];
  const value = current - past;
  const percent = past !== 0 ? (value / past) * 100 : 0;
  return { value: round2(value), percent: round2(percent) };
}

// ---- Helper: volatility (coefficient of variation of daily returns) ----

function calculateVolatility(rates: number[]): number {
  if (rates.length < 3) return 0;
  const returns: number[] = [];
  for (let i = 1; i < rates.length; i++) {
    if (rates[i - 1] !== 0) {
      returns.push((rates[i] - rates[i - 1]) / rates[i - 1]);
    }
  }
  if (returns.length === 0) return 0;
  return round2(standardDeviation(returns) * 100);
}

// ---- Helper: trend via linear regression ----

function calculateTrend(
  values: number[],
): { direction: "rising" | "falling" | "stable"; strength: number } {
  if (values.length < 5) return { direction: "stable", strength: 0 };

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(values);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const yRange = Math.max(...values) - Math.min(...values);
  const strength = yRange > 0 ? Math.min(100, Math.abs(slope) / yRange * n * 100) : 0;

  let direction: "rising" | "falling" | "stable" = "stable";
  if (slope > 0.05) direction = "rising";
  else if (slope < -0.05) direction = "falling";

  return { direction, strength: round2(strength) };
}

// ---- Batch: calculate all route analytics ----

export function calculateAllRouteAnalytics(
  observations: FreightObservation[],
  dateFrom?: string,
  dateTo?: string,
): RouteAnalytics[] {
  const routeClassPairs = new Map<string, { routeId: string; vesselClass: VesselClass }>();

  for (const obs of observations) {
    const key = `${obs.routeId}:${obs.vesselClass}`;
    if (!routeClassPairs.has(key)) {
      routeClassPairs.set(key, { routeId: obs.routeId, vesselClass: obs.vesselClass });
    }
  }

  const results: RouteAnalytics[] = [];
  for (const { routeId, vesselClass } of routeClassPairs.values()) {
    const analytics = calculateRouteAnalytics(observations, routeId, vesselClass, dateFrom, dateTo);
    if (analytics) results.push(analytics);
  }

  return results;
}

// ---- Filter observations ----

export function filterObservations(
  observations: FreightObservation[],
  filter: FreightFilter,
): FreightObservation[] {
  let result = observations;

  if (filter.originPortId) result = result.filter((o) => o.originPortId === filter.originPortId);
  if (filter.destinationPortId) result = result.filter((o) => o.destinationPortId === filter.destinationPortId);
  if (filter.routeId) result = result.filter((o) => o.routeId === filter.routeId);
  if (filter.vesselClass) result = result.filter((o) => o.vesselClass === filter.vesselClass);
  if (filter.cargoType) result = result.filter((o) => o.cargoType === filter.cargoType);
  if (filter.dateFrom) result = result.filter((o) => o.date >= filter.dateFrom!);
  if (filter.dateTo) result = result.filter((o) => o.date <= filter.dateTo!);

  return result;
}

// ---- Validation ----

export function validateObservation(obs: Partial<FreightObservation>): string[] {
  const errors: string[] = [];
  if (!obs.date || isNaN(Date.parse(obs.date))) errors.push("Invalid date");
  if (obs.ratePerTonne !== undefined && obs.ratePerTonne < 0) errors.push("Rate cannot be negative");
  if (obs.tcePerDay !== undefined && obs.tcePerDay < 0) errors.push("TCE cannot be negative");
  if (obs.cargoQuantityTonnes !== undefined && obs.cargoQuantityTonnes < 0) errors.push("Cargo quantity cannot be negative");
  if (obs.vesselClass && !["Handysize", "Supramax", "Panamax", "Capesize"].includes(obs.vesselClass)) {
    errors.push("Invalid vessel class");
  }
  if (obs.currency && obs.currency !== "USD") errors.push("Currency must be USD");
  return errors;
}
