"use client";

import Link from "next/link";
import { Panel, PanelHeader, Tag } from "@/components/design-system/primitives";
import type { DecisionCategory } from "@/services/decision-engine/types";

interface MarketEntrySignal {
  id: string;
  route: string;
  vesselClass: string;
  recommendation: DecisionCategory;
  score: number;
}

const DECISION_CONFIG: Record<
  DecisionCategory,
  { label: string; tagVariant: "green" | "amber" | "blue" | "default" }
> = {
  CHARTER_NOW: { label: "CHARTER NOW", tagVariant: "green" },
  WAIT: { label: "WAIT", tagVariant: "amber" },
  WATCH_MARKET: { label: "WATCH", tagVariant: "blue" },
  REASSESS: { label: "REASSESS", tagVariant: "default" },
};

const SIGNALS: MarketEntrySignal[] = [
  { id: "sig-1", route: "Australia → Paradip", vesselClass: "Panamax", recommendation: "CHARTER_NOW", score: 72 },
  { id: "sig-2", route: "Australia → Dhamra", vesselClass: "Supramax", recommendation: "WATCH_MARKET", score: 54 },
  { id: "sig-3", route: "Indonesia → Paradip", vesselClass: "Handysize", recommendation: "WAIT", score: 38 },
  { id: "sig-4", route: "US → East Coast India", vesselClass: "Panamax", recommendation: "WAIT", score: 35 },
  { id: "sig-5", route: "Mozambique → Gangavaram", vesselClass: "Supramax", recommendation: "WATCH_MARKET", score: 52 },
];

export function MarketEntrySignals() {
  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Market Entry Signals
        </h3>
        <Link
          href="/market-entry"
          className="text-[10px] font-medium"
          style={{ color: "var(--color-cyan)" }}
        >
          Full Analysis →
        </Link>
      </PanelHeader>
      <div className="p-3 space-y-1.5">
        {SIGNALS.map((signal) => {
          const config = DECISION_CONFIG[signal.recommendation];
          return (
            <div
              key={signal.id}
              className="flex items-center justify-between p-2 rounded-md transition-colors"
              style={{
                border: "1px solid var(--color-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-[11px] font-medium truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {signal.route}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {signal.vesselClass}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[11px] font-mono"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {signal.score}
                </span>
                <Tag variant={config.tagVariant}>{config.label}</Tag>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
