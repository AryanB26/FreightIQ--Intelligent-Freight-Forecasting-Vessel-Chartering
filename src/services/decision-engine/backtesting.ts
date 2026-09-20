// ============================================================
// FreightIQ — Decision Engine Backtesting (Phase 7)
//
// Simulates historical decision-making by:
// 1. Selecting a historical date
// 2. Using only data available at that date (no future leakage)
// 3. Generating a forecast and recommendation
// 4. Observing what actually happened afterward
// 5. Evaluating whether the decision was directionally correct
// ============================================================

import type { FreightObservation, PortCongestionObservation, RouteAnalytics } from "@/types/freight-market";
import type { VesselClass } from "@/types";
import type { ForecastResult } from "@/services/forecasting/types";
import type {
  BacktestScenario,
  BacktestResult,
  MarketEntryDecision,
} from "./types";
import { analyzeMarketEntry } from "./engine";
import { calculateRouteAnalytics } from "@/services/market-analytics";
import { BACKTEST_CONFIG } from "./config";
import { DEFAULT_WEIGHTS } from "./config";

/**
 * Run backtesting for a specific route and vessel class.
 *
 * IMPORTANT: At each historical date, only data BEFORE that date is used.
 * No future information is ever leaked.
 */
export function runBacktest(
  freightObservations: FreightObservation[],
  portCongestion: PortCongestionObservation[],
  routeId: string,
  vesselClass: VesselClass,
): BacktestResult {
  // Filter observations for this route/class
  const routeObs = freightObservations
    .filter((o) => o.routeId === routeId && o.vesselClass === vesselClass)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (routeObs.length < BACKTEST_CONFIG.minDataPoints) {
    return emptyBacktestResult(routeId, vesselClass);
  }

  const scenarios: BacktestScenario[] = [];

  // Walk forward through history
  const startDate = new Date(routeObs[0].date);
  const endDate = new Date(routeObs[routeObs.length - 1].date);

  // Start from minDataPoints days in to have enough history
  let currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + BACKTEST_CONFIG.minDataPoints);

  while (currentDate <= endDate) {
    const currentDateString = currentDate.toISOString().split("T")[0];

    // Get only data UP TO current date (no future leakage)
    const historicalData = routeObs.filter((o) => o.date <= currentDateString);

    if (historicalData.length < 30) {
      currentDate.setDate(currentDate.getDate() + BACKTEST_CONFIG.stepDays);
      continue;
    }

    // Find what the actual rate was at entry
    const entryRate = historicalData[historicalData.length - 1].ratePerTonne;

    // Find what the actual rate was after waiting period
    const waitEndDate = new Date(currentDate);
    waitEndDate.setDate(waitEndDate.getDate() + BACKTEST_CONFIG.evaluationPeriodDays);
    const waitEndString = waitEndDate.toISOString().split("T")[0];

    const futureData = routeObs.filter(
      (o) => o.date > currentDateString && o.date <= waitEndString,
    );

    if (futureData.length < 5) {
      currentDate.setDate(currentDate.getDate() + BACKTEST_CONFIG.stepDays);
      continue;
    }

    const futureRate = futureData[Math.floor(futureData.length / 2)].ratePerTonne;
    const endRate = futureData[futureData.length - 1].ratePerTonne;

    // Generate a simple forecast using available data only
    const forecast = generateSimpleBacktestForecast(historicalData, routeId, vesselClass);

    // Generate route analytics from historical data only
    const analytics = calculateRouteAnalytics(
      historicalData,
      routeId,
      vesselClass,
    );

    // Get congestion data up to current date
    const relevantCongestion = portCongestion.filter(
      (pc) => pc.date <= currentDateString,
    );
    const latestCongestion = relevantCongestion.length > 0
      ? relevantCongestion[relevantCongestion.length - 1]
      : null;

    // Generate a decision using only historical data
    const decision = analyzeMarketEntry(
      {
        cargo: {
          commodity: "iron_ore",
          commodityCategory: "iron_ore",
          quantityTonnes: 70000,
          loadingWindowStart: currentDateString,
          loadingWindowEnd: waitEndString,
        },
        route: {
          originPortId: "port-port-hedland",
          destinationPortId: "port-paradip",
          distanceNm: 5200,
          estimatedTransitDays: 16,
        },
        vessel: { vesselClass },
        contractDuration: "short_term",
      },
      {
        forecast,
        routeAnalytics: analytics,
        compatibilityResults: [],
        vessels: [],
        originPort: null,
        destPort: null,
        originCongestionIndex: latestCongestion?.congestionIndex ?? 50,
        destCongestionIndex: latestCongestion?.congestionIndex ?? 50,
        originWaitingDays: latestCongestion?.estimatedWaitingDays ?? 2,
        destWaitingDays: latestCongestion?.estimatedWaitingDays ?? 2,
      },
      DEFAULT_WEIGHTS,
    );

    // Evaluate the decision
    const actualDirection = endRate > entryRate ? "rising" : endRate < entryRate ? "falling" : "stable";
    const predictedDirection = forecast.horizons.find((h) => h.days === 30)?.direction ?? "stable";

    const wasDirectionallyCorrect = predictedDirection === actualDirection;

    // Did "CHARTER_NOW" avoid paying more? (entering before a rise = good)
    const avoidedIncrease = decision.recommendation === "CHARTER_NOW" && actualDirection === "rising";

    // Did "WAIT" correctly identify a decline?
    const correctlyIdentifiedDecline = decision.recommendation === "WAIT" && actualDirection === "falling";

    // Was the signal wrong? (CHARTER_NOW when rates fell, or WAIT when rates rose)
    const falseSignal =
      (decision.recommendation === "CHARTER_NOW" && actualDirection === "falling") ||
      (decision.recommendation === "WAIT" && actualDirection === "rising");

    scenarios.push({
      historicalDate: currentDateString,
      actualRateAtEntry: entryRate,
      actualRateAfterWait: futureRate,
      forecastAvailable: forecast,
      recommendation: decision.recommendation,
      decisionScore: decision.decisionScore,
      wasDirectionallyCorrect,
      avoidedIncrease,
      correctlyIdentifiedDecline,
      falseSignal,
    });

    currentDate.setDate(currentDate.getDate() + BACKTEST_CONFIG.stepDays);
  }

  // Compute aggregate metrics
  const total = scenarios.length;
  const directionallyCorrect = scenarios.filter((s) => s.wasDirectionallyCorrect).length;
  const avoidedIncrease = scenarios.filter((s) => s.avoidedIncrease).length;
  const correctlyIdentifiedDecline = scenarios.filter((s) => s.correctlyIdentifiedDecline).length;
  const falseSignals = scenarios.filter((s) => s.falseSignal).length;

  return {
    scenarios,
    totalScenarios: total,
    directionallyCorrectCount: directionallyCorrect,
    avoidedIncreaseCount: avoidedIncrease,
    correctlyIdentifiedDeclineCount: correctlyIdentifiedDecline,
    falseSignalCount: falseSignals,
    accuracyRate: total > 0 ? Math.round((directionallyCorrect / total) * 100) : 0,
    period: `${routeObs[0].date} to ${routeObs[routeObs.length - 1].date}`,
  };
}

/**
 * Generate a simple forecast for backtesting using only historical data.
 * This uses a simple trend extrapolation — NOT the full ML pipeline
 * (which would be too expensive to run per backtest step).
 */
function generateSimpleBacktestForecast(
  data: FreightObservation[],
  routeId: string,
  vesselClass: VesselClass,
): ForecastResult {
  const rates = data.map((d) => d.ratePerTonne);
  const recent30 = rates.slice(-30);
  const recent7 = rates.slice(-7);

  const avg30 = recent30.reduce((s, v) => s + v, 0) / recent30.length;
  const avg7 = recent7.reduce((s, v) => s + v, 0) / recent7.length;

  // Simple linear trend
  const trend = recent30.length > 1
    ? (recent30[recent30.length - 1] - recent30[0]) / recent30.length
    : 0;

  const currentRate = rates[rates.length - 1];
  const predictions = [];

  for (let d = 1; d <= 30; d++) {
    const predicted = currentRate + trend * d;
    const spread = d * 0.1; // growing uncertainty
    predictions.push({
      date: new Date(Date.now() + d * 86400000).toISOString().split("T")[0],
      predictedRate: Math.round(predicted * 100) / 100,
      lowerBound: Math.round((predicted - spread) * 100) / 100,
      upperBound: Math.round((predicted + spread) * 100) / 100,
    });
  }

  const change30 = predictions.length > 0
    ? ((predictions[29].predictedRate - currentRate) / currentRate) * 100
    : 0;

  return {
    routeId,
    routeLabel: `${routeId}`,
    vesselClass,
    currentRate,
    predictions,
    horizons: [
      {
        days: 7,
        label: "7-Day",
        predictedRate: predictions[6]?.predictedRate ?? currentRate,
        changePercent: Math.round(((predictions[6]?.predictedRate ?? currentRate) - currentRate) / currentRate * 10000) / 100,
        direction: (predictions[6]?.predictedRate ?? currentRate) > currentRate + 0.5 ? "rising" : (predictions[6]?.predictedRate ?? currentRate) < currentRate - 0.5 ? "falling" : "stable",
        lowerBound: predictions[6]?.lowerBound ?? currentRate - 1,
        upperBound: predictions[6]?.upperBound ?? currentRate + 1,
        confidence: "medium",
      },
      {
        days: 14,
        label: "14-Day",
        predictedRate: predictions[13]?.predictedRate ?? currentRate,
        changePercent: Math.round(((predictions[13]?.predictedRate ?? currentRate) - currentRate) / currentRate * 10000) / 100,
        direction: (predictions[13]?.predictedRate ?? currentRate) > currentRate + 0.5 ? "rising" : (predictions[13]?.predictedRate ?? currentRate) < currentRate - 0.5 ? "falling" : "stable",
        lowerBound: predictions[13]?.lowerBound ?? currentRate - 2,
        upperBound: predictions[13]?.upperBound ?? currentRate + 2,
        confidence: "medium",
      },
      {
        days: 30,
        label: "30-Day",
        predictedRate: predictions[29]?.predictedRate ?? currentRate,
        changePercent: Math.round(change30 * 100) / 100,
        direction: change30 > 0.5 ? "rising" : change30 < -0.5 ? "falling" : "stable",
        lowerBound: predictions[29]?.lowerBound ?? currentRate - 3,
        upperBound: predictions[29]?.upperBound ?? currentRate + 3,
        confidence: "low",
      },
    ],
    model: "Simple Trend (backtest)",
    modelMetrics: { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 },
    drivers: [],
    backtest: {
      period: "N/A",
      actual: [],
      predicted: [],
      dates: [],
      metrics: { mae: 0, rmse: 0, mape: 0, directionAccuracy: 0, r2: 0 },
      horizonMetrics: [],
      errorDistribution: [],
    },
    generatedAt: new Date().toISOString(),
    disclaimer: "Backtest forecast uses simple trend extrapolation — not the full ML pipeline.",
  };
}

function emptyBacktestResult(routeId: string, vesselClass: VesselClass): BacktestResult {
  return {
    scenarios: [],
    totalScenarios: 0,
    directionallyCorrectCount: 0,
    avoidedIncreaseCount: 0,
    correctlyIdentifiedDeclineCount: 0,
    falseSignalCount: 0,
    accuracyRate: 0,
    period: "Insufficient data",
  };
}
