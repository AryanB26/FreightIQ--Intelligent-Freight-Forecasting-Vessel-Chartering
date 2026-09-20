export interface ShadowBooking {
  id: string;
  date: string;
  route: string;
  cargoTotalMt: number;
  actualExecution: {
    type: "Spot" | "COA" | "Multi-Voyage";
    costPerMt: number;
    totalCost: number;
    delayDays: number;
  };
  recommendedExecution: {
    type: "Spot" | "COA" | "Multi-Voyage";
    costPerMt: number;
    totalCost: number;
    delayDays: number;
  };
  opportunityCost: number;
  notes: string;
}

export function getShadowLedger(): ShadowBooking[] {
  return [
    {
      id: "sb-1001",
      date: "2023-11-15",
      route: "Port Hedland → Qingdao",
      cargoTotalMt: 150000,
      actualExecution: {
        type: "Spot",
        costPerMt: 12.5,
        totalCost: 1875000,
        delayDays: 2
      },
      recommendedExecution: {
        type: "Multi-Voyage",
        costPerMt: 10.8,
        totalCost: 1620000,
        delayDays: 0
      },
      opportunityCost: 255000,
      notes: "System recommended locking in a 3-voyage contract before rates spiked, but operations chose spot due to short-term budget limits."
    },
    {
      id: "sb-1002",
      date: "2023-12-04",
      route: "Newcastle → Paradip",
      cargoTotalMt: 80000,
      actualExecution: {
        type: "COA",
        costPerMt: 14.2,
        totalCost: 1136000,
        delayDays: 0
      },
      recommendedExecution: {
        type: "Spot",
        costPerMt: 13.0,
        totalCost: 1040000,
        delayDays: 0
      },
      opportunityCost: 96000,
      notes: "Locked into long-term COA right before rates dropped. System detected falling momentum."
    },
    {
      id: "sb-1003",
      date: "2024-01-22",
      route: "Tubarao → Rotterdam",
      cargoTotalMt: 170000,
      actualExecution: {
        type: "Spot",
        costPerMt: 8.5,
        totalCost: 1445000,
        delayDays: 0
      },
      recommendedExecution: {
        type: "Multi-Voyage",
        costPerMt: 7.2,
        totalCost: 1224000,
        delayDays: 0
      },
      opportunityCost: 221000,
      notes: "Missed Triangulation/Backhaul opportunity which would have subsidized this leg."
    }
  ];
}

export function getShadowLedgerSummary() {
  const ledger = getShadowLedger();
  const totalOpportunityCost = ledger.reduce((sum, item) => sum + item.opportunityCost, 0);
  
  return {
    totalOpportunityCost,
    totalBookings: ledger.length,
    averageCostPerBooking: totalOpportunityCost / ledger.length
  };
}
