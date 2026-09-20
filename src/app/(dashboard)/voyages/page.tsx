"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dashboard/data-table";
import { sampleVesselPositions } from "@/data/seed/vessel-positions";
import { indianOceanCables } from "@/data/seed/submarine-cables";
import type { VesselPosition } from "@/data/seed/vessel-positions";

// Dynamic import to avoid SSR issues with Leaflet
const VesselTracker = dynamic(
  () => import("@/components/maps/vessel-tracker").then((m) => m.VesselTracker),
  { ssr: false, loading: () => <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center text-sm text-muted-foreground">Loading map...</div> }
);

const statusColors: Record<string, string> = {
  underway: "bg-emerald-100 text-emerald-700",
  at_anchor: "bg-amber-100 text-amber-700",
  moored: "bg-blue-100 text-blue-700",
  engaged: "bg-purple-100 text-purple-700",
  not_under_command: "bg-red-100 text-red-700",
};

export default function VoyagesPage() {
  const underway = sampleVesselPositions.filter((v) => v.status === "underway");
  const anchored = sampleVesselPositions.filter((v) => v.status === "at_anchor" || v.status === "moored");

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Voyage & Vessel Tracking</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live vessel positions, route intelligence, and submarine cable infrastructure</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vessels Tracked</p>
            <p className="text-xl font-bold font-mono">{sampleVesselPositions.length}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Underway</p>
            <p className="text-xl font-bold font-mono text-emerald-600">{underway.length}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">At Port / Anchor</p>
            <p className="text-xl font-bold font-mono text-blue-600">{anchored.length}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cable Systems</p>
            <p className="text-xl font-bold font-mono">{indianOceanCables.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vessel Tracker Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Indian Ocean — Vessel Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <VesselTracker vessels={sampleVesselPositions} cables={indianOceanCables} />
        </CardContent>
      </Card>

      {/* Vessel Fleet Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Fleet Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Vessel",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <div>
                    <span className="font-medium">{String(row.name)}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{String(row.vesselClass)}</span>
                  </div>
                ),
              },
              {
                key: "latitude",
                header: "Position",
                render: (row: Record<string, unknown>) => (
                  <span className="font-mono text-xs">
                    {Number(row.latitude).toFixed(2)}°, {Number(row.longitude).toFixed(2)}°
                  </span>
                ),
              },
              {
                key: "speed",
                header: "Speed",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <span className="font-mono text-xs">{Number(row.speed)} kn</span>
                ),
              },
              {
                key: "origin",
                header: "Origin",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <span className="text-xs text-muted-foreground">{String(row.origin || "Port Hedland")}</span>
                ),
              },
              {
                key: "destination",
                header: "Destination",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <span className="text-xs font-medium text-cyan-400">{String(row.destination)}</span>
                ),
              },
              {
                key: "cargo",
                header: "Cargo",
                render: (row: Record<string, unknown>) => (
                  <span className="text-xs">{String(row.cargo || "Dry Bulk")}</span>
                ),
              },
              {
                key: "eta",
                header: "ETA",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <span className="font-mono text-xs text-amber-400">{String(row.eta || "—")}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <Badge variant="outline" className={`text-[10px] border-0 ${statusColors[String(row.status)] || ""}`}>
                    {String(row.status).replace("_", " ")}
                  </Badge>
                ),
              },
              {
                key: "dwt",
                header: "DWT",
                sortable: true,
                render: (row: Record<string, unknown>) => (
                  <span className="font-mono text-xs">{Number(row.dwt).toLocaleString()}</span>
                ),
              },
            ]}
            data={sampleVesselPositions as unknown as Record<string, unknown>[]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
