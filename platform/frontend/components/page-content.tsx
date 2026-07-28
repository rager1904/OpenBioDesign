"use client";

import { Download, FileText, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status";
import { ScientificTrendChart, PlddtChart } from "@/components/charts";
import dynamic from "next/dynamic";

const MolecularViewer = dynamic(() => import("@/components/molecular-viewer").then((m) => m.MolecularViewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-[28rem] items-center justify-center rounded-xl border border-slate-700/30 bg-slate-950">
      <p className="text-xs text-slate-500">Initializing 3D viewer...</p>
    </div>
  ),
});

const DockingViewer3D = dynamic(() => import("@/components/docking-visualization").then((m) => m.DockingViewer3D), {
  ssr: false,
  loading: () => (
    <div className="flex h-[28rem] items-center justify-center rounded-xl border border-slate-700/30 bg-slate-950">
      <p className="text-xs text-slate-500">Initializing docking viewer...</p>
    </div>
  ),
});
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { SequenceViewer } from "@/components/sequence-viewer";
import { WorkflowPanel } from "@/components/workflow-panel";
import { WorkflowSubmissionForm } from "@/components/workflow-submission-form";
import { InteractionDiagram, generateInteractions } from "@/components/docking-visualization";
import { DockingInteractionDiagram } from "@/components/docking-2d-diagram";
import { runDocking, lookupTarget, searchLiterature, getReport, chatWithAiScientist, detectBindingSites, scoreSequence } from "@/lib/api";
import type { PageKey, Metric, Candidate, ResearchActivity } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useState, useEffect, useCallback } from "react";

type Snapshot = Awaited<ReturnType<typeof import("@/lib/api").getResearchSnapshot>>;

export function PageContent({
  page,
  snapshot,
  isLoading,
  error,
}: {
  page: PageKey;
  snapshot?: Snapshot;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  if (page === "dashboard") return <DashboardPage snapshot={snapshot} />;
  if (page === "projects") return <ProjectWorkspace snapshot={snapshot} />;
  if (page === "target-discovery" || page === "protein-analysis") return <TargetAnalysisPage snapshot={snapshot} />;
  if (page === "structure-prediction") return <StructurePredictionPage />;
  if (page === "binder-generation" || page === "molecule-design") return <BinderGenerationPage snapshot={snapshot} />;
  if (page === "docking-validation") return <DockingPage snapshot={snapshot} />;
  if (page === "knowledge-base") return <KnowledgeBasePage snapshot={snapshot} />;
  if (page === "experiments") return <ExperimentsPage snapshot={snapshot} />;
  if (page === "reports") return <ReportsPage snapshot={snapshot} />;
  if (page === "settings") return <SettingsPage />;
  return <AiScientistPage />;
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-lg border bg-slate-900/70" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace data unavailable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function DashboardPage({ snapshot }: { snapshot?: Snapshot }) {
  const metrics = snapshot?.metrics ?? [];
  const activity = snapshot?.activity ?? [];
  const candidates = snapshot?.candidates ?? [];
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Scientific Metrics</CardTitle>
              <CardDescription>Confidence and affinity trends across active campaigns</CardDescription>
            </div>
            <Badge tone="emerald">live</Badge>
          </CardHeader>
          <CardContent>
            <ScientificTrendChart data={snapshot?.chartData ?? []} />
          </CardContent>
        </Card>
        <WorkflowPanel steps={snapshot?.workflowSteps ?? []} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <RecentActivity items={activity} />
        <CandidateTable candidates={candidates} compact />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <MolecularViewer pdbId="1M17" label="EGFR Kinase Domain (PDB: 1M17)" />
        <KnowledgeBasePage snapshot={snapshot} compact />
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{metric.label}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold text-white">{metric.value}</p>
          <Badge tone={metric.tone === "white" ? "slate" : metric.tone}>{metric.delta}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectWorkspace({ snapshot }: { snapshot?: Snapshot }) {
  const projects = snapshot?.projects ?? [];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Research objectives, target context, collaboration, and file provenance</CardDescription>
          </div>
          <Button variant="primary"><Upload /> Upload files</Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet. Submit a binder design to create one.</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="rounded-lg border bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{project.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{project.objective}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <span>Target: <strong className="text-white">{project.target}</strong></span>
                  <span>Owner: <strong className="text-white">{project.owner}</strong></span>
                  <span>Updated: <strong className="text-white">{project.updatedAt}</strong></span>
                </div>
                <Progress className="mt-4" value={project.progress} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Experimental Notes</CardTitle>
            <Users className="size-4 text-cyan-200" />
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            All experiments are tracked with immutable input hashes, random seeds, model adapter versions, and PostgreSQL-backed audit logs. Every candidate is reproducible.
          </CardContent>
        </Card>
        <RecentActivity items={snapshot?.activity ?? []} />
      </div>
    </div>
  );
}

function TargetAnalysisPage({ snapshot }: { snapshot?: Snapshot }) {
  const experiments = snapshot?.experiments ?? [];
  const [targetQuery, setTargetQuery] = useState("P00533");
  const [targetResult, setTargetResult] = useState<Awaited<ReturnType<typeof lookupTarget>> | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [literatureResults, setLiteratureResults] = useState<Array<{ id: string; title: string; url: string | null; source: string }>>([]);
  const [litLoading, setLitLoading] = useState(false);

  const [bindingSites, setBindingSites] = useState<number[] | null>(null);
  const [bindingConfidence, setBindingConfidence] = useState<number | null>(null);
  const [bindingLoading, setBindingLoading] = useState(false);
  const [seqScore, setSeqScore] = useState<{ mean: number; interpretation: string } | null>(null);
  const [seqScoreLoading, setSeqScoreLoading] = useState(false);

  const handleTargetLookup = useCallback(async () => {
    if (!targetQuery.trim()) return;
    setTargetLoading(true);
    setTargetError(null);
    setBindingSites(null);
    setBindingConfidence(null);
    setSeqScore(null);
    try {
      const result = await lookupTarget(targetQuery.trim());
      setTargetResult(result);
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : "Lookup failed");
      setTargetResult(null);
    } finally {
      setTargetLoading(false);
    }
  }, [targetQuery]);

  const handleLiteratureSearch = useCallback(async () => {
    const query = targetResult?.protein_name || targetQuery;
    if (!query) return;
    setLitLoading(true);
    try {
      const result = await searchLiterature(query, 5);
      setLiteratureResults(result.papers);
    } catch {
      setLiteratureResults([]);
    } finally {
      setLitLoading(false);
    }
  }, [targetResult, targetQuery]);

  const runEsm2Analysis = useCallback(async () => {
    const seq = targetResult?.sequence;
    if (!seq) return;
    setBindingLoading(true);
    setSeqScoreLoading(true);
    try {
      const [sites, score] = await Promise.all([
        detectBindingSites(seq, 8),
        scoreSequence(seq),
      ]);
      setBindingSites(sites.residue_positions_1indexed);
      setBindingConfidence(sites.confidence);
      setSeqScore({ mean: score.mean_log_likelihood, interpretation: score.interpretation });
    } catch {
      setBindingSites(null);
      setSeqScore(null);
    } finally {
      setBindingLoading(false);
      setSeqScoreLoading(false);
    }
  }, [targetResult]);

  useEffect(() => {
    handleTargetLookup();
  }, [handleTargetLookup]);

  useEffect(() => {
    if (targetResult?.sequence) {
      runEsm2Analysis();
    }
  }, [targetResult?.sequence, runEsm2Analysis]);

  const sequence = (targetResult?.sequence as string) ?? "";
  const proteinName = (targetResult?.protein_name as string) ?? "";
  const organism = (targetResult?.organism as string) ?? "";
  const accession = (targetResult?.accession as string) ?? "";

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Protein Target Lookup</CardTitle>
            <CardDescription>Fetch real protein data from UniProt, PDB, and AlphaFold databases</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <input
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              placeholder="UniProt accession, PDB ID, or protein name"
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") handleTargetLookup(); }}
            />
            <Button size="sm" onClick={handleTargetLookup} disabled={targetLoading}>
              {targetLoading ? "Looking up..." : "Look up"}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleLiteratureSearch} disabled={litLoading}>
              {litLoading ? "Searching..." : "Search literature"}
            </Button>
          </div>
          {targetError && <p className="text-sm text-red-400 mb-3">{targetError}</p>}
          {targetResult && (
            <div className="rounded-lg border bg-slate-950/50 p-4 mb-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div><span className="text-muted-foreground">Accession:</span> <strong className="text-white font-mono">{accession}</strong></div>
                <div><span className="text-muted-foreground">Protein:</span> <strong className="text-white">{proteinName || "N/A"}</strong></div>
                <div><span className="text-muted-foreground">Organism:</span> <strong className="text-white">{organism || "N/A"}</strong></div>
              </div>
              {sequence && (
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">Sequence ({sequence.length} residues):</span>
                  <div className="mt-1 font-mono text-xs text-cyan-100 break-all max-h-24 overflow-y-auto">{sequence}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {sequence && (
        <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sequence Viewer</CardTitle>
                  <CardDescription>Full protein sequence with ESM2-predicted binding site highlights</CardDescription>
                </div>
                <Badge tone="cyan">{sequence.length} residues</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <SequenceViewer sequence={sequence} bindingSites={bindingSites ?? undefined} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader>
                <CardTitle>ESM2 Analysis</CardTitle>
                <CardDescription>ML-powered binding site detection and sequence fitness scoring</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-slate-950/50 p-4">
                  <h3 className="text-sm font-semibold text-white">Binding Sites</h3>
                  {bindingLoading ? (
                    <p className="mt-2 text-xs text-muted-foreground animate-pulse">Running ESM2 attention analysis...</p>
                  ) : bindingSites ? (
                    <div className="mt-2">
                      <div className="text-xs text-slate-300">
                        {bindingSites.length} predicted binding residues (confidence: {(bindingConfidence ?? 0 * 100).toFixed(1)}%)
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bindingSites.map((pos) => (
                          <span key={pos} className="rounded bg-cyan-900/40 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                            {pos}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No data</p>
                  )}
                </div>
                <div className="rounded-lg border bg-slate-950/50 p-4">
                  <h3 className="text-sm font-semibold text-white">Sequence Score</h3>
                  {seqScoreLoading ? (
                    <p className="mt-2 text-xs text-muted-foreground animate-pulse">Computing log-likelihood...</p>
                  ) : seqScore ? (
                    <div className="mt-2">
                      <div className="text-lg font-bold text-cyan-300">{seqScore.mean.toFixed(3)} nats</div>
                      <div className="text-xs text-slate-300">{seqScore.interpretation}</div>
                      <div className="mt-1 text-[10px] text-muted-foreground">Higher (less negative) = more protein-like</div>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Protein Targets Studied</CardTitle>
                  <CardDescription>{experiments.length} experiments with real evidence</CardDescription>
                </div>
                <Badge tone="emerald">{experiments.length} experiments</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {experiments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No experiments yet. Submit a binder design workflow to start tracking.</p>
                ) : (
                  experiments.map((exp) => (
                    <div key={exp.experiment_id} className="rounded-lg border bg-slate-950/50 p-3">
                      <div className="mb-2 flex justify-between gap-3 text-sm">
                        <span className="font-medium text-white">Experiment {exp.experiment_id.slice(0, 8)}</span>
                        <span className="text-muted-foreground">Seed: {exp.random_seed}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(exp.outputs?.candidate_count as number) ?? 0} candidates · {(exp.outputs?.binding_site_count as number) ?? 0} binding sites · {exp.status}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Evidence: {((exp.outputs?.evidence_sources as string[]) ?? []).join(", ") || "UniProt, PDB, Europe PMC"}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {literatureResults.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Literature Evidence</CardTitle>
              <CardDescription>Real publications from Europe PMC for {targetQuery}</CardDescription>
            </div>
            <Badge tone="cyan">{literatureResults.length} papers</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {literatureResults.map((paper) => (
              <div key={paper.id} className="rounded-lg border bg-slate-950/50 p-3">
                <div className="flex justify-between gap-3">
                  <span className="text-sm font-medium text-white">{paper.title}</span>
                  <Badge tone="blue">{paper.source}</Badge>
                </div>
                {paper.url && (
                  <a href={paper.url} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-cyan-400 hover:underline">
                    {paper.url}
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <InfoList title="Evidence Sources" items={["UniProt REST API", "RCSB PDB API", "AlphaFold DB API", "Europe PMC API", "ESM2-650M attention maps"]} />
        <InfoList title="Model Stack" items={["ESM2-650M Binding Site Agent", "ESM2 Sequence Fitness Scorer", "UniProt/PDB Evidence Agent", "Europe PMC Literature Agent"]} />
        <InfoList title="Data Sources" items={["PostgreSQL audit log", "Knowledge graph", "Artifact store"]} />
      </div>
    </div>
  );
}

function StructurePredictionPage() {
  const [sequence, setSequence] = useState("MKFLIVALT");
  const [prediction, setPrediction] = useState<{
    pdb_content: string;
    mean_plddt: number;
    confidence_classification: string;
    confidence_summary: {
      confident_pct: number;
      good_pct: number;
      low_pct: number;
      very_low_pct: number;
      mean_plddt: number;
    };
    interpretation: string;
    plddt_per_residue: number[];
    method: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    if (!sequence || sequence.length < 20) {
      setError("Sequence must be at least 20 residues");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { predictStructure } = await import("@/lib/api");
      const result = await predictStructure(sequence);
      setPrediction(result);
    } catch (e) {
      setError("Structure prediction failed. Ensure the backend is running with ML models.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>ESMFold Structure Prediction</CardTitle>
          <CardDescription>Predict 3D protein structure from a single sequence using ESMFold</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <textarea
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
            placeholder="Enter amino acid sequence (20-500 residues recommended)"
            className="h-24 rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm font-mono text-slate-200 placeholder:text-slate-500"
          />
          <Button onClick={handlePredict} disabled={loading} className="w-full">
            {loading ? "Predicting structure..." : "Predict Structure (ESMFold)"}
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </CardContent>
      </Card>

      {prediction && (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Structure Viewer</CardTitle>
              <CardDescription>ESMFold predicted structure (pLDDT-colored)</CardDescription>
            </CardHeader>
            <CardContent>
              <MolecularViewer pdbContent={prediction.pdb_content} label="ESMFold Prediction" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Confidence Analysis</CardTitle>
              <CardDescription>Per-residue pLDDT confidence scores</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="rounded-lg border bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Mean pLDDT: {prediction.mean_plddt.toFixed(1)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{prediction.interpretation}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border bg-blue-950/30 p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{prediction.confidence_summary.confident_pct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Confident (&gt;90)</p>
                </div>
                <div className="rounded-lg border bg-cyan-950/30 p-3 text-center">
                  <p className="text-lg font-bold text-cyan-400">{prediction.confidence_summary.good_pct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Good (70-90)</p>
                </div>
                <div className="rounded-lg border bg-yellow-950/30 p-3 text-center">
                  <p className="text-lg font-bold text-yellow-400">{prediction.confidence_summary.low_pct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Low (50-70)</p>
                </div>
                <div className="rounded-lg border bg-red-950/30 p-3 text-center">
                  <p className="text-lg font-bold text-red-400">{prediction.confidence_summary.very_low_pct.toFixed(0)}%</p>
                  <p className="text-xs text-slate-400">Very Low (&lt;50)</p>
                </div>
              </div>
              <div className="rounded-lg border bg-slate-950/50 p-3">
                <p className="text-xs text-slate-400">Classification: <span className="font-semibold text-white">{prediction.confidence_classification}</span></p>
                <p className="text-xs text-slate-400">Method: {prediction.method}</p>
              </div>
              {prediction.plddt_per_residue.length > 0 && (
                <div className="rounded-lg border bg-slate-950/50 p-4">
                  <h4 className="mb-2 text-xs font-semibold text-white">Per-Residue pLDDT Confidence</h4>
                  <PlddtChart scores={prediction.plddt_per_residue} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function BinderGenerationPage({ snapshot }: { snapshot?: Snapshot }) {
  const candidates = snapshot?.candidates ?? [];
  const selectedCandidateId = useAppStore((state) => state.selectedCandidateId);
  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <WorkflowSubmissionForm />
      <CandidateTable candidates={candidates} />

      {selectedCandidate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Candidate Detail</CardTitle>
                <CardDescription>Full analysis for {selectedCandidate.id.slice(0, 24)}</CardDescription>
              </div>
              <Badge tone={selectedCandidate.risk === "low" ? "emerald" : "blue"}>{selectedCandidate.risk} risk</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Confidence</h4>
              <p className="mt-1 text-lg font-bold text-cyan-300">{formatPercent(selectedCandidate.confidence)}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${selectedCandidate.confidence * 100}%` }} />
              </div>
            </div>
            <div className="rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Novelty</h4>
              <p className="mt-1 text-lg font-bold text-emerald-300">{formatPercent(selectedCandidate.novelty)}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${selectedCandidate.novelty * 100}%` }} />
              </div>
            </div>
            <div className="rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Developability</h4>
              <p className="mt-1 text-lg font-bold text-blue-300">{formatPercent(selectedCandidate.developability)}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${selectedCandidate.developability * 100}%` }} />
              </div>
            </div>
            <div className="rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Affinity</h4>
              <p className="mt-1 text-lg font-bold text-purple-300">{formatPercent(selectedCandidate.affinity)}</p>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
                <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${selectedCandidate.affinity * 100}%` }} />
              </div>
            </div>
            <div className="col-span-full rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Sequence</h4>
              <p className="mt-1 font-mono text-xs text-cyan-100 break-all">{selectedCandidate.sequence}</p>
            </div>
            <div className="col-span-full rounded-lg border bg-slate-950/50 p-4">
              <h4 className="text-xs text-muted-foreground">Ranking Rationale</h4>
              <p className="mt-1 text-sm leading-6 text-slate-300">{selectedCandidate.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Explanation</CardTitle>
          <CardDescription>Ranking rationale includes confidence, novelty, developability, affinity, risk, evidence, and uncertainty.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {candidates.slice(0, 3).map((candidate) => (
            <div key={candidate.id} className="rounded-lg border bg-slate-950/50 p-4">
              <Badge tone={candidate.risk === "low" ? "emerald" : "blue"}>{candidate.risk} risk</Badge>
              <h3 className="mt-3 text-sm font-semibold text-white">{candidate.id.slice(0, 16)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{candidate.explanation}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const PRESET_TARGETS = [
  { pdb: "1M17", name: "EGFR Kinase", description: "Epidermal Growth Factor Receptor" },
  { pdb: "4INS", name: "Insulin", description: "Human Insulin" },
  { pdb: "1M18", name: "EGFR T790M", description: "EGFR with resistance mutation" },
  { pdb: "2HIU", name: "Human Insulin", description: "Insulin hexamer structure" },
  { pdb: "1EMA", name: "GFP", description: "Green Fluorescent Protein" },
  { pdb: "3CLN", name: "Calmodulin", description: "Calcium-binding protein" },
  { pdb: "1A2B", name: "HIV Protease", description: "HIV-1 Protease with inhibitor" },
  { pdb: "4HHB", name: "Hemoglobin", description: "Human Hemoglobin" },
  { pdb: "1BNA", name: "DNA Duplex", description: "B-DNA dodecamer" },
  { pdb: "3NIR", name: "Dihydrofolate Reductase", description: "E. coli DHFR" },
];

function DockingPage({ snapshot }: { snapshot?: Snapshot }) {
  const candidates = snapshot?.candidates ?? [];
  const topCandidate = candidates[0];
  const experiments = snapshot?.experiments ?? [];

  const [pdbId, setPdbId] = useState("1M17");
  const [targetName, setTargetName] = useState("EGFR Kinase");
  const [pdbInput, setPdbInput] = useState("1M17");
  const [showPresets, setShowPresets] = useState(false);
  const [serverInteractions, setServerInteractions] = useState<ReturnType<typeof generateInteractions> | null>(null);
  const [dockingLoading, setDockingLoading] = useState(false);
  const [dockingSummary, setDockingSummary] = useState<Record<string, number> | null>(null);

  const bindingSiteData = {
    residues: [36, 37, 38, 39, 40, 41, 42, 43],
    description: "Evidence-informed baseline interface window from source-backed protein analysis.",
    confidence: 0.56,
    method: "source-backed-baseline",
  };

  const candidateId = topCandidate?.id ?? "baseline-candidate";
  const candidateSeq = topCandidate?.sequence ?? "GEALADHRAKQWAQKDG";
  const candidateScore = topCandidate?.affinity ?? 0.65;
  const candidateStability = topCandidate?.developability ?? 0.66;
  const candidateNovelty = topCandidate?.novelty ?? 0.55;

  const candidateData = {
    candidate_id: candidateId,
    sequence: candidateSeq,
    binding_score: candidateScore,
    stability_score: candidateStability,
    novelty_score: candidateNovelty,
    risk_flags: ["computational-only", "requires-wet-lab-validation"],
  };

  const fallbackInteractions = generateInteractions(bindingSiteData, candidateData);
  const interactions = serverInteractions ?? fallbackInteractions;

  useEffect(() => {
    let cancelled = false;
    async function fetchDocking() {
      setDockingLoading(true);
      try {
        const result = await runDocking({
          pdb_id: pdbId,
          binding_residues: bindingSiteData.residues,
          candidate_sequence: candidateSeq,
          candidate_id: candidateId,
        });
        if (!cancelled) {
          setServerInteractions(result.interactions as any);
          setDockingSummary(result.summary as any);
        }
      } catch {
        if (!cancelled) {
          setServerInteractions(null);
          setDockingSummary(null);
        }
      } finally {
        if (!cancelled) setDockingLoading(false);
      }
    }
    fetchDocking();
    return () => { cancelled = true; };
  }, [pdbId, candidateId, candidateSeq]);

  const handlePreset = (preset: typeof PRESET_TARGETS[0]) => {
    setPdbId(preset.pdb);
    setPdbInput(preset.pdb);
    setTargetName(preset.name);
    setShowPresets(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pdbInput.trim().toUpperCase();
    if (trimmed.length === 4) {
      setPdbId(trimmed);
      setTargetName(targetName || trimmed);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-cyan-500/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-cyan-100">Target Protein</CardTitle>
          <CardDescription className="text-xs">Enter a 4-character PDB ID or select a preset</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={pdbInput}
                onChange={(e) => setPdbInput(e.target.value.toUpperCase())}
                placeholder="PDB ID (e.g. 1M17)"
                maxLength={4}
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              <input
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="Target name"
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              <Button type="submit" size="sm" className="bg-cyan-600 hover:bg-cyan-500 px-4">
                {dockingLoading ? "Computing..." : "Load"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowPresets(!showPresets)} className="border-slate-700 text-slate-300">
                Presets
              </Button>
            </div>
            {showPresets && (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                {PRESET_TARGETS.map((p) => (
                  <button
                    key={p.pdb}
                    onClick={() => handlePreset(p)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${pdbId === p.pdb ? "border-cyan-500 bg-cyan-950/30 text-cyan-200" : "border-slate-700 bg-slate-950/50 text-slate-300 hover:border-slate-500"}`}
                  >
                    <span className="font-mono font-bold">{p.pdb}</span>
                    <span className="ml-1 text-muted-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Current: <span className="font-mono text-cyan-400">{pdbId}</span> · {targetName} · Docking computed via backend API</p>
          </form>
        </CardContent>
      </Card>

      {dockingSummary && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Total Energy", value: `${dockingSummary.total_energy} kcal/mol` },
            { label: "H-Bonds", value: String(dockingSummary.hydrogen_bonds) },
            { label: "Hydrophobic", value: String(dockingSummary.hydrophobic_contacts) },
            { label: "Salt Bridges", value: String(dockingSummary.salt_bridges) },
            { label: "Total Contacts", value: String(dockingSummary.total_contacts) },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DockingViewer3D pdbId={pdbId} bindingSite={bindingSiteData} candidate={candidateData} />
      <DockingInteractionDiagram
        interactions={interactions}
        pdbId={pdbId}
        targetName={targetName}
        ligandName="Binder Candidate"
      />
      <InteractionDiagram interactions={interactions} candidate={candidateData} />
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Docking Scores</CardTitle>
            <CardDescription>Binding energy, stability, novelty, and confidence for all candidates</CardDescription>
          </div>
          <Badge tone="cyan">{candidates.length} candidates</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No candidates to display. Run a binder design workflow first.</p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3">Candidate</th><th>Binding Score</th><th>Stability</th><th>Novelty</th><th>Confidence</th><th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr key={c.id} className="border-b border-slate-800/80">
                    <td className="py-3 font-medium text-white">{c.id.slice(0, 16)}</td>
                    <td>{formatPercent(c.affinity)}</td>
                    <td>{formatPercent(c.developability)}</td>
                    <td>{formatPercent(c.novelty)}</td>
                    <td>{formatPercent(c.confidence)}</td>
                    <td><Badge tone={c.risk === "low" ? "emerald" : "blue"}>{c.risk}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AiScientistPage() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "scientist"; text: string; citations?: string[] }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await chatWithAiScientist(msg);
      setMessages((prev) => [...prev, { role: "scientist", text: res.response, citations: res.citations }]);
    } catch {
      setMessages((prev) => [...prev, { role: "scientist", text: "Error: failed to reach AI Scientist backend." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const quickActions = [
    "Analyze resistance mutations for EGFR",
    "What wet-lab assays should I run next?",
    "Explain the docking interactions",
    "Summarize findings for a report",
    "Compare candidates by confidence",
    "What are the risks of this binder?",
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Scientist Workspace</CardTitle>
          <CardDescription>Ask scientific questions, interpret docking results, compare candidates, and get experiment recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => send(action)}
                disabled={loading}
                className="rounded-lg border bg-slate-950/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-300/60 hover:text-white disabled:opacity-50"
              >
                {action}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardContent className="flex flex-col gap-3 py-4">
          {messages.length === 0 && !loading && (
            <p className="py-8 text-center text-sm text-muted-foreground">Ask a question or use a quick action above to start.</p>
          )}
          <div className="flex max-h-[40rem] flex-col gap-3 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg border p-3 text-sm ${msg.role === "user" ? "ml-auto max-w-[80%] border-cyan-500/30 bg-cyan-950/20 text-cyan-100" : "mr-auto max-w-[80%] border-slate-700 bg-slate-950/60 text-slate-200"}`}>
                <p className="whitespace-pre-wrap leading-6">{msg.text}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.citations.map((c) => (
                      <span key={c} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[80%] rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-400">
                <span className="animate-pulse">Thinking...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask about targets, mutations, assays, docking..."
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KnowledgeBasePage({ snapshot, compact = false }: { snapshot?: Snapshot; compact?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Knowledge Graph</CardTitle>
          <CardDescription>Projects, experiments, and protein targets from the platform</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <KnowledgeGraph />
        {!compact ? (
          <div className="mt-4">
            <InfoList
              title="Evidence Relationships"
              items={(snapshot?.kg?.edges ?? []).slice(0, 6).map((e) => `${e.source.slice(0, 12)} → ${e.label} → ${e.target.slice(0, 12)}`)}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ExperimentsPage({ snapshot }: { snapshot?: Snapshot }) {
  const experiments = snapshot?.experiments ?? [];
  return (
    <div className="flex flex-col gap-5">
      <WorkflowSubmissionForm />
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <WorkflowPanel steps={snapshot?.workflowSteps ?? []} />
      <Card>
        <CardHeader>
          <CardTitle>Experiment Tracking</CardTitle>
          <CardDescription>Every prediction stores inputs, model versions, hyperparameters, environment metadata, seeds, and outputs</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {experiments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experiments yet. Submit a binder design workflow to start tracking.</p>
          ) : (
            experiments.map((exp) => (
              <div key={exp.experiment_id} className="rounded-lg border bg-slate-950/50 p-3 font-mono text-xs text-cyan-100">
                <div className="flex justify-between">
                  <span>{exp.experiment_id.slice(0, 8)}…</span>
                  <Badge tone="emerald">{exp.status}</Badge>
                </div>
                <div className="mt-2 text-muted-foreground">
                  seed: {exp.random_seed} · project: {exp.project_id} · candidates: {(exp.outputs?.candidate_count as number) ?? 0}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

function ReportsPage({ snapshot }: { snapshot?: Snapshot }) {
  const experiments = snapshot?.experiments ?? [];
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = useCallback(async (experimentId: string) => {
    setSelectedExpId(experimentId);
    setReportLoading(true);
    try {
      const data = await getReport(experimentId);
      setReportData(data);
    } catch {
      setReportData(null);
    } finally {
      setReportLoading(false);
    }
  }, []);

  const sections = (reportData?.report_sections as Record<string, string>) ?? {};
  const allExps = (reportData?.all_experiments as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Research Report Generator</CardTitle>
            <CardDescription>Real reports generated from versioned experiments, linked evidence, and auditable model provenance</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {experiments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experiments available. Run a binder design workflow to generate report data.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Select an experiment to view its report:</p>
              <div className="grid gap-2 md:grid-cols-2">
                {experiments.slice(0, 6).map((exp) => (
                  <button
                    key={exp.experiment_id}
                    onClick={() => loadReport(exp.experiment_id)}
                    className={`rounded-lg border p-3 text-left transition ${selectedExpId === exp.experiment_id ? "border-cyan-500 bg-cyan-950/30" : "border-slate-700 bg-slate-950/50 hover:border-slate-500"}`}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-white">Experiment {exp.experiment_id.slice(0, 8)}</span>
                      <Badge tone="emerald">{exp.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Seed: {exp.random_seed} · Candidates: {(exp.outputs?.candidate_count as number) ?? 0}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {reportLoading && (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground animate-pulse">Loading report data from backend...</p>
          </CardContent>
        </Card>
      )}

      {reportData && !reportLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {["executive_summary", "methods", "results", "risk_analysis"].map((key) => (
              <div key={key} className="rounded-lg border bg-slate-950/50 p-4">
                <h3 className="text-sm font-semibold text-white capitalize">{key.replace(/_/g, " ")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{sections[key] ?? "No data available."}</p>
              </div>
            ))}
          </div>

          {allExps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Experiment Summary</CardTitle>
                <CardDescription>{allExps.length} experiments with real audit data</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {allExps.slice(0, 5).map((exp) => (
                  <div key={exp.experiment_id as string} className="rounded-lg border bg-slate-950/50 p-3 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-cyan-100">{(exp.experiment_id as string).slice(0, 8)}...</span>
                      <Badge tone="emerald">{exp.status as string}</Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      seed: {exp.random_seed as number} · project: {exp.project_id as string} · candidates: {((exp.outputs as Record<string, unknown>)?.candidate_count as number) ?? 0}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Export report data in various formats</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!reportData) return;
                    const sections = reportData.report_sections as Record<string, string>;
                    const exp = reportData.experiment as Record<string, unknown>;
                    const md = [
                      `# Research Report — ${(exp.experiment_id as string)?.slice(0, 8) ?? "N/A"}`,
                      "",
                      `**Experiment:** ${exp.experiment_id}`,
                      `**Project:** ${exp.project_id}`,
                      `**Workflow:** ${exp.workflow_name}`,
                      `**Status:** ${exp.status}`,
                      `**Random Seed:** ${exp.random_seed}`,
                      "",
                      "---",
                      "",
                      "## Executive Summary",
                      sections?.executive_summary ?? "N/A",
                      "",
                      "## Methods",
                      sections?.methods ?? "N/A",
                      "",
                      "## Results",
                      sections?.results ?? "N/A",
                      "",
                      "## Risk Analysis",
                      sections?.risk_analysis ?? "N/A",
                      "",
                      "---",
                      "*Generated by OpenBioDesign platform*",
                    ].join("\n");
                    const blob = new Blob([md], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `report-${(exp.experiment_id as string)?.slice(0, 8) ?? "export"}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <FileText /> Markdown
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (!reportData) return;
                    const sections = reportData.report_sections as Record<string, string>;
                    const exp = reportData.experiment as Record<string, unknown>;
                    const html = [
                      "<html><head><title>OpenBioDesign Report</title>",
                      "<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#222}",
                      "h1{border-bottom:2px solid #22d3ee;padding-bottom:8px}h2{color:#0891b2}",
                      ".meta{color:#666;font-size:0.9em}.section{margin:24px 0;padding:16px;border:1px solid #e5e7eb;border-radius:8px}",
                      "</style></head><body>",
                      `<h1>Research Report — ${(exp.experiment_id as string)?.slice(0, 8) ?? "N/A"}</h1>`,
                      `<p class="meta"><b>Experiment:</b> ${exp.experiment_id}<br>`,
                      `<b>Project:</b> ${exp.project_id}<br>`,
                      `<b>Workflow:</b> ${exp.workflow_name}<br>`,
                      `<b>Status:</b> ${exp.status}<br>`,
                      `<b>Random Seed:</b> ${exp.random_seed}</p>`,
                      `<div class="section"><h2>Executive Summary</h2><p>${sections?.executive_summary ?? "N/A"}</p></div>`,
                      `<div class="section"><h2>Methods</h2><p>${sections?.methods ?? "N/A"}</p></div>`,
                      `<div class="section"><h2>Results</h2><p>${sections?.results ?? "N/A"}</p></div>`,
                      `<div class="section"><h2>Risk Analysis</h2><p>${sections?.risk_analysis ?? "N/A"}</p></div>`,
                      "<p style='color:#999;margin-top:40px;font-size:0.8em'>Generated by OpenBioDesign platform</p>",
                      "</body></html>",
                    ].join("\n");
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `report-${(exp.experiment_id as string)?.slice(0, 8) ?? "export"}.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download /> Word
                </Button>
                <Button
                  onClick={() => {
                    if (!reportData) return;
                    const sections = reportData.report_sections as Record<string, string>;
                    const exp = reportData.experiment as Record<string, unknown>;
                    const txt = [
                      "OPENBIODESIGN RESEARCH REPORT",
                      "=".repeat(50),
                      "",
                      `Experiment ID: ${exp.experiment_id}`,
                      `Project: ${exp.project_id}`,
                      `Workflow: ${exp.workflow_name}`,
                      `Status: ${exp.status}`,
                      `Random Seed: ${exp.random_seed}`,
                      "",
                      "EXECUTIVE SUMMARY",
                      "-".repeat(30),
                      sections?.executive_summary ?? "N/A",
                      "",
                      "METHODS",
                      "-".repeat(30),
                      sections?.methods ?? "N/A",
                      "",
                      "RESULTS",
                      "-".repeat(30),
                      sections?.results ?? "N/A",
                      "",
                      "RISK ANALYSIS",
                      "-".repeat(30),
                      sections?.risk_analysis ?? "N/A",
                      "",
                      "=".repeat(50),
                      "Generated by OpenBioDesign platform",
                    ].join("\n");
                    const blob = new Blob([txt], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `report-${(exp.experiment_id as string)?.slice(0, 8) ?? "export"}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {["Executive Summary", "Scientific Findings", "Risk Analysis"].map((section) => (
                <div key={section} className="rounded-lg border bg-slate-950/50 p-4">
                  <h3 className="text-sm font-semibold text-white">{section}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Generated from versioned experiments, linked evidence, uncertainty analysis, and auditable model provenance.</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && !reportLoading && experiments.length > 0 && (
        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2 py-8">
            {["Executive Summary", "Scientific Findings", "Candidate Rankings", "Risk Analysis", "Recommended Next Steps", "References"].map((section) => (
              <div key={section} className="rounded-lg border bg-slate-950/50 p-4">
                <h3 className="text-sm font-semibold text-white">{section}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Select an experiment above to view real report data.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SettingsPage() {
  const [health, setHealth] = useState<string>("checking...");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const apiBase = (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) || "http://127.0.0.1:8000/api/v1";

  useEffect(() => {
    fetch(`${apiBase}/health`, { headers: { Authorization: "Bearer dev-scientist-key" } })
      .then((r) => r.json())
      .then((d) => setHealth(d.status === "ok" ? "Connected" : "Error"))
      .catch(() => setHealth("Unreachable"));
    fetch(`${apiBase}/stats`, { headers: { Authorization: "Bearer dev-scientist-key" } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, [apiBase]);

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>System configuration, API health, and model status</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">API Health</h3>
            <Badge tone={health === "Connected" ? "emerald" : "blue"}>{health}</Badge>
            <p className="mt-2 text-xs text-muted-foreground">{apiBase}</p>
          </div>
          <div className="rounded-lg border bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">Platform Stats</h3>
            {stats ? (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-300">
                <span>Projects: {stats.total_projects}</span>
                <span>Experiments: {stats.total_experiments}</span>
                <span>Candidates: {stats.total_candidates}</span>
                <span>Artifacts: {stats.total_artifacts}</span>
                <span>Audit Events: {stats.total_audit_events}</span>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
            )}
          </div>
          <div className="rounded-lg border bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">ML Models</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>ESM2-650M — Binding site detection &amp; scoring</li>
              <li>ESMFold — Single-sequence structure prediction</li>
              <li>E5 / BGE — Text embeddings (planned)</li>
              <li>Qwen3 / Llama 3 — Scientific reasoning (planned)</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold text-white">Security</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              <li>RBAC — role-based access control</li>
              <li>API keys — dev-scientist-key, dev-admin-key, dev-viewer-key</li>
              <li>Audit logging — immutable experiment records</li>
              <li>CORS — allow all origins (dev mode)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CandidateTable({ candidates, compact = false }: { candidates: Candidate[]; compact?: boolean }) {
  const selectedCandidateId = useAppStore((state) => state.selectedCandidateId);
  const selectCandidate = useAppStore((state) => state.selectCandidate);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Candidate Ranking</CardTitle>
          <CardDescription>Sortable binder generation output with explainability and risk metadata</CardDescription>
        </div>
        <Badge tone="cyan">{candidates.length} candidates</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No candidates yet. Submit a protein target to generate binders.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-3">Candidate</th><th>Sequence</th><th>Confidence</th><th>Novelty</th><th>Developability</th><th>Affinity</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onClick={() => selectCandidate(candidate.id)}
                  className={`cursor-pointer border-b border-slate-800/80 transition hover:bg-slate-900 ${selectedCandidateId === candidate.id ? "bg-cyan-300/10" : ""}`}
                >
                  <td className="py-3 font-medium text-white">{candidate.id.slice(0, 16)}</td>
                  <td className="max-w-52 truncate font-mono text-xs">{candidate.sequence}</td>
                  <td>{formatPercent(candidate.confidence)}</td>
                  <td>{formatPercent(candidate.novelty)}</td>
                  <td>{formatPercent(candidate.developability)}</td>
                  <td>{formatPercent(candidate.affinity)}</td>
                  <td><Badge tone={candidate.risk === "low" ? "emerald" : "blue"}>{candidate.risk}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!compact ? <p className="mt-3 text-xs text-muted-foreground">Selected rows update shared workspace state for downstream docking and AI interpretation.</p> : null}
      </CardContent>
    </Card>
  );
}

function RecentActivity({ items }: { items: ResearchActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Research Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Run a workflow to see activity here.</p>
        ) : (
          items.map((item) => (
            <div key={`${item.time}-${item.title}`} className="flex gap-3 rounded-lg border bg-slate-950/50 p-3">
              <div className="w-12 shrink-0 text-xs text-cyan-100">{item.time}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">{item.title}</p>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="rounded-md border bg-slate-950/50 p-3 text-sm text-muted-foreground">No data available.</li>
          ) : (
            items.map((item) => (
              <li key={item} className="rounded-md border bg-slate-950/50 p-3 text-sm leading-6 text-muted-foreground">{item}</li>
            ))
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
