"use client";

import { useEffect, useRef, useState } from "react";
import type { Port } from "@/types";
import type { VesselPosition } from "@/data/seed/vessel-positions";
import type { SubmarineCable } from "@/data/seed/submarine-cables";
import { useCurrentTheme } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { getActiveVesselRoutes } from "@/lib/maritime-routing";

export interface MaritimeGlobeProps {
  ports: Port[];
  vessels: VesselPosition[];
  cables: SubmarineCable[];
  selectedPortId?: string | null;
  selectedVesselId?: string | null;
  onPortSelect?: (portId: string | null) => void;
  onVesselSelect?: (vesselId: string | null) => void;
  focusIndia?: boolean;
  showCables?: boolean;
  showRoutes?: boolean;
  vesselClassFilter?: string[];
  statusFilter?: string[];
}

const CONGESTION_COLORS: Record<string, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#ef4444",
  severe: "#dc2626",
};

const STATUS_COLORS: Record<string, string> = {
  underway: "#22c55e",
  at_anchor: "#eab308",
  moored: "#3b82f6",
  engaged: "#a855f7",
  not_under_command: "#ef4444",
};

export interface MaritimeRoute {
  id: string;
  name: string;
  originPortId: string;
  destPortId: string;
  cargo: string;
  riskLevel: "normal" | "warning" | "critical";
  color: string;
  waypoints: [number, number][]; // [latitude, longitude]
  assignedVesselIds: string[];
}

// 11 Comprehensive Maritime Corridors matching exact user specifications
export const MARITIME_ROUTES: MaritimeRoute[] = [
  // 1. Port Hedland, Australia → Paradip, India (Iron Ore - Cyan)
  {
    id: "route-hedland-paradip",
    name: "Port Hedland → Paradip",
    originPortId: "port-port-hedland",
    destPortId: "port-paradip",
    cargo: "Iron Ore (Capesize)",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [-20.31, 118.57],
      [-10.5, 105.0],
      [2.0, 93.5],
      [11.0, 89.0],
      [20.2624, 86.7065],
    ],
    assignedVesselIds: ["v-003"], // MV bulk Pioneer
  },
  // 2. New Orleans, USA → Visakhapatnam, India (Cape Route Bulk - Red Critical)
  {
    id: "route-new-orleans-visakhapatnam",
    name: "New Orleans → Visakhapatnam",
    originPortId: "port-new-orleans",
    destPortId: "port-visakhapatnam",
    cargo: "Grain / Heavy Bulk (Cape Route)",
    riskLevel: "critical",
    color: "#ff3344",
    waypoints: [
      [29.9511, -90.0715],
      [24.5, -82.0],
      [22.0, -74.0],
      [10.0, -50.0],
      [-5.0, -30.0],
      [-25.0, -10.0],
      [-35.0, 18.5],
      [-30.0, 40.0],
      [-15.0, 65.0],
      [2.0, 78.0],
      [5.5, 81.0],
      [12.0, 84.0],
      [17.6868, 83.2185],
    ],
    assignedVesselIds: [],
  },
  // 3. Beira, Mozambique → Gangavaram, India (Coking Coal - Amber Warning)
  {
    id: "route-beira-gangavaram",
    name: "Beira → Gangavaram",
    originPortId: "port-beira",
    destPortId: "port-gangavaram",
    cargo: "Thermal / Coking Coal",
    riskLevel: "warning",
    color: "#ffaa00",
    waypoints: [
      [-19.8436, 34.8389],
      [-15.0, 43.0],
      [-7.0, 52.0],
      [1.0, 68.0],
      [5.5, 81.0],
      [11.5, 83.5],
      [17.6325, 83.2904],
    ],
    assignedVesselIds: ["v-004"], // MV Cape Vanguard
  },
  // 4. Vladivostok, Russia → Haldia, India (Siberian Bulk - Cyan)
  {
    id: "route-vladivostok-haldia",
    name: "Vladivostok → Haldia",
    originPortId: "port-vladivostok",
    destPortId: "port-haldia",
    cargo: "Metallurgical Coal & Fertilizer",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [43.1056, 131.8735],
      [34.5, 129.5],
      [28.0, 124.0],
      [21.5, 119.5],
      [10.0, 110.5],
      [1.25, 103.85],
      [3.8, 100.5],
      [5.8, 95.5],
      [16.0, 89.0],
      [22.0636, 88.0709],
    ],
    assignedVesselIds: ["v-007"], // MV Bengal Carrier
  },
  // 5. Tanjung Api-Api, Indonesia → Paradip, India (Thermal Coal - Cyan)
  {
    id: "route-tanjung-paradip",
    name: "Tanjung Api-Api → Paradip",
    originPortId: "port-tanjung-api",
    destPortId: "port-paradip",
    cargo: "Thermal Coal (Supramax)",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [-2.25, 105.02],
      [-1.5, 104.8],
      [1.25, 103.85],
      [3.8, 100.5],
      [5.8, 95.5],
      [12.5, 90.0],
      [20.2624, 86.7065],
    ],
    assignedVesselIds: ["v-001"], // MV Pacific Trader
  },
  // 6. Port Hedland, Australia → Visakhapatnam, India (Iron Ore - Cyan)
  {
    id: "route-hedland-visakhapatnam",
    name: "Port Hedland → Visakhapatnam",
    originPortId: "port-port-hedland",
    destPortId: "port-visakhapatnam",
    cargo: "Iron Ore (Panamax)",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [-20.31, 118.57],
      [-12.0, 108.0],
      [1.0, 91.0],
      [10.0, 86.5],
      [17.6868, 83.2185],
    ],
    assignedVesselIds: [],
  },
  // 7. Port Hedland, Australia → Gopalpur, India (Mineral Sands - Cyan)
  {
    id: "route-hedland-gopalpur",
    name: "Port Hedland → Gopalpur",
    originPortId: "port-port-hedland",
    destPortId: "port-gopalpur",
    cargo: "Mineral Sands (Handysize)",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [-20.31, 118.57],
      [-8.5, 103.0],
      [4.0, 91.5],
      [13.0, 87.5],
      [19.2646, 84.9458],
    ],
    assignedVesselIds: ["v-006"], // MV Ocean Meridian
  },
  // 8. Tanjung Api-Api, Indonesia → Dhamra, India (Malacca Transit - Amber)
  {
    id: "route-tanjung-dhamra",
    name: "Tanjung Api-Api → Dhamra",
    originPortId: "port-tanjung-api",
    destPortId: "port-dhamra",
    cargo: "Thermal Coal (Malacca Transit)",
    riskLevel: "warning",
    color: "#ffaa00",
    waypoints: [
      [-2.25, 105.02],
      [-1.5, 104.8],
      [1.25, 103.85],
      [3.8, 100.5],
      [5.8, 95.5],
      [14.0, 90.5],
      [21.0858, 87.2426],
    ],
    assignedVesselIds: ["v-009"], // MV Gujarat Spirit
  },
  // 9. Tanjung Api-Api, Indonesia → Sagar / Sandheads, India (Bauxite - Cyan)
  {
    id: "route-tanjung-sagar",
    name: "Tanjung Api-Api → Sagar / Sandheads",
    originPortId: "port-tanjung-api",
    destPortId: "port-sagar",
    cargo: "Bauxite / Industrial Bulk",
    riskLevel: "normal",
    color: "#00f0ff",
    waypoints: [
      [-2.25, 105.02],
      [-1.5, 104.8],
      [1.25, 103.85],
      [3.8, 100.5],
      [5.8, 95.5],
      [15.5, 89.5],
      [21.6465, 88.1164],
    ],
    assignedVesselIds: [],
  },
  // 10. Beira, Mozambique → Visakhapatnam, India (Mozambique Coal - Amber)
  {
    id: "route-beira-visakhapatnam",
    name: "Beira → Visakhapatnam",
    originPortId: "port-beira",
    destPortId: "port-visakhapatnam",
    cargo: "Coking Coal (Mozambique)",
    riskLevel: "warning",
    color: "#ffaa00",
    waypoints: [
      [-19.8436, 34.8389],
      [-14.0, 42.0],
      [-8.0, 50.0],
      [0.0, 65.0],
      [5.5, 80.5],
      [12.0, 83.0],
      [17.6868, 83.2185],
    ],
    assignedVesselIds: ["v-010"], // MV Coromandel Express
  },
  // 11. New Orleans, USA → Haldia, India (Cape Bulk - Red Critical)
  {
    id: "route-new-orleans-haldia",
    name: "New Orleans → Haldia",
    originPortId: "port-new-orleans",
    destPortId: "port-haldia",
    cargo: "Heavy Bulk (Cape Route)",
    riskLevel: "critical",
    color: "#ff3344",
    waypoints: [
      [29.9511, -90.0715],
      [24.5, -82.0],
      [22.0, -74.0],
      [10.0, -50.0],
      [-5.0, -30.0],
      [-25.0, -10.0],
      [-35.0, 18.5],
      [-30.0, 40.0],
      [-15.0, 65.0],
      [2.0, 78.0],
      [5.5, 81.0],
      [15.0, 87.0],
      [22.0636, 88.0709],
    ],
    assignedVesselIds: [],
  },
];

/**
 * Directional ship SVG marker oriented along true maritime voyage heading
 */
function getShipSvg(colorHex: string, isSelected: boolean): string {
  const fill = encodeURIComponent(colorHex);
  const stroke = isSelected ? "%23fbbf24" : "%23ffffff";
  const sw = isSelected ? "2.5" : "1.5";
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><polygon points="18,4 27,28 18,23 9,28" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><circle cx="18" cy="18" r="3" fill="%23ffffff"/></svg>`;
}

/**
 * Core rendering engine for attaching routes, ports, and vessels to the 3D globe
 */
function renderMaritimeOverlays(
  viewer: any,
  Cesium: any,
  props: {
    ports: Port[];
    vessels: VesselPosition[];
    cables: SubmarineCable[];
    selectedPortId?: string | null;
    selectedVesselId?: string | null;
    showRoutes?: boolean;
    showCables?: boolean;
    vesselClassFilter?: string[];
    statusFilter?: string[];
    isDark?: boolean;
  },
  stateRef: React.MutableRefObject<{ time: number }>
) {
  if (!viewer || viewer.isDestroyed()) return;

  viewer.entities.removeAll();

  const {
    ports,
    vessels,
    cables,
    selectedPortId,
    selectedVesselId,
    showRoutes = true,
    showCables = true,
    vesselClassFilter = [],
    statusFilter = [],
    isDark = true,
  } = props;

  // Filter vessels based on user filters
  const filtered = vessels.filter((v) => {
    if (vesselClassFilter.length > 0 && !vesselClassFilter.includes(v.vesselClass)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(v.status)) return false;
    return true;
  });

  // Calculate active split water routes (traveled past dotted leg & remaining solid route) matching 2D map
  const activeRoutes = getActiveVesselRoutes(filtered, selectedVesselId);
  const vesselTracksMap: Record<string, { lat: number; lon: number }[]> = {};

  // 1. ADD WATER VOYAGE ROUTES (Dotted Traveled Track & Solid Remaining Route matching 2D Map)
  if (showRoutes) {
    for (const vRoute of activeRoutes) {
      const isSelected = vRoute.isSelected;
      vesselTracksMap[vRoute.vessel.vesselId] = vRoute.remainingCoords.map(([lon, lat]) => ({ lat, lon }));

      // A. Traveled Leg (Origin -> Current Position): Dotted/Dashed Polyline
      if (vRoute.pastCoords && vRoute.pastCoords.length >= 2) {
        const pastFlat = vRoute.pastCoords.flatMap(([lon, lat]) => [lon, lat, 35000]);
        viewer.entities.add({
          id: `past-route-${vRoute.vessel.vesselId}`,
          name: `${vRoute.vessel.name} (Traveled Track)`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(pastFlat),
            width: isSelected ? 3.5 : 2.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString(isDark ? "#38bdf8" : "#0284c7").withAlpha(isSelected ? 0.9 : 0.6),
              dashLength: 14.0,
            }),
            arcType: Cesium.ArcType.NONE,
          },
        });
      }

      // B. Remaining Leg (Current Position -> Destination): Solid High-Contrast Route
      if (vRoute.remainingCoords && vRoute.remainingCoords.length >= 2) {
        const remainingFlat = vRoute.remainingCoords.flatMap(([lon, lat]) => [lon, lat, 45000]);
        viewer.entities.add({
          id: `remaining-route-${vRoute.vessel.vesselId}`,
          name: `${vRoute.vessel.name} (Remaining Route)`,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArrayHeights(remainingFlat),
            width: isSelected ? 5.0 : 3.8,
            material: new Cesium.PolylineOutlineMaterialProperty({
              color: Cesium.Color.fromCssColorString(isSelected ? "#f59e0b" : isDark ? "#00f0ff" : "#0284c7").withAlpha(0.95),
              outlineColor: Cesium.Color.fromCssColorString(isDark ? "#020617" : "#ffffff").withAlpha(0.6),
              outlineWidth: 1.2,
            }),
            arcType: Cesium.ArcType.NONE,
          },
        });
      }

      // C. Origin Terminal Point Marker
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(vRoute.origCoord[0], vRoute.origCoord[1], 25000),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString("#a855f7"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1.5,
        },
      });

      // D. Destination ECoI Port Marker
      viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(vRoute.destCoord[0], vRoute.destCoord[1], 25000),
        point: {
          pixelSize: 9,
          color: Cesium.Color.fromCssColorString(isDark ? "#00f0ff" : "#0284c7"),
          outlineColor: Cesium.Color.fromCssColorString("#fbbf24"),
          outlineWidth: 1.5,
        },
      });
    }
  }

  // 2. ADD SUBMARINE CABLES
  if (showCables && cables) {
    for (const cable of cables) {
      if (!cable.route || cable.route.length < 2) continue;
      const flatCoords = cable.route.flatMap(([lon, lat]) => [lon, lat, 8000]);
      viewer.entities.add({
        name: cable.name,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(flatCoords),
          width: 1.5,
          material: Cesium.Color.fromCssColorString(cable.color || "#38bdf8").withAlpha(0.65),
          arcType: Cesium.ArcType.GEODESIC,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000000),
        },
      });
    }
  }

  // 3. ADD PORTS (Indian East Coast Ports + Trade Origin Ports)
  for (const port of ports) {
    const isSelected = port.id === selectedPortId;
    const congestionColor = CONGESTION_COLORS[port.congestionLevel] || "#3b82f6";
    const isDest = port.isDestination;

    viewer.entities.add({
      id: port.id,
      name: port.name,
      position: Cesium.Cartesian3.fromDegrees(port.longitude, port.latitude, 25000),
      point: {
        pixelSize: isSelected ? 16 : isDest ? 11 : 9,
        color: isDest
          ? Cesium.Color.fromCssColorString(isDark ? "#00f0ff" : "#0284c7")
          : Cesium.Color.fromCssColorString(isDark ? "#a855f7" : "#7e22ce"),
        outlineColor: isSelected
          ? Cesium.Color.fromCssColorString("#fbbf24")
          : Cesium.Color.fromCssColorString(congestionColor),
        outlineWidth: isSelected ? 3.5 : 2.5,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 28000000),
      },
      label: {
        text: isDest ? port.name : `${port.name} (${port.country.slice(0, 2).toUpperCase()})`,
        font: isSelected ? "bold 13px Inter, sans-serif" : "bold 11px Inter, sans-serif",
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(isDark ? "rgba(11, 19, 38, 0.85)" : "rgba(255, 255, 255, 0.92)"),
        backgroundPadding: new Cesium.Cartesian2(6, 4),
        fillColor: isSelected
          ? Cesium.Color.fromCssColorString("#fbbf24")
          : isDest
          ? Cesium.Color.fromCssColorString(isDark ? "#ffffff" : "#0f172a")
          : Cesium.Color.fromCssColorString(isDark ? "#e2e8f0" : "#334155"),
        outlineColor: Cesium.Color.fromCssColorString(isDark ? "#020617" : "#ffffff"),
        outlineWidth: 2.5,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 24000000),
      },
    });
  }

  // 4. ADD VESSELS SAILING ALONG THEIR EXACT WATER ROUTE TRAJECTORIES
  for (let idx = 0; idx < filtered.length; idx++) {
    const vessel = filtered[idx];
    const isSelected = vessel.vesselId === selectedVesselId;
    const color = STATUS_COLORS[vessel.status] || "#22c55e";
    const assignedPts = vesselTracksMap[vessel.vesselId] || null;

    // Dynamic 3D position: smoothly follows route curvature along water
    const positionProperty = new Cesium.CallbackProperty(() => {
      let lat = vessel.latitude;
      let lon = vessel.longitude;

      if (vessel.status === "underway" && assignedPts && assignedPts.length > 1) {
        const speedKnots = vessel.speed || 12;
        const progress = ((stateRef.current.time * speedKnots * 0.00035) + (idx * 0.23)) % 1.0;
        const exactIdx = progress * (assignedPts.length - 1);
        const i0 = Math.floor(exactIdx);
        const i1 = Math.min(assignedPts.length - 1, i0 + 1);
        const frac = exactIdx - i0;

        const p0 = assignedPts[i0];
        const p1 = assignedPts[i1];
        lat = p0.lat + (p1.lat - p0.lat) * frac;
        lon = p0.lon + (p1.lon - p0.lon) * frac;
      }

      return Cesium.Cartesian3.fromDegrees(lon, lat, 45000);
    }, false);

    viewer.entities.add({
      id: vessel.vesselId,
      name: vessel.name,
      position: positionProperty,
      billboard: {
        image: getShipSvg(color, isSelected),
        width: isSelected ? 26 : 20,
        height: isSelected ? 26 : 20,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 24000000),
      },
      label: {
        text: `${vessel.name} (${vessel.speed} kn)`,
        font: isSelected ? "bold 11px Inter, sans-serif" : "10px Inter, sans-serif",
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(isDark ? "rgba(11, 19, 38, 0.85)" : "rgba(255, 255, 255, 0.92)"),
        backgroundPadding: new Cesium.Cartesian2(5, 3),
        fillColor: isSelected
          ? Cesium.Color.fromCssColorString("#fbbf24")
          : Cesium.Color.fromCssColorString(isDark ? "rgba(226, 232, 240, 0.95)" : "rgba(15, 23, 42, 0.95)"),
        outlineColor: Cesium.Color.fromCssColorString(isDark ? "#020617" : "#ffffff"),
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        pixelOffset: new Cesium.Cartesian2(0, 14),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 18000000),
      },
    });
  }
}

export function MaritimeGlobe({
  ports,
  vessels,
  cables,
  selectedPortId,
  selectedVesselId,
  onPortSelect,
  onVesselSelect,
  focusIndia = false,
  showCables = true,
  showRoutes = true,
  vesselClassFilter = [],
  statusFilter = [],
}: MaritimeGlobeProps) {
  const theme = useCurrentTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const preRenderRemoverRef = useRef<(() => void) | null>(null);

  const stateRef = useRef({
    autoRotate: true,
    autoRotatePaused: false,
    lastInteraction: 0,
    time: 0,
    focusIndia,
    selectedPortId,
    selectedVesselId,
    showCables,
    showRoutes,
    vesselClassFilter,
    statusFilter,
  });

  stateRef.current.focusIndia = focusIndia;
  stateRef.current.selectedPortId = selectedPortId;
  stateRef.current.selectedVesselId = selectedVesselId;
  stateRef.current.showCables = showCables;
  stateRef.current.showRoutes = showRoutes;
  stateRef.current.vesselClassFilter = vesselClassFilter;
  stateRef.current.statusFilter = statusFilter;

  // Initialize Locked Cesium Earth Foundation (God's Eye Architecture)
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let isDestroyed = false;

    if (typeof window !== "undefined") {
      (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
    }

    const initCesium = async () => {
      const Cesium = await import("cesium");
      if (isDestroyed || !containerRef.current) return;

      const creditDiv = document.createElement("div");
      creditDiv.style.display = "none";

      const viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        vrButton: false,
        selectionIndicator: false,
        infoBox: false,
        baseLayer: false,
        creditContainer: creditDiv,
        msaaSamples: 4,
        contextOptions: {
          webgl: {
            preserveDrawingBuffer: true,
          },
        },
      });

      viewerRef.current = viewer;
      viewer.targetFrameRate = 60;

      // Photorealistic Earth settings matching God's Eye View
      viewer.scene.globe.show = true;
      viewer.scene.globe.enableLighting = true; // Natural day/night terminator
      viewer.scene.globe.atmosphereLightIntensity = 18;
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true; // Realistic atmospheric edge glow
        viewer.scene.skyAtmosphere.saturationShift = -0.12;
        viewer.scene.skyAtmosphere.brightnessShift = -0.08;
      }

      // Terrain depth testing ensures back-side entities are naturally occluded
      viewer.scene.globe.depthTestAgainstTerrain = true;

      // Realistic Satellite Imagery (Esri World Imagery)
      try {
        const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
          { enablePickFeatures: false }
        );
        if (!isDestroyed) {
          viewer.imageryLayers.addImageryProvider(esriProvider);
        }
      } catch (e) {
        console.warn("[MaritimeGlobe] Esri World Imagery fallback:", e);
        try {
          const localProvider = await Cesium.TileMapServiceImageryProvider.fromUrl(
            "/cesium/Assets/Textures/NaturalEarthII"
          );
          if (!isDestroyed) {
            viewer.imageryLayers.addImageryProvider(localProvider);
          }
        } catch {
          const osm = new Cesium.OpenStreetMapImageryProvider({
            url: "https://tile.openstreetmap.org/",
          });
          if (!isDestroyed) {
            viewer.imageryLayers.addImageryProvider(osm);
          }
        }
      }

      // Initial orbital camera vantage over Indian Ocean & India
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(78.0, 15.0, 18000000),
        orientation: {
          heading: 0,
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });

      // User interaction listener: pauses auto-rotation during drag/zoom, resumes after 2s
      const s = stateRef.current;
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      const onInteractionStart = () => {
        s.autoRotatePaused = true;
        s.lastInteraction = Date.now();
      };
      const onInteractionEnd = () => {
        s.lastInteraction = Date.now();
        setTimeout(() => {
          s.autoRotatePaused = false;
        }, 2000);
      };

      handler.setInputAction(onInteractionStart, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      handler.setInputAction(onInteractionEnd, Cesium.ScreenSpaceEventType.LEFT_UP);
      handler.setInputAction(onInteractionStart, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      handler.setInputAction(onInteractionEnd, Cesium.ScreenSpaceEventType.RIGHT_UP);
      handler.setInputAction(onInteractionStart, Cesium.ScreenSpaceEventType.WHEEL);
      handler.setInputAction(onInteractionEnd, Cesium.ScreenSpaceEventType.PINCH_END);

      // Port & Vessel selection click handler
      handler.setInputAction((click: { position: InstanceType<typeof Cesium.Cartesian2> }) => {
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id) {
          const entityId = picked.id.id || picked.id;
          if (typeof entityId === "string") {
            if (ports.some((p) => p.id === entityId)) {
              onPortSelect?.(entityId);
              return;
            }
            if (vessels.some((v) => v.vesselId === entityId)) {
              onVesselSelect?.(entityId);
              return;
            }
          }
        }
        onPortSelect?.(null);
        onVesselSelect?.(null);
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Unified Earth rotation around polar axis (UNIT_Z)
      let lastTime = performance.now();
      const rotationSpeed = Cesium.Math.toRadians(4.0); // ~90 seconds per complete 360° rotation

      preRenderRemoverRef.current = viewer.scene.preRender.addEventListener(() => {
        const now = performance.now();
        const dt = Math.min(0.1, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        s.time += dt;

        // Rotate entire Earth and attached geographic overlays together
        if (s.autoRotate && !s.autoRotatePaused) {
          if (Date.now() - s.lastInteraction > 2000) {
            viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -rotationSpeed * dt);
          }
        }
      });

      // RENDER OVERLAYS IMMEDIATELY AS SOON AS VIEWER IS INITIALIZED!
      renderMaritimeOverlays(
        viewer,
        Cesium,
        {
          ports,
          vessels,
          cables,
          selectedPortId,
          selectedVesselId,
          showRoutes,
          showCables,
          vesselClassFilter,
          statusFilter,
        },
        stateRef
      );

      setViewerReady(true);
    };

    initCesium();

    return () => {
      isDestroyed = true;
      if (preRenderRemoverRef.current) {
        preRenderRemoverRef.current();
        preRenderRemoverRef.current = null;
      }
      if (viewerRef.current) {
        const v = viewerRef.current as { isDestroyed: () => boolean; destroy: () => void };
        if (!v.isDestroyed()) {
          v.destroy();
        }
        viewerRef.current = null;
      }
    };
  }, [ports, vessels, onPortSelect, onVesselSelect]);

  // Handle Focus India & Global Camera Transitions
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    import("cesium").then((Cesium) => {
      stateRef.current.autoRotatePaused = true;
      stateRef.current.lastInteraction = Date.now();

      if (focusIndia) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(82.5, 17.5, 7000000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-88),
            roll: 0,
          },
          duration: 2.5,
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
          complete: () => {
            setTimeout(() => {
              stateRef.current.autoRotatePaused = false;
            }, 2500);
          },
        });
      } else {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(78.0, 12.0, 18500000),
          orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
          },
          duration: 2.5,
          easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
          complete: () => {
            setTimeout(() => {
              stateRef.current.autoRotatePaused = false;
            }, 2500);
          },
        });
      }
    });
  }, [focusIndia]);

  // Synchronize Maritime Route & Vessel Overlays when Props or Filters Change
  useEffect(() => {
    if (!viewerReady || !viewerRef.current) return;

    import("cesium").then((Cesium) => {
      renderMaritimeOverlays(
        viewerRef.current,
        Cesium,
        {
          ports,
          vessels,
          cables,
          selectedPortId,
          selectedVesselId,
          showRoutes,
          showCables,
          vesselClassFilter,
          statusFilter,
          isDark,
        },
        stateRef
      );
    });
  }, [
    viewerReady,
    ports,
    vessels,
    cables,
    showRoutes,
    showCables,
    selectedPortId,
    selectedVesselId,
    vesselClassFilter,
    statusFilter,
    isDark,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden transition-colors"
      style={{ background: isDark ? "#01040a" : "var(--color-bg)" }}
    >
      <link rel="stylesheet" href="/cesium/Widgets/widgets.css" />
      {/* Corner HUD Brackets matching FreightIQ styling */}
      <div className={cn("absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 pointer-events-none z-10", isDark ? "border-cyan-500/30" : "border-cyan-700/50")} />
      <div className={cn("absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 pointer-events-none z-10", isDark ? "border-cyan-500/30" : "border-cyan-700/50")} />
      <div className={cn("absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 pointer-events-none z-10", isDark ? "border-cyan-500/30" : "border-cyan-700/50")} />
      <div className={cn("absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 pointer-events-none z-10", isDark ? "border-cyan-500/30" : "border-cyan-700/50")} />
    </div>
  );
}
