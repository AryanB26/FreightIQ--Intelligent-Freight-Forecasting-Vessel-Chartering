import { getFreightRoutes } from "@/lib/market-data-store";

export interface TriangulationOpportunity {
  id: string;
  primaryLeg: { originPortId: string; destinationPortId: string };
  subsequentLegs: { originPortId: string; destinationPortId: string; cargoAvailable: boolean }[];
  totalDistanceNm: number;
  ballastDistanceNm: number;
  ballastPercentage: number;
  estimatedSavingsPerVoyage: number;
}

export function findTriangulationOpportunities(
  originPortId: string, 
  destinationPortId: string
): TriangulationOpportunity[] {
  const routes = getFreightRoutes();
  
  // Primary leg distance
  const primaryRoute = routes.find(r => r.originPortId === originPortId && r.destinationPortId === destinationPortId);
  const primaryDistance = primaryRoute?.distanceNm || 5000;

  // Mock finding triangulation routes based on the destination
  const opportunities: TriangulationOpportunity[] = [];

  // If going to India (e.g. Paradip), find a route from India to China or back to Origin
  if (destinationPortId.includes("paradip") || destinationPortId.includes("gangavaram") || destinationPortId.includes("haldia")) {
    // Opportunity 1: Triangular backhaul
    opportunities.push({
      id: `tri-${Date.now()}-1`,
      primaryLeg: { originPortId, destinationPortId },
      subsequentLegs: [
        { originPortId: destinationPortId, destinationPortId: "port-shanghai", cargoAvailable: true },
        { originPortId: "port-shanghai", destinationPortId: originPortId, cargoAvailable: false }
      ],
      totalDistanceNm: primaryDistance + 3500 + 4000,
      ballastDistanceNm: 4000,
      ballastPercentage: Math.round((4000 / (primaryDistance + 3500 + 4000)) * 100),
      estimatedSavingsPerVoyage: 120000
    });
    
    // Opportunity 2: Short-haul sublet then ballast
    opportunities.push({
      id: `tri-${Date.now()}-2`,
      primaryLeg: { originPortId, destinationPortId },
      subsequentLegs: [
        { originPortId: destinationPortId, destinationPortId: "port-chittagong", cargoAvailable: true },
        { originPortId: "port-chittagong", destinationPortId: originPortId, cargoAvailable: false }
      ],
      totalDistanceNm: primaryDistance + 500 + primaryDistance,
      ballastDistanceNm: primaryDistance,
      ballastPercentage: Math.round((primaryDistance / (primaryDistance * 2 + 500)) * 100),
      estimatedSavingsPerVoyage: 45000
    });
  } else {
    // Generic backhaul
    opportunities.push({
      id: `tri-${Date.now()}-gen`,
      primaryLeg: { originPortId, destinationPortId },
      subsequentLegs: [
        { originPortId: destinationPortId, destinationPortId: originPortId, cargoAvailable: true }
      ],
      totalDistanceNm: primaryDistance * 2,
      ballastDistanceNm: 0,
      ballastPercentage: 0,
      estimatedSavingsPerVoyage: 250000
    });
  }

  return opportunities;
}
