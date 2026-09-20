import type { Vessel, VesselType } from "@/types";

export const vesselTypes: VesselType[] = [
  { id: "vt-handy", name: "Handysize", vesselClass: "Handysize", dwtRange: [10000, 39999], avgSpeed: 13.5, fuelConsumption: 28, typicalLOA: 180, typicalBeam: 30, typicalDraft: 10 },
  { id: "vt-supra", name: "Supramax", vesselClass: "Supramax", dwtRange: [40000, 59999], avgSpeed: 14.0, fuelConsumption: 32, typicalLOA: 200, typicalBeam: 32, typicalDraft: 12.5 },
  { id: "vt-panamax", name: "Panamax", vesselClass: "Panamax", dwtRange: [60000, 84999], avgSpeed: 14.5, fuelConsumption: 38, typicalLOA: 230, typicalBeam: 32, typicalDraft: 14.0 },
  { id: "vt-capesize", name: "Capesize", vesselClass: "Capesize", dwtRange: [85000, 200000], avgSpeed: 14.0, fuelConsumption: 55, typicalLOA: 300, typicalBeam: 50, typicalDraft: 18.0 },
];

export const sampleVessels: Vessel[] = [
  { id: "v-001", name: "MV Pacific Trader", imoNumber: "9876543", vesselTypeId: "vt-handy", vesselClass: "Handysize", dwt: 28000, loa: 175, beam: 28, draft: 9.8, buildYear: 2015, flag: "Panama", status: "active", currentLat: 4.2, currentLon: 100.5, dailyHireRate: 8500, dailyOperatingCost: 4200, lastDryDock: "2024-03-15" },
  { id: "v-002", name: "MV Iron Horizon", imoNumber: "9876544", vesselTypeId: "vt-supra", vesselClass: "Supramax", dwt: 52000, loa: 198, beam: 32, draft: 12.2, buildYear: 2018, flag: "Marshall Islands", status: "idle", currentLat: 1.3, currentLon: 103.8, nextAvailableDate: "2026-09-15", dailyHireRate: 12000, dailyOperatingCost: 5800, lastDryDock: "2024-08-20" },
  { id: "v-003", name: "MV bulk Pioneer", imoNumber: "9876545", vesselTypeId: "vt-panamax", vesselClass: "Panamax", dwt: 75000, loa: 228, beam: 32, draft: 13.8, buildYear: 2020, flag: "Liberia", status: "active", currentLat: -18.5, currentLon: 115.2, dailyHireRate: 16500, dailyOperatingCost: 7200, lastDryDock: "2025-01-10" },
  { id: "v-004", name: "MV Cape Vanguard", imoNumber: "9876546", vesselTypeId: "vt-capesize", vesselClass: "Capesize", dwt: 180000, loa: 292, beam: 45, draft: 17.8, buildYear: 2017, flag: "Hong Kong", status: "chartered", currentLat: -20.2, currentLon: 118.4, dailyHireRate: 22000, dailyOperatingCost: 9500, lastDryDock: "2024-06-01" },
  { id: "v-005", name: "MV Star Reliance", imoNumber: "9876547", vesselTypeId: "vt-supra", vesselClass: "Supramax", dwt: 48000, loa: 190, beam: 30, draft: 11.8, buildYear: 2019, flag: "Singapore", status: "idle", currentLat: 22.3, currentLon: 114.2, nextAvailableDate: "2026-09-20", dailyHireRate: 11500, dailyOperatingCost: 5500, lastDryDock: "2024-11-15" },
  { id: "v-006", name: "MV Ocean Meridian", imoNumber: "9876548", vesselTypeId: "vt-handy", vesselClass: "Handysize", dwt: 34000, loa: 182, beam: 30, draft: 10.2, buildYear: 2021, flag: "Japan", status: "active", currentLat: 5.3, currentLon: 103.1, dailyHireRate: 9200, dailyOperatingCost: 4500, lastDryDock: "2025-04-20" },
  { id: "v-007", name: "MV Bengal Carrier", imoNumber: "9876549", vesselTypeId: "vt-panamax", vesselClass: "Panamax", dwt: 82000, loa: 235, beam: 33, draft: 14.2, buildYear: 2016, flag: "Malta", status: "active", currentLat: 10.5, currentLon: 80.2, dailyHireRate: 15800, dailyOperatingCost: 7000, lastDryDock: "2024-09-10" },
  { id: "v-008", name: "MV Nordic Strength", imoNumber: "9876550", vesselTypeId: "vt-capesize", vesselClass: "Capesize", dwt: 172000, loa: 289, beam: 45, draft: 17.5, buildYear: 2019, flag: "Norway", status: "under_maintenance", currentLat: 1.3, currentLon: 103.8, dailyHireRate: 21000, dailyOperatingCost: 9200, lastDryDock: "2025-07-01" },
];
