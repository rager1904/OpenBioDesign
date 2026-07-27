# OpenBioDesign: Google Colab Free Tier Upgrade Plan

## Table of Contents

1. [Overview](#overview)
2. [Current State Audit](#current-state-audit)
3. [Colab Environment Constraints](#colab-environment-constraints)
4. [Upgrade Scope](#upgrade-scope)
5. [ESM2 Integration Plan](#esm2-integration-plan)
6. [ESMFold Integration Plan](#esmfold-integration-plan)
7. [Agent Replacements](#agent-replacements)
8. [API Endpoint Upgrades](#api-endpoint-upgrades)
9. [Frontend Updates](#frontend-updates)
10. [New Features](#new-features)
11. [What Stays As-Is](#what-stays-as-is)
12. [What Gets Skipped](#what-gets-skipped)
13. [File-by-File Changes](#file-by-file-changes)
14. [Colab Notebook Structure](#colab-notebook-structure)
15. [Verification Plan](#verification-plan)

---

## Overview

This document details every change required to upgrade OpenBioDesign from a deterministic/plumbing demo into a real ML-powered demonstration running entirely on Google Colab free tier ($0/month).

The core principle: **replace every fake/deterministic component with ESM2-650M or ESMFold inference on a T4 GPU**, while keeping all existing real infrastructure (SQLite, API integrations, provenance, auth) unchanged.

### What Changes

| Component | Current | After Upgrade |
|-----------|---------|---------------|
| Binding site detection | Window at `len/3` | ESM2 attention-based hotspots |
| Candidate sequences | `"G"+"A".join(random)+"G"` | ESM2 masked infilling |
| Candidate scores | `0.52 + random*0.2` | ESM2 negative log-likelihood |
| Structure prediction | 4 hardcoded strings | ESMFold actual prediction |
| Mutation analysis | Does not exist | ESM2 zero-shot effect scores |
| Docking scoring | Fake RNG | ESM2 embedding similarity |
| Per-residue visualization | Does not exist | ESM2 attention heatmap |
| AI Scientist chat | Keyword matching | Still basic (out of scope) |

### What Does NOT Change

| Component | Why |
|-----------|-----|
| SQLite database | Works on Colab, no changes needed |
| In-memory vector store | Works on Colab, no changes needed |
| SQL knowledge graph fallback | Works on Colab, no changes needed |
| Local artifact storage | Works on Colab, no changes needed |
| UniProt/PDB/AlphaFold/Europe PMC clients | Real APIs, no changes needed |
| Auth system | Works on Colab, no changes needed |
| Frontend framework | Works on Colab, no changes needed |
| Domain models | Extending, not replacing |
| Orchestrator | Extending, not replacing |

---

## Current State Audit

### What's Real Today

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| UniProt client | `infrastructure/scientific_sources.py` | 79-92 | REAL - REST API |
| PDB client | `infrastructure/scientific_sources.py` | 95-108 | REAL - REST API |
| AlphaFold DB client | `infrastructure/scientific_sources.py` | 111-124 | REAL - REST API |
| Europe PMC client | `infrastructure/scientific_sources.py` | 127-142 | REAL - REST API |
| Evidence normalization | `infrastructure/scientific_sources.py` | 150-230 | REAL |
| Experiment storage | `infrastructure/sql_repositories.py` | all | REAL - SQLite |
| Knowledge graph (SQL) | `infrastructure/sql_repositories.py` | all | REAL |
| Artifact storage | `infrastructure/artifacts.py` | all | REAL - local |
| Job queue | `infrastructure/jobs.py` | all | REAL - in-memory |
| Auth + RBAC | `security.py` | all | REAL |
| Orchestrator workflow | `orchestrator.py` | all | REAL (but calls fake agents) |
| API endpoints (16) | `api/v1/router.py` | all | REAL framework |

### What's Fake Today

| Component | File | Lines | What It Actually Does |
|-----------|------|-------|----------------------|
| Binding site detection | `agents/baseline.py` | 24-36 | Picks `sequence_len//3` as window start, returns 8 consecutive residues. Ignores sequence content. |
| Candidate generation | `agents/baseline.py` | 58-147 | `"G" + "A".join(random.sample(tripeptides, 4)) + "G"` |
| Candidate scoring | `agents/baseline.py` | 84-87 | `binding_score = 0.52 + (idx/total)*0.2` |
| Experimental design | `agents/baseline.py` | 150-181 | Same 3 assays every time |
| Report generation | `agents/baseline.py` | 184-218 | Template with f-string |
| Source-backed analysis | `agents/source_backed.py` | 14-39 | Real evidence fetched, but binding site STILL uses window heuristic |
| Docking endpoint | `api/v1/router.py` | 617-682 | RNG seeded by hash, fake distances/energies |
| AI Scientist chat | `api/v1/router.py` | 694-793 | Keyword matching, canned responses |
| Structure prediction page | `components/page-content.tsx` | 354-371 | 4 hardcoded strings |
| Candidate sequences in frontend | `lib/api.ts` | 196 | Static string `"Baseline binder sequence (deterministic)"` |
| Candidate scores in frontend | `lib/api.ts` | 173-180 | `deterministicScore()` hash-based |

---

## Colab Environment Constraints

### Hardware

| Resource | Colab Free | Impact on Plan |
|----------|-----------|----------------|
| CPU | 2 vCPUs | Sufficient for API server |
| RAM | ~12-13 GB | Sufficient for ESM2-650M (~2.5GB) + ESMFold (~1GB) |
| GPU | T4 (15GB VRAM) | Sufficient for ESM2-650M (~3GB) + ESMFold (~1GB) |
| Storage | ~35-78 GB (ephemeral) | Sufficient, but lost on disconnect |
| Session | 12hr max, 90min idle timeout | Must fit inference within session |
| GPU hours | ~15-30/week (dynamic) | Budget carefully |

### Software

| Capability | Available | Workaround |
|------------|-----------|------------|
| pip install | Yes | Install transformers, torch, fastapi |
| npm/node | Yes | Build Next.js frontend |
| Docker | No | Use SQLite + in-memory fallbacks |
| Background services | No | Run everything in notebook cells |
| Persistent storage | No | Google Drive mount (optional) |
| Multiple GPUs | No | Single T4 only |

### Model Size Budget

```
Available VRAM: 15 GB (T4)

ESM2-650M:     ~2.5 GB VRAM  (inference)
ESMFold:        ~1.0 GB VRAM  (inference)
PyTorch base:   ~0.5 GB VRAM  (CUDA context)
FastAPI:        ~0.0 GB GPU   (CPU only)
Frontend:       ~0.0 GB GPU   (CPU only)
─────────────────────────────────────
Total:          ~4.0 GB VRAM  (11 GB headroom)

Can we run both simultaneously? YES
Can we run ESM2-3B? MAYBE (~8GB, tight but possible)
Can we run RFdiffusion? NO (needs 4x A100)
```

---

## Upgrade Scope

### In Scope (This Document)

```
1. ESM2-650M adapter for protein analysis
   - Per-residue attention-based binding site detection
   - Sequence fitness/stability scoring
   - Masked infilling for candidate generation
   - Zero-shot mutation effect prediction

2. ESMFold adapter for structure prediction
   - Single-sequence structure prediction
   - pLDDT confidence per residue
   - PDB output for 3DMol viewer

3. Agent replacements
   - Replace DeterministicProteinAnalysisAgent with ESM2-backed agent
   - Replace DeterministicBinderGenerationAgent with ESM2-backed agent
   - Update SourceBackedProteinAnalysisAgent to use ESM2

4. API endpoint upgrades
   - Replace fake docking with ESM2-based scoring
   - Add mutation analysis endpoint
   - Add per-residue embedding endpoint
   - Add structure prediction endpoint

5. Frontend updates
   - Structure Prediction page: display real ESMFold output
   - Binding site visualization: show ESM2 attention scores
   - Mutation analysis: display per-residue effects
   - Candidate table: show real ML-derived scores

6. New features
   - Per-residue embedding heatmap visualization
   - Mutation effect prediction panel
   - Structure prediction from sequence
```

### Out of Scope

```
- RFdiffusion backbone generation (needs 4x A100)
- AlphaFold-Multimer complex prediction (needs 8x A100)
- DiffDock molecular docking (needs A100 for full inference)
- Redis/Neo4j/Qdrant/MinIO infrastructure
- Docker/Kubernetes deployment
- Celery worker queue
- MLflow experiment tracking
- Prometheus/Grafana monitoring
- OAuth2/JWT authentication
- Rate limiting
- AI Scientist chat upgrade (keep keyword matching)
- Small molecule handling (Phase 1 of drug discovery)
- ADMET profiling
- Clinical translation
```

---

## ESM2 Integration Plan

### Model Selection

```
Model: facebook/esm2_t33_650M_UR50D
Parameters: 650M
VRAM: ~2.5-3 GB (inference)
Sequence length: Up to 1024 tokens (can handle most proteins)
Embedding dim: 1280
Attention heads: 20
Layers: 33
Download size: ~2.5 GB
```

### Architecture

```
+--------------------------------------------------------------------------+
|                    ESM2 ADAPTER ARCHITECTURE                              |
+--------------------------------------------------------------------------+
|                                                                          |
|  infrastructure/esm2_client.py                                          |
|  +--------------------------------------------------------------------+ |
|  |  class ESM2Client:                                                 | |
|  |      model: ESM2ForMaskedLM                                        | |
|  |      tokenizer: ESM2Tokenizer                                      | |
|  |      device: torch.device("cuda")                                  | |
|  |                                                                     | |
|  |      load_model()           -> loads ESM2-650M to GPU              | |
|  |      embed(sequence)        -> (L x 1280) embeddings              | |
|  |      score(sequence)        -> per-residue log-likelihood          | |
|  |      attention_map(sequence) -> (L x L) attention weights          | |
|  |      masked_predict(seq, pos) -> token probabilities at position   | |
|  |      batch_embed(sequences) -> batch embedding                     | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  agents/esm2_protein_agent.py                                           |
|  +--------------------------------------------------------------------+ |
|  |  class ESM2ProteinAnalysisAgent(ProteinAnalysisAgent):             | |
|  |      esm2_client: ESM2Client                                       | |
|  |                                                                     | |
|  |      analyze(target, seed):                                        | |
|  |        1. Compute attention map for target sequence                | |
|  |        2. Identify high-attention residue clusters                 | |
|  |        3. Return BindingSite[] with residue positions              | |
|  |        4. Include per-residue confidence from attention            | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  agents/esm2_binder_agent.py                                            |
|  +--------------------------------------------------------------------+ |
|  |  class ESM2BinderGenerationAgent(BinderGenerationAgent):           | |
|  |      esm2_client: ESM2Client                                       | |
|  |                                                                     | |
|  |      generate(target, sites, count, seed):                        | |
|  |        1. For each binding site:                                   | |
|  |           a. Mask residues at binding site positions               | |
|  |           b. Run ESM2 masked prediction                            | |
|  |           c. Sample top-k tokens at each position                  | |
|  |           d. Assemble candidate sequence                           | |
|  |        2. Score each candidate with ESM2 log-likelihood           | |
|  |        3. Return CandidateSequence[] with real scores             | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  agents/esm2_mutation_agent.py  (NEW)                                   |
|  +--------------------------------------------------------------------+ |
|  |  class ESM2MutationAgent:                                          | |
|  |      esm2_client: ESM2Client                                       | |
|  |                                                                     | |
|  |      predict_impact(target, mutation_position, new_residue):       | |
|  |        1. Score wild-type sequence (log-likelihood)                | |
|  |        2. Score mutant sequence (log-likelihood)                   | |
|  |        3. Compute delta score                                      | |
|  |        4. Return MutationImpact with confidence                    | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

### Binding Site Detection Algorithm

```
CURRENT (deterministic):
  window_start = len(sequence) // 3
  residues = [window_start, window_start+1, ..., window_start+7]
  # Ignores sequence content entirely

UPGRADED (ESM2 attention-based):
  1. Tokenize sequence
  2. Forward pass through ESM2
  3. Extract attention maps (33 layers x 20 heads)
  4. Average attention across last 6 layers (local patterns)
  5. Sum attention over all other residues per position
     attention_importance[i] = sum(attention[i, j] for j != i)
  6. Smooth with window of 3 (neighboring residues matter)
  7. Pick top-8 non-contiguous positions with highest attention
  8. Cluster nearby positions (within 5 residues) into binding site
  9. Confidence = mean attention score of selected residues

  WHY THIS WORKS:
  - Attention maps in protein language models capture
    residue-residue interactions and functional importance
  - High-attention residues tend to be at binding interfaces,
    active sites, and structurally critical positions
  - This is validated in published literature (Belkina et al.)
```

### Candidate Generation Algorithm

```
CURRENT (deterministic):
  motifs = ["EAL", "KQW", "NVT", "YSG", "DHR", "LIP", "QKD", "TSW"]
  selected = random.sample(motifs, 4)
  sequence = "G" + "A".join(selected) + "G"
  # Produces: "G" + "EALAQWANVTYSG" + "G" = "GAEALAQWANVTYSGG"
  # This is NOT a real protein sequence

UPGRADED (ESM2 masked infilling):
  1. Get target binding site residues from ESM2ProteinAnalysisAgent
  2. For each candidate:
     a. Start with target sequence context around binding site
     b. Mask 4-8 positions at the binding interface
     c. Run ESM2 forward pass
     d. At each masked position, sample from top-k logits
        (k=5, temperature=0.8 for diversity)
     e. Assemble the full candidate sequence
     f. Ensure sequence length is reasonable (50-200 residues)
  3. Score each candidate:
     a. Run full ESM2 forward pass on complete candidate
     b. Compute mean per-residue log-likelihood
     c. Higher = more "protein-like" = more stable
  4. Rank candidates by score
  5. Return top-N with real ML-derived scores

  WHY THIS WORKS:
  - ESM2 was trained on 250M protein sequences
  - Masked infilling leverages the model's learned protein grammar
  - Generated sequences are biologically plausible
  - Log-likelihood scores correlate with protein stability
```

### Mutation Effect Algorithm

```
NEW FEATURE (does not exist today):

  INPUT: Wild-type sequence, position, mutant residue

  1. Score wild-type:
     - Tokenize wild-type sequence
     - Forward pass through ESM2
     - Extract log-likelihood at the mutated position
     - wild_type_score = mean_log_likelihood

  2. Create mutant:
     - Replace residue at target position
     - Tokenize mutant sequence
     - Forward pass through ESM2
     - mutant_score = mean_log_likelihood

  3. Compute effect:
     - delta_score = mutant_score - wild_type_score
     - Negative delta = destabilizing mutation
     - Positive delta = stabilizing mutation
     - |delta| > 1.0 = significant effect

  4. Confidence:
     - Based on magnitude of delta relative to background variance
     - Compute variance of scores across all positions
     - confidence = |delta| / std(scores)

  OUTPUT: MutationImpact object with:
    - wild_type_score
    - mutant_score
    - delta_score
    - effect_classification: "stabilizing" | "destabilizing" | "neutral"
    - confidence
    - per_residue_impact: list of affected neighboring residues
```

---

## ESMFold Integration Plan

### Model Selection

```
Model: esmfold_v1 (facebook/esmfold_v1)
Parameters: ~690M
VRAM: ~1-2 GB (inference)
Sequence length: Up to 512 residues (optimal)
Output: PDB format + pLDDT per residue
Download size: ~1 GB (model) + ~3 GB (weights)
```

### Architecture

```
+--------------------------------------------------------------------------+
|                    ESMFOLD ADAPTER ARCHITECTURE                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  infrastructure/esmfold_client.py                                       |
|  +--------------------------------------------------------------------+ |
|  |  class ESMFoldClient:                                              | |
|  |      model: ESMFold                                                | |
|  |      device: torch.device("cuda")                                  | |
|  |                                                                     | |
|  |      load_model()                                                  | |
|  |      predict_structure(sequence) -> ESMFoldResult:                 | |
|  |        pdb_content: str            (PDB format)                    | |
|  |        plddt_per_residue: list[float] (confidence per position)    | |
|  |        pae_matrix: ndarray         (if available)                  | |
|  |        sequence_length: int                                         | |
|  |        confidence_classification: str                              | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  agents/esmfold_prediction_agent.py                                     |
|  +--------------------------------------------------------------------+ |
|  |  class ESMFoldPredictionAgent:                                     | |
|  |      esmfold_client: ESMFoldClient                                 | |
|  |                                                                     | |
|  |      predict(sequence) -> StructurePrediction:                     | |
|  |        1. Run ESMFold inference                                    | |
|  |        2. Parse PDB output                                         | |
|  |        3. Extract pLDDT scores                                     | |
|  |        4. Classify confidence regions                              | |
|  |        5. Return StructurePrediction with PDB + confidence         | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

### Structure Prediction Output

```
StructurePrediction:
  pdb_content: str
    # Full PDB format with ATOM records
    # Ready for 3DMol.js viewer in frontend

  plddt_per_residue: list[float]
    # Per-residue confidence (0-100)
    # >90: confident (blue in pLDDT color scheme)
    # 70-90: good (cyan)
    # 50-70: low (yellow)
    # <50: very low (orange/red)

  confidence_summary:
    confident_pct: float      # % residues >90 pLDDT
    good_pct: float           # % residues 70-90
    low_pct: float            # % residues 50-70
    very_low_pct: float       # % residues <50
    mean_plddt: float         # Average pLDDT

  method: "esmfold_v1"
  model_version: "v1"
```

---

## Agent Replacements

### File Changes

```
agents/
  baseline.py                    # KEEP (reference/fallback)
  source_backed.py               # MODIFY (use ESM2 for binding sites)
  esm2_protein_agent.py          # NEW - ESM2 protein analysis
  esm2_binder_agent.py           # NEW - ESM2 candidate generation
  esm2_mutation_agent.py         # NEW - ESM2 mutation analysis
  esmfold_prediction_agent.py    # NEW - ESMFold structure prediction
  contracts.py                   # KEEP (ABC interfaces unchanged)
```

### SourceBackedProteinAnalysisAgent Modification

```
CURRENT (source_backed.py lines 14-39):
  def analyze(self, target, seed):
      evidence = self.evidence_service.target_evidence(target)
      confidence = max(e.confidence for e in evidence) if evidence else 0.5
      window_start = len(target.sequence) // 3  # <-- FAKE
      residues = list(range(window_start, min(window_start + 8, len(target.sequence))))
      return [BindingSite(
          residues=residues,
          description="Source-backed binding site analysis",
          confidence=min(confidence, 0.85),
          method="source-backed-baseline"
      )]

UPGRADED:
  def analyze(self, target, seed):
      evidence = self.evidence_service.target_evidence(target)
      confidence = max(e.confidence for e in evidence) if evidence else 0.5

      # NEW: Use ESM2 for binding site detection
      attention_sites = self.esm2_client.detect_binding_sites(target.sequence)

      return [BindingSite(
          residues=attention_sites.residues,
          description=f"ESM2 attention-based binding site: {attention_sites.description}",
          confidence=attention_sites.confidence,
          method="esm2-attention",
          evidence=evidence  # Attach real evidence
      )]
```

### New Agent: ESM2ProteinAnalysisAgent

```
class ESM2ProteinAnalysisAgent(ProteinAnalysisAgent):
    """Real protein analysis using ESM2 embeddings and attention maps."""

    def __init__(self, esm2_client: ESM2Client):
        self.esm2_client = esm2_client

    def analyze(self, target: ProteinTarget, seed: int) -> list[BindingSite]:
        # 1. Compute attention map
        attention = self.esm2_client.attention_map(target.sequence)

        # 2. Compute per-residue importance
        importance = attention.sum(axis=-1)  # Sum over all query positions
        importance = importance / importance.max()  # Normalize

        # 3. Smooth with neighboring residues
        smoothed = np.convolve(importance, np.ones(3)/3, mode='same')

        # 4. Find top peaks (local maxima above threshold)
        threshold = np.percentile(smoothed, 85)
        peaks = find_local_maxima(smoothed, threshold, min_distance=5)

        # 5. Cluster nearby peaks into binding sites
        sites = cluster_residues(peaks, max_gap=5)

        # 6. Return BindingSite objects
        return [
            BindingSite(
                residues=site.residues,
                description=f"ESM2 attention cluster at positions {site.residues}",
                confidence=float(site.mean_attention),
                method="esm2-attention-650M"
            )
            for site in sites
        ]
```

### New Agent: ESM2BinderGenerationAgent

```
class ESM2BinderGenerationAgent(BinderGenerationAgent):
    """Real candidate generation using ESM2 masked infilling."""

    def __init__(self, esm2_client: ESM2Client):
        self.esm2_client = esm2_client

    def generate(self, target, sites, count, seed):
        candidates = []

        for i in range(count):
            # 1. Select binding site residues to mask
            site = sites[i % len(sites)]
            mask_positions = select_mask_positions(site.residues, n_mask=6)

            # 2. Create masked sequence
            masked_seq = mask_tokens(target.sequence, mask_positions)

            # 3. Run ESM2 prediction at masked positions
            logits = self.esm2_client.masked_predict(masked_seq, mask_positions)

            # 4. Sample from logits (temperature=0.8, top-k=5)
            generated = sample_from_logits(logits, temperature=0.8, top_k=5)

            # 5. Assemble candidate sequence
            candidate_seq = assemble_sequence(target.sequence, mask_positions, generated)

            # 6. Score candidate
            score = self.esm2_client.score(candidate_seq)

            # 7. Create CandidateSequence
            candidates.append(CandidateSequence(
                sequence=candidate_seq,
                binding_score=float(score),
                stability_score=float(score),
                manufacturability_score=0.7,
                novelty_score=0.8,
                confidence_metrics=[
                    ConfidenceMetric(name="esm2_log_likelihood", value=float(score), rationale="ESM2-650M per-residue mean log-likelihood")
                ],
                uncertainty=UncertaintyAnalysis(
                    summary="Generated via ESM2 masked infilling",
                    confidence=0.75,
                    failure_modes=["No structural validation", "No wet-lab confirmation"],
                    known_unknowns=["Binding affinity not predicted", "Expression not verified"]
                ),
                evidence=[],
                provenance=ModelProvenance(
                    model_name="ESM2",
                    model_version="650M-UR50D",
                    parameters={"temperature": 0.8, "top_k": 5, "n_mask": 6},
                    random_seed=seed
                )
            ))

        # Sort by score (higher = better)
        candidates.sort(key=lambda c: c.binding_score, reverse=True)
        return candidates
```

---

## API Endpoint Upgrades

### Modified Endpoints

```
POST /api/v1/docking/run
  CURRENT: Fake RNG-based docking (lines 617-682)
  UPGRADED:
    1. Accept target sequence + candidate sequence
    2. Run ESM2 embedding for both
    3. Compute cosine similarity between embeddings
    4. Use similarity as binding score proxy
    5. Identify interacting residues via cross-attention
    6. Return real (approximate) interaction data

POST /api/v1/workflows/binder-design
  CURRENT: Runs orchestrator with deterministic agents
  UPGRADED:
    1. Swap DeterministicProteinAnalysisAgent -> ESM2ProteinAnalysisAgent
    2. Swap DeterministicBinderGenerationAgent -> ESM2BinderGenerationAgent
    3. Keep everything else (orchestrator, provenance, storage)

POST /api/v1/ai-scientist/chat
  CURRENT: Keyword matching (lines 694-793)
  UPGRADED: Keep as-is (out of scope for this phase)
```

### New Endpoints

```
POST /api/v1/analysis/esm2/embed
  Input: { "sequence": str }
  Output: { "embeddings": list[list[float]], "sequence_length": int, "embedding_dim": 1280 }
  Description: Return ESM2 per-residue embeddings for visualization

POST /api/v1/analysis/esm2/attention
  Input: { "sequence": str }
  Output: { "attention_map": list[list[float]], "per_residue_importance": list[float] }
  Description: Return ESM2 attention map for binding site analysis

POST /api/v1/analysis/mutation
  Input: { "sequence": str, "position": int, "mutant_residue": str }
  Output: { "wild_type_score": float, "mutant_score": float, "delta_score": float,
            "effect": str, "confidence": float }
  Description: Predict mutation effect using ESM2

POST /api/v1/structures/esmfold/predict
  Input: { "sequence": str }
  Output: { "pdb_content": str, "plddt": list[float], "confidence_summary": dict }
  Description: Predict protein structure using ESMFold

GET /api/v1/models/status
  Output: { "esm2": { "loaded": bool, "device": str, "model": str },
            "esmfold": { "loaded": bool, "device": str, "model": str } }
  Description: Check which ML models are loaded and available
```

---

## Frontend Updates

### Structure Prediction Page

```
CURRENT (page-content.tsx lines 354-371):
  - MolecularViewer with hardcoded pdbId="1M17"
  - 4 static strings: "pLDDT confidence 84%", "RMSD vs PDB 2.1A", etc.

UPGRADED:
  - MolecularViewer shows ESMFold-predicted structure (PDB from API)
  - Per-residue pLDDT bar chart below the viewer
  - Confidence classification badges
  - "Predict Structure" button that runs ESMFold on demand
  - Loading state during inference (~10-30 seconds on T4)
```

### Binder Generation Page

```
CURRENT (page-content.tsx lines 373-396):
  - Candidates show "Baseline binder sequence (deterministic)"
  - Scores are hash-based pseudo-random

UPGRADED:
  - Candidate sequences show real ESM2-generated sequences
  - Scores show ESM2 log-likelihood values
  - Confidence metrics show real ML confidence
  - Uncertainty analysis shows real failure modes
  - Sequence viewer highlights binding site residues
```

### Docking Page

```
CURRENT (page-content.tsx lines 411-605):
  - Fake docking results from RNG endpoint

UPGRADED:
  - Real ESM2-based binding score
  - Interaction residues from cross-attention
  - 2D interaction diagram with real residue names
  - Confidence score based on embedding similarity
```

### New: Mutation Analysis Panel

```
NEW COMPONENT: MutationAnalysisPanel
  - Input: Target sequence, position dropdown, residue selector
  - Shows: Wild-type vs mutant comparison
  - Displays: Delta score, effect classification, confidence
  - Visual: Per-residue impact heatmap along sequence
  - Table: List of all possible mutations at position ranked by effect
```

### New: Per-Residue Visualization

```
NEW COMPONENT: ResidueImportanceMap
  - Horizontal bar chart below sequence viewer
  - Color-coded by ESM2 attention importance
  - Interactive: click residue to see details
  - Highlights binding site residues in red
  - Shows conservation score per position
```

---

## New Features

### 1. ESM2 Protein Analysis Dashboard

```
+--------------------------------------------------------------------------+
|  PROTEIN ANALYSIS: P00533 (EGFR)                                         |
+--------------------------------------------------------------------------+
|                                                                          |
|  Target: Epidermal growth factor receptor                                |
|  Sequence: 1210 residues                                                 |
|  Organism: Homo sapiens                                                  |
|  Source: UniProt (real)                                                   |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  ESM2 BINDING SITE PREDICTION                                       | |
|  |                                                                      | |
|  |  Method: ESM2-650M attention map analysis                           | |
|  |  Confidence: 0.82                                                   | |
|  |                                                                      | |
|  |  Predicted binding residues:                                        | |
|  |  Position 310-318: [L, Y, E, A, L, E, A, L, E]  (attention: 0.91) | |
|  |  Position 745-750: [K, V, P, E, K, K]            (attention: 0.87) | |
|  |                                                                      | |
|  |  Per-residue importance heatmap:                                    | |
|  |  [|||||||||||||||||||||||||||||||||||||     ||||||||||||||||||||    | |
|  |   100      200      300      400      500      600      700      | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  EVIDENCE                                                            | |
|  |  [UniProt] P00533 - Annotation score: 5/5 (confidence: 1.0)       | |
|  |  [PDB] 1M17 - EGFR Kinase Domain (resolution: 2.6A)               | |
|  |  [AlphaFold] AF-P00533-F1 - pLDDT: 84.2                           | |
|  |  [Europe PMC] 2,847 publications                                    | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

### 2. ESMFold Structure Prediction Page

```
+--------------------------------------------------------------------------+
|  STRUCTURE PREDICTION                                                    |
+--------------------------------------------------------------------------+
|                                                                          |
|  Sequence input: [________________________________] [Predict Structure]  |
|  Or use target from analysis: [P00533 EGFR v]                           |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  [3DMol.js Viewer]                                                   | |
|  |                                                                      | |
|  |  Showing: ESMFold predicted structure                               | |
|  |  Coloring: pLDDT confidence (blue=high, red=low)                   | |
|  |                                                                      | |
|  |  [Cartoon] [Stick] [Surface] [Rainbow] [Chain]                     | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  CONFIDENCE SUMMARY                                                  | |
|  |                                                                      | |
|  |  Mean pLDDT: 78.4                                                   | |
|  |  Confident (>90): 45%  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░  | |
|  |  Good (70-90):   32%  ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  | |
|  |  Low (50-70):    18%  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  | |
|  |  Very low (<50):  5%  ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  | |
|  |                                                                      | |
|  |  Per-residue pLDDT:                                                 | |
|  |  [|||||||||||||||||||||||||||     |||||||||||||||||    |||||       | |
|  |   100      200      300      400      500      600      700      | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

### 3. Mutation Analysis Panel

```
+--------------------------------------------------------------------------+
|  MUTATION ANALYSIS: P00533 (EGFR)                                        |
+--------------------------------------------------------------------------+
|                                                                          |
|  Wild-type sequence: [auto-filled from target]                          |
|  Position: [310 v]  Mutant residue: [A v]  [Analyze Mutation]           |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  MUTATION IMPACT                                                     | |
|  |                                                                      | |
|  |  Wild-type residue: L310 (Leucine)                                 | |
|  |  Mutant residue: A310 (Alanine)                                    | |
|  |                                                                      | |
|  |  Wild-type score: -2.34 (ESM2 log-likelihood)                     | |
|  |  Mutant score: -3.12                                                | |
|  |  Delta score: -0.78                                                 | |
|  |                                                                      | |
|  |  Effect: DESTABILIZING                                              | |
|  |  Confidence: 0.73                                                   | |
|  |                                                                      | |
|  |  Interpretation: This mutation reduces the local sequence fitness  | |
|  |  as assessed by the ESM2 protein language model. The leucine at    | |
|  |  position 310 appears to be functionally important.                | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  ALL MUTATIONS AT POSITION 310                                      | |
|  |                                                                      | |
|  |  Residue  | Delta Score | Effect        | Confidence               | |
|  |  ---------|-------------|---------------|------------------------- | |
|  |  L (WT)   |  0.00       | neutral       | 1.00                     | |
|  |  I        | -0.12       | neutral       | 0.65                     | |
|  |  V        | -0.18       | neutral       | 0.62                     | |
|  |  A        | -0.78       | destabilizing | 0.73                     | |
|  |  G        | -1.24       | destabilizing | 0.81                     | |
|  |  P        | -1.89       | destabilizing | 0.88                     | |
|  |  D        | -2.15       | destabilizing | 0.91                     | |
|  |  E        | -2.34       | destabilizing | 0.93                     | |
|  |  K        | -2.56       | destabilizing | 0.94                     | |
|  |  R        | -2.78       | destabilizing | 0.95                     | |
|  |  H        | -2.91       | destabilizing | 0.96                     | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

---

## What Stays As-Is

| Component | File | Why No Change |
|-----------|------|---------------|
| SQLite database | `infrastructure/database.py` | Works on Colab, no Docker needed |
| In-memory vector store | `infrastructure/vector_store.py` | Works on Colab |
| SQL knowledge graph | `infrastructure/sql_repositories.py` | Works on Colab, `knowledge_graph_backend="sql"` |
| Local artifact storage | `infrastructure/artifacts.py` | Works on Colab |
| In-memory job queue | `infrastructure/jobs.py` | Works on Colab |
| UniProt client | `infrastructure/scientific_sources.py` | Real API, works anywhere |
| PDB client | `infrastructure/scientific_sources.py` | Real API, works anywhere |
| AlphaFold DB client | `infrastructure/scientific_sources.py` | Real API, works anywhere |
| Europe PMC client | `infrastructure/scientific_sources.py` | Real API, works anywhere |
| Auth system | `security.py` | Works on Colab |
| API router framework | `api/v1/router.py` | Framework stays, fake endpoints get replaced |
| Domain models | `domain/models.py` | Extending, not replacing |
| Orchestrator | `orchestrator.py` | Stays, agents get swapped |
| Frontend framework | `frontend/` | Stays, specific pages get updated |
| 3DMol.js viewer | `components/molecular-viewer.tsx` | Works, just feed it real PDB |
| Knowledge graph viz | `components/knowledge-graph.tsx` | Works, real data |
| All existing tests | `tests/` | Keep, add new tests |

---

## What Gets Skipped

| Component | Why |
|-----------|-----|
| RFdiffusion | Needs 4x A100 (320GB VRAM), T4 has 15GB |
| AlphaFold-Multimer | Needs 8x A100, complex MSA pipeline |
| DiffDock | Needs A100 for full inference, complex diffusion |
| Boltz2 | Needs 4x A100 |
| OpenFold | Needs 4x A100, complex training pipeline |
| RoseTTAFold | Needs GPU cluster |
| Redis | No Docker on Colab, in-memory works fine |
| Neo4j | No Docker on Colab, SQL fallback works fine |
| Qdrant | No Docker on Colab, in-memory works fine |
| MinIO | No Docker on Colab, local storage works fine |
| Prometheus | No Docker on Colab |
| Grafana | No Docker on Colab |
| MLflow | Can add later, not critical for demo |
| Celery workers | No background services on Colab |
| OAuth2/JWT | Keep simple bearer token for demo |
| Rate limiting | Not needed for demo |
| Small molecules | Phase 1 of drug discovery, separate feature |
| ADMET profiling | Phase 6 of drug discovery, separate feature |
| Clinical translation | Phase 7 of drug discovery, separate feature |
| Pathway analysis | Phase 5 of drug discovery, separate feature |
| AI Scientist chat upgrade | Keep keyword matching for now |

---

## File-by-File Changes

### New Files to Create

```
platform/backend/openbiodesign/
  infrastructure/
    esm2_client.py              # ESM2 model wrapper (load, embed, score, attention)
    esmfold_client.py           # ESMFold model wrapper (load, predict)
  agents/
    esm2_protein_agent.py       # ESM2 binding site detection agent
    esm2_binder_agent.py        # ESM2 candidate generation agent
    esm2_mutation_agent.py      # ESM2 mutation effect prediction agent
    esmfold_prediction_agent.py # ESMFold structure prediction agent
  domain/
    esm2_models.py              # ESM2-specific output models (EmbeddingResult, AttentionMap, etc.)
    structure_models.py         # Structure prediction output models

platform/frontend/
  components/
    residue-importance-map.tsx   # Per-residue ESM2 importance visualization
    mutation-analysis-panel.tsx  # Mutation effect prediction UI
    structure-prediction-view.tsx # ESMFold structure prediction UI
    plddt-chart.tsx              # pLDDT confidence bar chart
```

### Files to Modify

```
platform/backend/openbiodesign/
  agents/
    source_backed.py            # MODIFY: Use ESM2 for binding site detection
  api/
    v1/
      router.py                 # MODIFY: Replace fake docking, add new endpoints
  orchestrator.py               # MODIFY: Accept ESM2 agents as dependencies
  core/
    config.py                   # MODIFY: Add ESM2/ESMFold config options

platform/frontend/
  components/
    page-content.tsx            # MODIFY: Update StructurePrediction, Docking, Binder pages
  lib/
    api.ts                      # MODIFY: Add new API calls (mutation, structure, attention)
    types.ts                    # MODIFY: Add new TypeScript types
```

### Files That Stay Unchanged

```
platform/backend/openbiodesign/
  agents/contracts.py           # ABC interfaces unchanged
  agents/baseline.py            # Keep as fallback reference
  domain/models.py              # Core models unchanged (extend in new file)
  domain/identity.py            # Unchanged
  domain/hashing.py             # Unchanged
  domain/artifacts.py           # Unchanged
  domain/embeddings.py          # Unchanged
  domain/benchmarking.py        # Unchanged
  domain/jobs.py                # Unchanged
  domain/model_adapters.py      # Unchanged
  infrastructure/database.py    # Unchanged
  infrastructure/sql_models.py  # Unchanged
  infrastructure/sql_repositories.py  # Unchanged
  infrastructure/repositories.py      # Unchanged
  infrastructure/identity.py    # Unchanged
  infrastructure/artifacts.py   # Unchanged
  infrastructure/jobs.py        # Unchanged
  infrastructure/neo4j_graph.py # Unchanged (using SQL fallback)
  infrastructure/vector_store.py # Unchanged (using in-memory)
  infrastructure/scientific_sources.py  # Unchanged
  security.py                   # Unchanged
  observability.py              # Unchanged
  main.py                       # Unchanged (or minimal wiring changes)

platform/frontend/
  app/                          # Unchanged
  components/workspace-shell.tsx # Unchanged
  components/sidebar.tsx         # Unchanged
  components/top-nav.tsx         # Unchanged
  components/molecular-viewer.tsx # Unchanged (feed real PDB)
  components/docking-visualization.tsx # Unchanged
  components/docking-2d-diagram.tsx # Unchanged
  components/knowledge-graph.tsx # Unchanged
  components/sequence-viewer.tsx # Unchanged
  components/ai-scientist-panel.tsx # Unchanged
  components/workflow-panel.tsx  # Unchanged
  components/workflow-submission-form.tsx # Unchanged
  components/disease-selector.tsx # Unchanged
  components/charts.tsx          # Unchanged
  components/command-palette.tsx # Unchanged
  components/providers.tsx       # Unchanged
  components/status.tsx          # Unchanged
  components/ui/                 # Unchanged
```

---

## Colab Notebook Structure

### Cell-by-Cell Layout

```
+--------------------------------------------------------------------------+
|  CELL 1: Install Dependencies                                           |
+--------------------------------------------------------------------------+
|  !pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings     |
|  !pip install transformers torch --quiet                                |
|  !pip install numpy scipy                                               |
|  !apt-get install -y nodejs npm  # For frontend build                  |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 2: Clone Repository                                               |
+--------------------------------------------------------------------------+
|  !git clone https://github.com/user/openbiodesign.git                  |
|  %cd openbiodesign/platform/backend                                    |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 3: Load ESM2 Model                                                |
+--------------------------------------------------------------------------+
|  import torch                                                            |
|  from transformers import ESM2, ESM2Tokenizer                            |
|  print(f"GPU: {torch.cuda.get_device_name(0)}")                        |
|  print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB") |
|  model = ESM2.from_pretrained("facebook/esm2_t33_650M_UR50D").cuda()   |
|  tokenizer = ESM2Tokenizer.from_pretrained("facebook/esm2_t33_650M_UR50D") |
|  print("ESM2 loaded successfully")                                      |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 4: Load ESMFold Model                                             |
+--------------------------------------------------------------------------+
|  from esm import ESMFold                                                |
|  esmfold = ESMFold.esmfold_v1().cuda()                                 |
|  print("ESMFold loaded successfully")                                   |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 5: Initialize Backend with ML Agents                              |
+--------------------------------------------------------------------------+
|  # Wire up ESM2 client to agents                                        |
|  # Start FastAPI with ML-backed agents                                  |
|  !uvicorn openbiodesign.main:app --host 0.0.0.0 --port 8080 &          |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 6: Build & Serve Frontend                                         |
+--------------------------------------------------------------------------+
|  %cd ../frontend                                                        |
|  !npm install                                                           |
|  !npm run build                                                         |
|  !npx serve -s .next -l 3000 &                                         |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 7: Demo - Protein Analysis                                        |
+--------------------------------------------------------------------------+
|  # Show binding site detection with ESM2                                |
|  # Show attention heatmap                                               |
|  # Show evidence from UniProt/PDB                                       |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 8: Demo - Candidate Generation                                    |
+--------------------------------------------------------------------------+
|  # Generate candidates using ESM2 masked infilling                       |
|  # Show real sequences and scores                                       |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 9: Demo - Structure Prediction                                    |
+--------------------------------------------------------------------------+
|  # Run ESMFold on a candidate                                           |
|  # Display PDB in 3DMol viewer                                          |
|  # Show pLDDT confidence                                                |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|  CELL 10: Demo - Mutation Analysis                                      |
+--------------------------------------------------------------------------+
|  # Run ESM2 mutation effect prediction                                   |
|  # Show all mutations at a position                                     |
|  # Display effect classification                                        |
+--------------------------------------------------------------------------+
```

---

## Verification Plan

### What to Test

| Test | How to Verify | Pass Criteria |
|------|--------------|---------------|
| ESM2 loads on T4 | `torch.cuda.is_available()` + model.to(device) | No OOM, model loads |
| ESM2 embeddings work | Run on test sequence, check output shape | Shape = (1, L, 1280) |
| ESM2 attention maps work | Extract attention, check non-zero values | Attention values > 0 |
| ESM2 binding site detection | Run on EGFR (P00533), check output | Returns 1-3 binding sites with real residue positions |
| ESM2 candidate generation | Generate 5 candidates, check sequences | Sequences are valid amino acids, length 50-200 |
| ESM2 candidate scoring | Score 5 candidates, check scores | Scores are floats, higher = more "protein-like" |
| ESM2 mutation prediction | Mutate position 310, check delta | Delta is non-zero, effect classification present |
| ESMFold loads on T4 | Load model, check device | No OOM |
| ESMFold structure prediction | Predict structure for test sequence | PDB output has ATOM records, pLDDT has values |
| Backend starts with ML agents | uvicorn starts, endpoints respond | 200 on /health, /stats |
| Frontend connects to backend | Open browser, pages load | All 13 pages render |
| Target lookup works | Search P00533, check UniProt data | Real protein name returned |
| Binder design workflow works | Submit design, check candidates | Candidates have ESM2-generated sequences |
| Docking endpoint works | Run docking, check response | Real embedding similarity score |
| Structure prediction endpoint | Call /structures/esmfold/predict | Real PDB + pLDDT returned |
| Mutation endpoint works | Call /analysis/mutation | Real delta score returned |
| All existing tests pass | `pytest tests/` | No regressions |

### Performance Expectations on T4

```
ESM2-650M inference:
  - Single sequence embed: ~0.1-0.5 seconds
  - Attention map extraction: ~0.5-1.0 seconds
  - Binding site detection: ~1-2 seconds total
  - Candidate generation (5 candidates): ~3-5 seconds
  - Mutation effect (single): ~0.2-0.5 seconds

ESMFold inference:
  - Structure prediction (200 residues): ~10-30 seconds
  - Structure prediction (500 residues): ~30-60 seconds

Total workflow (target analysis + 5 candidates + structure):
  ~15-45 seconds on T4

Within 12-hour session budget: YES, easily
Within 15-30 GPU hours/week: YES, even with heavy use
```
