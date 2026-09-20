import { HistoricalAnalyticsDashboard } from "@/components/history/historical-analytics-dashboard";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historical Freight Intelligence</h1>
        <p className="text-sm text-muted-foreground">
          Analyze 90-day spot freight rates, volatility indices, and TCE earnings across key dry-bulk corridors
        </p>
      </div>

      <HistoricalAnalyticsDashboard />
    </div>
  );
}
