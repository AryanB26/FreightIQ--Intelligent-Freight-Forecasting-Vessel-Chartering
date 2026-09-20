export interface LighteragePlanInput {
  vesselSizeMt: number;
  draftRequiredMeters: number;
  portMaxDraftMeters: number;
  cargoTotalMt: number;
}

export interface LighteragePlanResult {
  requiresLighterage: boolean;
  anchorageLocation: string;
  motherVesselDischargeMt: number;
  lighterVesselCount: number;
  lighterVesselType: string;
  lighterVesselCapacityMt: number;
  estimatedExtraTimeDays: number;
  estimatedLighterageCost: number;
}

export function optimizeLighterage(input: LighteragePlanInput): LighteragePlanResult {
  // Simple heuristic: if vessel draft > port draft, we need lighterage
  const requiresLighterage = input.draftRequiredMeters > input.portMaxDraftMeters;
  
  if (!requiresLighterage) {
    return {
      requiresLighterage: false,
      anchorageLocation: "N/A",
      motherVesselDischargeMt: 0,
      lighterVesselCount: 0,
      lighterVesselType: "N/A",
      lighterVesselCapacityMt: 0,
      estimatedExtraTimeDays: 0,
      estimatedLighterageCost: 0
    };
  }
  
  // Calculate how much needs to be discharged at anchorage
  // Roughly 1 meter of draft = ~10,000 MT for a Capesize, just as a mock heuristic
  const draftDifference = input.draftRequiredMeters - input.portMaxDraftMeters;
  const mtToDischarge = draftDifference * 10000; 
  const safeDischargeMt = Math.min(mtToDischarge, input.cargoTotalMt);
  
  const lighterCapacity = 5000; // 5k MT barges
  const bargesNeeded = Math.ceil(safeDischargeMt / lighterCapacity);
  
  return {
    requiresLighterage: true,
    anchorageLocation: "Sandheads Anchorage",
    motherVesselDischargeMt: safeDischargeMt,
    lighterVesselCount: bargesNeeded,
    lighterVesselType: "Barge (5,000 MT)",
    lighterVesselCapacityMt: lighterCapacity,
    estimatedExtraTimeDays: bargesNeeded * 0.5 + 1, // half day per barge + 1 day setup
    estimatedLighterageCost: bargesNeeded * 25000, // $25k per barge trip
  };
}
