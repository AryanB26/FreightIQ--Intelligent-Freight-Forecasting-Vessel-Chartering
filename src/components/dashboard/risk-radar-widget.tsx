"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Panel, PanelHeader, Tag } from "@/components/design-system/primitives";

export function RiskRadarWidget() {
  const [disruptions, setDisruptions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/risk-intelligence/analyze?action=disruptions")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setDisruptions(d.data);
      })
      .catch(() => {});
  }, []);

  const activeCount = disruptions.filter((d) => d.status === "active").length;
  const monitoringCount = disruptions.filter((d) => d.status === "monitoring").length;
  const totalDelay = disruptions.reduce(
    (s, d) => s + d.estimatedDelayDays,
    0
  );

  return (
    <Panel>
      <PanelHeader>
        <h3
          className="text-[13px] font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Risk & Disruptions
        </h3>
        <Link
          href="/risks"
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
            { label: "Active", value: activeCount, color: "var(--color-danger)" },
            { label: "Monitoring", value: monitoringCount, color: "var(--color-warning)" },
            { label: "Est. Delay", value: `${totalDelay}d`, color: "var(--color-text-primary)" },
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

        {/* Disruption list */}
        {disruptions.slice(0, 4).map((d) => (
          <div
            key={d.id}
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
                {d.title}
              </p>
              <p
                className="text-[10px]"
                style={{ color: "var(--color-text-dim)" }}
              >
                +{d.estimatedDelayDays}d delay ·{" "}
                {d.isSimulated ? "SIMULATED" : "LIVE"}
              </p>
            </div>
            <Tag
              variant={
                d.status === "active" ? "red" : "amber"
              }
            >
              {d.status.toUpperCase()}
            </Tag>
          </div>
        ))}

        {disruptions.length === 0 && (
          <p
            className="text-[11px] text-center py-3"
            style={{ color: "var(--color-text-dim)" }}
          >
            No active disruptions
          </p>
        )}
      </div>
    </Panel>
  );
}
