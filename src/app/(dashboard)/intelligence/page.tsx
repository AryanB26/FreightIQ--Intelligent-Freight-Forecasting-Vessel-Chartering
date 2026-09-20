"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Panel, PanelHeader, DataModeBadge, Tag, StatusDot } from "@/components/design-system/primitives";
import { allPorts } from "@/data/seed/ports";
import { sampleVesselPositions } from "@/data/seed/vessel-positions";
import { indianOceanCables } from "@/data/seed/submarine-cables";
import { PortInfoPanel, VesselInfoPanel } from "@/components/maritime/info-panels";
import type { VesselClass } from "@/types";

const MaritimeGlobe = dynamic(
  () => import("@/components/maritime/maritime-globe").then((m) => m.MaritimeGlobe),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full rounded-lg flex items-center justify-center"
        style={{ background: "var(--color-bg-raised)" }}
      >
        <div className="text-center">
          <div
            className="h-8 w-8 border-2 rounded-full animate-spin mx-auto mb-2"
            style={{
              borderColor: "var(--color-cyan)",
              borderTopColor: "transparent",
            }}
          />
          <p
            className="text-[12px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading 3D Maritime Globe...
          </p>
        </div>
      </div>
    ),
  }
);

const VESSEL_CLASSES: VesselClass[] = ["Handysize", "Supramax", "Panamax", "Capesize"];
const STATUS_OPTIONS = ["underway", "at_anchor", "moored"];

const vesselClassColors: Record<string, string> = {
  Capesize: "var(--color-danger)",
  Panamax: "var(--color-warning)",
  Supramax: "var(--color-positive)",
  Handysize: "var(--color-blue)",
};

const statusDotMap: Record<string, "green" | "amber" | "cyan"> = {
  underway: "green",
  at_anchor: "amber",
  moored: "cyan",
};

export default function IntelligencePage() {
  const [selectedPortId, setSelectedPortId] = useState<string | null>(null);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [focusIndia, setFocusIndia] = useState(false);
  const [showCables, setShowCables] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [vesselClassFilter, setVesselClassFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPort = selectedPortId ? allPorts.find((p) => p.id === selectedPortId) : null;
  const selectedVessel = selectedVesselId ? sampleVesselPositions.find((v) => v.vesselId === selectedVesselId) : null;

  const handlePortSelect = useCallback((id: string | null) => {
    setSelectedPortId(id);
    if (id) setSelectedVesselId(null);
  }, []);

  const handleVesselSelect = useCallback((id: string | null) => {
    setSelectedVesselId(id);
    if (id) setSelectedPortId(null);
  }, []);

  const toggleVesselClass = (vc: string) => {
    setVesselClassFilter((prev) =>
      prev.includes(vc) ? prev.filter((c) => c !== vc) : [...prev, vc]
    );
  };

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filteredVessels = sampleVesselPositions.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.vesselClass.toLowerCase().includes(q) ||
      v.destination.toLowerCase().includes(q)
    );
  });

  const indianPorts = allPorts.filter((p) => p.isDestination);
  const originPortsList = allPorts.filter((p) => !p.isDestination);

  return (
    <div className="h-[calc(100vh-2.5rem)] flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-raised)" }}
      >
        <div>
          <h1
            className="text-[14px] font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            3D Maritime Intelligence
          </h1>
          <p
            className="text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Interactive globe — ports, vessels, routes, and infrastructure
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Filters */}
        <div
          className="w-56 overflow-y-auto shrink-0 p-3 space-y-3"
          style={{
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-bg-raised)",
          }}
        >
          {/* Search */}
          <div>
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Vessel, port, or route..."
              className="mt-1 input-field text-[11px]"
            />
          </div>

          {/* Camera Controls */}
          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Camera
            </label>
            <div className="flex gap-1">
              {[
                { label: "Focus India", active: focusIndia, onClick: () => setFocusIndia(true) },
                { label: "Global", active: !focusIndia, onClick: () => setFocusIndia(false) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  className="flex-1 text-[10px] font-medium px-2 py-1.5 rounded-md transition-colors"
                  style={{
                    background: btn.active ? "rgba(6, 182, 212, 0.12)" : "var(--color-bg)",
                    color: btn.active ? "var(--color-cyan)" : "var(--color-text-secondary)",
                    border: btn.active
                      ? "1px solid rgba(6, 182, 212, 0.25)"
                      : "1px solid var(--color-border)",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layer Toggles */}
          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Layers
            </label>
            {[
              { label: "Active Routes", checked: showRoutes, onChange: setShowRoutes },
              { label: "Submarine Cables", checked: showCables, onChange: setShowCables },
            ].map((layer) => (
              <label
                key={layer.label}
                className="flex items-center gap-2 text-[11px] font-medium cursor-pointer"
                style={{ color: "var(--color-text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={layer.checked}
                  onChange={(e) => layer.onChange(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: "var(--color-cyan)" }}
                />
                {layer.label} ({layer.checked ? "ON" : "OFF"})
              </label>
            ))}
          </div>

          {/* Vessel Class Filter */}
          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Vessel Class
            </label>
            <div className="flex flex-wrap gap-1">
              {VESSEL_CLASSES.map((vc) => {
                const isActive = vesselClassFilter.includes(vc);
                const color = vesselClassColors[vc] || "var(--color-text-secondary)";
                return (
                  <button
                    key={vc}
                    onClick={() => toggleVesselClass(vc)}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded border transition-colors"
                    style={{
                      background: isActive ? `${color}15` : "var(--color-bg)",
                      color: isActive ? color : "var(--color-text-secondary)",
                      borderColor: isActive ? `${color}40` : "var(--color-border)",
                    }}
                  >
                    {vc}
                  </button>
                );
              })}
              {vesselClassFilter.length > 0 && (
                <button
                  onClick={() => setVesselClassFilter([])}
                  className="text-[9px] px-1.5 py-0.5 rounded border font-medium"
                  style={{
                    background: "var(--color-bg)",
                    color: "var(--color-text-muted)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Status
            </label>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map((status) => {
                const isActive = statusFilter.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className="text-[9px] font-medium px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1"
                    style={{
                      background: isActive ? "rgba(6, 182, 212, 0.1)" : "var(--color-bg)",
                      color: isActive ? "var(--color-cyan)" : "var(--color-text-secondary)",
                      borderColor: isActive ? "rgba(6, 182, 212, 0.25)" : "var(--color-border)",
                    }}
                  >
                    <StatusDot status={statusDotMap[status] || "cyan"} />
                    {status.replace("_", " ")}
                  </button>
                );
              })}
              {statusFilter.length > 0 && (
                <button
                  onClick={() => setStatusFilter([])}
                  className="text-[9px] px-1.5 py-0.5 rounded border font-medium"
                  style={{
                    background: "var(--color-bg)",
                    color: "var(--color-text-muted)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Port List */}
          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Indian East Coast Ports ({indianPorts.length})
            </label>
            <div className="space-y-0.5">
              {indianPorts.map((port) => (
                <button
                  key={port.id}
                  onClick={() => handlePortSelect(selectedPortId === port.id ? null : port.id)}
                  className="w-full text-left text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 hover:bg-[var(--color-bg-elevated)]"
                  style={{
                    background: selectedPortId === port.id ? "rgba(6, 182, 212, 0.1)" : "transparent",
                    color: selectedPortId === port.id ? "var(--color-cyan)" : "var(--color-text-primary)",
                  }}
                >
                  <span className="font-medium">{port.name}</span>
                  <span className="opacity-70 text-[9px]">
                    {port.congestionLevel === "high" ? "🔴" : port.congestionLevel === "moderate" ? "🟡" : "🟢"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Origin Ports ({originPortsList.length})
            </label>
            <div className="space-y-0.5">
              {originPortsList.map((port) => (
                <button
                  key={port.id}
                  onClick={() => handlePortSelect(selectedPortId === port.id ? null : port.id)}
                  className="w-full text-left text-[11px] px-2 py-1 rounded transition-colors hover:bg-[var(--color-bg-elevated)]"
                  style={{
                    background: selectedPortId === port.id ? "rgba(6, 182, 212, 0.1)" : "transparent",
                    color: selectedPortId === port.id ? "var(--color-cyan)" : "var(--color-text-primary)",
                  }}
                >
                  <span className="font-medium">{port.name}</span>
                  <span className="ml-1 opacity-70 text-[10px] text-[var(--color-text-muted)]">({port.country})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div
            className="space-y-1 pt-2"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <label
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Legend
            </label>
            <div className="space-y-1 text-[10px] font-medium" style={{ color: "var(--color-text-secondary)" }}>
              {[
                { color: "var(--color-blue)", label: "Indian ECoI Port" },
                { color: "var(--color-violet)", label: "Origin Port" },
                { color: "var(--color-positive)", label: "Underway" },
                { color: "var(--color-warning)", label: "At Anchor" },
                { color: "var(--color-cyan)", label: "Moored" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <StatusDot
                    status={
                      item.color === "var(--color-positive)"
                        ? "green"
                        : item.color === "var(--color-warning)"
                        ? "amber"
                        : "cyan"
                    }
                  />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Globe Area */}
        <div className="flex-1 relative overflow-hidden" style={{ background: "var(--color-bg)" }}>
          <MaritimeGlobe
            ports={allPorts}
            vessels={filteredVessels}
            cables={indianOceanCables}
            selectedPortId={selectedPortId}
            selectedVesselId={selectedVesselId}
            onPortSelect={handlePortSelect}
            onVesselSelect={handleVesselSelect}
            focusIndia={focusIndia}
            showCables={showCables}
            showRoutes={showRoutes}
            vesselClassFilter={vesselClassFilter}
            statusFilter={statusFilter}
          />

          {/* Floating Info Panels */}
          {selectedPort && (
            <div className="absolute top-4 right-4 z-20">
              <PortInfoPanel port={selectedPort} onClose={() => setSelectedPortId(null)} />
            </div>
          )}
          {selectedVessel && (
            <div className="absolute top-4 right-4 z-20">
              <VesselInfoPanel vessel={selectedVessel} onClose={() => setSelectedVesselId(null)} />
            </div>
          )}

          {/* Bottom Status Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div
              className="flex items-center justify-between px-4 py-2 rounded-lg shadow-md"
              style={{
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="flex items-center gap-5">
                {[
                  { label: "Vessels", value: filteredVessels.length, color: "var(--color-text-primary)" },
                  { label: "Underway", value: filteredVessels.filter((v) => v.status === "underway").length, color: "var(--color-positive)" },
                  { label: "At Port", value: filteredVessels.filter((v) => v.status !== "underway").length, color: "var(--color-blue)" },
                  { label: "Ports", value: allPorts.length, color: "var(--color-text-primary)" },
                  { label: "Routes", value: 8, color: "var(--color-text-primary)" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p
                      className="text-[9px] uppercase tracking-wider"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {stat.label}
                    </p>
                    <p
                      className="text-[13px] font-bold"
                      style={{ fontFamily: "var(--font-mono)", color: stat.color }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p
                  className="text-[9px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Click any port or vessel for details
                </p>
                <p
                  className="text-[9px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Scroll to zoom · Drag to rotate · Right-drag to pan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
