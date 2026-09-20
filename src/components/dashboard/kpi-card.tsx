"use client";

import { CompactCard } from "@/components/design-system/primitives";
import type { DashboardKPI } from "@/types";

interface KPICardProps {
  kpi: DashboardKPI;
}

export function KPICard({ kpi }: KPICardProps) {
  const trendColor = {
    rising: "var(--color-positive)",
    falling: "var(--color-danger)",
    stable: "var(--color-text-dim)",
    volatile: "var(--color-warning)",
  }[kpi.trend];

  const trendIcon = {
    rising: "↑",
    falling: "↓",
    stable: "→",
    volatile: "↕",
  }[kpi.trend];

  return (
    <CompactCard>
      <p
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {kpi.label}
      </p>
      <p
        className="text-[20px] font-bold mt-1"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-primary)",
        }}
      >
        {kpi.value}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <span
          className="text-[10px] font-medium"
          style={{
            fontFamily: "var(--font-mono)",
            color: trendColor,
          }}
        >
          {trendIcon} {kpi.change > 0 ? "+" : ""}
          {kpi.change}
        </span>
        <span
          className="text-[10px]"
          style={{ color: "var(--color-text-dim)" }}
        >
          {kpi.changeLabel}
        </span>
      </div>
    </CompactCard>
  );
}
