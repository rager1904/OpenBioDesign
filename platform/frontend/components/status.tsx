import { Badge } from "@/components/ui/badge";
import type { WorkflowStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: WorkflowStatus }) {
  const tone = status === "completed" ? "emerald" : status === "running" ? "cyan" : status === "failed" ? "red" : "slate";
  return <Badge tone={tone}>{status}</Badge>;
}
