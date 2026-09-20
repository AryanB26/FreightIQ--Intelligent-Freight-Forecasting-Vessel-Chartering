"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Port } from "@/types";
import type { VesselPosition } from "@/data/seed/vessel-positions";
import { portInfrastructure } from "@/data/seed/port-infrastructure";

interface PortInfoPanelProps {
  port: Port;
  onClose: () => void;
}

export function PortInfoPanel({ port, onClose }: PortInfoPanelProps) {
  const infra = portInfrastructure.find((p) => p.portId === port.id);
  const congestionColor =
    port.congestionLevel === "high" ? "bg-red-100 text-red-700" :
    port.congestionLevel === "moderate" ? "bg-amber-100 text-amber-700" :
    "bg-emerald-100 text-emerald-700";

  return (
    <Card className="w-80 shadow-lg border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">{port.name}</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>
        <p className="text-[10px] text-muted-foreground">{port.country} — {port.region}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Status</p>
            <Badge variant="outline" className={`text-[10px] border-0 ${congestionColor}`}>
              {port.congestionLevel.toUpperCase()}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Berths</p>
            <p className="font-mono font-bold">{port.berthCount}</p>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Max Draft</p>
            <p className="font-mono">{port.maxDraft}m</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Max LOA</p>
            <p className="font-mono">{port.maxLOA}m</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Handling</p>
            <p className="font-mono">{port.cargoHandlingRate.toLocaleString()} t/hr</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Turnaround</p>
            <p className="font-mono">{port.avgTurnaroundDays}d</p>
          </div>
        </div>

        {/* Vessel Classes */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Compatible Vessels</p>
          <div className="flex flex-wrap gap-1">
            {port.vesselClasses.map((vc) => (
              <Badge key={vc} variant="outline" className="text-[9px]">{vc}</Badge>
            ))}
          </div>
        </div>

        {/* Infrastructure Details */}
        {infra && (
          <>
            <div className="border-t pt-2">
              <p className="text-[10px] text-muted-foreground uppercase mb-1">Pilotage Required</p>
              <p className="font-mono">{infra.pilotageRequired ? "Yes" : "No"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Tugboats</p>
                <p className="font-mono">{infra.tugboatCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Tidal Windows</p>
                <p className="font-mono">{infra.tidalWindows}h/day</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Monsoon Impact</p>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-sm ${
                      i < infra.monsoonImpact ? "bg-amber-500" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Coordinates */}
        <div className="border-t pt-2">
          <p className="font-mono text-[10px] text-muted-foreground">
            {port.latitude.toFixed(4)}°N, {port.longitude.toFixed(4)}°E
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface VesselInfoPanelProps {
  vessel: VesselPosition;
  onClose: () => void;
}

export function VesselInfoPanel({ vessel, onClose }: VesselInfoPanelProps) {
  const statusColor =
    vessel.status === "underway" ? "bg-emerald-100 text-emerald-700" :
    vessel.status === "at_anchor" ? "bg-amber-100 text-amber-700" :
    vessel.status === "moored" ? "bg-blue-100 text-blue-700" :
    "bg-gray-100 text-gray-700";

  const classColor =
    vessel.vesselClass === "Capesize" ? "bg-red-100 text-red-700" :
    vessel.vesselClass === "Panamax" ? "bg-amber-100 text-amber-700" :
    vessel.vesselClass === "Supramax" ? "bg-emerald-100 text-emerald-700" :
    "bg-blue-100 text-blue-700";

  return (
    <Card className="w-80 shadow-lg border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">{vessel.name}</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
        </div>
        <div className="flex gap-1 mt-1">
          <Badge variant="outline" className={`text-[9px] border-0 ${classColor}`}>{vessel.vesselClass}</Badge>
          <Badge variant="outline" className={`text-[9px] border-0 ${statusColor}`}>
            {vessel.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">DWT</p>
            <p className="font-mono font-bold">{vessel.dwt.toLocaleString()} MT</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Speed</p>
            <p className="font-mono">{vessel.speed} kn</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Heading</p>
            <p className="font-mono">{vessel.heading}°</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Flag</p>
            <p className="font-mono">{vessel.flag}</p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Voyage</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px]">{vessel.name}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-mono text-[10px] font-bold">{vessel.destination}</span>
          </div>
          {vessel.eta && (
            <p className="text-[10px] text-muted-foreground mt-1">ETA: {vessel.eta}</p>
          )}
        </div>

        <div className="border-t pt-2">
          <p className="font-mono text-[10px] text-muted-foreground">
            {vessel.latitude.toFixed(4)}°, {vessel.longitude.toFixed(4)}°
          </p>
        </div>

        <p className="text-[9px] text-muted-foreground italic">DEMO / SIMULATED POSITION — Not live AIS data</p>
      </CardContent>
    </Card>
  );
}
