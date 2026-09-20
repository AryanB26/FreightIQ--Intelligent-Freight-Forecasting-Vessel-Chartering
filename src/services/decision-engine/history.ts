// ============================================================
// FreightIQ — Decision History Store (Phase 7)
// In-memory store for decision analysis history.
// ============================================================

import type { AnalysisHistoryEntry, MarketEntryDecision, MarketEntryAnalysisRequest } from "./types";
import type { ForecastResult } from "@/services/forecasting/types";

let _history: AnalysisHistoryEntry[] = [];
let _nextId = 1;

/**
 * Store a new analysis result in history.
 */
export function storeAnalysis(
  request: MarketEntryAnalysisRequest,
  result: MarketEntryDecision,
  forecast: ForecastResult | null,
): AnalysisHistoryEntry {
  const entry: AnalysisHistoryEntry = {
    id: `analysis-${String(_nextId++).padStart(4, "0")}`,
    timestamp: new Date().toISOString(),
    request,
    result,
    forecastUsed: forecast,
  };

  _history.unshift(entry); // newest first

  // Keep last 100 entries
  if (_history.length > 100) {
    _history = _history.slice(0, 100);
  }

  return entry;
}

/**
 * Retrieve all stored analyses (newest first).
 */
export function getAnalysisHistory(): AnalysisHistoryEntry[] {
  return [..._history];
}

/**
 * Retrieve a specific analysis by ID.
 */
export function getAnalysisById(id: string): AnalysisHistoryEntry | null {
  return _history.find((e) => e.id === id) ?? null;
}

/**
 * Get recent analyses for a specific route.
 */
export function getAnalysesByRoute(routeId: string): AnalysisHistoryEntry[] {
  return _history.filter(
    (e) =>
      e.request.route.originPortId === routeId ||
      e.request.route.destinationPortId === routeId ||
      e.result.routeId === routeId,
  );
}

/**
 * Get summary statistics of past decisions.
 */
export function getDecisionStats(): {
  total: number;
  byRecommendation: Record<string, number>;
  averageScore: number;
  latestDecision: AnalysisHistoryEntry | null;
} {
  const byRecommendation: Record<string, number> = {};

  for (const entry of _history) {
    const rec = entry.result.recommendation;
    byRecommendation[rec] = (byRecommendation[rec] || 0) + 1;
  }

  const totalScore = _history.reduce((sum, e) => sum + e.result.decisionScore, 0);
  const averageScore = _history.length > 0 ? Math.round(totalScore / _history.length) : 0;

  return {
    total: _history.length,
    byRecommendation,
    averageScore,
    latestDecision: _history[0] ?? null,
  };
}

/**
 * Clear all history (for testing).
 */
export function clearHistory(): void {
  _history = [];
  _nextId = 1;
}
