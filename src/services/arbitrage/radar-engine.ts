import { generateForecast } from "@/services/forecast-engine";
import { getFreightObservations } from "@/lib/market-data-store";
import type { VesselClass } from "@/types";

export interface ArbitrageAnalysis {
  routeId: string;
  vesselClass: VesselClass;
  spotForecastCurve: { date: string; rate: number }[];
  contractRateCurve: { date: string; rate: number }[];
  spotAggregateCost: number;
  contractAggregateCost: number;
  arbitrageIndex: number;
  recommendation: "LOCK_IN" | "WAIT" | "FAVORS_SPOT";
  savingsEstimate: number;
}

export function runArbitrageRadar(routeId: string, vesselClass: VesselClass, currentContractAsk: number): ArbitrageAnalysis {
  const historicalData = getFreightObservations();
  
  const forecast = generateForecast({
    routeId,
    vesselClass,
    historicalData,
    marketIndicators: [],
    congestionData: [],
    horizon: "180d"
  });

  const spotForecastCurve = forecast.predictions.map(p => ({
    date: p.date,
    rate: p.predictedRate
  }));

  const contractRateCurve = forecast.predictions.map(p => ({
    date: p.date,
    rate: currentContractAsk
  }));

  const numVoyages = 6; // Assume 1 voyage per month
  const interval = Math.floor(spotForecastCurve.length / numVoyages);
  
  let spotAggregateCost = 0;
  let contractAggregateCost = 0;

  for (let i = 0; i < numVoyages; i++) {
    const idx = Math.min(i * interval, spotForecastCurve.length - 1);
    if(spotForecastCurve[idx]) {
        spotAggregateCost += spotForecastCurve[idx].rate;
        contractAggregateCost += contractRateCurve[idx].rate;
    }
  }

  // Arbitrage index: positive means contract is cheaper, negative means spot is cheaper
  const arbitrageIndex = spotAggregateCost - contractAggregateCost;
  const savingsEstimate = arbitrageIndex * 50000; // Assume 50k metric tons per voyage

  let recommendation: "LOCK_IN" | "WAIT" | "FAVORS_SPOT" = "WAIT";
  if (arbitrageIndex > 2) {
    recommendation = "LOCK_IN";
  } else if (arbitrageIndex < -2) {
    recommendation = "FAVORS_SPOT";
  }

  return {
    routeId,
    vesselClass,
    spotForecastCurve,
    contractRateCurve,
    spotAggregateCost,
    contractAggregateCost,
    arbitrageIndex,
    recommendation,
    savingsEstimate
  };
}
