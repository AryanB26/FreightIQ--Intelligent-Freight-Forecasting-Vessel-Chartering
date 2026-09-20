"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendIndicator } from "@/components/dashboard/trend-indicator";
import { DataTable } from "@/components/dashboard/data-table";
import { FreightTrendChart } from "@/components/charts/freight-trend-chart";
import { VesselComparisonChart } from "@/components/charts/vessel-comparison-chart";
import { cn } from "@/lib/utils";
import type {
  FreightRoute,
  FreightObservation,
  RouteAnalytics,
  TimeSeriesPoint,
  MultiSeriesData,
  PortCongestionObservation,
  MarketIndicatorObservation,
} from "@/types/freight-market";
import type { VesselClass } from "@/types";

const VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const VESSEL_COLORS: Record<VesselClass, string> = {
  Handysize: "#3B82F6",
  Supramax: "#10B981",
  Panamax: "#F59E0B",
  Capesize: "#EF4444",
};

export default function FreightMarketPage() {
  const [routes, setRoutes] = useState<FreightRoute[]>([]);
  const [analytics, setAnalytics] = useState<RouteAnalytics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [classComparison, setClassComparison] = useState<MultiSeriesData[]>([]);
  const [congestion, setCongestion] = useState<PortCongestionObservation[]>([]);
  const [indicators, setIndicators] = useState<MarketIndicatorObservation[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedClass, setSelectedClass] = useState<VesselClass>("Supramax");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load routes
  useEffect(() => {
    fetch("/api/freight/routes")
      .then((r) => r.json())
      .then((d) => {
        setRoutes(d.data || []);
        if (d.data?.length > 0) setSelectedRoute(d.data[0].id);
      });
  }, []);

  // Load analytics when filters change
  useEffect(() => {
    if (!selectedRoute) return;
    setLoading(true);

    const params = new URLSearchParams({ routeId: selectedRoute, vesselClass: selectedClass });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    Promise.all([
      fetch(`/api/freight/analytics?${params}`).then((r) => r.json()),
      fetch(`/api/freight/analytics?${params}&mode=timeSeries`).then((r) => r.json()),
      fetch(`/api/freight/analytics?routeId=${selectedRoute}&mode=multiSeries${dateFrom ? "&dateFrom=" + dateFrom : ""}${dateTo ? "&dateTo=" + dateTo : ""}`).then((r) => r.json()),
    ]).then(([analyticsData, tsData, compData]) => {
      setAnalytics(analyticsData.data);
      setTimeSeries(tsData.data || []);
      setClassComparison(compData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedRoute, selectedClass, dateFrom, dateTo]);

  // Load congestion for selected route's destination
  useEffect(() => {
    if (!selectedRoute) return;
    const route = routes.find((r) => r.id === selectedRoute);
    if (!route) return;
    fetch(`/api/port-congestion?portId=${route.destinationPortId}&dateFrom=${dateFrom || "2025-03-01"}&dateTo=${dateTo || "2026-08-31"}`)
      .then((r) => r.json())
      .then((d) => setCongestion(d.data || []));
  }, [selectedRoute, routes, dateFrom, dateTo]);

  // Load indicators
  useEffect(() => {
    fetch("/api/market-indicators-hist?dateFrom=2026-08-01")
      .then((r) => r.json())
      .then((d) => setIndicators(d.data || []));
  }, []);

  const route = routes.find((r) => r.id === selectedRoute);

  // Latest indicators summary
  const latestIndicators = useMemo(() => {
    const map = new Map<string, MarketIndicatorObservation>();
    for (const ind of indicators) {
      const existing = map.get(ind.indicatorId);
      if (!existing || ind.date > existing.date) map.set(ind.indicatorId, ind);
    }
    return Array.from(map.values());
  }, [indicators]);

  // Congestion summary
  const latestCongestion = useMemo(() => {
    if (congestion.length === 0) return null;
    return congestion[congestion.length - 1];
  }, [congestion]);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Freight Market</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Historical freight rates, market analytics, and vessel class comparison</p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="py-3">
        <CardContent className="px-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Route</label>
              <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.originPortName} → {r.destinationPortName} ({r.distanceNm} nm)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Vessel Class</label>
              <Select value={selectedClass} onValueChange={(v) => setSelectedClass(v as VesselClass)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VESSEL_CLASSES.map((vc) => (
                    <SelectItem key={vc} value={vc}>{vc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[140px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">From</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="w-[140px]">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">To</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Clear Dates
            </Button>
          </div>
          {route && (
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{route.originPortName} ({route.originCountry}) → {route.destinationPortName} ({route.destinationCountry})</span>
              <span className="font-mono">{route.distanceNm} nm</span>
              <span className="font-mono">~{route.typicalTransitDays} days</span>
              <span>Classes: {route.vesselClasses.join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics KPIs */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Current", value: `$${analytics.currentRate.toFixed(2)}`, trend: "stable" as const },
            { label: "7D Δ", value: `${analytics.change7dPercent >= 0 ? "+" : ""}${analytics.change7dPercent.toFixed(1)}%`, trend: analytics.change7dPercent > 0 ? "rising" as const : analytics.change7dPercent < 0 ? "falling" as const : "stable" as const },
            { label: "30D Δ", value: `${analytics.change30dPercent >= 0 ? "+" : ""}${analytics.change30dPercent.toFixed(1)}%`, trend: analytics.change30dPercent > 0 ? "rising" as const : analytics.change30dPercent < 0 ? "falling" as const : "stable" as const },
            { label: "90D Avg", value: `$${analytics.average90d.toFixed(2)}`, trend: "stable" as const },
            { label: "Volatility", value: `${analytics.volatility.toFixed(1)}%`, trend: analytics.volatilityLevel === "high" ? "volatile" as const : "stable" as const },
            { label: "Trend", value: analytics.trend, trend: analytics.trend === "rising" ? "rising" as const : analytics.trend === "falling" ? "falling" as const : "stable" as const },
            { label: "90D Low", value: `$${analytics.min90d.toFixed(2)}`, trend: "falling" as const },
            { label: "90D High", value: `$${analytics.max90d.toFixed(2)}`, trend: "rising" as const },
          ].map((kpi) => (
            <Card key={kpi.label} className="py-2">
              <CardContent className="px-3">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-sm font-bold font-mono mt-0.5">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FreightTrendChart
          data={timeSeries}
          title={`Freight Rate — ${route?.originPortName || "?"} → ${route?.destinationPortName || "?"} (${selectedClass})`}
          description="Historical rate with 7-day moving average and volatility band"
          color={VESSEL_COLORS[selectedClass]}
        />
        <VesselComparisonChart
          series={classComparison}
          title="Vessel Class Comparison"
          description={`Comparing freight rates across classes on ${route?.originPortName || "?"} → ${route?.destinationPortName || "?"}`}
        />
      </div>

      {/* Tabs: Route Comparison + Indicators + Congestion */}
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison" className="text-xs">Route Comparison</TabsTrigger>
          <TabsTrigger value="indicators" className="text-xs">Market Indicators</TabsTrigger>
          <TabsTrigger value="congestion" className="text-xs">Port Congestion</TabsTrigger>
        </TabsList>

        {/* Route Comparison */}
        <TabsContent value="comparison">
          <RouteComparisonView routes={routes} vesselClass={selectedClass} />
        </TabsContent>

        {/* Market Indicators */}
        <TabsContent value="indicators">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Supporting Market Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {latestIndicators.map((ind) => (
                  <div key={ind.indicatorId} className="border rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ind.indicatorId.replace("mi-", "").replace("-", " ")}</p>
                    <p className="text-lg font-bold font-mono mt-0.5">{ind.value.toFixed(2)}</p>
                    <p className={cn("text-[10px] font-mono", ind.changePercent >= 0 ? "text-emerald-600" : "text-red-600")}>
                      {ind.changePercent >= 0 ? "+" : ""}{ind.changePercent.toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Port Congestion */}
        <TabsContent value="congestion">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Port Congestion — {route?.destinationPortName || "Destination"}</CardTitle>
            </CardHeader>
            <CardContent>
              {latestCongestion && (
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {[
                    { label: "Congestion Index", value: latestCongestion.congestionIndex },
                    { label: "Vessel Queue", value: latestCongestion.vesselQueueLength },
                    { label: "Wait (days)", value: latestCongestion.estimatedWaitingDays },
                    { label: "Berth Util.", value: `${latestCongestion.berthUtilization}%` },
                    { label: "Status", value: latestCongestion.operationalStatus },
                  ].map((item) => (
                    <div key={item.label} className="border rounded-lg p-2 text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                      <p className="text-sm font-bold font-mono">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}
              {congestion.length > 0 && (
                <FreightTrendChart
                  data={congestion.slice(-90).map((c) => ({ date: c.date, value: c.congestionIndex }))}
                  title="Congestion Index (90d)"
                  unit="index"
                  color="#F59E0B"
                  height={200}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Route Comparison Sub-Component ----

function RouteComparisonView({ routes, vesselClass }: { routes: FreightRoute[]; vesselClass: VesselClass }) {
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [compData, setCompData] = useState<MultiSeriesData[]>([]);

  useEffect(() => {
    if (selectedRoutes.length < 2) { setCompData([]); return; }
    const params = new URLSearchParams({
      mode: "multiSeries",
      routeId: selectedRoutes[0],
      vesselClass,
    });
    // For simplicity, load multi-series for first route
    // A full implementation would merge across routes
    fetch(`/api/freight/analytics?${params}`)
      .then((r) => r.json())
      .then((d) => setCompData(d.data || []));
  }, [selectedRoutes, vesselClass]);

  const toggleRoute = (routeId: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeId) ? prev.filter((r) => r !== routeId) : [...prev, routeId].slice(0, 4)
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Compare Routes ({vesselClass})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {routes.map((r) => (
            <button
              key={r.id}
              onClick={() => toggleRoute(r.id)}
              className={cn(
                "text-[10px] px-2 py-1 rounded border transition-colors cursor-pointer",
                selectedRoutes.includes(r.id)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:bg-muted border-border"
              )}
            >
              {r.originPortName} → {r.destinationPortName}
            </button>
          ))}
        </div>
        {selectedRoutes.length < 2 ? (
          <p className="text-xs text-muted-foreground">Select at least 2 routes to compare</p>
        ) : (
          <p className="text-[10px] text-muted-foreground mb-3">
            Showing {selectedRoutes.length} routes — feature compares vessel class behavior per route.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
