"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Map as MapLibreMap, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// MapLibre v6 worker URL configuration for Next.js / Webpack
if (typeof window !== "undefined") {
  setWorkerUrl("https://cdn.jsdelivr.net/npm/maplibre-gl@6.10.0/dist/maplibre-gl-worker.mjs");
}
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VesselPosition } from "@/data/seed/vessel-positions";
import type { SubmarineCable } from "@/data/seed/submarine-cables";
import Link from "next/link";
import { Navigation, ArrowRight, ShieldCheck, Compass, Gauge, Ship } from "lucide-react";
import { useCurrentTheme } from "@/components/ui/theme-toggle";

import {
  ECOI_PORTS,
  ORIGIN_PORTS,
  getActiveVesselRoutes,
} from "@/lib/maritime-routing";

interface VesselTrackerProps {
  vessels: VesselPosition[];
  cables: SubmarineCable[];
}

// Normalize cable coordinates to guaranteed [lng, lat]
function normalizeCableCoord(pt: [number, number]): [number, number] {
  const [a, b] = pt;
  if (a >= 32 && Math.abs(b) <= 35) return [a, b];
  if (b >= 32 && Math.abs(a) <= 35) return [b, a];
  return [a, b];
}

// Helper: Registers SDF directional vessel arrow icon
function registerVesselArrow(map: MapLibreMap) {
  if (map.hasImage("vessel-arrow")) return;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, 32, 32);
  ctx.beginPath();
  ctx.moveTo(16, 2);    // Arrow bow / tip
  ctx.lineTo(28, 28);   // Starboard stern corner
  ctx.lineTo(16, 21);   // Stern center notch
  ctx.lineTo(4, 28);    // Port stern corner
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const imgData = ctx.getImageData(0, 0, 32, 32);
  map.addImage("vessel-arrow", imgData, { sdf: true });
}

// Helper: Builds Ports GeoJSON
function buildPortsGeoJson(isDark: boolean = true) {
  const features: any[] = [];
  ECOI_PORTS.forEach((p) => {
    features.push({
      type: "Feature",
      properties: {
        id: p.id,
        name: p.name,
        portType: "ecoi",
        color: isDark ? "#00f0ff" : "#0284c7",
        labelColor: isDark ? "#a5f3fc" : "#0369a1",
      },
      geometry: {
        type: "Point",
        coordinates: [p.lon, p.lat],
      },
    });
  });
  ORIGIN_PORTS.forEach((p) => {
    features.push({
      type: "Feature",
      properties: {
        id: p.id,
        name: p.name,
        portType: "origin",
        color: isDark ? "#a855f7" : "#7e22ce",
        labelColor: isDark ? "#d8b4fe" : "#6b21a8",
      },
      geometry: {
        type: "Point",
        coordinates: [p.lon, p.lat],
      },
    });
  });
  return { type: "FeatureCollection" as const, features };
}

// Helper: Builds Submarine Cables GeoJSON
function buildCablesGeoJson(cablesList: SubmarineCable[]) {
  const features = cablesList.map((cable, idx) => ({
    type: "Feature" as const,
    id: idx,
    properties: {
      name: cable.name,
      color: cable.color || "#38bdf8",
    },
    geometry: {
      type: "LineString" as const,
      coordinates: cable.route.map(normalizeCableCoord),
    },
  }));
  return { type: "FeatureCollection" as const, features };
}

// Helper: Builds Voyage Routes GeoJSON (Traveled Past Dotted Trail & Remaining Darker Line Route strictly on water)
function buildRoutesGeoJson(vesselsList: VesselPosition[], selectedId: string | null) {
  const activeRoutes = getActiveVesselRoutes(vesselsList, selectedId);
  const pastBaseFeatures: any[] = [];
  const pastSelectedFeatures: any[] = [];
  const remainingBaseFeatures: any[] = [];
  const remainingSelectedFeatures: any[] = [];

  activeRoutes.forEach(({ vessel, pastCoords, remainingCoords, isSelected }) => {
    const pastFeat = {
      type: "Feature" as const,
      properties: {
        vesselId: vessel.vesselId,
        name: vessel.name,
        isSelected,
        stage: "traveled",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: pastCoords,
      },
    };

    const remainingFeat = {
      type: "Feature" as const,
      properties: {
        vesselId: vessel.vesselId,
        name: vessel.name,
        isSelected,
        stage: "remaining",
      },
      geometry: {
        type: "LineString" as const,
        coordinates: remainingCoords,
      },
    };

    if (isSelected) {
      pastSelectedFeatures.push(pastFeat);
      remainingSelectedFeatures.push(remainingFeat);
    } else {
      pastBaseFeatures.push(pastFeat);
      remainingBaseFeatures.push(remainingFeat);
    }
  });

  return {
    pastBase: { type: "FeatureCollection" as const, features: pastBaseFeatures },
    pastSelected: { type: "FeatureCollection" as const, features: pastSelectedFeatures },
    remainingBase: { type: "FeatureCollection" as const, features: remainingBaseFeatures },
    remainingSelected: { type: "FeatureCollection" as const, features: remainingSelectedFeatures },
  };
}

// Helper: Builds Vessels GeoJSON
function buildVesselsGeoJson(vesselsList: VesselPosition[], selectedId: string | null) {
  const features = vesselsList.map((v) => {
    const isSelected = v.vesselId === selectedId;
    const color = isSelected
      ? "#fbbf24"
      : v.status === "underway"
      ? "#10b981"
      : v.status === "at_anchor"
      ? "#f59e0b"
      : "#38bdf8";

    return {
      type: "Feature" as const,
      properties: {
        vesselId: v.vesselId,
        name: v.name,
        speed: v.speed,
        heading: v.heading,
        status: v.status,
        vesselClass: v.vesselClass,
        color,
        isSelected,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [v.longitude, v.latitude],
      },
    };
  });

  return { type: "FeatureCollection" as const, features };
}

// Helper: Applies light or dark theme styling across all MapLibre layers
function applyThemeToMap(map: MapLibreMap, isDark: boolean) {
  try {
    if (map.getLayer("background")) {
      map.setPaintProperty("background", "background-color", isDark ? "#131e2b" : "#f1f5f9");
    }
    if (map.getLayer("natural_earth")) {
      if (isDark) {
        map.setPaintProperty("natural_earth", "raster-saturation", -1);
        map.setPaintProperty("natural_earth", "raster-brightness-max", 0.25);
        map.setPaintProperty("natural_earth", "raster-contrast", 0.3);
        map.setPaintProperty("natural_earth", "raster-opacity", 0.4);
      } else {
        map.setPaintProperty("natural_earth", "raster-saturation", 0);
        map.setPaintProperty("natural_earth", "raster-brightness-max", 0.95);
        map.setPaintProperty("natural_earth", "raster-contrast", 0);
        map.setPaintProperty("natural_earth", "raster-opacity", 0.12);
      }
    }
    if (map.getLayer("water")) {
      map.setPaintProperty("water", "fill-color", isDark ? "#060e18" : "#bae6fd");
    }

    const layers = map.getStyle().layers || [];
    layers.forEach((layer) => {
      if (
        layer.id.startsWith("tunnel_") ||
        layer.id.startsWith("road_") ||
        layer.id.startsWith("bridge_") ||
        layer.id.startsWith("highway") ||
        layer.id.startsWith("poi_") ||
        layer.id === "airport" ||
        layer.id.startsWith("label_village") ||
        layer.id.startsWith("label_other")
      ) {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } else if (layer.id.startsWith("waterway_") && layer.type === "line") {
        map.setPaintProperty(layer.id, "line-color", isDark ? "#0a1d2e" : "#38bdf8");
      } else if (layer.id.startsWith("boundary_")) {
        map.setPaintProperty(layer.id, "line-color", isDark ? "#234963" : "#94a3b8");
        map.setPaintProperty(layer.id, "line-opacity", isDark ? 0.7 : 0.75);
      } else if (
        layer.id.startsWith("landcover_") ||
        layer.id.startsWith("landuse_") ||
        layer.id.startsWith("park") ||
        layer.id.startsWith("aeroway_") ||
        layer.id.startsWith("building")
      ) {
        if (layer.type === "fill") {
          map.setPaintProperty(layer.id, "fill-color", isDark ? "#152230" : "#ffffff");
        }
      } else if (layer.type === "symbol" && layer.layout && (layer.layout as any)["text-field"]) {
        if (!layer.id.startsWith("ports-") && !layer.id.startsWith("vessels-")) {
          map.setPaintProperty(layer.id, "text-color", isDark ? "#64849b" : "#334155");
          map.setPaintProperty(layer.id, "text-halo-color", isDark ? "#060e18" : "#ffffff");
          map.setPaintProperty(layer.id, "text-halo-width", 2);
        }
      }
    });

    // Ports layers styling
    if (map.getLayer("ports-label-lyr")) {
      map.setPaintProperty("ports-label-lyr", "text-halo-color", isDark ? "#060e18" : "#ffffff");
      map.setPaintProperty("ports-label-lyr", "text-halo-width", 2);
    }
    if (map.getLayer("ports-circle-lyr")) {
      map.setPaintProperty("ports-circle-lyr", "circle-stroke-color", isDark ? "#ffffff" : "#0f172a");
    }

    // Vessels layers styling
    if (map.getLayer("vessels-symbol-lyr")) {
      map.setPaintProperty("vessels-symbol-lyr", "text-color", isDark ? "#ffffff" : "#0f172a");
      map.setPaintProperty("vessels-symbol-lyr", "text-halo-color", isDark ? "#060e18" : "#ffffff");
      map.setPaintProperty("vessels-symbol-lyr", "text-halo-width", 2);
    }
    if (map.getLayer("vessels-dot-lyr")) {
      map.setPaintProperty("vessels-dot-lyr", "circle-color", isDark ? "#ffffff" : "#0f172a");
    }
    if (map.getLayer("vessels-selected-halo-lyr")) {
      map.setPaintProperty("vessels-selected-halo-lyr", "circle-stroke-color", isDark ? "#fbbf24" : "#d97706");
    }

    // Past Routes (Lighter dots for path already travelled)
    if (map.getLayer("voyage-routes-past-base-lyr")) {
      map.setPaintProperty("voyage-routes-past-base-lyr", "line-color", isDark ? "#38bdf8" : "#0284c7");
      map.setPaintProperty("voyage-routes-past-base-lyr", "line-opacity", isDark ? 0.45 : 0.45);
    }
    if (map.getLayer("voyage-routes-past-selected-lyr")) {
      map.setPaintProperty("voyage-routes-past-selected-lyr", "line-color", isDark ? "#fbbf24" : "#d97706");
      map.setPaintProperty("voyage-routes-past-selected-lyr", "line-opacity", isDark ? 0.75 : 0.7);
    }

    // Remaining Routes (Darker longer line for upcoming route)
    if (map.getLayer("voyage-routes-remaining-base-lyr")) {
      map.setPaintProperty("voyage-routes-remaining-base-lyr", "line-color", isDark ? "#00d8f6" : "#0284c7");
      map.setPaintProperty("voyage-routes-remaining-base-lyr", "line-opacity", isDark ? 0.95 : 0.9);
    }
    if (map.getLayer("voyage-routes-remaining-selected-lyr")) {
      map.setPaintProperty("voyage-routes-remaining-selected-lyr", "line-color", isDark ? "#fbbf24" : "#d97706");
      map.setPaintProperty("voyage-routes-remaining-selected-lyr", "line-opacity", 1.0);
    }
  } catch (err) {
    console.warn("[VesselTracker] Styling update skipped:", err);
  }
}

export function VesselTracker({ vessels, cables }: VesselTrackerProps) {
  const theme = useCurrentTheme();
  const isDark = theme === "dark";
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>("v-012"); // default to MV Eastern Star
  const [showCables, setShowCables] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Keep refs for current state to use inside map event listeners
  const selectedVesselIdRef = useRef(selectedVesselId);
  selectedVesselIdRef.current = selectedVesselId;

  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      if (classFilter !== "all" && v.vesselClass.toLowerCase() !== classFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    });
  }, [vessels, classFilter, statusFilter]);

  const selectedVessel = useMemo(() => {
    return vessels.find((v) => v.vesselId === selectedVesselId) || filteredVessels[0] || null;
  }, [vessels, selectedVesselId, filteredVessels]);

  // 1. Initialize MapLibre GL Map and all Native WebGL Layers
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      bounds: [
        [32, -28], // SW bound: 32°E, 28°S
        [124, 28], // NE bound: 124°E, 28°N
      ],
      fitBoundsOptions: { padding: 30 },
      attributionControl: false,
      maxPitch: 0,
      dragRotate: false,
    });

    map.on("error", (e) => {
      console.warn("[VesselTracker] Map warning:", e);
    });

    map.on("load", () => {
      // 1. Transform OpenFreeMap Liberty to match active theme
      applyThemeToMap(map, isDark);

      // 2. Register SDF Vessel Arrow Icon for GPU rotation & dynamic status colors
      registerVesselArrow(map);

      // 3. Submarine Cables Layer (Native WebGL Line Layer)
      const cablesGeoJson = buildCablesGeoJson(cables);
      if (!map.getSource("submarine-cables-src")) {
        map.addSource("submarine-cables-src", { type: "geojson", data: cablesGeoJson });
        map.addLayer({
          id: "submarine-cables-lyr",
          type: "line",
          source: "submarine-cables-src",
          layout: { visibility: showCables ? "visible" : "none" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": 1.6,
            "line-dasharray": [4, 3],
            "line-opacity": 0.75,
          },
        });
      }

      // 4. Voyage Routes Layers (Native WebGL Line Layers: Past Traveled Dotted Trail & Remaining Darker Line Route)
      const routesGeoJson = buildRoutesGeoJson(filteredVessels, selectedVesselIdRef.current);

      // Traveled route (Base unselected: lighter dots)
      if (!map.getSource("voyage-routes-past-base-src")) {
        map.addSource("voyage-routes-past-base-src", { type: "geojson", data: routesGeoJson.pastBase });
        map.addLayer({
          id: "voyage-routes-past-base-lyr",
          type: "line",
          source: "voyage-routes-past-base-src",
          layout: {
            "line-cap": "round",
            "line-join": "round",
            visibility: showRoutes ? "visible" : "none",
          },
          paint: {
            "line-color": isDark ? "#38bdf8" : "#0284c7",
            "line-width": 3.0,
            "line-dasharray": [0.01, 2.4],
            "line-opacity": isDark ? 0.45 : 0.45,
          },
        });
      }

      // Traveled route (Selected vessel: highlighted lighter dots)
      if (!map.getSource("voyage-routes-past-selected-src")) {
        map.addSource("voyage-routes-past-selected-src", { type: "geojson", data: routesGeoJson.pastSelected });
        map.addLayer({
          id: "voyage-routes-past-selected-lyr",
          type: "line",
          source: "voyage-routes-past-selected-src",
          layout: {
            "line-cap": "round",
            "line-join": "round",
            visibility: showRoutes ? "visible" : "none",
          },
          paint: {
            "line-color": isDark ? "#fbbf24" : "#d97706",
            "line-width": 4.0,
            "line-dasharray": [0.01, 2.2],
            "line-opacity": isDark ? 0.75 : 0.7,
          },
        });
      }

      // Remaining route (Base unselected: darker prominent continuous line)
      if (!map.getSource("voyage-routes-remaining-base-src")) {
        map.addSource("voyage-routes-remaining-base-src", { type: "geojson", data: routesGeoJson.remainingBase });
        map.addLayer({
          id: "voyage-routes-remaining-base-lyr",
          type: "line",
          source: "voyage-routes-remaining-base-src",
          layout: {
            "line-cap": "round",
            "line-join": "round",
            visibility: showRoutes ? "visible" : "none",
          },
          paint: {
            "line-color": isDark ? "#00d8f6" : "#0284c7",
            "line-width": 2.4,
            "line-opacity": isDark ? 0.95 : 0.9,
          },
        });
      }

      // Remaining route (Selected vessel: bold highlighted line)
      if (!map.getSource("voyage-routes-remaining-selected-src")) {
        map.addSource("voyage-routes-remaining-selected-src", { type: "geojson", data: routesGeoJson.remainingSelected });
        map.addLayer({
          id: "voyage-routes-remaining-selected-lyr",
          type: "line",
          source: "voyage-routes-remaining-selected-src",
          layout: {
            "line-cap": "round",
            "line-join": "round",
            visibility: showRoutes ? "visible" : "none",
          },
          paint: {
            "line-color": isDark ? "#fbbf24" : "#d97706",
            "line-width": 3.8,
            "line-opacity": 1.0,
          },
        });
      }

      // 5. Ports Layer (Native WebGL Circle & Symbol Layers)
      const portsGeoJson = buildPortsGeoJson(isDark);
      if (!map.getSource("ports-src")) {
        map.addSource("ports-src", { type: "geojson", data: portsGeoJson });

        map.addLayer({
          id: "ports-circle-lyr",
          type: "circle",
          source: "ports-src",
          paint: {
            "circle-radius": 5,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": isDark ? "#ffffff" : "#0f172a",
          },
        });

        map.addLayer({
          id: "ports-label-lyr",
          type: "symbol",
          source: "ports-src",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 10,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": ["get", "labelColor"],
            "text-halo-color": isDark ? "#060e18" : "#ffffff",
            "text-halo-width": 2,
          },
        });
      }

      // 6. Vessels Layers (Native WebGL Layers pinned to exact [lng, lat])
      const vesselsGeoJson = buildVesselsGeoJson(filteredVessels, selectedVesselIdRef.current);
      if (!map.getSource("vessels-src")) {
        map.addSource("vessels-src", { type: "geojson", data: vesselsGeoJson });

        // Selected vessel golden halo ring
        map.addLayer({
          id: "vessels-selected-halo-lyr",
          type: "circle",
          source: "vessels-src",
          filter: ["==", ["get", "isSelected"], true],
          paint: {
            "circle-radius": 15,
            "circle-color": "rgba(251, 191, 36, 0.15)",
            "circle-stroke-width": 2,
            "circle-stroke-color": isDark ? "#fbbf24" : "#d97706",
          },
        });

        // Directional vessel arrow + label on selection
        map.addLayer({
          id: "vessels-symbol-lyr",
          type: "symbol",
          source: "vessels-src",
          layout: {
            "icon-image": "vessel-arrow",
            "icon-rotate": ["get", "heading"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "icon-size": 0.65,
            "text-field": [
              "case",
              ["==", ["get", "isSelected"], true],
              ["concat", ["get", "name"], " (", ["to-string", ["get", "speed"]], " kn)"],
              "",
            ],
            "text-font": ["Noto Sans Regular"],
            "text-offset": [0, -1.8],
            "text-size": 11,
            "text-allow-overlap": true,
          },
          paint: {
            "icon-color": ["get", "color"],
            "text-color": isDark ? "#ffffff" : "#0f172a",
            "text-halo-color": isDark ? "#060e18" : "#ffffff",
            "text-halo-width": 2,
          },
        });

        // Center dot
        map.addLayer({
          id: "vessels-dot-lyr",
          type: "circle",
          source: "vessels-src",
          paint: {
            "circle-radius": 2.2,
            "circle-color": isDark ? "#ffffff" : "#0f172a",
          },
        });

        // Click handler to select vessel
        map.on("click", "vessels-symbol-lyr", (e) => {
          if (e.features && e.features[0]) {
            const vId = e.features[0].properties?.vesselId;
            if (vId) {
              setSelectedVesselId(vId);
            }
          }
        });

        map.on("mouseenter", "vessels-symbol-lyr", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "vessels-symbol-lyr", () => {
          map.getCanvas().style.cursor = "";
        });
      }

      setMapLoaded(true);
    });

    mapRef.current = map;
    if (typeof window !== "undefined") {
      (window as any).__map = map;
    }

    // Ensure map fits container when resized
    const handleResize = () => {
      map.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
      mapRef.current = null;
      if (typeof window !== "undefined") {
        delete (window as any).__map;
      }
      setMapLoaded(false);
    };
  }, []);

  // Update map theme when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    applyThemeToMap(map, isDark);

    const portsSource = map.getSource("ports-src") as any;
    if (portsSource?.setData) {
      portsSource.setData(buildPortsGeoJson(isDark));
    }
  }, [mapLoaded, isDark]);

  // 2. Synchronize Vessels and Routes GeoJSON when filter or selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Update Vessels Source
    const vesselsSource = map.getSource("vessels-src") as any;
    if (vesselsSource?.setData) {
      vesselsSource.setData(buildVesselsGeoJson(filteredVessels, selectedVesselId));
    }

    // Update Routes Sources
    const routes = buildRoutesGeoJson(filteredVessels, selectedVesselId);
    const pastBaseSource = map.getSource("voyage-routes-past-base-src") as any;
    if (pastBaseSource?.setData) {
      pastBaseSource.setData(routes.pastBase);
    }
    const pastSelectedSource = map.getSource("voyage-routes-past-selected-src") as any;
    if (pastSelectedSource?.setData) {
      pastSelectedSource.setData(routes.pastSelected);
    }
    const remainingBaseSource = map.getSource("voyage-routes-remaining-base-src") as any;
    if (remainingBaseSource?.setData) {
      remainingBaseSource.setData(routes.remainingBase);
    }
    const remainingSelectedSource = map.getSource("voyage-routes-remaining-selected-src") as any;
    if (remainingSelectedSource?.setData) {
      remainingSelectedSource.setData(routes.remainingSelected);
    }
  }, [mapLoaded, filteredVessels, selectedVesselId]);

  // 3. Synchronize Voyage Lines Visibility Toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const visibility = showRoutes ? "visible" : "none";
    if (map.getLayer("voyage-routes-past-base-lyr")) {
      map.setLayoutProperty("voyage-routes-past-base-lyr", "visibility", visibility);
    }
    if (map.getLayer("voyage-routes-past-selected-lyr")) {
      map.setLayoutProperty("voyage-routes-past-selected-lyr", "visibility", visibility);
    }
    if (map.getLayer("voyage-routes-remaining-base-lyr")) {
      map.setLayoutProperty("voyage-routes-remaining-base-lyr", "visibility", visibility);
    }
    if (map.getLayer("voyage-routes-remaining-selected-lyr")) {
      map.setLayoutProperty("voyage-routes-remaining-selected-lyr", "visibility", visibility);
    }
  }, [mapLoaded, showRoutes]);

  // 4. Synchronize Submarine Cables Visibility Toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer("submarine-cables-lyr")) {
      map.setLayoutProperty("submarine-cables-lyr", "visibility", showCables ? "visible" : "none");
    }
  }, [mapLoaded, showCables]);

  return (
    <div className="space-y-4">
      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[var(--color-bg-raised)] rounded-lg border border-[var(--color-border)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Vessel Class Filter */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-[var(--color-bg)] border-[var(--color-border)]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="handysize">Handysize</SelectItem>
              <SelectItem value="supramax">Supramax</SelectItem>
              <SelectItem value="panamax">Panamax</SelectItem>
              <SelectItem value="capesize">Capesize</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--color-bg)] p-0.5 rounded border border-[var(--color-border)]">
            {[
              { id: "all", label: "All" },
              { id: "underway", label: "Underway" },
              { id: "at_anchor", label: "Anchor" },
              { id: "moored", label: "At Port" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "px-2 py-1 text-[11px] rounded transition-colors cursor-pointer",
                  statusFilter === s.id
                    ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-semibold shadow-xs"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Layer Toggles */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs font-medium transition-colors border cursor-pointer",
              showRoutes
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)]"
                : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]"
            )}
            onClick={() => setShowRoutes(!showRoutes)}
          >
            Voyage Lines {showRoutes ? "ON" : "OFF"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 text-xs font-medium transition-colors border cursor-pointer",
              showCables
                ? "bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)]"
                : "bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]"
            )}
            onClick={() => setShowCables(!showCables)}
          >
            Submarine Cables {showCables ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-dim)]">
          <span className="text-cyan-600 dark:text-cyan-400 font-bold">{filteredVessels.length}</span> vessels plotted ·
          <span className="text-emerald-600 dark:text-emerald-400">{filteredVessels.filter((v) => v.status === "underway").length}</span> underway
        </div>
      </div>

      {/* Real Geographic MapLibre Indian Ocean Map */}
      <div className="relative rounded-lg border border-[var(--color-border)] overflow-hidden bg-slate-100 dark:bg-[#06111b] select-none shadow-md">
        {/* Tactical HUD Header Bar */}
        <div
          className="absolute top-2 left-3 z-10 flex items-center gap-2 text-[10px] font-mono rounded px-2.5 py-1 border shadow-xs pointer-events-none transition-colors"
          style={{
            background: isDark ? "rgba(11, 19, 38, 0.9)" : "rgba(255, 255, 255, 0.95)",
            color: isDark ? "rgba(34, 211, 238, 0.9)" : "#0f172a",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          }}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">INDIAN OCEAN OPERATIONAL THEATRE // 32°E - 124°E · 28°S - 28°N</span>
        </div>

        {/* Top Right AIS Badge */}
        <span
          className="absolute top-2 right-3 text-[9px] font-mono px-2.5 py-1 rounded border z-10 pointer-events-none shadow-xs transition-colors font-semibold"
          style={{
            background: isDark ? "rgba(8, 47, 73, 0.6)" : "rgba(240, 249, 255, 0.95)",
            color: isDark ? "#67e8f9" : "#0369a1",
            borderColor: isDark ? "rgba(14, 116, 144, 0.4)" : "#bae6fd",
          }}
        >
          REAL VECTOR BASEMAP · AIS FEED
        </span>

        {/* MapLibre WebGL Canvas Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-[clamp(380px,54vw,560px)] block transition-colors"
          style={{ background: isDark ? "#06111b" : "#f1f5f9" }}
        />

        {/* Tactical Legend Overlay */}
        <div
          className="absolute bottom-2 left-3 z-10 flex flex-wrap items-center gap-3 text-[11px] px-3.5 py-1.5 rounded-lg border shadow-md pointer-events-none transition-colors"
          style={{
            background: isDark ? "rgba(11, 19, 38, 0.92)" : "rgba(255, 255, 255, 0.95)",
            color: isDark ? "#cbd5e1" : "#1e293b",
            borderColor: isDark ? "#1e293b" : "#cbd5e1",
            backdropFilter: "blur(8px)",
          }}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Underway ({vessels.filter((v) => v.status === "underway").length})
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            At Anchor
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            Moored / Port
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-400 border border-white dark:border-black" />
            ECoI Port
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600 dark:bg-purple-500" />
            Origin Terminal
          </span>
          <span className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-2.5 font-medium">
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold tracking-tighter text-sm leading-none">···</span>
            Traveled Route
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1 w-4 bg-cyan-600 dark:bg-cyan-400 rounded-full" />
            Remaining Route
          </span>
        </div>
      </div>

      {/* Selected Vessel Operational Dossier Card */}
      {selectedVessel && (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-raised)] shadow-lg overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--color-border)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <h3 className="font-bold text-base text-[var(--color-text-primary)]">{selectedVessel.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-mono border-[var(--color-border-light)] text-[var(--color-text-secondary)]">
                    {selectedVessel.vesselClass}
                  </Badge>
                  <span className="text-xs text-[var(--color-text-muted)]">· Flag: {selectedVessel.flag}</span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Cargo Onboard: <span className="text-cyan-600 dark:text-cyan-300 font-medium">{selectedVessel.cargo || "Dry Bulk"}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase font-mono px-2 py-0.5",
                    selectedVessel.status === "underway"
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10"
                      : selectedVessel.status === "at_anchor"
                      ? "text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10"
                      : "text-sky-600 dark:text-sky-400 border-sky-500/40 bg-sky-500/10"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full mr-1.5 bg-current inline-block" />
                  {selectedVessel.status.replace("_", " ")}
                </Badge>
                <Link href="/charter-planner">
                  <Button size="sm" className="h-7 text-xs bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)]">
                    Charter Planner <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* 6 Key Operational Telemetry Points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                  <Navigation className="h-3 w-3 text-cyan-600 dark:text-cyan-400" /> Origin → Dest
                </span>
                <span className="font-semibold text-[var(--color-text-primary)] truncate block mt-0.5">
                  {selectedVessel.origin || "Port Hedland"} → {selectedVessel.destination}
                </span>
              </div>

              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                  <Gauge className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Speed & Heading
                </span>
                <span className="font-mono text-[var(--color-text-primary)] font-semibold block mt-0.5">
                  {selectedVessel.speed} kn · {selectedVessel.heading}°
                </span>
              </div>

              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                  <Compass className="h-3 w-3 text-purple-600 dark:text-purple-400" /> Position
                </span>
                <span className="font-mono text-[var(--color-text-primary)] font-semibold block mt-0.5">
                  {selectedVessel.latitude.toFixed(2)}°, {selectedVessel.longitude.toFixed(2)}°
                </span>
              </div>

              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block">Estimated Arrival</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold block mt-0.5">{selectedVessel.eta}</span>
              </div>

              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block">Deadweight / Draught</span>
                <span className="font-mono text-[var(--color-text-primary)] font-semibold block mt-0.5">
                  {selectedVessel.dwt.toLocaleString()} DWT · {selectedVessel.draught || 12.5}m
                </span>
              </div>

              <div className="bg-[var(--color-bg)] p-2 rounded border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] font-medium block flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> Vetting Status
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  RightShip 5★ · Active
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
