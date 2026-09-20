import { ScenarioWorkbench } from "@/components/scenarios/scenario-workbench";

export default function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scenario Modeling</h1>
        <p className="text-sm text-muted-foreground">
          What-if stress testing across freight volatility, bunker shifts, and East Coast India port congestion
        </p>
      </div>

      <ScenarioWorkbench />
    </div>
  );
}
