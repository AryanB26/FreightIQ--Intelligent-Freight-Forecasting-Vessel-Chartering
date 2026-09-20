"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Panel, PanelHeader, Tag, DataModeBadge } from "@/components/design-system/primitives";
import type { FleetIdleOverview, VesselIdleSummary, IdleAction } from "@/types/idle-vessel";

const ACTION_CONFIG: Record<IdleAction, { label: string; tagVariant: "green" | "blue" | "amber" | "default" }> = {
  TAKE_ALTERNATIVE: { label: "FIND EMPLOYMENT", tagVariant: "green" },
  REPOSITION: { label: "REPOSITION", tagVariant: "blue" },
  WAIT: { label: "WAIT", tagVariant: "amber" },
  REASSESS: { label: "REASSESS", tagVariant: "default" },
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--color-positive)",
  watch: "var(--color-warning)",
  idle_risk: "var(--color-warning)",
  high: "var(--color-danger)",
};

export function IdleFleetWidget() {
  const [overview, setOverview] = useState<FleetIdleOverview | null>(null);

  useEffect(() => {
    fetch("/api/idle/analyze?action=fleet")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setOverview(d.data);
      })
      .catch(() => {});
  }, []);

  if (!overview) return null;

  const atRiskVessels = overview.vesselSummaries.filter(
    (v) => v.status === "idle" || v.status === "at_risk"
  );

  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Idle Fleet
        </h3>
        <Link
          href="/idle-vessels"
          className="text-[10px] font-medium"
          style={{ color: "var(--color-cyan)" }}
        >
          Full Analysis →
        </Link>
      </PanelHeader>
      <div className="p-3 space-y-2">
        {/* Mini KPIs */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { label: "Idle", value: overview.idleVessels, color: "var(--color-text-primary)" },
            { label: "High Risk", value: overview.highRiskVessels, color: overview.highRiskVessels > 0 ? "var(--color-danger)" : "var(--color-text-primary)" },
            { label: "Avg Risk", value: overview.averageIdleRisk, color: "var(--color-text-primary)" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="text-center p-2 rounded-md"
              style={{ background: "var(--color-bg)" }}
            >
              <p
                className="text-[16px] font-bold"
                style={{ fontFamily: "var(--font-mono)", color: kpi.color }}
              >
                {kpi.value}
              </p>
              <p
                className="text-[9px] uppercase tracking-wider"
                style={{ color: "var(--color-text-dim)" }}
              >
                {kpi.label}
              </p>
            </div>
          ))}
        </div>

        {/* Vessel list */}
        {atRiskVessels.slice(0, 4).map((v) => {
          const actionConfig = ACTION_CONFIG[v.recommendedAction] ?? ACTION_CONFIG.WAIT;
          return (
            <div
              key={v.vesselId}
              className="flex items-center justify-between p-2 rounded-md transition-colors"
              style={{ border: "1px solid var(--color-border)" }}
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
                  {v.vesselName}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {v.vesselClass} · Idle: ~{v.expectedIdleDays}d
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{ color: RISK_COLOR[v.idleRiskLevel] ?? "var(--color-text-muted)" }}
                >
                  {v.idleRiskScore}
                </span>
                <Tag variant={actionConfig.tagVariant}>{actionConfig.label}</Tag>
              </div>
            </div>
          );
        })}

        {atRiskVessels.length === 0 && (
          <p
            className="text-[11px] text-center py-3"
            style={{ color: "var(--color-text-dim)" }}
          >
            No vessels at risk
          </p>
        )}
      </div>
    </Panel>
  );
}
