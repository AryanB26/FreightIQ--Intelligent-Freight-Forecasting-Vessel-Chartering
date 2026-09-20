"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  DEMO: { color: "text-amber-700", bg: "bg-amber-50" },
  CONNECTED: { color: "text-emerald-700", bg: "bg-emerald-50" },
  DISCONNECTED: { color: "text-slate-600", bg: "bg-slate-50" },
  ERROR: { color: "text-red-700", bg: "bg-red-50" },
};

const FRESHNESS_COLORS: Record<string, { color: string; bg: string }> = {
  FRESH: { color: "text-emerald-700", bg: "bg-emerald-50" },
  AGING: { color: "text-amber-700", bg: "bg-amber-50" },
  STALE: { color: "text-red-700", bg: "bg-red-50" },
};

const QUALITY_COLORS: Record<string, { color: string }> = {
  HIGH: { color: "text-emerald-600" },
  MEDIUM: { color: "text-amber-600" },
  LOW: { color: "text-red-600" },
};

interface PlatformSummary {
  dataMode: string;
  overallQuality: number;
  overallQualityLevel: string;
  providerCount: number;
  demoProviders: number;
  totalRecords: number;
  providers: { name: string; provider: string; status: string; mode: string; recordCount: number; lastUpdated: string; freshness: string }[];
  quality: { overallScore: number; overallLevel: string; categoryScores: { category: string; score: number; level: string; recordCount: number; missingCount: number; duplicateCount: number }[] };
  lineage: Record<string, { source: string; dataStatus: string; recordCount: number; qualityScore: number }>;
  freshness: { name: string; freshness: string; dataStatus: string }[];
  currencyRates: { from: string; to: string; rate: number; source: string }[];
  generatedAt: string;
}

interface IngestionJob {
  id: string;
  provider: string;
  category: string;
  status: string;
  completedAt: string;
  recordsProcessed: number;
  recordsAccepted: number;
  recordsRejected: number;
  durationMs: number;
}

export default function DataCenterPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [ingestionJobs, setIngestionJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [activeTab, setActiveTab] = useState<"sources" | "quality" | "freshness" | "ingestion" | "lineage">("sources");

  useEffect(() => {
    fetch("/api/data-platform/summary")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setSummary(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const runIngestion = async () => {
    setIngesting(true);
    try {
      const res = await fetch("/api/data-platform/ingest", { method: "POST" });
      const d = await res.json();
      if (d.success && d.data) setIngestionJobs(d.data);
    } catch { /* Error */ }
    finally { setIngesting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Center</h1>
          <p className="text-sm text-muted-foreground">Data sources, quality, freshness, and lineage</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`border-0 text-xs font-semibold ${summary?.dataMode === "DEMO" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            <span className="h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: summary?.dataMode === "DEMO" ? "#f59e0b" : "#10b981" }} />
            DATA MODE: {summary?.dataMode ?? "—"}
          </Badge>
          <Button variant="outline" size="sm" onClick={runIngestion} disabled={ingesting}>
            {ingesting ? "Ingesting..." : "Run Ingestion"}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading data platform status...</CardContent></Card>
      )}

      {!loading && !summary && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Unable to load data platform status.</CardContent></Card>
      )}

      {!loading && summary && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <KPICard label="Data Mode" value={summary.dataMode} />
            <KPICard label="Overall Quality" value={`${summary.overallQuality}/100`} accent={QUALITY_COLORS[summary.overallQualityLevel]?.color} />
            <KPICard label="Providers" value={`${summary.demoProviders}/${summary.providerCount} Demo`} />
            <KPICard label="Total Records" value={summary.totalRecords.toLocaleString()} />
            <KPICard label="Currency Rates" value={summary.currencyRates.length} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b">
            {(["sources", "quality", "freshness", "ingestion", "lineage"] as const).map((tab) => (
              <button
                key={tab}
                className={`px-4 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "sources" && <SourcesTab providers={summary.providers} />}
          {activeTab === "quality" && <QualityTab quality={summary.quality} />}
          {activeTab === "freshness" && <FreshnessTab freshness={summary.freshness} providers={summary.providers} />}
          {activeTab === "ingestion" && <IngestionTab jobs={ingestionJobs} />}
          {activeTab === "lineage" && <LineageTab lineage={summary.lineage} />}
        </>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KPICard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className={`text-xl font-bold font-mono ${accent ?? ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function SourcesTab({ providers }: { providers: PlatformSummary["providers"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {providers.map((p) => {
          const statusConfig = STATUS_COLORS[p.status] ?? STATUS_COLORS.DISCONNECTED;
          return (
            <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{p.name}</span>
                  <Badge className={`${statusConfig.bg} ${statusConfig.color} border-0 text-[9px] font-semibold`}>{p.status}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{p.provider}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono">{p.recordCount.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">records</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function QualityTab({ quality }: { quality: PlatformSummary["quality"] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Overall Quality Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className={`text-5xl font-bold font-mono ${QUALITY_COLORS[quality.overallLevel]?.color}`}>{quality.overallScore}</p>
          <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          <Badge className={`mt-2 border-0 text-xs ${quality.overallLevel === "HIGH" ? "bg-emerald-50 text-emerald-700" : quality.overallLevel === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
            {quality.overallLevel}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quality.categoryScores.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{cat.score}</span>
                  <Badge className={`border-0 text-[9px] ${cat.level === "HIGH" ? "bg-emerald-50 text-emerald-700" : cat.level === "MEDIUM" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{cat.level}</Badge>
                </div>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cat.level === "HIGH" ? "bg-emerald-500" : cat.level === "MEDIUM" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${cat.score}%` }} />
              </div>
              <div className="flex gap-3 text-[9px] text-muted-foreground mt-0.5">
                <span>Records: {cat.recordCount}</span>
                {cat.missingCount > 0 && <span className="text-amber-600">Missing: {cat.missingCount}</span>}
                {cat.duplicateCount > 0 && <span className="text-red-600">Duplicates: {cat.duplicateCount}</span>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function FreshnessTab({ freshness, providers }: { freshness: PlatformSummary["freshness"]; providers: PlatformSummary["providers"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {freshness.map((f) => {
          const fConfig = FRESHNESS_COLORS[f.freshness] ?? FRESHNESS_COLORS.FRESH;
          const provider = providers.find((p) => p.name === f.name);
          return (
            <div key={f.name} className="flex items-center justify-between p-2 rounded-lg border text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.name}</span>
                <Badge className={`${fConfig.bg} ${fConfig.color} border-0 text-[9px]`}>{f.freshness}</Badge>
                <Badge className="border-0 text-[9px] bg-muted text-muted-foreground">{f.dataStatus}</Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {provider?.recordCount.toLocaleString()} records
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function IngestionTab({ jobs }: { jobs: IngestionJob[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Ingestion History</CardTitle>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No ingestion jobs yet. Click &quot;Run Ingestion&quot; to start.</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-2 rounded border text-xs">
                <div>
                  <span className="font-medium">{job.provider}</span>
                  <span className="text-muted-foreground ml-2">({job.category})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">{job.recordsAccepted}/{job.recordsProcessed}</span>
                  <Badge className={`border-0 text-[9px] ${job.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : job.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                    {job.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LineageTab({ lineage }: { lineage: PlatformSummary["lineage"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Data Lineage</CardTitle>
          <Badge className="bg-amber-50 text-amber-700 border-0 text-[9px]">ALL SIMULATED</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(lineage).map(([key, info]) => (
          <div key={key} className="p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold capitalize">{key}</span>
              <Badge className="border-0 text-[9px] bg-muted text-muted-foreground">{info.dataStatus}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
              <div>
                <span className="block">Source</span>
                <span className="font-mono">{info.source}</span>
              </div>
              <div>
                <span className="block">Records</span>
                <span className="font-mono">{info.recordCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="block">Quality</span>
                <span className="font-mono">{info.qualityScore}/100</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
