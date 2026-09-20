"use client";

import { Panel, PanelHeader, Tag, RiskBadge } from "@/components/design-system/primitives";

interface CharterRecommendation {
  route: string;
  totalCargoTonnes: number;
  recommendedStrategy: string;
  voyageCount: number;
  coveragePercent: number;
  strategyScore: number;
  estimatedCost: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

const RECOMMENDATIONS: CharterRecommendation[] = [
  {
    route: "Australia → Paradip",
    totalCargoTonnes: 300000,
    recommendedStrategy: "4 × Panamax",
    voyageCount: 4,
    coveragePercent: 100,
    strategyScore: 86,
    estimatedCost: 2850000,
    riskLevel: "medium",
  },
  {
    route: "Indonesia → Visakhapatnam",
    totalCargoTonnes: 150000,
    recommendedStrategy: "3 × Supramax",
    voyageCount: 3,
    coveragePercent: 100,
    strategyScore: 82,
    estimatedCost: 1420000,
    riskLevel: "low",
  },
];

export function CharterRecommendationWidget() {
  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Charter Recommendations
        </h3>
        <a
          href="/charter-planner"
          className="text-[10px] font-medium"
          style={{ color: "var(--color-cyan)" }}
        >
          View Plans →
        </a>
      </PanelHeader>
      <div className="p-3 space-y-2">
        {RECOMMENDATIONS.map((rec, idx) => (
          <div
            key={idx}
            className="p-3 rounded-md transition-colors"
            style={{ border: "1px solid var(--color-border)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p
                  className="text-[12px] font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {rec.route}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {(rec.totalCargoTonnes / 1000).toFixed(0)}K MT
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {rec.recommendedStrategy}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {rec.voyageCount} voyages
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Coverage:{" "}
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {rec.coveragePercent}%
                  </span>
                </span>
                <RiskBadge level={rec.riskLevel.toUpperCase() as any} />
              </div>
              <div className="flex items-center gap-1">
                <span
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Score:
                </span>
                <span
                  className="text-[14px] font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-cyan)",
                  }}
                >
                  {rec.strategyScore}
                </span>
              </div>
            </div>

            <div
              className="mt-2 pt-2 flex items-center justify-between"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <span
                className="text-[10px]"
                style={{ color: "var(--color-text-dim)" }}
              >
                Est. Cost:
              </span>
              <span
                className="text-[12px] font-mono font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                ${rec.estimatedCost.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
