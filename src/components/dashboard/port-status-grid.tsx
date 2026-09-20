"use client";

import Link from "next/link";
import { Panel, PanelHeader, Tag } from "@/components/design-system/primitives";
import type { PortStatusRow } from "@/data/seed/dashboard-data";

interface PortStatusGridProps {
  data: PortStatusRow[];
}

const congestionConfig: Record<
  string,
  { color: string; tagVariant: "green" | "amber" | "red" | "default" }
> = {
  low: { color: "var(--color-positive)", tagVariant: "green" },
  moderate: { color: "var(--color-warning)", tagVariant: "amber" },
  high: { color: "var(--color-danger)", tagVariant: "red" },
  severe: { color: "var(--color-danger)", tagVariant: "red" },
};

export function PortStatusGrid({ data }: PortStatusGridProps) {
  return (
    <Panel>
      <PanelHeader>
        <div className="flex items-center gap-3">
          <h3
            className="text-[13px] font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            East Coast India — Port Status
          </h3>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--color-text-dim)" }}
          >
            Updated {data[0]?.lastUpdated}
          </span>
        </div>
        <Link
          href="/ports"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Explore All Ports &amp; Berths →
        </Link>
      </PanelHeader>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.map((port) => {
            const config = congestionConfig[port.congestion] || congestionConfig.low;
            return (
              <div
                key={port.id}
                className="p-3 rounded-md transition-colors"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${config.color}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {port.name}
                    </span>
                    <span
                      className="text-[10px] font-mono ml-1.5"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {port.code}
                    </span>
                  </div>
                  <Tag variant={config.tagVariant}>{port.congestion}</Tag>
                </div>

                {/* Berth occupancy bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] mb-0.5">
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Berths
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {port.berthAvailable}/{port.totalBerths} free
                    </span>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--color-bg-elevated)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${port.berthOccupancy}%`,
                        background: config.color,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Draft
                    </span>
                    <span
                      className="font-mono font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {port.draftLimit}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Turnaround
                    </span>
                    <span
                      className="font-mono font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {port.turnaroundDays}d
                    </span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span style={{ color: "var(--color-text-dim)" }}>
                      Max vessel
                    </span>
                    <Tag variant="blue">{port.maxVesselClass}</Tag>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
