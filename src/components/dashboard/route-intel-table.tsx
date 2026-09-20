"use client";

import { DataTable } from "@/components/dashboard/data-table";
import { Tag } from "@/components/design-system/primitives";
import { TrendIndicator } from "@/components/dashboard/trend-indicator";
import type { RouteIntelligenceRow } from "@/data/seed/dashboard-data";

interface RouteIntelTableProps {
  data: RouteIntelligenceRow[];
}

const recConfig: Record<
  string,
  { tagVariant: "green" | "amber" | "blue" | "red" | "default" }
> = {
  charter_now: { tagVariant: "green" },
  wait: { tagVariant: "amber" },
  hedge: { tagVariant: "blue" },
  urgent: { tagVariant: "red" },
};

const congestionColor: Record<string, string> = {
  low: "var(--color-positive)",
  moderate: "var(--color-warning)",
  high: "var(--color-danger)",
};

export function RouteIntelTable({ data }: RouteIntelTableProps) {
  return (
    <DataTable
      columns={[
        {
          key: "origin",
          header: "Origin",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <div>
              <span style={{ color: "var(--color-text-primary)" }}>
                {String(row.origin)}
              </span>
              <span
                className="ml-1 text-[10px] font-mono"
                style={{ color: "var(--color-text-dim)" }}
              >
                {String(row.originCode)}
              </span>
            </div>
          ),
        },
        {
          key: "destination",
          header: "Destination",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <div>
              <span style={{ color: "var(--color-text-primary)" }}>
                {String(row.destination)}
              </span>
              <span
                className="ml-1 text-[10px] font-mono"
                style={{ color: "var(--color-text-dim)" }}
              >
                {String(row.destCode)}
              </span>
            </div>
          ),
        },
        {
          key: "vesselType",
          header: "Vessel",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <Tag variant="blue">{String(row.vesselType)}</Tag>
          ),
        },
        {
          key: "currentFreight",
          header: "Current $/t",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <span
              className="font-mono font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              ${String(row.currentFreight)}
            </span>
          ),
        },
        {
          key: "forecastFreight",
          header: "Forecast $/t",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <span
              className="font-mono"
              style={{ color: "var(--color-cyan)" }}
            >
              ${String(row.forecastFreight)}
            </span>
          ),
        },
        {
          key: "change7d",
          header: "7D Δ",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <TrendIndicator
              trend={Number(row.change7d) >= 0 ? "rising" : "falling"}
              value={Number(row.change7d)}
            />
          ),
        },
        {
          key: "forecast30d",
          header: "30D Forecast",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <span className="font-mono" style={{ color: "var(--color-text-secondary)" }}>
              ${String(row.forecast30d)}
            </span>
          ),
        },
        {
          key: "congestion",
          header: "Congestion",
          sortable: true,
          render: (row: Record<string, unknown>) => (
            <span
              className="text-[10px] font-medium capitalize"
              style={{
                color: congestionColor[String(row.congestion)] || "var(--color-text-secondary)",
              }}
            >
              {String(row.congestion)}
            </span>
          ),
        },
        {
          key: "recommendation",
          header: "Action",
          render: (row: Record<string, unknown>) => {
            const config = recConfig[String(row.recommendation)] || recConfig.wait;
            return (
              <Tag variant={config.tagVariant}>
                {String(row.recommendationLabel)}
              </Tag>
            );
          },
        },
      ]}
      data={data.map((r) => r as unknown as Record<string, unknown>)}
    />
  );
}
