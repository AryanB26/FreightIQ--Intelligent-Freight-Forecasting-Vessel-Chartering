export interface GraphNode {
  id: string;
  label: string;
  type: "Event" | "Port" | "Region" | "Commodity" | "VesselClass";
  impactScore: number; // 0-10
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: "AFFECTS_CONGESTION" | "INCREASES_RATE" | "RESTRICTS_SUPPLY" | "DELAYS_TRANSIT";
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function getKnowledgeGraph(): KnowledgeGraphData {
  return {
    nodes: [
      { id: "e1", label: "Australian Dockworker Strike", type: "Event", impactScore: 8 },
      { id: "p1", label: "Port Hedland", type: "Port", impactScore: 9 },
      { id: "c1", label: "Iron Ore", type: "Commodity", impactScore: 7 },
      { id: "v1", label: "Capesize", type: "VesselClass", impactScore: 8 },
      
      { id: "e2", label: "Panama Canal Drought", type: "Event", impactScore: 9 },
      { id: "r1", label: "US Gulf", type: "Region", impactScore: 8 },
      { id: "v2", label: "Panamax", type: "VesselClass", impactScore: 9 },
      
      { id: "e3", label: "China Stimulus Package", type: "Event", impactScore: 7 },
      { id: "r2", label: "China (Far East)", type: "Region", impactScore: 8 }
    ],
    edges: [
      { source: "e1", target: "p1", relation: "AFFECTS_CONGESTION", weight: 0.9 },
      { source: "p1", target: "c1", relation: "RESTRICTS_SUPPLY", weight: 0.8 },
      { source: "c1", target: "v1", relation: "INCREASES_RATE", weight: 0.85 },
      
      { source: "e2", target: "r1", relation: "DELAYS_TRANSIT", weight: 0.95 },
      { source: "r1", target: "v2", relation: "INCREASES_RATE", weight: 0.88 },
      
      { source: "e3", target: "r2", relation: "INCREASES_RATE", weight: 0.7 },
      { source: "r2", target: "c1", relation: "INCREASES_RATE", weight: 0.75 }
    ]
  };
}
