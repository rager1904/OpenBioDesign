"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitBinderDesign } from "@/lib/api";
import type { BinderDesignRequest, BinderDesignResult } from "@/lib/types";

export function WorkflowSubmissionForm() {
  const queryClient = useQueryClient();
  const [proteinName, setProteinName] = useState("");
  const [proteinSequence, setProteinSequence] = useState("");
  const [numCandidates, setNumCandidates] = useState(5);
  const [randomSeed, setRandomSeed] = useState(42);
  const [hypothesis, setHypothesis] = useState("");
  const [result, setResult] = useState<BinderDesignResult | null>(null);

  const mutation = useMutation({
    mutationFn: (request: BinderDesignRequest) => submitBinderDesign(request),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["research-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-graph"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proteinName || !proteinSequence) return;
    mutation.mutate({
      target: {
        name: proteinName,
        sequence: proteinSequence,
        organism: "Homo sapiens",
      },
      hypothesis: hypothesis || "Deterministic baseline binder design hypothesis for target validation",
      requested_candidates: numCandidates,
      random_seed: randomSeed,
      project_id: "demo-project",
    });
  };

  const presetTargets = [
    {
      name: "Human Insulin",
      sequence: "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQPLALEGSLQKRGIVEQCCTSICSLYQLENYCN",
    },
    {
      name: "Human Growth Hormone",
      sequence: "MGSSHHHHHHSSGLVPRGSHMFPTIPLSRLFDNAMLRAHRLHQLAFDTYQEFEEAYIPKEQKYSFLQNPQTSLCFSESIPTPSNREETQQKSNLELLRISLLLIQSWLGECPYLKDNIHSLSRAFPESLD",
    },
    {
      name: "Green Fluorescent Protein",
      sequence: "MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTLVTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLVNRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLADHYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Submit Binder Design Workflow</CardTitle>
          <CardDescription>Send a protein target to the backend for deterministic binder generation</CardDescription>
        </div>
        {mutation.isPending && <Badge tone="cyan">Running...</Badge>}
        {mutation.isSuccess && <Badge tone="emerald">Completed</Badge>}
        {mutation.isError && <Badge tone="blue">Failed</Badge>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {presetTargets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setProteinName(preset.name);
                  setProteinSequence(preset.sequence);
                }}
                className="rounded-lg border bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-white transition hover:border-cyan-300/60"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Protein Name</label>
              <input
                type="text"
                value={proteinName}
                onChange={(e) => setProteinName(e.target.value)}
                placeholder="e.g. Human Insulin"
                className="w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Random Seed</label>
              <input
                type="number"
                value={randomSeed}
                onChange={(e) => setRandomSeed(Number(e.target.value))}
                className="w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Protein Sequence (amino acids)</label>
            <textarea
              value={proteinSequence}
              onChange={(e) => setProteinSequence(e.target.value)}
              placeholder="Paste amino acid sequence here..."
              rows={3}
              className="w-full resize-none rounded-md border bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Number of Candidates</label>
              <input
                type="number"
                value={numCandidates}
                onChange={(e) => setNumCandidates(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Hypothesis (optional)</label>
              <input
                type="text"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Design rationale..."
                className="w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-300/50"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" disabled={mutation.isPending || !proteinName || !proteinSequence}>
            {mutation.isPending ? "Running workflow..." : "Submit Binder Design"}
          </Button>
        </form>

        {result && (
          <div className="mt-4 rounded-lg border bg-slate-950/50 p-4">
            <div className="mb-2 flex items-center gap-3">
              <Badge tone="emerald">Completed</Badge>
              <span className="text-sm font-medium text-white">Experiment {result.experiment.experiment_id.slice(0, 8)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {result.candidates.length} candidates generated · {result.binding_sites.length} binding sites
            </p>
            {result.ranking_rationale && (
              <p className="mt-2 text-xs text-muted-foreground">{result.ranking_rationale}</p>
            )}
            {result.candidates.length > 0 && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {result.candidates.slice(0, 6).map((c) => (
                  <div key={c.candidate_id} className="rounded border bg-slate-900/50 p-2">
                    <p className="text-xs font-medium text-white">{c.candidate_id.slice(0, 16)}</p>
                    <p className="mt-1 font-mono text-xs text-cyan-100">{c.sequence}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Binding: {(c.binding_score * 100).toFixed(1)}% · Stability: {(c.stability_score * 100).toFixed(1)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
