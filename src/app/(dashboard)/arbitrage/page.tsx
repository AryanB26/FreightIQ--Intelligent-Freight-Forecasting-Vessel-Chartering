"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runArbitrageRadar, ArbitrageAnalysis } from "@/services/arbitrage/radar-engine";
import { freightRoutes } from "@/data/seed/freight-market-generator";

export default function ArbitrageRadarPage() {
  const [routeId, setRouteId] = useState("fr-001");
  const currentRoute = freightRoutes.find(r => r.id === routeId) || freightRoutes[0];
  const [vesselClass, setVesselClass] = useState(currentRoute.vesselClasses.includes("Capesize") ? "Capesize" : currentRoute.vesselClasses[0]);
  const [currentContractAsk, setCurrentContractAsk] = useState(15);
  const [analysis, setAnalysis] = useState<ArbitrageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentRoute && !currentRoute.vesselClasses.includes(vesselClass as any)) {
      setVesselClass(currentRoute.vesselClasses[0]);
    }
  }, [routeId, currentRoute, vesselClass]);

  const handleRunRadar = () => {
    setLoading(true);
    // Simulate slight network delay
    setTimeout(() => {
      const result = runArbitrageRadar(routeId, vesselClass as any, currentContractAsk);
      setAnalysis(result);
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Arbitrage Radar</h1>
        <p className="text-sm text-muted-foreground">
          Compare 6-month Spot Forecast Aggregate against current Time Charter asking rates to find arbitrage opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Radar Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Route</label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                <option value="fr-001">Australia &rarr; India East Coast</option>
                <option value="fr-004">Indonesia &rarr; India East Coast</option>
                <option value="fr-007">US Gulf &rarr; India East Coast</option>
                <option value="fr-009">Mozambique &rarr; India East Coast</option>
                <option value="fr-010">Russia &rarr; India East Coast</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Vessel Class</label>
              <select
                value={vesselClass}
                onChange={(e) => setVesselClass(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                {currentRoute?.vesselClasses.map(vc => (
                  <option key={vc} value={vc}>{vc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Current 6m Contract Ask ($/mt)</label>
              <input
                type="number"
                value={currentContractAsk}
                onChange={(e) => setCurrentContractAsk(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                step="0.5"
              />
            </div>

            <Button onClick={handleRunRadar} className="w-full" disabled={loading}>
              {loading ? "Scanning Market..." : "Run Arbitrage Radar"}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {!analysis && !loading && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Configure radar settings and click "Run Arbitrage Radar" to scan for opportunities.
              </CardContent>
            </Card>
          )}

          {loading && (
             <Card>
             <CardContent className="py-12 text-center text-muted-foreground">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
               Scanning spot curves and contract offers...
             </CardContent>
           </Card>
          )}

          {analysis && !loading && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Arbitrage Signal</CardTitle>
                  <Badge className={
                    analysis.recommendation === "LOCK_IN" ? "bg-emerald-500 text-white" :
                    analysis.recommendation === "FAVORS_SPOT" ? "bg-blue-500 text-white" :
                    "bg-amber-500 text-white"
                  }>
                    {analysis.recommendation === "LOCK_IN" ? "LOCK-IN SIGNAL" : 
                     analysis.recommendation === "FAVORS_SPOT" ? "FAVORS SPOT" : "WAIT / NEUTRAL"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">6m Spot Aggregate</p>
                      <p className="text-2xl font-bold">${analysis.spotAggregateCost.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">/mt estimated total</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">6m Contract Total</p>
                      <p className="text-2xl font-bold">${analysis.contractAggregateCost.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">/mt fixed ask</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Arbitrage Spread</p>
                      <p className={`text-2xl font-bold ${analysis.arbitrageIndex > 0 ? "text-emerald-500" : analysis.arbitrageIndex < 0 ? "text-blue-500" : ""}`}>
                        {analysis.arbitrageIndex > 0 ? "+" : ""}{analysis.arbitrageIndex.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">/mt difference</p>
                    </div>
                  </div>

                  {analysis.recommendation === "LOCK_IN" && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-emerald-600 mb-1">Strong Arbitrage Opportunity</h4>
                      <p className="text-xs text-muted-foreground">
                        The current contract asking price is significantly cheaper than the 6-month forecasted aggregate spot cost. 
                        Locking in this contract now could save an estimated <strong>${analysis.savingsEstimate.toLocaleString()}</strong> over 6 voyages (assuming 50k MT per voyage).
                      </p>
                    </div>
                  )}

                  {analysis.recommendation === "FAVORS_SPOT" && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-600 mb-1">Spot Market Subsidization</h4>
                      <p className="text-xs text-muted-foreground">
                        The forecasted spot rates are dipping significantly below the contract curve. 
                        It is mathematically optimal to remain on the spot market and not commit to long-term contracts at this asking price.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Forward Curve Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end gap-1 overflow-hidden relative border-b border-l pt-4 pb-2 px-2">
                        {/* Y-axis markers */}
                        <div className="absolute left-1 top-2 text-[10px] text-muted-foreground">${Math.max(...analysis.spotForecastCurve.map(c => c.rate), currentContractAsk).toFixed(1)}</div>
                        <div className="absolute left-1 bottom-2 text-[10px] text-muted-foreground">${Math.min(...analysis.spotForecastCurve.map(c => c.rate), currentContractAsk).toFixed(1)}</div>
                        
                        {analysis.spotForecastCurve.map((point, i) => {
                            // Sample points to fit the graph
                            if (i % Math.ceil(analysis.spotForecastCurve.length / 50) !== 0) return null;
                            
                            const maxRate = Math.max(...analysis.spotForecastCurve.map(c => c.rate), currentContractAsk) * 1.1;
                            const heightPercent = (point.rate / maxRate) * 100;
                            const contractHeightPercent = (currentContractAsk / maxRate) * 100;
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center relative group h-full">
                                    {/* Spot Bar */}
                                    <div 
                                        className="w-full bg-blue-500/50 rounded-t-sm z-10" 
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    {/* Contract Line Indicator */}
                                    <div 
                                        className="absolute w-full h-[2px] bg-red-500/80 z-20"
                                        style={{ bottom: `${contractHeightPercent}%` }}
                                    ></div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-center items-center gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500/50 rounded-sm"></div> Spot Forecast</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-1 bg-red-500/80 rounded-sm"></div> Contract Ask</div>
                    </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
