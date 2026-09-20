// ============================================================
// FreightIQ — Port Infrastructure Seed Data (Phase 3)
// All values are DEMO/SAMPLE data, not real operational limits.
// ============================================================

import type { PortInfrastructure } from "@/types/port-vessel";

export const portInfrastructure: PortInfrastructure[] = [
  // ---- Indian East Coast Destination Ports ----
  {
    portId: "port-paradip",
    berths: [
      { id: "bp-01", name: "Iron Ore Berth 1", maxLOA: 290, maxBeam: 45, maxDraft: 16.5, maxDWT: 180000, cargoType: "iron_ore", isOccupied: false },
      { id: "bp-02", name: "Iron Ore Berth 2", maxLOA: 290, maxBeam: 45, maxDraft: 16.5, maxDWT: 180000, cargoType: "iron_ore", isOccupied: true },
      { id: "bp-03", name: "Coal Berth", maxLOA: 250, maxBeam: 40, maxDraft: 15.0, maxDWT: 100000, cargoType: "coal", isOccupied: false },
      { id: "bp-04", name: "Multi-Purpose Berth", maxLOA: 220, maxBeam: 35, maxDraft: 12.0, maxDWT: 60000, cargoType: "general", isOccupied: false },
    ],
    draftRestrictions: [
      { season: "Jun-Sep", restrictedDraft: 14.5, reason: "Monsoon swell reduces safe under-keel clearance" },
    ],
    cargoFacilities: [
      { type: "iron_ore", handlingRate: 4500, storageCapacity: 500000, equipment: ["ship_loaders", "conveyor", "stacker_reclaimer"] },
      { type: "coal", handlingRate: 3500, storageCapacity: 300000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Normal operations. Monsoon restrictions apply Jun-Sep.",
    pilotageRequired: true,
    tugboatCount: 8,
    tidalWindows: 16,
    monsoonImpact: 3,
  },
  {
    portId: "port-visakhapatnam",
    berths: [
      { id: "bv-01", name: "Deep Water Berth 1", maxLOA: 280, maxBeam: 45, maxDraft: 17.5, maxDWT: 160000, cargoType: "iron_ore", isOccupied: false },
      { id: "bv-02", name: "Deep Water Berth 2", maxLOA: 280, maxBeam: 45, maxDraft: 17.5, maxDWT: 160000, cargoType: "iron_ore", isOccupied: false },
      { id: "bv-03", name: "Coal Terminal", maxLOA: 260, maxBeam: 40, maxDraft: 16.0, maxDWT: 120000, cargoType: "coal", isOccupied: true },
      { id: "bv-04", name: "General Cargo Berth", maxLOA: 200, maxBeam: 32, maxDraft: 12.0, maxDWT: 50000, cargoType: "general", isOccupied: false },
      { id: "bv-05", name: "Fertilizer Berth", maxLOA: 190, maxBeam: 30, maxDraft: 11.5, maxDWT: 45000, cargoType: "fertilizer", isOccupied: false },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "iron_ore", handlingRate: 5000, storageCapacity: 600000, equipment: ["ship_loaders", "conveyor", "stacker_reclaimer", "wagon_tippler"] },
      { type: "coal", handlingRate: 4000, storageCapacity: 400000, equipment: ["ship_loaders", "conveyor"] },
      { type: "fertilizer", handlingRate: 2000, storageCapacity: 100000, equipment: ["cranes", "bagging_plant"] },
    ],
    operationalStatus: "operational",
    statusNote: "All berths operational. Best draft availability on East Coast.",
    pilotageRequired: true,
    tugboatCount: 12,
    tidalWindows: 18,
    monsoonImpact: 2,
  },
  {
    portId: "port-gangavaram",
    berths: [
      { id: "bg-01", name: "Deep Water Berth 1", maxLOA: 300, maxBeam: 50, maxDraft: 18.5, maxDWT: 200000, cargoType: "iron_ore", isOccupied: false },
      { id: "bg-02", name: "Deep Water Berth 2", maxLOA: 300, maxBeam: 50, maxDraft: 18.5, maxDWT: 200000, cargoType: "iron_ore", isOccupied: false },
      { id: "bg-03", name: "Coal Berth", maxLOA: 270, maxBeam: 42, maxDraft: 16.5, maxDWT: 140000, cargoType: "coal", isOccupied: true },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "iron_ore", handlingRate: 5500, storageCapacity: 700000, equipment: ["ship_loaders", "conveyor", "stacker_reclaimer"] },
      { type: "coal", handlingRate: 4200, storageCapacity: 350000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Deepest draft port on ECoI. Capesize fully operational.",
    pilotageRequired: true,
    tugboatCount: 10,
    tidalWindows: 20,
    monsoonImpact: 2,
  },
  {
    portId: "port-gopalpur",
    berths: [
      { id: "bgp-01", name: "Berth 1", maxLOA: 230, maxBeam: 35, maxDraft: 12.5, maxDWT: 60000, cargoType: "general", isOccupied: false },
      { id: "bgp-02", name: "Berth 2", maxLOA: 200, maxBeam: 32, maxDraft: 11.0, maxDWT: 40000, cargoType: "general", isOccupied: false },
    ],
    draftRestrictions: [
      { season: "Jun-Sep", restrictedDraft: 10.5, reason: "Monsoon silting reduces channel depth" },
    ],
    cargoFacilities: [
      { type: "general", handlingRate: 2500, storageCapacity: 80000, equipment: ["cranes"] },
    ],
    operationalStatus: "operational",
    statusNote: "Limited to Handysize/Supramax. Draft reduces in monsoon.",
    pilotageRequired: true,
    tugboatCount: 3,
    tidalWindows: 14,
    monsoonImpact: 4,
  },
  {
    portId: "port-dhamra",
    berths: [
      { id: "bd-01", name: "Deep Water Berth 1", maxLOA: 300, maxBeam: 50, maxDraft: 18.0, maxDWT: 200000, cargoType: "iron_ore", isOccupied: false },
      { id: "bd-02", name: "Coal Berth", maxLOA: 260, maxBeam: 42, maxDraft: 16.0, maxDWT: 120000, cargoType: "coal", isOccupied: true },
      { id: "bd-03", name: "Multi-Purpose", maxLOA: 230, maxBeam: 35, maxDraft: 14.0, maxDWT: 70000, cargoType: "general", isOccupied: false },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "iron_ore", handlingRate: 5000, storageCapacity: 600000, equipment: ["ship_loaders", "conveyor", "stacker_reclaimer"] },
      { type: "coal", handlingRate: 4000, storageCapacity: 350000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Modern port. Good Capesize access. Expanding capacity.",
    pilotageRequired: true,
    tugboatCount: 8,
    tidalWindows: 18,
    monsoonImpact: 3,
  },
  {
    portId: "port-sagar",
    berths: [
      { id: "bs-01", name: "LPG Terminal", maxLOA: 230, maxBeam: 36, maxDraft: 12.5, maxDWT: 65000, cargoType: "liquid", isOccupied: false },
      { id: "bs-02", name: "Container Berth", maxLOA: 250, maxBeam: 40, maxDraft: 14.0, maxDWT: 80000, cargoType: "container", isOccupied: true },
      { id: "bs-03", name: "General Cargo", maxLOA: 220, maxBeam: 35, maxDraft: 12.0, maxDWT: 55000, cargoType: "general", isOccupied: true },
    ],
    draftRestrictions: [
      { season: "Jun-Sep", restrictedDraft: 12.0, reason: "Monsoon reduces channel depth. Tidal windows critical." },
    ],
    cargoFacilities: [
      { type: "general", handlingRate: 3500, storageCapacity: 200000, equipment: ["cranes", "conveyor"] },
    ],
    operationalStatus: "restricted",
    statusNote: "High congestion. 12 vessels queued. Monsoon draft restrictions active.",
    pilotageRequired: true,
    tugboatCount: 6,
    tidalWindows: 10,
    monsoonImpact: 5,
  },
  {
    portId: "port-haldia",
    berths: [
      { id: "bh-01", name: "Coal Berth 1", maxLOA: 250, maxBeam: 40, maxDraft: 13.5, maxDWT: 85000, cargoType: "coal", isOccupied: false },
      { id: "bh-02", name: "Coal Berth 2", maxLOA: 250, maxBeam: 40, maxDraft: 13.5, maxDWT: 85000, cargoType: "coal", isOccupied: true },
      { id: "bh-03", name: "Container Terminal", maxLOA: 240, maxBeam: 38, maxDraft: 13.0, maxDWT: 70000, cargoType: "container", isOccupied: false },
      { id: "bh-04", name: "Liquid Terminal", maxLOA: 200, maxBeam: 32, maxDraft: 11.5, maxDWT: 45000, cargoType: "liquid", isOccupied: false },
    ],
    draftRestrictions: [
      { season: "Jun-Sep", restrictedDraft: 11.5, reason: "Monsoon reduces channel draft" },
    ],
    cargoFacilities: [
      { type: "coal", handlingRate: 3200, storageCapacity: 250000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Coal imports hub. Moderate congestion. Draft limited to 13.5m.",
    pilotageRequired: true,
    tugboatCount: 8,
    tidalWindows: 14,
    monsoonImpact: 4,
  },

  // ---- Origin Ports ----
  {
    portId: "port-port-hedland",
    berths: [
      { id: "bph-01", name: "Capesize Berth 1", maxLOA: 340, maxBeam: 65, maxDraft: 20.0, maxDWT: 250000, cargoType: "iron_ore", isOccupied: false },
      { id: "bph-02", name: "Capesize Berth 2", maxLOA: 340, maxBeam: 65, maxDraft: 20.0, maxDWT: 250000, cargoType: "iron_ore", isOccupied: true },
      { id: "bph-03", name: "Supramax Berth", maxLOA: 230, maxBeam: 38, maxDraft: 14.0, maxDWT: 80000, cargoType: "iron_ore", isOccupied: false },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "iron_ore", handlingRate: 8000, storageCapacity: 2000000, equipment: ["ship_loaders", "conveyor", "stacker_reclaimer", "wagon_tippler"] },
    ],
    operationalStatus: "operational",
    statusNote: "World-class iron ore terminal. Handles 300Mt/year.",
    pilotageRequired: true,
    tugboatCount: 14,
    tidalWindows: 20,
    monsoonImpact: 1,
  },
  {
    portId: "port-new-orleans",
    berths: [
      { id: "bno-01", name: "Grain Terminal", maxLOA: 280, maxBeam: 45, maxDraft: 15.0, maxDWT: 100000, cargoType: "grain", isOccupied: false },
      { id: "bno-02", name: "Coal Terminal", maxLOA: 260, maxBeam: 42, maxDraft: 14.0, maxDWT: 85000, cargoType: "coal", isOccupied: true },
      { id: "bno-03", name: "General Cargo", maxLOA: 220, maxBeam: 35, maxDraft: 12.0, maxDWT: 55000, cargoType: "general", isOccupied: false },
    ],
    draftRestrictions: [
      { season: "Jun-Aug", restrictedDraft: 13.5, reason: "Mississippi River low water period" },
    ],
    cargoFacilities: [
      { type: "grain", handlingRate: 5000, storageCapacity: 500000, equipment: ["elevators", "conveyor"] },
      { type: "coal", handlingRate: 4000, storageCapacity: 300000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Major US grain export terminal. Panamax max.",
    pilotageRequired: true,
    tugboatCount: 10,
    tidalWindows: 18,
    monsoonImpact: 0,
  },
  {
    portId: "port-beira",
    berths: [
      { id: "bbe-01", name: "Bulk Berth", maxLOA: 225, maxBeam: 32, maxDraft: 10.5, maxDWT: 45000, cargoType: "general", isOccupied: false },
      { id: "bbe-02", name: "Container Berth", maxLOA: 200, maxBeam: 30, maxDraft: 10.0, maxDWT: 35000, cargoType: "container", isOccupied: false },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "general", handlingRate: 2000, storageCapacity: 60000, equipment: ["cranes"] },
    ],
    operationalStatus: "operational",
    statusNote: "Limited infrastructure. Handysize max for deep-draft cargo.",
    pilotageRequired: true,
    tugboatCount: 3,
    tidalWindows: 12,
    monsoonImpact: 2,
  },
  {
    portId: "port-vladivostok",
    berths: [
      { id: "bvl-01", name: "Bulk Terminal", maxLOA: 300, maxBeam: 45, maxDraft: 13.5, maxDWT: 80000, cargoType: "general", isOccupied: false },
      { id: "bvl-02", name: "Coal Terminal", maxLOA: 280, maxBeam: 42, maxDraft: 13.0, maxDWT: 70000, cargoType: "coal", isOccupied: true },
    ],
    draftRestrictions: [
      { season: "Dec-Mar", restrictedDraft: 11.5, reason: "Winter ice conditions" },
    ],
    cargoFacilities: [
      { type: "coal", handlingRate: 3500, storageCapacity: 200000, equipment: ["ship_loaders", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Year-round operations. Winter draft restrictions Dec-Mar.",
    pilotageRequired: true,
    tugboatCount: 8,
    tidalWindows: 16,
    monsoonImpact: 0,
  },
  {
    portId: "port-tanjung-api",
    berths: [
      { id: "bta-01", name: "Coal Berth", maxLOA: 230, maxBeam: 35, maxDraft: 12.0, maxDWT: 55000, cargoType: "coal", isOccupied: false },
      { id: "bta-02", name: "Palm Oil Berth", maxLOA: 200, maxBeam: 30, maxDraft: 10.5, maxDWT: 35000, cargoType: "palm_oil", isOccupied: false },
    ],
    draftRestrictions: [],
    cargoFacilities: [
      { type: "coal", handlingRate: 2500, storageCapacity: 100000, equipment: ["cranes", "conveyor"] },
    ],
    operationalStatus: "operational",
    statusNote: "Emerging coal export terminal. Limited to Handysize/Supramax.",
    pilotageRequired: true,
    tugboatCount: 3,
    tidalWindows: 14,
    monsoonImpact: 1,
  },
];

export function getPortInfrastructure(portId: string): PortInfrastructure | undefined {
  return portInfrastructure.find((p) => p.portId === portId);
}
