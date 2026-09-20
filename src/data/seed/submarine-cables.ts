// ============================================================
// FreightIQ — Indian Ocean Submarine Cable Data (Phase 3)
// Filtered from TeleGeography dataset via God's Eye View.
// Reference: github.com/bilawalsidhu/gods-eye-view
// TeleGeography CC BY-NC-SA 3.0 — for demo/educational use only.
// ============================================================

export interface SubmarineCable {
  id: string;
  name: string;
  color: string;
  /** Landing point coordinates */
  landingPoints: [number, number][];
  /** Cable route coordinates */
  route: [number, number][];
  /** Operator */
  operator?: string;
  /** Capacity */
  capacity?: string;
}

export const indianOceanCables: SubmarineCable[] = [
  {
    id: "sea-me-we-3",
    name: "SEA-ME-WE 3",
    color: "#3B82F6",
    landingPoints: [
      [12.83, 45.03],  // Djibouti
      [28.30, 36.80],  // Jeddah
      [39.18, 21.48],  // Jeddah
      [72.88, 19.08],  // Mumbai
      [80.22, 13.08],  // Chennai
      [100.52, 2.27],  // Malacca
      [103.85, 1.37],  // Singapore
    ],
    route: [
      [12.83, 45.03],
      [15.00, 42.00],
      [20.00, 38.00],
      [28.30, 36.80],
      [35.00, 32.00],
      [39.18, 21.48],
      [45.00, 15.00],
      [55.00, 10.00],
      [65.00, 8.00],
      [72.88, 19.08],
      [78.00, 16.00],
      [80.22, 13.08],
      [88.00, 5.00],
      [95.00, 2.00],
      [100.52, 2.27],
      [103.85, 1.37],
    ],
    operator: "Consortium",
    capacity: "40 Tbps",
  },
  {
    id: "sea-me-we-5",
    name: "SEA-ME-WE 5",
    color: "#10B981",
    landingPoints: [
      [32.55, 29.97],  // Suez
      [43.17, 13.05],  // Jeddah
      [58.50, 24.35],  // Muscat
      [68.20, 24.85],  // Karachi
      [72.88, 19.08],  // Mumbai
      [88.00, 22.50],  // Kolkata region
      [103.85, 1.37],  // Singapore
    ],
    route: [
      [32.55, 29.97],
      [36.00, 28.00],
      [40.00, 22.00],
      [43.17, 13.05],
      [50.00, 15.00],
      [58.50, 24.35],
      [65.00, 22.00],
      [68.20, 24.85],
      [72.88, 19.08],
      [78.00, 18.00],
      [85.00, 20.00],
      [88.00, 22.50],
      [92.00, 15.00],
      [98.00, 5.00],
      [103.85, 1.37],
    ],
    operator: "Consortium",
    capacity: "24 Tbps",
  },
  {
    id: "asia-africa-europe-1",
    name: "Asia-Africa-Europe-1 (AAE-1)",
    color: "#F59E0B",
    landingPoints: [
      [32.55, 29.97],  // Suez
      [43.17, 13.05],  // Jeddah
      [56.25, 26.16],  // Fujairah
      [72.88, 19.08],  // Mumbai
      [100.52, 2.27],  // Malacca
      [103.85, 1.37],  // Singapore
    ],
    route: [
      [32.55, 29.97],
      [38.00, 25.00],
      [43.17, 13.05],
      [50.00, 18.00],
      [56.25, 26.16],
      [62.00, 24.00],
      [68.00, 21.00],
      [72.88, 19.08],
      [80.00, 10.00],
      [88.00, 5.00],
      [95.00, 3.00],
      [100.52, 2.27],
      [103.85, 1.37],
    ],
    operator: "Consortium (Google, Meta)",
    capacity: "40 Tbps",
  },
  {
    id: "mumbai-chennai",
    name: "Mumbai-Chennai Corridor",
    color: "#8B5CF6",
    landingPoints: [
      [72.88, 19.08],  // Mumbai
      [73.82, 15.36],  // Goa
      [77.20, 11.50],  // Mangalore
      [80.22, 13.08],  // Chennai
    ],
    route: [
      [72.88, 19.08],
      [73.20, 17.50],
      [73.82, 15.36],
      [75.50, 13.00],
      [77.20, 11.50],
      [78.50, 12.50],
      [80.22, 13.08],
    ],
    operator: "Tata Communications",
    capacity: "100 Gbps",
  },
  {
    id: "chennai-singapore",
    name: "Chennai-Singapore Cable",
    color: "#EC4899",
    landingPoints: [
      [80.22, 13.08],  // Chennai
      [88.00, 22.50],  // Kolkata
      [92.80, 22.47],  // Cox's Bazar
      [98.50, 10.00],  // Myanmar
      [103.85, 1.37],  // Singapore
    ],
    route: [
      [80.22, 13.08],
      [83.00, 10.00],
      [86.00, 14.00],
      [88.00, 18.00],
      [88.00, 22.50],
      [90.00, 21.00],
      [92.80, 22.47],
      [96.00, 16.00],
      [98.50, 10.00],
      [101.00, 5.00],
      [103.85, 1.37],
    ],
    operator: "Consortium",
    capacity: "160 Gbps",
  },
  {
    id: "india-maldives-sri-lanka",
    name: "India-Maldives-Sri Lanka",
    color: "#06B6D4",
    landingPoints: [
      [72.88, 19.08],  // Mumbai
      [73.50, 4.17],   // Malé
      [79.86, 6.93],   // Colombo
      [80.22, 13.08],  // Chennai
    ],
    route: [
      [72.88, 19.08],
      [73.00, 14.00],
      [73.20, 10.00],
      [73.50, 4.17],
      [75.00, 3.00],
      [78.00, 5.00],
      [79.86, 6.93],
      [80.00, 10.00],
      [80.22, 13.08],
    ],
    operator: "Ooredoo / Dialog",
    capacity: "10 Gbps",
  },
  {
    id: "gateway-india-east-africa",
    name: "Gateway India-East Africa",
    color: "#EF4444",
    landingPoints: [
      [72.88, 19.08],  // Mumbai
      [68.20, 24.85],  // Karachi
      [63.30, 25.30],  // Gwadar
      [57.50, -4.62],  // Dar es Salaam
      [39.28, -6.79],  // Dar es Salaam
    ],
    route: [
      [72.88, 19.08],
      [70.00, 18.00],
      [68.20, 24.85],
      [65.00, 25.00],
      [63.30, 25.30],
      [60.00, 20.00],
      [57.50, 15.00],
      [55.00, 10.00],
      [52.00, 5.00],
      [48.00, 0.00],
      [42.00, -3.00],
      [39.28, -6.79],
    ],
    operator: "Ooredoo",
    capacity: "100 Gbps",
  },
];
