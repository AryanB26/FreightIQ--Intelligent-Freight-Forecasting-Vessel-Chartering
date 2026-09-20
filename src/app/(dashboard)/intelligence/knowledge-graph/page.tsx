"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKnowledgeGraph, KnowledgeGraphData, GraphNode } from "@/services/knowledge-graph/engine";
import { Info, AlertTriangle, Ship, Anchor, Globe } from "lucide-react";

export default function KnowledgeGraphPage() {
  const [data, setData] = useState<KnowledgeGraphData | null>(null);

  useEffect(() => {
    // Mocking an API call
    setTimeout(() => {
      setData(getKnowledgeGraph());
    }, 500);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "Event": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "Port": return <Anchor className="w-4 h-4 text-blue-500" />;
      case "Region": return <Globe className="w-4 h-4 text-emerald-500" />;
      case "VesselClass": return <Ship className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 9) return "bg-red-500 text-white";
    if (score >= 7) return "bg-orange-500 text-white";
    return "bg-yellow-500 text-black";
  };

  if (!data) {
    return <div className="p-8">Loading Knowledge Graph...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Geopolitical & Macro-Event Knowledge Graph</h1>
        <p className="text-muted-foreground">
          Map macro events to localized market impacts. See how global disruptions propagate to specific ports and freight rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle>Impact Network</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Fallback rendering of graph relations since we don't have a charting library like react-flow installed */}
              <div className="space-y-4">
                {data.edges.map((edge, i) => {
                  const sourceNode = data.nodes.find(n => n.id === edge.source);
                  const targetNode = data.nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;
                  
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          {getIcon(sourceNode.type)}
                          <span className="font-medium text-sm">{sourceNode.label}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{sourceNode.type}</Badge>
                      </div>
                      
                      <div className="flex flex-col items-center flex-1 px-4">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          {edge.relation.replace(/_/g, " ")}
                        </span>
                        <div className="w-full h-px bg-border relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-border rotate-45" />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          Weight: {(edge.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getIcon(targetNode.type)}
                          <span className="font-medium text-sm">{targetNode.label}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{targetNode.type}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.nodes.sort((a, b) => b.impactScore - a.impactScore).map(node => (
                  <div key={node.id} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      {getIcon(node.type)}
                      <div>
                        <p className="text-sm font-medium">{node.label}</p>
                        <p className="text-[10px] text-muted-foreground">{node.type}</p>
                      </div>
                    </div>
                    <Badge className={getImpactColor(node.impactScore)}>
                      Impact: {node.impactScore}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
