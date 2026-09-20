"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LighteragePlanResult } from "@/services/lighterage/optimizer";
import { Info } from "lucide-react";

export function LighterageOptimizerSection({ result }: { result: LighteragePlanResult }) {
  if (!result.requiresLighterage) {
    return (
      <Card className="border-emerald-500/30">
        <CardHeader className="bg-emerald-500/5 pb-4">
          <CardTitle className="text-sm font-medium text-emerald-500 flex justify-between items-center">
            Lighterage & Parceling
            <Badge className="bg-emerald-500 text-white">Direct Discharge</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Vessel draft is sufficient for direct discharge at the destination port. No lighterage required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30">
      <CardHeader className="bg-amber-500/5 pb-4">
        <CardTitle className="text-sm font-medium text-amber-500 flex justify-between items-center">
          Dynamic Lighterage & Parceling Optimizer
          <Badge className="bg-amber-500 text-white">Lighterage Required</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground mb-4">
          Destination port has draft restrictions. Lighterage operations at {result.anchorageLocation} are necessary to reach safe draft.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 border rounded-lg bg-background">
            <p className="text-xs text-muted-foreground mb-1">Discharge at Anchorage</p>
            <p className="text-lg font-bold">{result.motherVesselDischargeMt.toLocaleString()} MT</p>
          </div>
          <div className="p-3 border rounded-lg bg-background">
            <p className="text-xs text-muted-foreground mb-1">Lighter Vessels</p>
            <p className="text-lg font-bold">{result.lighterVesselCount} x {result.lighterVesselType}</p>
          </div>
          <div className="p-3 border rounded-lg bg-background">
            <p className="text-xs text-muted-foreground mb-1">Est. Extra Time</p>
            <p className="text-lg font-bold text-amber-500">+{result.estimatedExtraTimeDays} Days</p>
          </div>
          <div className="p-3 border rounded-lg bg-background border-amber-500/50">
            <p className="text-xs text-amber-500/80 mb-1">Est. Lighterage Cost</p>
            <p className="text-lg font-bold text-amber-500">${result.estimatedLighterageCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 rounded-lg text-xs text-amber-700 dark:text-amber-400">
          <strong>Insight:</strong> Factoring in this lighterage cost, consider if splitting the cargo into two smaller vessels (e.g., Supramax) from the origin is more cost-effective than using a Capesize.
        </div>
      </CardContent>
    </Card>
  );
}
