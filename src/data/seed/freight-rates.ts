import type { Route, FreightRate, MarketIndicator } from "@/types";

export const sampleRoutes: Route[] = [
  { id: "route-001", originPortId: "port-port-hedland", destinationPortId: "port-paradip", distanceNm: 5200, estimatedSeaDays: 16, canalFees: 0, bunkerCostEstimate: 480000 },
  { id: "route-002", originPortId: "port-port-hedland", destinationPortId: "port-visakhapatnam", distanceNm: 5150, estimatedSeaDays: 15, canalFees: 0, bunkerCostEstimate: 465000 },
  { id: "route-003", originPortId: "port-new-orleans", destinationPortId: "port-paradip", distanceNm: 12800, estimatedSeaDays: 35, canalFees: 450000, bunkerCostEstimate: 1150000 },
  { id: "route-004", originPortId: "port-beira", destinationPortId: "port-gangavaram", distanceNm: 5400, estimatedSeaDays: 17, canalFees: 0, bunkerCostEstimate: 510000 },
  { id: "route-005", originPortId: "port-vladivostok", destinationPortId: "port-dhamra", distanceNm: 7200, estimatedSeaDays: 22, canalFees: 0, bunkerCostEstimate: 660000 },
  { id: "route-006", originPortId: "port-tanjung-api", destinationPortId: "port-gopalpur", distanceNm: 3800, estimatedSeaDays: 12, canalFees: 0, bunkerCostEstimate: 340000 },
  { id: "route-007", originPortId: "port-port-hedland", destinationPortId: "port-dhamra", distanceNm: 5600, estimatedSeaDays: 17, canalFees: 0, bunkerCostEstimate: 520000 },
  { id: "route-008", originPortId: "port-port-hedland", destinationPortId: "port-haldia", distanceNm: 5350, estimatedSeaDays: 16, canalFees: 0, bunkerCostEstimate: 495000 },
];

function generateRates(): FreightRate[] {
  const rates: FreightRate[] = [];
  const baseRates: Record<string, Record<string, number>> = {
    Handysize: { "route-001": 12.5, "route-002": 12.2, "route-003": 22.8, "route-004": 14.1, "route-005": 18.5, "route-006": 10.2, "route-007": 13.0, "route-008": 12.7 },
    Supramax: { "route-001": 11.8, "route-002": 11.5, "route-003": 20.5, "route-004": 13.2, "route-005": 17.0, "route-006": 9.8, "route-007": 12.3, "route-008": 12.0 },
    Panamax: { "route-001": 10.5, "route-002": 10.2, "route-003": 18.2, "route-004": 11.8, "route-005": 15.5, "route-006": 9.0, "route-007": 11.0, "route-008": 10.7 },
    Capesize: { "route-001": 9.2, "route-002": 9.0, "route-003": 15.8, "route-004": 10.5, "route-005": 13.8, "route-006": 0, "route-007": 9.5, "route-008": 9.3 },
  };

  const classes = ["Handysize", "Supramax", "Panamax", "Capesize"] as const;

  // Generate 90 days of historical data
  for (let d = 89; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split("T")[0];

    for (const routeId of Object.keys(baseRates.Handysize)) {
      for (const vc of classes) {
        const base = baseRates[vc]?.[routeId];
        if (!base) continue;

        // Simulate realistic daily fluctuation ±8%
        const noise = (Math.sin(d * 0.3 + vc.charCodeAt(0)) * 0.06 + Math.cos(d * 0.1 + routeId.charCodeAt(6)) * 0.04) * base;
        const rate = Math.round((base + noise) * 100) / 100;
        const tce = Math.round(rate * 30000 * 0.65);

        rates.push({
          id: `fr-${routeId}-${vc}-${dateStr}`,
          routeId,
          vesselClass: vc,
          date: dateStr,
          ratePerTonne: rate,
          tcePerDay: tce,
          source: "Sample Data",
        });
      }
    }
  }
  return rates;
}

export const sampleFreightRates = generateRates();

export const sampleMarketIndicators: MarketIndicator[] = [
  { id: "mi-bunker-vlsfo", name: "VLSFO (Singapore)", category: "bunker", value: 612.50, unit: "USD/mt", change: -3.20, changePercent: -0.52, lastUpdated: "2026-08-31", trend: "falling" },
  { id: "mi-bunker-ifo380", name: "IFO 380 (Fujairah)", category: "bunker", value: 498.00, unit: "USD/mt", change: 1.50, changePercent: 0.30, lastUpdated: "2026-08-31", trend: "stable" },
  { id: "mi-bdi", name: "Baltic Dry Index", category: "index", value: 1842, unit: "points", change: 28, changePercent: 1.54, lastUpdated: "2026-08-30", trend: "rising" },
  { id: "mi-bhsi", name: "Baltic Handysize Index", category: "index", value: 982, unit: "points", change: -12, changePercent: -1.21, lastUpdated: "2026-08-30", trend: "falling" },
  { id: "mi-bsisupra", name: "Baltic Supramax Index", category: "index", value: 1356, unit: "points", change: 45, changePercent: 3.43, lastUpdated: "2026-08-30", trend: "rising" },
  { id: "mi-bcpi", name: "Baltic Capesize Index", category: "index", value: 2890, unit: "points", change: 82, changePercent: 2.92, lastUpdated: "2026-08-30", trend: "rising" },
  { id: "mi-usd-inr", name: "USD/INR", category: "currency", value: 83.42, unit: "INR", change: 0.15, changePercent: 0.18, lastUpdated: "2026-08-31", trend: "stable" },
  { id: "mi-aud-usd", name: "AUD/USD", category: "currency", value: 0.6534, unit: "USD", change: -0.0021, changePercent: -0.32, lastUpdated: "2026-08-31", trend: "falling" },
  { id: "mi-iron-ore", name: "Iron Ore (62% Fe)", category: "commodity", value: 108.50, unit: "USD/mt", change: 1.80, changePercent: 1.69, lastUpdated: "2026-08-30", trend: "rising" },
  { id: "mi-coal", name: "Thermal Coal (Newcastle)", category: "commodity", value: 142.30, unit: "USD/mt", change: -2.40, changePercent: -1.66, lastUpdated: "2026-08-30", trend: "falling" },
];
