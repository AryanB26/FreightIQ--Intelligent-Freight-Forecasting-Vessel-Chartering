"use client";

import { cn } from "@/lib/utils";
import type { MarketOverview } from "@/data/seed/dashboard-data";

interface MarketOverviewBarProps {
  data: MarketOverview;
}

export function MarketOverviewBar({ data }: MarketOverviewBarProps) {
  const statusConfig = {
    bullish: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
    bearish: { color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
    neutral: { color: "text-slate-700", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-500" },
  }[data.status];

  return (
    <div className={cn("rounded-lg border p-3 flex flex-col md:flex-row md:items-center gap-3", statusConfig.bg)}>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", statusConfig.dot)} />
        <span className={cn("text-sm font-semibold", statusConfig.color)}>{data.statusLabel}</span>
      </div>
      <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{data.trendDescription}</p>
      <div className="flex items-center gap-4 text-xs shrink-0">
        <span className="font-mono text-muted-foreground">
          Vol: <span className="font-medium text-foreground">{data.volatilityPercent}%</span>
        </span>
        <span className="font-mono text-muted-foreground">
          Routes: <span className="font-medium text-foreground">{data.activeRoutes}</span>
        </span>
        <span className="font-mono text-muted-foreground">
          Alerts: <span className="font-medium text-foreground">{data.congestionAlerts}</span>
        </span>
        <span className="font-mono text-muted-foreground">
          Confidence: <span className="font-medium text-foreground">{data.forecastConfidence}%</span>
        </span>
      </div>
    </div>
  );
}
