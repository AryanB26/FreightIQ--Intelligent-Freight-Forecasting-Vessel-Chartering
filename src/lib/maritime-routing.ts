// ============================================================
// FreightIQ — Centralized Maritime Water Routing Engine
// Provides high-fidelity, land-avoiding navigable corridors
// and shared route geometries for 2D Maps and 3D Cesium Globes.
// ============================================================

import type { VesselPosition } from "@/data/seed/vessel-positions";

// Indian East Coast Ports (ECoI)
export const ECOI_PORTS = [
  { id: "port-paradip", name: "Paradip", lat: 20.2624, lon: 86.7065, draft: "16.5m", congestion: "moderate" },
  { id: "port-visakhapatnam", name: "Visakhapatnam", lat: 17.6868, lon: 83.2185, draft: "17.5m", congestion: "low" },
  { id: "port-gangavaram", name: "Gangavaram", lat: 17.6325, lon: 83.2904, draft: "18.5m", congestion: "low" },
  { id: "port-gopalpur", name: "Gopalpur", lat: 19.2646, lon: 84.9458, draft: "12.5m", congestion: "low" },
  { id: "port-dhamra", name: "Dhamra", lat: 21.0858, lon: 87.2426, draft: "18.0m", congestion: "moderate" },
  { id: "port-sagar", name: "Sagar / Sandheads", lat: 21.6465, lon: 88.1164, draft: "14.0m", congestion: "high" },
  { id: "port-haldia", name: "Haldia", lat: 22.0636, lon: 88.0709, draft: "13.5m", congestion: "moderate" },
];

// Major Global Bulk Trade Origins (Guaranteed Coastal Water Coordinates)
export const ORIGIN_PORTS = [
  { id: "port-port-hedland", name: "Port Hedland", country: "Australia", lat: -20.31, lon: 118.57 },
  { id: "port-tanjung-api", name: "Tanjung Api-Api", country: "Indonesia", lat: -2.25, lon: 105.02 },
  { id: "port-beira", name: "Beira", country: "Mozambique", lat: -19.84, lon: 34.84 },
  { id: "port-singapore", name: "Singapore", country: "Singapore", lat: 1.25, lon: 103.85 },
  { id: "port-newcastle", name: "Newcastle", country: "Australia", lat: -32.93, lon: 151.78 },
  { id: "port-richards-bay", name: "Richards Bay", country: "South Africa", lat: -28.8, lon: 32.05 },
  { id: "port-dampier", name: "Dampier", country: "Australia", lat: -20.65, lon: 116.7 },
  { id: "port-taboneo", name: "Taboneo", country: "Indonesia", lat: -3.75, lon: 114.45 },
  { id: "port-samarinda", name: "Samarinda", country: "Indonesia", lat: -0.35, lon: 117.6 },
  { id: "port-colombo", name: "Colombo", country: "Sri Lanka", lat: 6.94, lon: 79.84 },
  { id: "port-vladivostok", name: "Vladivostok", country: "Russia", lat: 43.10, lon: 131.87 },
  { id: "port-new-orleans", name: "New Orleans", country: "USA", lat: 29.95, lon: -90.07 },
];

/**
 * Resolves [longitude, latitude] for a voyage origin port
 */
export function findOriginCoordinates(originName?: string): [number, number] {
  if (!originName) return [ORIGIN_PORTS[0].lon, ORIGIN_PORTS[0].lat];
  const lower = originName.toLowerCase();
  const orig = ORIGIN_PORTS.find((p) =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (orig) return [orig.lon, orig.lat];

  const ecoi = ECOI_PORTS.find((p) =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (ecoi) return [ecoi.lon, ecoi.lat];

  if (lower.includes("australia") || lower.includes("hedland")) return [118.57, -20.31];
  if (lower.includes("newcastle")) return [151.78, -32.93];
  if (lower.includes("indonesia") || lower.includes("tanjung") || lower.includes("api")) return [105.02, -2.25];
  if (lower.includes("mozambique") || lower.includes("beira") || lower.includes("africa")) return [34.84, -19.84];
  if (lower.includes("singapore") || lower.includes("malacca")) return [103.85, 1.25];
  if (lower.includes("richards") || lower.includes("durban") || lower.includes("south africa")) return [32.05, -28.8];
  if (lower.includes("vladivostok") || lower.includes("russia")) return [131.87, 43.10];
  if (lower.includes("orleans") || lower.includes("usa")) return [-90.07, 29.95];

  return [ORIGIN_PORTS[0].lon, ORIGIN_PORTS[0].lat];
}

/**
 * Resolves [longitude, latitude] for a voyage destination port
 */
export function findDestCoordinates(destName?: string): [number, number] {
  if (!destName) return [ECOI_PORTS[0].lon, ECOI_PORTS[0].lat];
  const lower = destName.toLowerCase();
  const ecoi = ECOI_PORTS.find((p) =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (ecoi) return [ecoi.lon, ecoi.lat];

  const orig = ORIGIN_PORTS.find((p) =>
    lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower)
  );
  if (orig) return [orig.lon, orig.lat];

  return [ECOI_PORTS[0].lon, ECOI_PORTS[0].lat];
}

/**
 * Generates nautical waypoint corridors strictly avoiding landmasses
 */
export function getMaritimeWaterWaypoints(start: [number, number], end: [number, number]): [number, number][] {
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;

  const isWestOfIndia = (lng: number, lat: number) => lng < 77.5 && lat > 6.0;
  const isEastOfIndia = (lng: number, lat: number) => lng > 79.5 && lat > 8.0;

  // 1. Arabian Sea / West of India to Bay of Bengal / East Coast of India (Round South of Sri Lanka)
  if (isWestOfIndia(lng1, lat1) && isEastOfIndia(lng2, lat2)) {
    const wps: [number, number][] = [start];
    if (lat1 > 10.0) {
      wps.push([Math.min(lng1 + 4.5, 73.0), Math.max(9.0, lat1 * 0.6 + 3.0)]);
    }
    wps.push([76.2, 6.8]);  // South-west of Cape Comorin
    wps.push([80.8, 5.5]);  // South of Dondra Head, Sri Lanka (deep ocean)
    wps.push([82.8, 8.5]);  // Turning north into Bay of Bengal
    if (lat2 > 16.0) {
      wps.push([84.8, 14.5]); // Mid Bay of Bengal clear corridor
    }
    wps.push(end);
    return wps;
  }

  // 2. East Coast of India to Arabian Sea (Reverse)
  if (isEastOfIndia(lng1, lat1) && isWestOfIndia(lng2, lat2)) {
    const wps: [number, number][] = [start];
    if (lat1 > 16.0) {
      wps.push([84.8, 14.5]);
    }
    wps.push([82.8, 8.5]);
    wps.push([80.8, 5.5]);
    wps.push([76.2, 6.8]);
    if (lat2 > 10.0) {
      wps.push([Math.min(lng2 + 4.5, 73.0), Math.max(9.0, lat2 * 0.6 + 3.0)]);
    }
    wps.push(end);
    return wps;
  }

  // 3. Port Hedland / Australia to Arabian Sea (Across South Indian Ocean)
  if (lng1 > 100.0 && lat1 < -10.0 && isWestOfIndia(lng2, lat2)) {
    return [
      start,
      [100.0, -10.0],
      [78.0, 0.0],
      end,
    ];
  }

  // 4. Mozambique / South Africa / Africa to East Coast of India
  if (lng1 < 75.0 && lat1 <= 6.0 && isEastOfIndia(lng2, lat2)) {
    const wps: [number, number][] = [start];
    if (lng1 < 50.0) {
      wps.push([48.0, -10.0]);
      wps.push([62.0, -2.0]);
    }
    wps.push([77.0, 3.5]);
    wps.push([80.8, 5.5]);  // South Sri Lanka deep water
    wps.push([82.8, 8.5]);  // Bay of Bengal entrance
    if (lat2 > 16.0) {
      wps.push([84.8, 14.5]);
    }
    wps.push(end);
    return wps;
  }

  // 5. Indonesia / Singapore / Malacca Strait Passage to Bay of Bengal / East Coast of India
  if (lng1 >= 95.0 && lng1 <= 120.0 && lat1 <= 4.5 && isEastOfIndia(lng2, lat2)) {
    const wps: [number, number][] = [start];
    if (lat1 < 0) {
      wps.push([104.5, -0.5]);
    }
    if (lng1 >= 103.0) {
      wps.push([103.7, 1.25]); // Singapore Strait
    }
    if (lng1 >= 99.0) {
      wps.push([100.5, 3.8]);  // Malacca North
    }
    wps.push([95.5, 5.8]);   // Andaman Sea entrance
    wps.push([89.5, 11.5]);  // Bay of Bengal open water
    wps.push(end);
    return wps;
  }

  // 6. Newcastle / East Coast Australia to Bay of Bengal / East Coast of India
  if (lng1 >= 140.0 && lat1 < -25.0 && isEastOfIndia(lng2, lat2)) {
    return [
      start,
      [148.0, -39.0], // Bass Strait
      [135.0, -37.0], // Great Australian Bight
      [115.0, -35.0], // Cape Leeuwin South
      [104.0, -9.0],  // South of Java
      [94.0, 2.0],    // Open Indian Ocean
      [88.5, 10.5],   // Bay of Bengal
      end,
    ];
  }

  // 7. Port Hedland / West Coast Australia to Bay of Bengal / East Coast of India
  if (lng1 >= 110.0 && lat1 < -15.0 && isEastOfIndia(lng2, lat2)) {
    return [
      start,
      [104.0, -9.0],
      [94.0, 2.0],
      [88.5, 10.5],
      end,
    ];
  }

  // 8. Vladivostok / East Asia to Bay of Bengal / East Coast of India
  if (lng1 > 120.0 && lat1 > 20.0 && isEastOfIndia(lng2, lat2)) {
    return [
      start,
      [129.5, 34.5], // Tsushima Strait
      [124.0, 28.0], // East China Sea
      [119.5, 21.5], // South China Sea
      [110.5, 10.0],
      [103.7, 1.25], // Singapore Strait
      [100.5, 3.8],  // Malacca
      [95.5, 5.8],   // Andaman Sea
      [89.0, 16.0],  // Bay of Bengal
      end,
    ];
  }

  // Default: Direct water line between points
  return [start, end];
}

/**
 * Computes a smooth curved segment between two individual nautical waypoints
 */
export function getCurvedSegment(start: [number, number], end: [number, number]): [number, number][] {
  const [lng1, lat1] = start;
  const [lng2, lat2] = end;
  const midLng = (lng1 + lng2) / 2;
  const midLat = (lat1 + lat2) / 2;
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;

  const curvature = lat1 > lat2 ? 0.05 : -0.05;
  const ctrlLng = midLng - dLat * curvature;
  const ctrlLat = midLat + dLng * curvature;

  const points: [number, number][] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * ctrlLng + t * t * lng2;
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * ctrlLat + t * t * lat2;
    points.push([Math.round(lng * 10000) / 10000, Math.round(lat * 10000) / 10000]);
  }
  return points;
}

/**
 * Generates smooth multi-waypoint water route guaranteed to remain in open sea
 */
export function getWaterRoute(start: [number, number], end: [number, number]): [number, number][] {
  const waypoints = getMaritimeWaterWaypoints(start, end);
  if (waypoints.length <= 2) {
    return getCurvedSegment(waypoints[0], waypoints[1]);
  }

  const result: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const segment = getCurvedSegment(waypoints[i], waypoints[i + 1]);
    if (i > 0) segment.shift(); // remove duplicate connection point
    result.push(...segment);
  }
  return result;
}

export interface VesselRouteData {
  vessel: VesselPosition;
  origCoord: [number, number]; // [lng, lat]
  destCoord: [number, number]; // [lng, lat]
  currentCoord: [number, number]; // [lng, lat]
  pastCoords: [number, number][]; // [lng, lat][]
  remainingCoords: [number, number][]; // [lng, lat][]
  isSelected: boolean;
}

/**
 * Computes split water routes (traveled past dotted leg & remaining solid route) for all active vessels
 */
export function getActiveVesselRoutes(vessels: VesselPosition[], selectedId?: string | null): VesselRouteData[] {
  const underway = vessels.filter((v) => v.status === "underway");
  return underway.map((v) => {
    const origCoord = findOriginCoordinates(v.origin);
    const destCoord = findDestCoordinates(v.destination);
    const currentCoord: [number, number] = [v.longitude, v.latitude];

    const pastCoords = getWaterRoute(origCoord, currentCoord);
    const remainingCoords = getWaterRoute(currentCoord, destCoord);
    const isSelected = v.vesselId === selectedId;

    return {
      vessel: v,
      origCoord,
      destCoord,
      currentCoord,
      pastCoords,
      remainingCoords,
      isSelected,
    };
  });
}
