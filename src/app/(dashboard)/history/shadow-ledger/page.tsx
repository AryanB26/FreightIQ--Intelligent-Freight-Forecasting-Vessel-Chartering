"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getShadowLedger, getShadowLedgerSummary, ShadowBooking } from "@/services/shadow-ledger/ledger-service";
import { ArrowDownIcon, ArrowRightIcon, History } from "lucide-react";

export default function ShadowLedgerPage() {
  const [ledger, setLedger] = useState<ShadowBooking[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    setLedger(getShadowLedger());
    setSummary(getShadowLedgerSummary());
  }, []);

  if (!summary) return <div className="p-8">Loading Shadow Ledger...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          Automated "Shadow Booking" Ledger
        </h1>
        <p className="text-muted-foreground mt-2">
          Track the opportunity cost of ignoring system recommendations. Compares actual physical executions against what the system recommended at the time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-red-500/30">
          <CardHeader className="bg-red-500/5 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Total Value Left on Table (YTD)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-red-500">
              ${(summary.totalOpportunityCost / 1000).toFixed(0)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Missed savings across {summary.totalBookings} bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Missed Savings</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">
              ${(summary.averageCostPerBooking / 1000).toFixed(1)}k
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per suboptimal booking</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision History Log</CardTitle>
          <CardDescription>Historical decisions and their financial impacts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date & Route</th>
                  <th className="px-4 py-3 font-medium">Actual Execution</th>
                  <th className="px-4 py-3 font-medium">System Recommendation</th>
                  <th className="px-4 py-3 font-medium text-right">Opportunity Cost</th>
                  <th className="px-4 py-3 font-medium w-[300px]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{item.date}</div>
                      <div className="text-xs text-muted-foreground">{item.route}</div>
                      <div className="text-xs text-muted-foreground">{item.cargoTotalMt.toLocaleString()} MT</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="mb-1">{item.actualExecution.type}</Badge>
                      <div className="text-sm">${item.actualExecution.costPerMt}/MT</div>
                      <div className="text-xs text-muted-foreground">${(item.actualExecution.totalCost/1000).toFixed(0)}k total</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-primary mb-1">{item.recommendedExecution.type}</Badge>
                      <div className="text-sm">${item.recommendedExecution.costPerMt}/MT</div>
                      <div className="text-xs text-muted-foreground">${(item.recommendedExecution.totalCost/1000).toFixed(0)}k total</div>
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                      ${(item.opportunityCost / 1000).toFixed(0)}k
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground italic">
                      {item.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
