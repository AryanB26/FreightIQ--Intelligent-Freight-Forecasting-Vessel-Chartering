"use client";

import { Panel, PanelHeader } from "@/components/design-system/primitives";
import type { RiskSummaryItem } from "@/data/seed/dashboard-data";

interface RiskPanelProps {
  data: RiskSummaryItem[];
}

const severityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "var(--color-positive)", label: "Low" },
  medium: { color: "var(--color-warning)", label: "Med" },
  high: { color: "var(--color-danger)", label: "High" },
};

const trendIcon: Record<string, { icon: string; color: string }> = {
  improving: { icon: "↓", color: "var(--color-positive)" },
  worsening: { icon: "↑", color: "var(--color-danger)" },
  stable: { icon: "→", color: "var(--color-text-dim)" },
};

export function RiskPanel({ data }: RiskPanelProps) {
  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Risk Summary
        </h3>
      </PanelHeader>
      <div className="p-3 space-y-1">
        {data.map((risk) => {
          const sev = severityConfig[risk.severity];
          const tr = trendIcon[risk.trend];
          return (
            <div
              key={risk.id}
              className="flex items-start gap-3 p-2.5 rounded-md transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                style={{ background: sev.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {risk.title}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: tr.color }}
                  >
                    {tr.icon}
                  </span>
                </div>
                <p
                  className="text-[11px] mt-0.5 leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {risk.detail}
                </p>
              </div>
              <span
                className="text-[10px] font-mono shrink-0 mt-0.5"
                style={{ color: "var(--color-text-dim)" }}
              >
                {risk.categoryLabel}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
