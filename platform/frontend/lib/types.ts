import type { LucideIcon } from "lucide-react";

export type WorkflowStatus = "queued" | "running" | "completed" | "failed";

export type PageKey =
  | "dashboard"
  | "projects"
  | "target-discovery"
  | "protein-analysis"
  | "structure-prediction"
  | "binder-generation"
  | "molecule-design"
  | "docking-validation"
  | "ai-scientist"
  | "knowledge-base"
  | "experiments"
  | "reports"
  | "settings";

export type NavigationItem = {
  key: PageKey;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type Metric = {
  label: string;
  value: string;
  delta: string;
  tone: "cyan" | "emerald" | "blue" | "white";
};

export type Project = {
  id: string;
  name: string;
  target: string;
  objective: string;
  status: WorkflowStatus;
  owner: string;
  progress: number;
  updatedAt: string;
};

export type ProteinTarget = {
  accession: string;
  proteinName: string;
  geneName: string;
  organism: string;
  sequence: string;
  domains: Array<{ name: string; start: number; end: number; confidence: number }>;
  mutations: Array<{ residue: string; effect: string; risk: "low" | "medium" | "high" }>;
  diseases: string[];
  references: Array<{ title: string; source: string; confidence: number }>;
};

export type Candidate = {
  id: string;
  sequence: string;
  confidence: number;
  novelty: number;
  developability: number;
  affinity: number;
  risk: "low" | "medium" | "high";
  explanation: string;
};

export type DockingPose = {
  id: string;
  candidate: string;
  bindingEnergy: number;
  dockingScore: number;
  hydrogenBonds: number;
  pocketOccupancy: number;
  confidence: number;
};

export type WorkflowStep = {
  name: string;
  status: WorkflowStatus;
  progress: number;
  agent: string;
};

export type GraphNode = {
  id: string;
  label: string;
  type: "gene" | "protein" | "disease" | "compound" | "target" | "pathway" | "publication";
  x: number;
  y: number;
};

export type GraphEdge = {
  source: string;
  target: string;
  relation: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
};

export type ResearchActivity = {
  time: string;
  title: string;
  detail: string;
  status: WorkflowStatus;
};

// Backend API response types
export type BackendStats = {
  total_experiments: number;
  total_artifacts: number;
  total_audit_events: number;
  total_projects: number;
  total_candidates: number;
};

export type BackendProject = {
  project_id: string;
  name: string;
  created_by: string;
  created_at: string;
  experiment_count: number;
};

export type BackendExperiment = {
  experiment_id: string;
  project_id: string;
  workflow_name: string;
  status: string;
  random_seed: number;
  created_at: string;
  completed_at: string | null;
  outputs: Record<string, unknown>;
  audit_events: string[];
};

export type BackendKGNode = {
  id: string;
  label: string;
};

export type BackendKGEdge = {
  source: string;
  target: string;
  label: string;
};

export type BackendKG = {
  nodes: BackendKGNode[];
  edges: BackendKGEdge[];
};

export type BinderDesignRequest = {
  project_id: string;
  target: {
    name: string;
    sequence: string;
    accession?: string;
    organism?: string;
  };
  hypothesis: string;
  requested_candidates?: number;
  random_seed?: number;
};

export type BinderDesignResult = {
  experiment: {
    experiment_id: string;
    project_id: string;
    workflow_name: string;
    status: string;
    random_seed: number;
    created_at: string;
    completed_at: string | null;
    outputs: Record<string, unknown>;
    audit_events: string[];
  };
  target: {
    name: string;
    sequence: string;
    accession?: string;
    organism?: string;
  };
  binding_sites: Array<{
    residues: number[];
    description: string;
    confidence: number;
    method: string;
  }>;
  candidates: Array<{
    candidate_id: string;
    sequence: string;
    scaffold_id: string;
    interface_residues: number[];
    manufacturability_score: number;
    stability_score: number;
    binding_score: number;
    novelty_score: number;
    risk_flags: string[];
    confidence_metrics: Array<{ name: string; value: number; rationale: string }>;
  }>;
  ranking_rationale: string;
  experimental_recommendations: Array<{
    assay: string;
    purpose: string;
    controls: string[];
    acceptance_criteria: string[];
    priority: number;
  }>;
};
