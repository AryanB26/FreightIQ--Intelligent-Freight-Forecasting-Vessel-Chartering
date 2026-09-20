// ============================================================
// FreightIQ — Data Preprocessing (Phase 6)
// Validates, cleans, resamples, and gaps-filled time series
// ============================================================

import type { FreightObservation } from "@/types/freight-market";
import type { VesselClass } from "@/types";
import type { TimeSeriesRecord } from "./types";

// ---- Validation ----

export interface ValidationReport {
  totalRecords: number;
  validRecords: number;
  duplicatesRemoved: number;
  negativeRatesRemoved: number;
  invalidDatesRemoved: number;
  gapsFound: number;
  gapsFilled: number;
  warnings: string[];
}

/**
 * Validate and clean freight observations.
 * Returns clean records + a validation report.
 */
export function validateAndClean(
  observations: FreightObservation[],
  routeId: string,
  vesselClass: VesselClass
): { clean: FreightObservation[]; report: ValidationReport } {
  const report: ValidationReport = {
    totalRecords: observations.length,
    validRecords: 0,
    duplicatesRemoved: 0,
    negativeRatesRemoved: 0,
    invalidDatesRemoved: 0,
    gapsFound: 0,
    gapsFilled: 0,
    warnings: [],
  };

  // Filter to route + vessel class
  let filtered = observations.filter(
    (o) => o.routeId === routeId && o.vesselClass === vesselClass
  );

  // 1. Remove invalid dates
  filtered = filtered.filter((o) => {
    if (!o.date || isNaN(Date.parse(o.date))) {
      report.invalidDatesRemoved++;
      return false;
    }
    return true;
  });

  // 2. Remove negative rates
  filtered = filtered.filter((o) => {
    if (o.ratePerTonne < 0) {
      report.negativeRatesRemoved++;
      return false;
    }
    return true;
  });

  // 3. Sort by date
  filtered.sort((a, b) => a.date.localeCompare(b.date));

  // 4. Deduplicate (keep latest observation per date)
  const seen = new Map<string, FreightObservation>();
  for (const obs of filtered) {
    const existing = seen.get(obs.date);
    if (existing) {
      report.duplicatesRemoved++;
      // Keep the one with higher quality confidence
      if (obs.quality.confidence >= existing.quality.confidence) {
        seen.set(obs.date, obs);
      }
    } else {
      seen.set(obs.date, obs);
    }
  }
  filtered = Array.from(seen.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 5. Detect and fill gaps (weekends/holidays)
  const filled = fillGaps(filtered);
  report.gapsFound = filled.gapsFound;
  report.gapsFilled = filled.gapsFilled;
  report.warnings = filled.warnings;

  report.validRecords = filled.series.length;

  return { clean: filled.series, report };
}

// ---- Gap filling ----

interface GapFillResult {
  series: FreightObservation[];
  gapsFound: number;
  gapsFilled: number;
  warnings: string[];
}

/**
 * Fill gaps in the time series using linear interpolation.
 * Handles weekends and holidays where markets may not report.
 */
function fillGaps(series: FreightObservation[]): GapFillResult {
  if (series.length < 2) return { series, gapsFound: 0, gapsFilled: 0, warnings: [] };

  const result: FreightObservation[] = [series[0]];
  let gapsFound = 0;
  let gapsFilled = 0;
  const warnings: string[] = [];

  for (let i = 1; i < series.length; i++) {
    const prev = new Date(series[i - 1].date);
    const curr = new Date(series[i].date);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Gap detected — fill with linear interpolation
      const gapDays = diffDays - 1;
      gapsFound++;

      if (gapDays > 5) {
        warnings.push(
          `Large gap of ${gapDays} days between ${series[i - 1].date} and ${series[i].date}. Filled with interpolation.`
        );
      }

      const startRate = series[i - 1].ratePerTonne;
      const endRate = series[i].ratePerTonne;
      const startTCE = series[i - 1].tcePerDay;
      const endTCE = series[i].tcePerDay;

      for (let d = 1; d <= gapDays; d++) {
        const t = d / (gapDays + 1);
        const interpDate = new Date(prev);
        interpDate.setDate(interpDate.getDate() + d);
        const dateStr = interpDate.toISOString().split("T")[0];

        const interpRate = Math.round((startRate + (endRate - startRate) * t) * 100) / 100;
        const interpTCE = Math.round(startTCE + (endTCE - startTCE) * t);

        result.push({
          id: `interp-${series[i - 1].id}-${d}`,
          date: dateStr,
          originPortId: series[i - 1].originPortId,
          destinationPortId: series[i - 1].destinationPortId,
          routeId: series[i - 1].routeId,
          vesselClass: series[i - 1].vesselClass,
          cargoType: series[i - 1].cargoType,
          cargoQuantityTonnes: series[i - 1].cargoQuantityTonnes,
          ratePerTonne: interpRate,
          tcePerDay: interpTCE,
          currency: "USD",
          source: "Interpolated",
          quality: { status: "estimated", confidence: 0.7, isSynthetic: true, missingFields: ["direct_observation"] },
        });
        gapsFilled++;
      }
    }

    result.push(series[i]);
  }

  return { series: result, gapsFound, gapsFilled, warnings };
}

// ---- Convert to time series records ----

export function toTimeSeries(clean: FreightObservation[]): TimeSeriesRecord[] {
  return clean.map((obs, i) => ({
    date: obs.date,
    rate: obs.ratePerTonne,
    tce: obs.tcePerDay,
    dayIndex: i,
  }));
}

// ---- Resample (aggregate by period) ----

export function resample(
  series: TimeSeriesRecord[],
  period: "daily" | "weekly" | "monthly"
): TimeSeriesRecord[] {
  if (period === "daily") return series;

  const groups = new Map<string, TimeSeriesRecord[]>();

  for (const rec of series) {
    let key: string;
    if (period === "weekly") {
      const d = new Date(rec.date);
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      key = d.toISOString().split("T")[0];
    } else {
      key = rec.date.substring(0, 7); // YYYY-MM
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(rec);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, recs]) => ({
      date,
      rate: Math.round((recs.reduce((s, r) => s + r.rate, 0) / recs.length) * 100) / 100,
      tce: Math.round(recs.reduce((s, r) => s + r.tce, 0) / recs.length),
      dayIndex: recs[0].dayIndex,
    }));
}

// ---- Statistical summaries ----

export function computeSeriesStats(series: TimeSeriesRecord[]) {
  const rates = series.map((r) => r.rate);
  const n = rates.length;
  if (n === 0) return null;

  const mean = rates.reduce((s, v) => s + v, 0) / n;
  const variance = rates.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1 || 1);
  const std = Math.sqrt(variance);

  return {
    count: n,
    mean: Math.round(mean * 100) / 100,
    std: Math.round(std * 100) / 100,
    min: Math.min(...rates),
    max: Math.max(...rates),
    first: rates[0],
    last: rates[n - 1],
    totalChange: Math.round((rates[n - 1] - rates[0]) * 100) / 100,
    totalChangePercent: Math.round(((rates[n - 1] - rates[0]) / rates[0]) * 10000) / 100,
  };
}
