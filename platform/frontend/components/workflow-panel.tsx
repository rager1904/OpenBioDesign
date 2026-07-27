import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status";
import type { WorkflowStep } from "@/lib/types";

export function WorkflowPanel({ steps }: { steps: WorkflowStep[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Workflow Monitoring</CardTitle>
          <CardDescription>Real-time agent execution and validation status</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflow steps. Submit a design to see progress.</p>
        ) : (
          steps.map((step) => (
            <div key={step.name} className="rounded-lg border bg-slate-950/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{step.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{step.agent}</p>
                </div>
                <StatusBadge status={step.status} />
              </div>
              <Progress value={step.progress} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
