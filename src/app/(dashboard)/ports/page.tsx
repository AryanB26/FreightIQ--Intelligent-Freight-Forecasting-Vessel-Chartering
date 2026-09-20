"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { allPorts } from "@/data/seed/ports";
import { getPortInfrastructure } from "@/data/seed/port-infrastructure";
import type { Port } from "@/types";

const congestionColor: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50",
  moderate: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
  severe: "text-red-700 bg-red-100",
};

const statusColor: Record<string, string> = {
  operational: "text-emerald-600",
  restricted: "text-amber-600",
  closed: "text-red-600",
};

export default function PortsPage() {
  const [selectedPort, setSelectedPort] = useState<Port>(allPorts[0]);
  const infra = getPortInfrastructure(selectedPort.id);

  const destPorts = allPorts.filter((p) => p.isDestination);
  const originPorts = allPorts.filter((p) => !p.isDestination);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Port Intelligence</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Infrastructure constraints, congestion levels, and berth availability</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Port List */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">East Coast India</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {destPorts.map((port) => (
                <button
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedPort.id === port.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{port.name}</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", congestionColor[port.congestionLevel])}>
                      {port.congestionLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Draft: {port.maxDraft}m · Berths: {port.berthCount}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Origin Ports</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {originPorts.map((port) => (
                <button
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm border-b last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
                    selectedPort.id === port.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{port.name}</span>
                    <span className="text-[10px] text-muted-foreground">{port.country}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Port Detail Panel */}
        <div className="col-span-9 space-y-4">
          {/* Header */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{selectedPort.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedPort.country} · {selectedPort.region} · {selectedPort.latitude.toFixed(2)}°, {selectedPort.longitude.toFixed(2)}°</p>
                </div>
                <div className="flex items-center gap-2">
                  {infra && (
                    <Badge variant="outline" className={cn("text-xs", statusColor[infra.operationalStatus])}>
                      {infra.operationalStatus}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("text-xs", congestionColor[selectedPort.congestionLevel])}>
                    Congestion: {selectedPort.congestionLevel}
                  </Badge>
                </div>
              </div>
              {infra && <p className="text-xs text-muted-foreground mt-2">{infra.statusNote}</p>}
            </CardContent>
          </Card>

          {/* Constraints Grid */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Max LOA", value: `${selectedPort.maxLOA}m` },
              { label: "Max Beam", value: `${selectedPort.maxBeam}m` },
              { label: "Max Draft", value: `${selectedPort.maxDraft}m` },
              { label: "Handling Rate", value: `${selectedPort.cargoHandlingRate.toLocaleString()} t/hr` },
            ].map((item) => (
              <Card key={item.label} className="py-3">
                <CardContent className="px-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold font-mono mt-0.5">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Infrastructure Details */}
          {infra && (
            <div className="grid grid-cols-2 gap-4">
              {/* Berths */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Berth Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {infra.berths.map((berth) => (
                      <div key={berth.id} className="flex items-center justify-between p-2 rounded border text-xs">
                        <div>
                          <span className="font-medium">{berth.name}</span>
                          <span className="text-muted-foreground ml-2 font-mono">
                            LOA {berth.maxLOA}m · Draft {berth.maxDraft}m · {berth.maxDWT.toLocaleString()} DWT
                          </span>
                        </div>
                        <span className={cn("text-[10px] font-medium", berth.isOccupied ? "text-red-600" : "text-emerald-600")}>
                          {berth.isOccupied ? "Occupied" : "Available"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Operations & Restrictions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Operations & Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pilotage</span>
                      <span className="font-medium">{infra.pilotageRequired ? "Required" : "Optional"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tugboats</span>
                      <span className="font-medium font-mono">{infra.tugboatCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tidal Windows</span>
                      <span className="font-medium font-mono">{infra.tidalWindows}h/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monsoon Impact</span>
                      <span className="font-medium font-mono">{infra.monsoonImpact}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Turnaround</span>
                      <span className="font-medium font-mono">{selectedPort.avgTurnaroundDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timezone</span>
                      <span className="font-medium text-[10px]">{selectedPort.timezone}</span>
                    </div>
                  </div>

                  {infra.draftRestrictions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Draft Restrictions</p>
                        {infra.draftRestrictions.map((dr, i) => (
                          <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 mt-1">
                            <span className="font-medium text-amber-700">{dr.season}:</span>{" "}
                            <span className="font-mono">Draft limited to {dr.restrictedDraft}m</span>
                            <span className="text-muted-foreground ml-1">— {dr.reason}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Compatible Vessel Classes</p>
                    <div className="flex gap-1.5 mt-1">
                      {selectedPort.vesselClasses.map((vc) => (
                        <Badge key={vc} variant="secondary" className="text-xs">{vc}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cargo Facilities */}
          {infra && infra.cargoFacilities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cargo Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {infra.cargoFacilities.map((cf, i) => (
                    <div key={i} className="border rounded-lg p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{cf.type.replace("_", " ")}</span>
                        <span className="font-mono text-primary">{cf.handlingRate.toLocaleString()} t/hr</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Storage</span>
                        <span className="font-mono">{cf.storageCapacity.toLocaleString()}t</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cf.equipment.map((eq) => (
                          <Badge key={eq} variant="outline" className="text-[9px]">{eq.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
