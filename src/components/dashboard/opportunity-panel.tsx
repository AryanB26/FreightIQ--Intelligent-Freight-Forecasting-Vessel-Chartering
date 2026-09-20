"use client";

import { Panel, PanelHeader, Tag } from "@/components/design-system/primitives";
import type { MarketOpportunity } from "@/data/seed/dashboard-data";

interface OpportunityPanelProps {
  data: MarketOpportunity[];
}

const typeConfig: Record<
  string,
  { color: string; tagVariant: "green" | "amber" | "blue" | "red" | "violet" }
> = {
  favorable_entry: { color: "var(--color-positive)", tagVariant: "green" },
  rising_freight: { color: "var(--color-warning)", tagVariant: "amber" },
  declining_freight: { color: "var(--color-blue)", tagVariant: "blue" },
  high_volatility: { color: "var(--color-warning)", tagVariant: "amber" },
  congestion_risk: { color: "var(--color-danger)", tagVariant: "red" },
};

const urgencyConfig: Record<string, { tagVariant: "red" | "amber" | "default" }> = {
  high: { tagVariant: "red" },
  medium: { tagVariant: "amber" },
  low: { tagVariant: "default" },
};

export function OpportunityPanel({ data }: OpportunityPanelProps) {
  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Chartering Opportunities
        </h3>
      </PanelHeader>
      <div className="p-3 space-y-2">
        {data.map((opp) => {
          const config = typeConfig[opp.type] || typeConfig.favorable_entry;
          const urgency = urgencyConfig[opp.urgency] || urgencyConfig.low;
          return (
            <div
              key={opp.id}
              className="p-3 rounded-md transition-colors"
              style={{ border: "1px solid var(--color-border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {config.color === "var(--color-positive)"
                      ? "↓"
                      : config.color === "var(--color-warning)"
                      ? "↑"
                      : "↓"}
                  </span>
                  <span
                    className="text-[12px] font-medium leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {opp.title}
                  </span>
                </div>
                <Tag variant={urgency.tagVariant}>{opp.urgency}</Tag>
              </div>
              <p
                className="text-[11px] leading-relaxed ml-7"
                style={{ color: "var(--color-text-muted)" }}
              >
                {opp.description}
              </p>
              <div className="flex items-center gap-3 mt-2 ml-7">
                {opp.route && (
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    Route: {opp.route}
                  </span>
                )}
                {opp.vesselClass && (
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    Class: {opp.vesselClass}
                  </span>
                )}
                {opp.potentialSaving && (
                  <span
                    className="text-[10px] font-mono font-medium"
                    style={{ color: "var(--color-positive)" }}
                  >
                    Est. savings: ${opp.potentialSaving.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
