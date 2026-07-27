# OpenBioDesign: Evolution to Drug Discovery

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Assessment](#current-state-assessment)
3. [Evolution Architecture](#evolution-architecture)
4. [Phase 1: Small Molecule Layer](#phase-1-small-molecule-layer)
5. [Phase 2: Real Model Adapters](#phase-2-real-model-adapters)
6. [Phase 3: Binding Affinity & Optimization](#phase-3-binding-affinity--optimization)
7. [Phase 4: Target-to-Candidate Pipeline](#phase-4-target-to-candidate-pipeline)
8. [Phase 5: Pathway & Systems Biology](#phase-5-pathway--systems-biology)
9. [Phase 6: ADMET & Safety Profiling](#phase-6-admet--safety-profiling)
10. [Phase 7: Clinical Translation](#phase-7-clinical-translation)
11. [Data Model Evolution](#data-model-evolution)
12. [Infrastructure Evolution](#infrastructure-evolution)
13. [API Evolution](#api-evolution)
14. [Frontend Evolution](#frontend-evolution)
15. [Knowledge Graph Evolution](#knowledge-graph-evolution)
16. [Security Evolution](#security-evolution)
17. [Testing & Validation Strategy](#testing--validation-strategy)
18. [Deployment Strategy](#deployment-strategy)
19. [Risk Assessment](#risk-assessment)
20. [Implementation Timeline](#implementation-timeline)

---

## Executive Summary

OpenBioDesign currently functions as a **protein binder design platform** with deterministic baseline agents, real scientific data source integrations, and a complete frontend-backend architecture. This document details the phased evolution into a **full-stack AI-driven drug discovery platform** capable of:

- Identifying disease-relevant protein targets
- Assessing druggability of protein pockets
- Designing protein binders and small molecule leads
- Predicting binding affinity and optimizing candidates
- Screening for ADMET properties
- Providing clinical translation context
- Explaining every prediction with evidence and uncertainty

The evolution preserves all existing architectural contracts (agent interfaces, model adapters, orchestrator pattern, knowledge graph, provenance tracking) while extending them with real GPU-backed models, additional data sources, and new domain capabilities.

---

## Current State Assessment

### What Exists Today

```
+--------------------------------------------------------------------------+
|                     CURRENT PLATFORM CAPABILITIES                        |
+--------------------------------------------------------------------------+
|                                                                          |
|  +--------------+    +--------------+    +------------------+            |
|  |   Frontend   |    |   Backend    |    |  Infrastructure  |            |
|  |   (Next.js)  |    |  (FastAPI)   |    |   (SQL/Neo4j)    |            |
|  +--------------+    +--------------+    +------------------+            |
|  | 13 pages     |    | 16 API ends  |    | SQLite/PostgreSQL|            |
|  | 3D viewer    |    | RBAC auth    |    | Neo4j adapter    |            |
|  | Knowledge gr |    | Audit logs   |    | Qdrant adapter   |            |
|  | AI chat      |    | Job queue    |    | Local artifacts  |            |
|  | Workflow sub |    | Orchestrator |    | Prometheus       |            |
|  +--------------+    +--------------+    +------------------+            |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |              SCIENTIFIC DATA SOURCES (ACTIVE)                 |       |
|  +--------------------------------------------------------------+       |
|  | UniProt | RCSB PDB | AlphaFold DB | Europe PMC              |       |
|  +--------------------------------------------------------------+       |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |              MODEL ADAPTERS (CONTRACT ONLY)                   |       |
|  +--------------------------------------------------------------+       |
|  | RFdiffusion | ProteinMPNN | OpenFold | DiffDock | ESM2      |       |
|  | (adapter)   | (adapter)   | (plan)   | (plan)   | (plan)    |       |
|  +--------------------------------------------------------------+       |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |              AGENT IMPLEMENTATIONS                            |       |
|  +--------------------------------------------------------------+       |
|  | SOURCE-BACKED:                                               |       |
|  |   [REAL] SourceBackedLiteratureAgent (real API data)         |       |
|  |   [REAL] SourceBackedProteinAnalysisAgent (real API data)    |       |
|  | DETERMINISTIC BASELINES:                                     |       |
|  |   [BASE] DeterministicBinderGenerationAgent (baseline only)  |       |
|  |   [BASE] DeterministicExperimentalDesignAgent (baseline)     |       |
|  |   [BASE] DeterministicReportAgent (template only)            |       |
|  +--------------------------------------------------------------+       |
|                                                                          |
|  Coverage: 89.60% | Tests: 13 files | Endpoints: 16                    |
+--------------------------------------------------------------------------+
```

### Gap Analysis

| Category | Current State | Drug Discovery Requirement | Gap Severity |
|----------|--------------|---------------------------|--------------|
| Small Molecules | None | SMILES/SDF handling, compound libraries | **Critical** |
| Real Models | Baseline only | GPU-backed RFdiffusion, ProteinMPNN, ESM2 | **Critical** |
| Docking | Deterministic heuristic | DiffDock or AutoDock Vina | **Critical** |
| Affinity Prediction | None | FEP+, MM-GBSA, or ML-based | **High** |
| ADMET | None | Lipinski, CYP450, hERG, toxicity | **High** |
| Pathway Analysis | None | Reactome, KEGG, pathway enrichment | **High** |
| Disease Data | None | DisGeNET, OMIM, disease-gene associations | **High** |
| Drug Data | None | ChEMBL, DrugBank, compound bioactivity | **High** |
| Clinical Context | None | ClinicalTrials.gov, competitive landscape | **Medium** |
| Mutation Optimization | None | ESM2 alanine scanning, beneficial mutations | **Medium** |
| GPU Scheduling | None | Kubernetes, KubeRay, Slurm | **High** |
| Job Queue | InMemory | Redis + Celery | **High** |
| Experiment Tracking | SQL records | MLflow or equivalent | **High** |

---

## Evolution Architecture

### Target State Architecture

```
+---------------------------------------------------------------------------+
|                        DRUG DISCOVERY PLATFORM                             |
+---------------------------------------------------------------------------+
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                        LAYER 1: USER INTERFACE                       | |
|  |                                                                     | |
|  |  +----------+ +----------+ +----------+ +----------+ +----------+  | |
|  |  | Target   | | Compound | | Protein  | | Binding  | | Clinical |  | |
|  |  | Discovery| | Search   | | Design   | | Analysis | | Context  |  | |
|  |  +----------+ +----------+ +----------+ +----------+ +----------+  | |
|  |                                                                     | |
|  |  +----------+ +----------+ +----------+ +----------+ +----------+  | |
|  |  | Pathway  | | ADMET    | | Candidate| | Report   | | AI       |  | |
|  |  | Explorer | | Screen   | | Ranking  | | Generator| | Scientist|  | |
|  |  +----------+ +----------+ +----------+ +----------+ +----------+  | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                        LAYER 2: API GATEWAY                          | |
|  |  FastAPI | OAuth2/JWT | Rate Limiting | Versioning | Audit Logging  | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                   LAYER 3: AI SCIENTIST ORCHESTRATOR                 | |
|  |  LangGraph | Workflow Engine | Task Decomposition | Research Memory | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                      LAYER 4: SCIENTIFIC AGENTS                      | |
|  |                                                                     | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |  | Target ID Agent |  | Druggability    |  | Compound Generation |  | |
|  |  |                 |  | Agent           |  | Agent               |  | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |                                                                     | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |  | Protein Design  |  | Structure       |  | Docking Agent       |  | |
|  |  | Agent           |  | Prediction Agent|  |                     |  | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |                                                                     | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |  | Affinity Agent  |  | ADMET Agent     |  | Mutation Agent      |  | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |                                                                     | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |  | Literature      |  | Pathway Agent   |  | Clinical Context    |  | |
|  |  | Agent           |  |                 |  | Agent               |  | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |                                                                     | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  |  | Experimental    |  | Report Agent    |  | Reasoning Agent     |  | |
|  |  | Design Agent    |  |                 |  |                     |  | |
|  |  +-----------------+  +-----------------+  +---------------------+  | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                    LAYER 5: KNOWLEDGE INFRASTRUCTURE                 | |
|  |  +----------+  +----------+  +----------+  +----------+            | |
|  |  | Neo4j    |  | Qdrant   |  | Redis    |  | MinIO    |            | |
|  |  | (Graph)  |  | (Vector) |  | (Cache)  |  | (Object) |            | |
|  |  +----------+  +----------+  +----------+  +----------+            | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                    LAYER 6: DATA SOURCES                             | |
|  |                                                                     | |
|  |  PROTEIN DATA           | COMPOUND DATA       | DISEASE DATA       | |
|  |  UniProt                | ChEMBL              | DisGeNET           | |
|  |  PDB                    | DrugBank            | OMIM               | |
|  |  AlphaFold DB           | PubChem             | ClinVar            | |
|  |  Ensembl                | ChEMBL Bioactivity  |                    | |
|  |                                                                     | |
|  |  PATHWAY DATA           | CLINICAL DATA       | LITERATURE DATA    | |
|  |  Reactome               | ClinicalTrials.gov  | PubMed             | |
|  |  KEGG                   | FDA Approvals       | Europe PMC         | |
|  |  WikiPathways           |                     | bioRxiv            | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                    LAYER 7: MODEL INFRASTRUCTURE                     | |
|  |  +----------+  +----------+  +----------+  +----------+            | |
|  |  | NVIDIA   |  | Local    |  | Cloud    |  | Hugging  |            | |
|  |  | NIM      |  | GPU      |  | GPU      |  | Face     |            | |
|  |  +----------+  +----------+  +----------+  +----------+            | |
|  |                                                                     | |
|  |  Models: RFdiffusion | ProteinMPNN | ESM2 | ESMFold | DiffDock    | |
|  |          AlphaFold-Multimer | Boltz2 | RoseTTAFold | OpenFold     | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |                    LAYER 8: OBSERVABILITY & SECURITY                 | |
|  |  OpenTelemetry | Prometheus | Grafana | OAuth2/JWT | RBAC | Audit  | |
|  +---------------------------------------------------------------------+ |
+---------------------------------------------------------------------------+
```

### Evolution Flow: Current vs Target

```
                    CURRENT STATE                         TARGET STATE
                    ============                          ============

                 +------------------+              +----------------------+
                 |  Protein Target  |              |     Disease/Target    |
                 |  (sequence only) |              |  (gene, pathway,     |
                 +--------+---------+              |   disease context)   |
                          |                        +----------+-----------+
                          v                                   v
                 +------------------+              +----------------------+
                 |  Binding Site    |              |  Druggability        |
                 |  (heuristic)     |              |  Assessment (Fpocket) |
                 +--------+---------+              +----------+-----------+
                          |                                   v
                          |                        +----------------------+
                          |                        |  Hit Generation       |
                          |                        |  +--------+ +------+ |
                          |                        |  |Protein | |Small | |
                          |                        |  |Binder  | |Molec | |
                          |                        |  +---+----+ +--+---+ |
                          |                        +----------+-----------+
                          |                              v         v
                 +------------------+              +----------------------+
                 |  Deterministic   |              |  Docking & Scoring   |
                 |  Scoring         |              |  (DiffDock + Affinity)|
                 +--------+---------+              +----------+-----------+
                          |                                   v
                          |                        +----------------------+
                          |                        |  ADMET Filtering     |
                          |                        |  (Lipinski, CYP,     |
                          |                        |   hERG, toxicity)    |
                          |                        +----------+-----------+
                          |                                   v
                 +------------------+              +----------------------+
                 |  Candidate       |              |  Optimization Loop   |
                 |  Ranking         |              |  (Mutation + Re-     |
                 +--------+---------+              |   design + Re-score) |
                          |                        +----------+-----------+
                          |                                   v
                 +------------------+              +----------------------+
                 |  Report          |              |  Clinical Context    |
                 |                  |              |  (Trials, Competition|
                 +------------------+              |   Safety Profile)    |
                                                  +----------------------+
```

---

## Phase 1: Small Molecule Layer

### Goal

Add small molecule handling alongside protein targets to unlock both protein-based and small-molecule drug discovery modalities.

### Timeline: Weeks 1-4

### Domain Model Extensions

```python
# NEW: platform/backend/openbiodesign/domain/compounds.py

class SmallMolecule:
    """Represents a small molecule compound."""
    compound_id: str              # Internal ID
    smiles: str                   # SMILES string (canonical)
    inchi: str                    # InChI identifier
    inchi_key: str                # InChI key (for deduplication)
    molecular_weight: float       # MW in Da
    logp: float                   # Partition coefficient
    hbd: int                      # Hydrogen bond donors
    hba: int                      # Hydrogen bond acceptors
    tpsa: float                   # Topological polar surface area
    rotatable_bonds: int          # Rotatable bond count
    source: str                   # "chembl" | "drugbank" | "pubchem" | "user"
    source_id: str                # ID in the source database
    iupac_name: str               # IUPAC name
    common_name: str              # Common/trade name
    max_phase: int                # Highest clinical phase (1-4, 0=preclinical)
    evidence: list[EvidenceItem]  # Supporting data sources

class BioactivityRecord:
    """Bioactivity measurement from ChEMBL or similar."""
    record_id: str
    compound_id: str              # FK to SmallMolecule
    target_id: str                # FK to ProteinTarget
    assay_id: str                 # Assay identifier
    activity_type: str            # "IC50" | "EC50" | "Ki" | "Kd" | "MIC"
    activity_value: float         # Measured value
    activity_unit: str            # "nM" | "uM" | "mg/L"
    relation: str                 # "=" | "<" | ">" | "<=" | ">="
    assay_type: str               # "B" (binding) | "F" (functional) | "T" (toxicity)
    reference: str                # Publication/assay reference
    confidence_score: int         # 1-9 (ChEMBL confidence)
    evidence: list[EvidenceItem]

class CompoundLibrary:
    """Collection of compounds for screening."""
    library_id: str
    name: str
    description: str
    compound_count: int
    source: str                   # "chembl" | "drugbank" | "zinc" | "enamine"
    drug_like_filter: bool        # Lipinski RO5 applied?
    created_at: datetime
    metadata: dict

class DockingResult:
    """Small molecule docking result."""
    compound_id: str
    target_id: str
    pocket_id: str
    pose_index: int
    docking_score: float          # kcal/mol
    rmsd_lower: float
    rmsd_upper: float
    binding_pose: str             # PDB format of pose
    interactions: list[ProteinLigandInteraction]
    confidence: float
    evidence: list[EvidenceItem]

class ProteinLigandInteraction:
    """Detailed protein-ligand interaction."""
    interaction_type: str         # "hydrogen_bond" | "hydrophobic" | "salt_bridge" |
                                 # "pi_stacking" | "cation_pi" | "halogen_bond"
    residue_name: str
    residue_number: int
    chain_id: str
    distance: float               # Angstroms
    ligand_atom: str              # Atom name in ligand
    strength: str                 # "strong" | "moderate" | "weak"
```

### New Data Source Integrations

```
+--------------------------------------------------------------------------+
|                    CHEMBL REST API CLIENT                                 |
+--------------------------------------------------------------------------+
|                                                                          |
|  Endpoints:                                                             |
|    /chembl/api/data/molecule/{chembl_id}       -> Compound details      |
|    /chembl/api/data/activity.json              -> Bioactivity data      |
|    /chembl/api/data/target/{chembl_id}         -> Target details        |
|    /chembl/api/data/assay.json                 -> Assay details         |
|    /chembl/api/data/mechanism.json             -> Drug mechanisms       |
|                                                                          |
|  Rate Limit: 5 requests/second (unauthenticated)                        |
|  Caching: In-memory with 24h TTL for compound lookups                   |
|  Retry: Exponential backoff, max 3 attempts                             |
|                                                                          |
|  Data Retrieved:                                                        |
|    - Compound SMILES, InChI, properties                                 |
|    - Bioactivity values (IC50, EC50, Ki, Kd)                            |
|    - Target organisms and assay types                                    |
|    - Max clinical phase and mechanism of action                          |
|    - Patent and publication references                                  |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|                    PUBCHEM REST API CLIENT                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  Endpoints:                                                             |
|    /rest/pug/compound/name/{name}/JSON         -> By name               |
|    /rest/pug/compound/cid/{cid}/JSON           -> By CID               |
|    /rest/pug/compound/smiles/{smiles}/JSON     -> By SMILES            |
|    /rest/pug/compound/cid/{cid}/property/      -> Properties           |
|      MolecularWeight, XLogP, HBondDonorCount, HBondAcceptorCount,      |
|      TPSA, RotatableBondCount                                           |
|                                                                          |
|  Rate Limit: 5 requests/5 seconds                                       |
|  Caching: In-memory with 24h TTL                                        |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|                    DRUGBANK API CLIENT                                    |
+--------------------------------------------------------------------------+
|                                                                          |
|  Endpoints (requires free academic license):                            |
|    /drugs/{drugbank_id}.json                   -> Approved drugs        |
|    /drugs/{drugbank_id}/targets.json           -> Drug targets          |
|    /drugs/{drugbank_id}/interactions.json      -> Drug interactions     |
|                                                                          |
|  Data Retrieved:                                                        |
|    - Approved drug structures and properties                             |
|    - Mechanism of action                                                 |
|    - Indications and contraindications                                   |
|    - Drug-drug interactions                                              |
|    - Pharmacokinetics (ADMET)                                            |
|    - Clinical trials and approval status                                |
|                                                                          |
|  Authentication: API key via OPENBIODESIGN_DRUGBANK_API_KEY             |
+--------------------------------------------------------------------------+
```

### New API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/compounds/lookup` | Find compound by SMILES/name/ID |
| POST | `/api/v1/compounds/search` | Search compound libraries |
| GET | `/api/v1/compounds/{compound_id}` | Compound details |
| GET | `/api/v1/compounds/{compound_id}/bioactivity` | Bioactivity records |
| GET | `/api/v1/compounds/{compound_id}/similar` | Similar compounds (Tanimoto) |
| POST | `/api/v1/compounds/compare` | Multi-compound comparison |
| GET | `/api/v1/libraries` | List compound libraries |
| POST | `/api/v1/libraries/screen` | Virtual screening against target |

### Knowledge Graph Extensions

```
NEW NODE TYPES:
  (:Compound {id, smiles, name, source, max_phase})
  (:Assay {id, type, organism, target_type})
  (:Bioactivity {id, type, value, unit, relation})

NEW RELATIONSHIP TYPES:
  (:Compound)-[:BINDS_TO {ic50, ki, kd, confidence}]->(:ProteinTarget)
  (:Compound)-[:INHIBITS]->(:ProteinTarget)
  (:Compound)-[:ACTIVATES]->(:ProteinTarget)
  (:Compound)-[:TREATS {evidence}]->(:Disease)
  (:Compound)-[:INTERACTS_WITH]->(:Compound)  [drug-drug]
  (:Compound)-[:SCREENED_IN]->(:Assay)
  (:Assay)-[:MEASURES]->(:Bioactivity)
  (:Bioactivity)-[:AGAINST]->(:ProteinTarget)
```

---

## Phase 2: Real Model Adapters

### Goal

Replace deterministic baseline agents with real GPU-backed models for protein analysis, binder generation, structure prediction, and docking.

### Timeline: Weeks 2-6

### Model Integration Matrix

```
+--------------------------------------------------------------------------+
|                         MODEL INTEGRATION MATRIX                         |
+------------------+----------+----------+----------+---------------------+
| Model            | Backend  | GPU Req  | Latency  | Replaces            |
+------------------+----------+----------+----------+---------------------+
| ESM2             | Local/NIM| 1x A100  | ~2s      | (new capability)    |
| ESMFold          | Local/NIM| 1x A100  | ~10s     | (new capability)    |
| RFdiffusion      | NIM/K8s  | 4x A100  | ~60s     | BinderGenAgent      |
| ProteinMPNN      | NIM/K8s  | 1x A100  | ~15s     | BinderGenAgent      |
| AlphaFold-Mult   | NIM/K8s  | 8x A100  | ~300s    | StructurePred       |
| Boltz2           | NIM/K8s  | 4x A100  | ~120s    | StructurePred       |
| DiffDock         | Local/NIM| 1x A100  | ~30s     | DockingAgent        |
| OpenFold         | Local/K8s| 4x A100  | ~600s    | StructurePred       |
| RoseTTAFold      | Local/K8s| 1x A100  | ~120s    | StructurePred       |
+------------------+----------+----------+----------+---------------------+
```

### ESM2 Integration (Highest Priority)

```
+--------------------------------------------------------------------------+
|                    ESM2 MODEL ADAPTER                                     |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Protein embeddings (640-dim per residue)                          |
|    2. Mutation effect prediction (delta-deltaG estimation)              |
|    3. Protein language model scores (per-residue)                       |
|    4. Contact prediction                                                |
|                                                                          |
|  Adapter Protocol:                                                      |
|    input: ProteinSequence -> ESM2Embedding                              |
|    input: MutationVariant -> MutationImpact                             |
|                                                                          |
|  Output Schema:                                                         |
|    ESM2Embedding:                                                       |
|      sequence_embedding: ndarray    (L x 640)                           |
|      cls_embedding: ndarray         (640,)                              |
|      per_residue_logps: ndarray    (L x 33)                            |
|      attention_maps: dict          (attention patterns)                 |
|                                                                          |
|    MutationImpact:                                                      |
|      wild_type_score: float         (log-likelihood)                    |
|      mutant_score: float            (log-likelihood)                    |
|      delta_score: float             (effect magnitude)                  |
|      confidence: float              (prediction confidence)             |
|      affected_residues: list        (residues with largest effect)      |
|                                                                          |
|  Deployment:                                                            |
|    Option A: HuggingFace transformers (local)                           |
|    Option B: NVIDIA NIM container (scalable)                            |
|    Option C: ESMAtlas API (zero infrastructure)                         |
|                                                                          |
|  Files to Create:                                                       |
|    agents/esm2_adapter.py                                               |
|    infrastructure/esm2_client.py                                        |
|    domain/esm2_models.py                                                |
+--------------------------------------------------------------------------+
```

### RFdiffusion Integration

```
+--------------------------------------------------------------------------+
|                    RFDIFFUSION MODEL ADAPTER                              |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Novel protein backbone generation                                 |
|    2. Binder design given target structure                              |
|    3. Scaffold design with motif constraints                            |
|    4. Inpainting (partial structure completion)                         |
|                                                                          |
|  Input Parameters:                                                      |
|    task: "binder" | "scaffold" | "inpaint" | "unconditional"            |
|    target_pdb: str                    (for binder task)                 |
|    target_chains: list[str]           (chain selection)                 |
|    hotspot_residues: list[str]        (design constraints)              |
|    num_designs: int                   (1-100)                           |
|    contig_length: str                 (e.g., "A100-150")                |
|    denoising_steps: int               (default: 200)                    |
|    random_seed: int                                                       |
|                                                                          |
|  Output:                                                                |
|    list[PdbRecord]:                                                     |
|      pdb_content: str                (PDB format)                       |
|      backbone_rmsd: float                                              |
|      sc_rmsd: float                                                    |
|      interface_score: float           (receptor-peptide)                |
|      pae_interaction: float           (predicted alignment error)       |
|      confidence: float                                                  |
|                                                                          |
|  Deployment:                                                            |
|    NVIDIA NIM: nvcr.io/nvidia/prototyping/rfdiffusion                   |
|    Kubernetes: GPU resource requests (4x A100 80GB)                     |
+--------------------------------------------------------------------------+
```

### ProteinMPNN Integration

```
+--------------------------------------------------------------------------+
|                    PROTEINMPNN MODEL ADAPTER                              |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Sequence design for fixed backbone                                |
|    2. Interface-aware sequence optimization                             |
|    3. Multi-state design                                                |
|    4. Conditional sequence generation                                   |
|                                                                          |
|  Input Parameters:                                                      |
|    backbone_pdb: str                   (RFdiffusion output)             |
|    chains_to_design: list[str]         (which chains to sequence)       |
|    fixed_chains: list[str]             (don't modify these)             |
|    temperature: float                  (sampling temperature)           |
|    num_seq_per_target: int             (sequences per backbone)         |
|                                                                          |
|  Output:                                                                |
|    list[DesignedSequence]:                                              |
|      sequence: str                    (amino acid sequence)             |
|      score: float                     (sequence recovery score)         |
|      interface_score: float           (interface compatibility)         |
|      confidence: float                                                  |
+--------------------------------------------------------------------------+
```

### DiffDock Integration

```
+--------------------------------------------------------------------------+
|                    DIFFDOCK MODEL ADAPTER                                 |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Blind protein-ligand docking (no pocket required)                 |
|    2. Confidence-scored pose ranking                                    |
|    3. Binding mode prediction                                           |
|    4. Interaction analysis                                              |
|                                                                          |
|  Input Parameters:                                                      |
|    protein_pdb: str                   (target structure)                |
|    ligand_smiles: str                 (compound SMILES)                 |
|    protein_sequence: str              (for featurization)               |
|    pocket_center: tuple[float]        (optional, for guided)            |
|    num_poses: int                     (1-10)                            |
|    time_steps: int                    (diffusion steps)                 |
|                                                                          |
|  Output:                                                                |
|    DiffDockResult:                                                      |
|      poses: list[Pose]:                                                 |
|        coordinates: ndarray           (N_atoms x 3)                    |
|        confidence_score: float        (higher = better)                 |
|        energy_score: float            (kcal/mol)                        |
|        interactions: list[Interaction]                                  |
|      ranking_confidence: float                                          |
|      explanation: str                                                   |
+--------------------------------------------------------------------------+
```

### Agent Replacement Strategy

```
BEFORE (Current):                          AFTER (Phase 2):
===============                            ================

+----------------------+                   +----------------------+
| ProteinAnalysisAgent |                   | ProteinAnalysisAgent |
|  - Deterministic     |  ------------->  |  - ESM2 Embeddings  |
|  - Heuristic Sites   |                   |  - Pocket Detection |
+----------------------+                   |  - Druggability     |
                                           +----------------------+
+----------------------+                   +----------------------+
| BinderGenerationAgent|                   | BinderGenerationAgent|
|  - Random Sequence   |  ------------->  |  - RFdiffusion      |
|  - Motif-Based       |                   |  - ProteinMPNN       |
+----------------------+                   |  - Validation        |
                                           +----------------------+
                                           +----------------------+  (NEW)
                                           | StructurePrediction  |
                                           |  - ESMFold (fast)    |
                                           |  - AlphaFold-Mult    |
                                           |  - Boltz2            |
                                           +----------------------+
                                           +----------------------+  (NEW)
                                           | DockingAgent         |
                                           |  - DiffDock (ML)     |
                                           +----------------------+
```

---

## Phase 3: Binding Affinity & Optimization

### Goal

Predict binding affinity accurately and iteratively optimize candidates through mutation scanning and redesign cycles.

### Timeline: Weeks 4-8

### Affinity Prediction Pipeline

```
+--------------------------------------------------------------------------+
|                    MULTI-METHOD AFFINITY PREDICTION                       |
+--------------------------------------------------------------------------+
|                                                                          |
|  Input: Protein-Ligand Complex (PDB) or Protein-Protein Complex         |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  METHOD 1: Docking Score (Fast, Low Accuracy)                      | |
|  |  - DiffDock confidence score                                        | |
|  |  - Force-field based energy                                         | |
|  |  - Estimated dG: +/-2-4 kcal/mol accuracy                          | |
|  +--------------------------------------------------------------------+ |
|                          |                                               |
|                          v                                               |
|  +--------------------------------------------------------------------+ |
|  |  METHOD 2: ML-Based Affinity (Medium Speed, Medium Accuracy)       | |
|  |  - GNINA (CNN-based scoring)                                        | |
|  |  - KDEEP (graph neural network)                                     | |
|  |  - Estimated dG: +/-1-2 kcal/mol accuracy                          | |
|  +--------------------------------------------------------------------+ |
|                          |                                               |
|                          v                                               |
|  +--------------------------------------------------------------------+ |
|  |  METHOD 3: Free Energy Perturbation (Slow, High Accuracy)          | |
|  |  - OpenFE / FEP+                                                    | |
|  |  - Absolute binding free energy                                     | |
|  |  - Estimated dG: +/-0.5-1 kcal/mol accuracy                        | |
|  +--------------------------------------------------------------------+ |
|                          |                                               |
|                          v                                               |
|  +--------------------------------------------------------------------+ |
|  |  COMPOSITE SCORING                                                  | |
|  |  - Weighted ensemble of methods                                     | |
|  |  - Uncertainty quantification                                       | |
|  |  - Confidence intervals                                             | |
|  |  - Final ranking with explanations                                  | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  Output:                                                                |
|    AffinityPrediction:                                                  |
|      predicted_kd: float                    (nM)                         |
|      predicted_ic50: float                  (nM)                         |
|      predicted_dg: float                    (kcal/mol)                   |
|      confidence_interval: tuple[float, float]                           |
|      methods_used: list[str]                                             |
|      uncertainty: float                                                  |
|      explanation: str                                                    |
+--------------------------------------------------------------------------+
```

### Mutation Optimization Loop

```
+--------------------------------------------------------------------------+
|                    ITERATIVE MUTATION OPTIMIZATION                        |
+--------------------------------------------------------------------------+
|                                                                          |
|  +-------------+                                                        |
|  |   Start     |                                                        |
|  |  Candidate   |                                                        |
|  +------+------+                                                        |
|         |                                                                |
|         v                                                                |
|  +-----------------+                                                    |
|  |  ESM2 Alanine   |  Identify critical residues at interface           |
|  |  Scanning       |  Score: d-dG per position                          |
|  +--------+--------+                                                    |
|           |                                                              |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Beneficial     |  Find mutations that improve:                     |
|  |  Mutation       |  - Binding affinity                                |
|  |  Prediction     |  - Stability                                       |
|  +--------+--------+  - Solubility                                      |
|           |                                                              |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Structure      |  ESMFold or AlphaFold-Multimer                     |
|  |  Prediction     |  Predict mutant structure                          |
|  +--------+--------+                                                    |
|           |                                                              |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Redocking &    |  DiffDock + Affinity scoring                      |
|  |  Affinity       |  Compare with wild-type                            |
|  |  Prediction     |                                                    |
|  +--------+--------+                                                    |
|           |                                                              |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Convergence    |  Is improvement > threshold?                      |
|  |  Check          |  Max iterations reached?                           |
|  +--------+--------+                                                    |
|           |                                                              |
|      +----+----+                                                        |
|      |         |                                                        |
|      v         v                                                        |
|    +-----+  +---------+                                                |
|    | YES |  |   NO    |                                                |
|    |     |  | (loop)  |                                                |
|    +--+--+  +----+----+                                                |
|       |          |                                                      |
|       v          |                                                      |
|    +---------+   |                                                      |
|    | Optimized|  |                                                      |
|    | Candidate|<-+                                                      |
|    +---------+                                                          |
|                                                                          |
|  Termination Criteria:                                                  |
|    - d-dG improvement < 0.1 kcal/mol                                    |
|    - Max 5 iterations                                                   |
|    - Structural distortion > threshold (TM-score < 0.9)                |
|    - ADMET violations detected                                          |
+--------------------------------------------------------------------------+
```

### Candidate Ranking System

```
+--------------------------------------------------------------------------+
|                    MULTI-OBJECTIVE CANDIDATE RANKING                      |
+--------------------------------------------------------------------------+
|                                                                          |
|  Scoring Dimensions:                                                    |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  1. BINDING AFFINITY          Weight: 0.30                          | |
|  |     - Predicted Kd/Ki           (lower = better)                    | |
|  |     - Docking score             (more negative = better)            | |
|  |     - Confidence                (higher = better)                   | |
|  +--------------------------------------------------------------------+ |
|  |  2. SELECTIVITY                Weight: 0.20                          | |
|  |     - Off-target binding        (fewer = better)                    | |
|  |     - Paralog selectivity       (higher = better)                   | |
|  |     - Panel safety score        (higher = better)                   | |
|  +--------------------------------------------------------------------+ |
|  |  3. STABILITY                  Weight: 0.15                          | |
|  |     - Predicted dG_fold         (more negative = better)            | |
|  |     - Thermal stability         (higher Tm = better)                | |
|  |     - Aggregation propensity    (lower = better)                    | |
|  +--------------------------------------------------------------------+ |
|  |  4. DRUG-LIKENESS              Weight: 0.15                          | |
|  |     - Lipinski RO5 compliance   (pass = better)                     | |
|  |     - Synthetic accessibility   (higher = better)                   | |
|  |     - ADMET profile             (fewer warnings = better)           | |
|  +--------------------------------------------------------------------+ |
|  |  5. NOVELTY                    Weight: 0.10                          | |
|  |     - Structural novelty        (higher = better)                   | |
|  |     - Sequence uniqueness       (higher = better)                   | |
|  |     - Patent landscape          (fewer conflicts = better)          | |
|  +--------------------------------------------------------------------+ |
|  |  6. MANUFACTURABILITY          Weight: 0.10                          | |
|  |     - Expression yield          (higher = better)                   | |
|  |     - Purification feasibility  (easier = better)                   | |
|  |     - Scalability               (higher = better)                   | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  Output:                                                                |
|    CandidateRanking:                                                    |
|      rank: int                                                          |
|      composite_score: float (0-100)                                     |
|      dimension_scores: dict[str, float]                                 |
|      confidence_interval: tuple[float, float]                           |
|      explanation: str                                                   |
|      trade_offs: list[str] (what you give up for this ranking)          |
+--------------------------------------------------------------------------+
```

---

## Phase 4: Target-to-Candidate Pipeline

### Goal

Create a complete end-to-end drug discovery workflow from disease identification to candidate selection.

### Timeline: Weeks 6-12

### Pipeline Architecture

```
+--------------------------------------------------------------------------+
|                    TARGET-TO-CANDIDATE PIPELINE                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  STAGE 1: TARGET IDENTIFICATION                                         |
|  ================================                                        |
|                                                                          |
|  Input: Disease name / phenotype                                        |
|                                                                          |
|  +----------------+   +----------------+   +----------------+           |
|  | DisGeNET       |   | OMIM           |   | Reactome       |           |
|  | Gene-Disease   |   | Genetic        |   | Pathway        |           |
|  | Associations   |   | Disorders      |   | Enrichment     |           |
|  +-------+--------+   +-------+--------+   +-------+--------+           |
|          |                    |                    |                      |
|          +----------+--------+----------+--------+                       |
|                     v                    v                                |
|            +--------------------------------------+                      |
|            |    TARGET VALIDATION PIPELINE         |                      |
|            |                                       |                      |
|            |  1. Genetic evidence score            |                      |
|            |  2. Expression in disease tissue      |                      |
|            |  3. Druggability prediction           |                      |
|            |  4. Known ligand availability         |                      |
|            |  5. Competitive landscape analysis    |                      |
|            |  6. Safety liabilities (essential     |                      |
|            |     genes, paralogs)                  |                      |
|            +-------------------+------------------+                      |
|                                |                                          |
|  Output: Ranked list of protein targets with evidence                    |
|                                                                          |
|  ========================================================================= |
|                                                                          |
|  STAGE 2: DRUGGABILITY ASSESSMENT                                       |
|  ================================                                        |
|                                                                          |
|  Input: Validated protein target                                         |
|                                                                          |
|  +----------------+   +----------------+   +----------------+           |
|  | Pocket         |   | Binding Site   |   | Structural     |           |
|  | Detection      |   | Analysis       |   | Analysis       |           |
|  | (Fpocket/COACH)|   | (ESM2 + PDB)   |   | (AlphaFold)    |           |
|  +-------+--------+   +-------+--------+   +-------+--------+           |
|          |                    |                    |                      |
|          +----------+--------+----------+--------+                       |
|                     v                    v                                |
|            +--------------------------------------+                      |
|            |    DRUGGABILITY SCORE                 |                      |
|            |                                       |                      |
|            |  - Pocket volume and depth            |                      |
|            |  - Hydrophobicity                     |                      |
|            |  - Enclosedness (druggability index)  |                      |
|            |  - Known drug-binding precedent       |                      |
|            |  - Druggability classification        |                      |
|            |    (druggable / partially / undruggable)|                    |
|            +-------------------+------------------+                      |
|                                |                                          |
|  Output: Druggable pockets with confidence scores                        |
|                                                                          |
|  ========================================================================= |
|                                                                          |
|  STAGE 3: HIT GENERATION                                                |
|  ========================                                               |
|                                                                          |
|  Input: Target + Druggable pocket                                       |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |  MODALITY SELECTION (AI Scientist determines)                |       |
|  |                                                               |       |
|  |  Route A: Protein Binder Design                              |       |
|  |    +--------------+  +--------------+  +--------------+      |       |
|  |    | RFdiffusion  |-> | ProteinMPNN  |-> | ESMFold      |      |       |
|  |    | (backbone)   |  | (sequence)   |  | (validate)   |      |       |
|  |    +--------------+  +--------------+  +--------------+      |       |
|  |                                                               |       |
|  |  Route B: Small Molecule Screening                           |       |
|  |    +--------------+  +--------------+  +--------------+      |       |
|  |    | ChEMBL       |-> | Virtual      |-> | DiffDock     |      |       |
|  |    | (compounds)  |  | Screen       |  | (dock)       |      |       |
|  |    +--------------+  +--------------+  +--------------+      |       |
|  |                                                               |       |
|  |  Route C: Hybrid (Protein + Small Molecule)                  |       |
|  |    Both routes in parallel, cross-validate                   |       |
|  +--------------------------------------------------------------+       |
|                                |                                          |
|  Output: Hit compounds/binders with initial scoring                      |
|                                                                          |
|  ========================================================================= |
|                                                                          |
|  STAGE 4: LEAD OPTIMIZATION                                             |
|  ==========================                                             |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |                                                               |       |
|  |  +--------------+  +--------------+  +--------------+        |       |
|  |  | ADMET        |  | Selectivity  |  | Affinity     |        |       |
|  |  | Filtering    |  | Profiling    |  | Optimization |        |       |
|  |  |              |  |              |  |              |        |       |
|  |  | - Lipinski   |  | - Off-target |  | - Mutation   |        |       |
|  |  | - Solubility |  |   screening  |  |   scanning   |        |       |
|  |  | - Stability  |  | - Paralog    |  | - FEP        |        |       |
|  |  | - Metabolism |  |   selectivity|  | - Redesign   |        |       |
|  |  +--------------+  +--------------+  +--------------+        |       |
|  |                          |                                   |       |
|  |                          v                                   |       |
|  |              +------------------------------+               |       |
|  |              |  MULTI-OBJECTIVE OPTIMIZATION|               |       |
|  |              |                              |               |       |
|  |              |  Pareto front:               |               |       |
|  |              |  Affinity vs. Selectivity vs.|               |       |
|  |              |  ADMET vs. Novelty           |               |       |
|  |              +------------------------------+               |       |
|  +--------------------------------------------------------------+       |
|                                |                                          |
|  Output: Optimized lead candidates                                        |
|                                                                          |
|  ========================================================================= |
|                                                                          |
|  STAGE 5: CANDIDATE SELECTION                                           |
|  ============================                                            |
|                                                                          |
|  +--------------------------------------------------------------+       |
|  |                                                               |       |
|  |  +--------------+  +--------------+  +--------------+        |       |
|  |  | Benchmarking |  | Explainable  |  | Experimental |        |       |
|  |  | vs Known     |  | Ranking      |  | Validation   |        |       |
|  |  | Drugs        |  |              |  | Plan         |        |       |
|  |  +--------------+  +--------------+  +--------------+        |       |
|  |                          |                                   |       |
|  |                          v                                   |       |
|  |              +------------------------------+               |       |
|  |              |  CANDIDATE REPORT            |               |       |
|  |              |                              |               |       |
|  |              |  - Scientific summary        |               |       |
|  |              |  - Structural details        |               |       |
|  |              |  - Risk assessment           |               |       |
|  |              |  - Clinical context          |               |       |
|  |              |  - Experimental plan         |               |       |
|  |              +------------------------------+               |       |
|  +--------------------------------------------------------------+       |
|                                                                          |
|  Output: Final candidates with full documentation                        |
+--------------------------------------------------------------------------+
```

### Pipeline API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/pipeline/target-identification` | Start target ID |
| POST | `/api/v1/pipeline/druggability-assessment` | Assess druggability |
| POST | `/api/v1/pipeline/hit-generation` | Generate hits |
| POST | `/api/v1/pipeline/lead-optimization` | Optimize leads |
| POST | `/api/v1/pipeline/candidate-selection` | Select candidates |
| POST | `/api/v1/pipeline/execute` | Full pipeline (async) |
| GET | `/api/v1/pipeline/{pipeline_id}/status` | Pipeline progress |
| GET | `/api/v1/pipeline/{pipeline_id}/report` | Full pipeline report |

---

## Phase 5: Pathway & Systems Biology

### Goal

Contextualize drug candidates within biological systems for better target selection and safety assessment.

### Timeline: Weeks 8-14

### Data Source Integrations

```
+--------------------------------------------------------------------------+
|                    REACTOME API CLIENT                                    |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Pathway lookup by protein/disease                                 |
|    2. Pathway enrichment analysis                                       |
|    3. Pathway hierarchy traversal                                       |
|    4. Species-specific pathway data                                     |
|                                                                          |
|  Endpoints Used:                                                        |
|    /idents/{id}                    -> Pathway details                   |
|    /data/pathway/{id}/containedIn  -> Parent pathways                   |
|    /data/pathway/{id}/hasComponent -> Pathway components                |
|    /analysis/identifiers/{query}   -> Enrichment analysis               |
|                                                                          |
|  Output:                                                                |
|    PathwayResult:                                                       |
|      pathway_id: str                (R-HSA-XXXXXX)                     |
|      pathway_name: str                                                  |
|      pathway_hierarchy: list[str]   (top-level -> specific)             |
|      components: list[ProteinTarget]                                    |
|      diseases: list[str]                                                |
|      drugs: list[str]                                                   |
|      enrichment_pvalue: float                                           |
+--------------------------------------------------------------------------+

+--------------------------------------------------------------------------+
|                    KEGG API CLIENT                                        |
+--------------------------------------------------------------------------+
|                                                                          |
|  Capabilities:                                                          |
|    1. Pathway mapping (compound -> pathway)                             |
|    2. Disease-gene associations                                         |
|    3. Drug-target-pathway relationships                                 |
|    4. Metabolic pathway analysis                                        |
|                                                                          |
|  Endpoints Used:                                                        |
|    /pathway/{pathway_id}           -> Pathway details                   |
|    /link/pathway/{compound_id}     -> Compound pathways                 |
|    /find/disease/{query}           -> Disease search                    |
|    /get/{compound_id}              -> Drug compound details             |
+--------------------------------------------------------------------------+
```

### Disease-Gene Knowledge Graph Schema

```
Neo4j Schema:

  (:Disease)-[:ASSOCIATED_WITH]->(:Gene)
  (:Gene)-[:ENCODES]->(:Protein)
  (:Protein)-[:PARTICIPATES_IN]->(:Pathway)
  (:Pathway)-[:REGULATES]->(:Pathway)
  (:Compound)-[:TARGETS]->(:Protein)
  (:Compound)-[:MODULATES]->(:Pathway)
  (:Disease)-[:DYSREGULATES]->(:Pathway)
  (:Drug)-[:TREATS]->(:Disease)
  (:Drug)-[:INHIBITS]->(:Protein)
  (:Mutation)-[:CAUSES]->(:Disease)
  (:Mutation)-[:AFFECTS]->(:Protein)

Example Queries:

  // Find all proteins in disease pathway
  MATCH (d:Disease {name: $disease})-[:DYSREGULATES]->(p:Pathway)
        -[:HAS_COMPONENT]->(prot:Protein)
  RETURN prot, p.name

  // Check if target has paralogs (safety concern)
  MATCH (g:Gene {name: $gene})-[:PARALOG_OF]->(paralog:Gene)
  RETURN paralog

  // Find existing drugs for similar targets
  MATCH (t:Protein {name: $target})-[:HOMOLOG_OF]->(homolog:Protein)
        <-[:TARGETS]-(c:Compound)
  RETURN c, homolog
```

### Pathway Enrichment Analysis

```
+--------------------------------------------------------------------------+
|                    PATHWAY ENRICHMENT ANALYSIS                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  Input: List of candidate target proteins                               |
|                                                                          |
|  Step 1: Map proteins to pathways (Reactome + KEGG)                     |
|  Step 2: Perform enrichment analysis                                    |
|    - Fisher's exact test / Hypergeometric test                          |
|    - Multiple testing correction (Benjamini-Hochberg)                   |
|    - False Discovery Rate control                                       |
|  Step 3: Pathway visualization                                          |
|    - Highlight enriched pathways                                         |
|    - Show candidate proteins within pathways                            |
|    - Color-code by confidence/druggability                              |
|                                                                          |
|  Output:                                                                |
|    EnrichmentResult:                                                    |
|      enriched_pathways: list[EnrichedPathway]                           |
|        pathway: PathwayInfo                                             |
|        pvalue: float                                                    |
|        adjusted_pvalue: float                                           |
|        fold_enrichment: float                                           |
|        hit_count: int                                                   |
|        genes_in_pathway: list[str]                                      |
|      pathway_network: NetworkGraph                                      |
|      biological_interpretation: str (AI-generated)                     |
+--------------------------------------------------------------------------+
```

---

## Phase 6: ADMET & Safety Profiling

### Goal

Predict drug-like properties early to reduce late-stage failures.

### Timeline: Weeks 10-16

### ADMET Property Panel

```
+--------------------------------------------------------------------------+
|                    ADMET PROPERTY PANEL                                   |
+--------------------------------------------------------------------------+
|                                                                          |
|  ABSORPTION                                                             |
|  - Lipinski Rule of Five         Pass/Fail + violations                |
|  - Veber Rules                   Pass/Fail                             |
|  - Caco-2 Permeability           Predicted Papp (nm/s)                 |
|  - P-gp Substrate                Yes/No                                |
|  - Oral Bioavailability          Predicted %F                          |
|  - Solubility                    Predicted logS                        |
|  ----------------------------------------------------------------------- |
|  DISTRIBUTION                                                            |
|  - Plasma Protein Binding         Predicted % bound                     |
|  - Volume of Distribution         Predicted Vd (L/kg)                  |
|  - Blood-Brain Barrier            Yes/No + confidence                   |
|  - CYP Inhibition Profile         1A2, 2C9, 2C19, 2D6, 3A4           |
|  ----------------------------------------------------------------------- |
|  METABOLISM                                                              |
|  - CYP450 Substrate               Which isoforms metabolize             |
|  - CYP450 Inducer                 Which isoforms are induced            |
|  - CYP450 Inhibitor               Which isoforms are inhibited          |
|  - Metabolic Stability             Predicted t1/2 (minutes)             |
|  - Reactive Metabolites           GSH trapping risk                     |
|  ----------------------------------------------------------------------- |
|  EXCRETION                                                               |
|  - Renal Clearance                 Predicted CLr (mL/min/kg)           |
|  - Half-life                       Predicted t1/2 (hours)              |
|  - Total Clearance                 Predicted CLtotal                    |
|  ----------------------------------------------------------------------- |
|  TOXICITY                                                                |
|  - hERG Channel Inhibition         IC50 prediction (uM)                |
|  - Ames Mutagenicity               Positive/Negative                   |
|  - Hepatotoxicity                  DILI risk score                     |
|  - Cardiotoxicity                  QT prolongation risk                |
|  - Acute Toxicity                   LD50 prediction                     |
|  - Organ Toxicity Panel            Kidney, Liver, Heart risk           |
|  ----------------------------------------------------------------------- |
|                                                                          |
|  Tools/Methods:                                                         |
|    - pkCSM (pretrained ADMET models)                                    |
|    - SwissADME (web-based, API available)                               |
|    - ADMETlab 2.0 (comprehensive ADMET prediction)                     |
|    - RDKit descriptors + custom ML models                               |
|    - DeepChem ADMET models                                              |
|                                                                          |
|  Output Schema:                                                        |
|    ADMETProfile:                                                        |
|      absorption: AbsorptionProfile                                      |
|      distribution: DistributionProfile                                  |
|      metabolism: MetabolismProfile                                      |
|      excretion: ExcretionProfile                                        |
|      toxicity: ToxicityProfile                                          |
|      overall_drug_likeness: float  (0-1 score)                         |
|      lipinski_compliant: bool                                            |
|      violations: list[str]                                              |
|      recommendations: list[str]  (how to improve)                       |
+--------------------------------------------------------------------------+
```

### Safety Profiling Pipeline

```
+--------------------------------------------------------------------------+
|                    SAFETY PROFILING PIPELINE                             |
+--------------------------------------------------------------------------+
|                                                                          |
|  Candidate Compound                                                     |
|       |                                                                  |
|       v                                                                  |
|  +-----------------+                                                    |
|  |  Lipinski RO5   |---- FAIL ----> Flag for review                    |
|  |  (4 rules)      |                                                    |
|  +--------+--------+                                                    |
|           | PASS                                                         |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Veber Rules    |---- FAIL ----> Flag for review                    |
|  +--------+--------+                                                    |
|           | PASS                                                         |
|           v                                                              |
|  +-----------------+                                                    |
|  |  hERG IC50      |---- < 10uM ----> Cardiac risk flag               |
|  +--------+--------+                                                    |
|           | > 10uM                                                       |
|           v                                                              |
|  +-----------------+                                                    |
|  |  CYP450 Panel   |---- Strong inhibitor ----> DDI risk flag          |
|  +--------+--------+                                                    |
|           | No strong inhibition                                         |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Ames Test      |---- Positive ----> Mutagenicity flag             |
|  +--------+--------+                                                    |
|           | Negative                                                     |
|           v                                                              |
|  +-----------------+                                                    |
|  |  Hepatotoxicity |---- High risk ----> Liver toxicity flag           |
|  +--------+--------+                                                    |
|           | Low risk                                                     |
|           v                                                              |
|  +-----------------------------+                                        |
|  |  SAFETY SCORE:              |                                        |
|  |                              |                                        |
|  |  Overall Risk: Low/Med/High  |                                        |
|  |  Key Concerns: [list]       |                                        |
|  |  Recommendation:            |                                        |
|  |    Advance / Modify / Stop   |                                        |
|  +-----------------------------+                                        |
+--------------------------------------------------------------------------+
```

---

## Phase 7: Clinical Translation

### Goal

Connect computational candidates to clinical reality for informed decision-making.

### Timeline: Weeks 14-20

### ClinicalTrials.gov Integration

```
+--------------------------------------------------------------------------+
|                    CLINICALTrials.gov CLIENT                              |
+--------------------------------------------------------------------------+
|                                                                          |
|  Endpoints Used:                                                        |
|    /api/v2/studies?query.term={disease}         -> Disease trials       |
|    /api/v2/studies?query.cond={disease}&        -> Target trials       |
|             query.intr={target_drug}                                     |
|    /api/v2/studies/{nctId}                       -> Trial details       |
|                                                                          |
|  Data Retrieved:                                                        |
|    - Trial NCT ID                                                       |
|    - Status (Recruiting, Completed, Terminated, etc.)                   |
|    - Phase (1, 2, 3, 4)                                               |
|    - Interventions (drugs being tested)                                 |
|    - Primary endpoints                                                  |
|    - Enrolled patient count                                             |
|    - Sponsor                                                            |
|    - Results (if available)                                             |
|                                                                          |
|  Competitive Analysis Output:                                           |
|    ClinicalLandscape:                                                   |
|      disease: str                                                        |
|      total_trials: int                                                  |
|      trials_by_phase: dict[str, int]                                    |
|      trials_by_status: dict[str, int]                                   |
|      competing_drugs: list[CompetingDrug]                               |
|        drug_name: str                                                   |
|        target: str                                                      |
|        phase: int                                                       |
|        status: str                                                      |
|        mechanism: str                                                   |
|      unmet_needs: list[str]   (gaps in current trials)                 |
|      opportunity_score: float (novelty of our candidate)               |
|      recommendation: str       (AI-generated strategic advice)         |
+--------------------------------------------------------------------------+
```

### Benchmarking Against Known Binders

```
+--------------------------------------------------------------------------+
|                    BENCHMARKING FRAMEWORK                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  Reference Databases:                                                   |
|    - PDBbind: Known binding affinities from PDB                        |
|    - BindingDB: Curated binding data                                    |
|    - UniProt: Known protein interactions                                |
|    - ChEMBL: Bioactivity data                                           |
|                                                                          |
|  Benchmarking Metrics:                                                  |
|    1. Structural Similarity (TM-score, GDT-TS)                         |
|    2. Sequence Identity (BLAST)                                         |
|    3. Binding Affinity Comparison (dG vs. known)                       |
|    4. Selectivity Profile                                               |
|    5. Novelty Score (distance from nearest known binder)               |
|                                                                          |
|  Benchmarking Output:                                                   |
|    BenchmarkResult:                                                     |
|      candidate_id: str                                                  |
|      nearest_known_binder: KnownBinder                                 |
|        pdb_id: str                                                      |
|        ligand_name: str                                                 |
|        affinity: float                                                  |
|        tm_score: float                                                  |
|      affinity_comparison: str    ("better"/"comparable"/"worse")       |
|      novelty_score: float        (0 = known, 1 = novel)                |
|      leaderboard_rank: int                                              |
|      improvement_over_known: str                                        |
+--------------------------------------------------------------------------+
```

---

## Data Model Evolution

### Entity Relationship Diagram

```
+--------------------------------------------------------------------------+
|                    EVOLVED DOMAIN MODEL                                   |
+--------------------------------------------------------------------------+
|                                                                          |
|  +----------+     +--------------+     +--------------+                 |
|  | Disease  |---->| Gene         |---->| ProteinTarget|                 |
|  |          |     |              |     |              |                 |
|  | id       |     | id           |     | id           |                 |
|  | name     |     | symbol       |     | accession   |                 |
|  | ontology |     | ensembl_id   |     | name        |                 |
|  +----------+     +--------------+     | sequence    |                 |
|                                         +------+-----+                  |
|                                                |                        |
|                    +---------------------------+-------------------+    |
|                    |                           |                   |    |
|                    v                           v                   v    |
|             +--------------+          +--------------+     +----------+|
|             | BindingSite  |          | Pathway      |     | Drugga-  ||
|             |              |          |              |     | bility   ||
|             | id           |          | id           |     |          ||
|             | residues     |          | name         |     | id       ||
|             | pocket_type  |          | ontology_id  |     | pocket   ||
|             | confidence   |          | organism     |     | score    ||
|             +------+-------+          | components   |     | class    ||
|                    |                  +--------------+     +----------+|
|         +----------+----------+                                        |
|         |          |          |                                        |
|         v          v          v                                        |
|  +----------+ +----------+ +----------+                               |
|  | Candidate| | Compound | | Hit      |                               |
|  |          | |          | |          |                               |
|  | id       | | id       | | id       |                               |
|  | sequence | | smiles   | | type     |                               |
|  | structure| | inchi    | | source   |                               |
|  | type     | | mw       | | score    |                               |
|  | scores   | | logp     | | target   |                               |
|  +----+-----+ | properties| | pocket   |                               |
|       |       +-----+----+ +----------+                               |
|       |             |                                                  |
|       |             v                                                  |
|       |       +--------------+                                         |
|       |       | Bioactivity  |                                         |
|       |       |              |                                         |
|       |       | id           |                                         |
|       |       | type (IC50)  |                                         |
|       |       | value        |                                         |
|       |       | target       |                                         |
|       |       +--------------+                                         |
|       |                                                                |
|       v                                                                |
|  +--------------+     +--------------+     +--------------+           |
|  | DockingResult|     | ADMETProfile |     | Affinity     |           |
|  |              |     |              |     | Prediction   |           |
|  | id           |     | id           |     |              |           |
|  | compound_id  |     | absorption   |     | id           |           |
|  | target_id    |     | distribution |     | kd, ic50     |           |
|  | score        |     | metabolism   |     | confidence   |           |
|  | pose         |     | toxicity     |     | methods      |           |
|  +--------------+     +--------------+     +--------------+           |
|                                                                          |
|  +--------------+     +--------------+     +--------------+           |
|  | ClinicalTrial|     | Literature   |     | Report       |           |
|  |              |     |              |     |              |           |
|  | nct_id       |     | pmid         |     | id           |           |
|  | phase        |     | title        |     | title        |           |
|  | status       |     | authors      |     | sections     |           |
|  | interventions |    | year         |     | references   |           |
|  +--------------+     +--------------+     +--------------+           |
+--------------------------------------------------------------------------+
```

### New Database Tables

```sql
CREATE TABLE compounds (
    id              TEXT PRIMARY KEY,
    smiles          TEXT NOT NULL,
    inchi           TEXT,
    inchi_key       TEXT UNIQUE,
    molecular_weight REAL,
    logp            REAL,
    hbd             INTEGER,
    hba             INTEGER,
    tpsa            REAL,
    rotatable_bonds INTEGER,
    source          TEXT NOT NULL,
    source_id       TEXT,
    iupac_name      TEXT,
    common_name     TEXT,
    max_phase       INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bioactivity_records (
    id              TEXT PRIMARY KEY,
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    target_id       TEXT NOT NULL,
    assay_id        TEXT,
    activity_type   TEXT NOT NULL,
    activity_value  REAL,
    activity_unit   TEXT,
    relation        TEXT DEFAULT '=',
    assay_type      TEXT,
    reference       TEXT,
    confidence_score INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compound_libraries (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    compound_count  INTEGER DEFAULT 0,
    source          TEXT,
    drug_like_filter BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admet_profiles (
    id              TEXT PRIMARY KEY,
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    absorption      JSONB,
    distribution    JSONB,
    metabolism      JSONB,
    excretion       JSONB,
    toxicity        JSONB,
    overall_drug_likeness REAL,
    lipinski_compliant BOOLEAN,
    violations      JSONB,
    recommendations JSONB,
    confidence      REAL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clinical_trials (
    id              TEXT PRIMARY KEY,
    nct_id          TEXT UNIQUE NOT NULL,
    disease         TEXT,
    phase           INTEGER,
    status          TEXT,
    interventions   JSONB,
    primary_endpoints TEXT,
    enrolled_count  INTEGER,
    sponsor         TEXT,
    results_available BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE binding_predictions (
    id              TEXT PRIMARY KEY,
    compound_id     TEXT,
    target_id       TEXT,
    pocket_id       TEXT,
    prediction_type TEXT NOT NULL,
    predicted_kd    REAL,
    predicted_ic50  REAL,
    predicted_dg    REAL,
    confidence      REAL,
    methods_used    JSONB,
    uncertainty     REAL,
    explanation     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pathway_annotations (
    id              TEXT PRIMARY KEY,
    target_id       TEXT NOT NULL,
    pathway_source  TEXT NOT NULL,
    pathway_id      TEXT NOT NULL,
    pathway_name    TEXT,
    enrichment_pvalue REAL,
    adjusted_pvalue REAL,
    fold_enrichment REAL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE safety_profiles (
    id              TEXT PRIMARY KEY,
    compound_id     TEXT NOT NULL REFERENCES compounds(id),
    herg_ic50       REAL,
    ames_positive   BOOLEAN,
    hepatotoxicity_risk TEXT,
    cardiorisk      TEXT,
    bbb_penetration BOOLEAN,
    overall_risk    TEXT,
    flags           JSONB,
    recommendation  TEXT,
    confidence      REAL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Infrastructure Evolution

### Job Queue Migration

```
CURRENT: InMemory Job Queue                     TARGET: Redis + Celery + GPU Scheduler
===============                                  =========================================

+-------------+     +--------------+             +-------------+     +--------------+
| API Request |---->| InMemory     |             | API Request |---->| Redis Queue  |
| (sync)      |     | Queue        |             | (async)     |     | (persistent) |
+-------------+     +------+-------+             +-------------+     +------+-------+
                           |                                              |
                           v                                              v
                    +--------------+                               +--------------+
                    | Worker       |                               | Celery Worker|
                    | (deterministic)|                              | (GPU-aware)  |
                    +--------------+                               +------+-------+
                                                                        |
                                                         +--------------+--------------+
                                                         v              v              v
                                                  +----------+  +----------+  +----------+
                                                  | CPU Pool |  | GPU Pool |  | Priority |
                                                  | (4 works)|  | (2 A100) |  | Queue    |
                                                  +----------+  +----------+  +----------+

Features:
  - Persistent job state
  - Automatic retry with exponential backoff
  - Job cancellation and timeout
  - Priority queues (high/medium/low)
  - GPU resource scheduling
  - Result backend (Redis + PostgreSQL)
  - Monitoring via Flower dashboard
```

### GPU Scheduling Architecture

```
+--------------------------------------------------------------------------+
|                    KUBERNETES CLUSTER                                     |
+--------------------------------------------------------------------------+
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  GPU NODE POOL                                                      | |
|  |                                                                      | |
|  |  +-------------+  +-------------+  +-------------+                 | |
|  |  | Node 1      |  | Node 2      |  | Node 3      |                 | |
|  |  | 4x A100     |  | 4x A100     |  | 8x A100     |                 | |
|  |  | 80GB        |  | 80GB        |  | 80GB        |                 | |
|  |  |             |  |             |  |             |                 | |
|  |  | +---------+ |  | +---------+ |  | +---------+ |                 | |
|  |  | |RFdiff   | |  | |Protein  | |  | |AlphaFold| |                 | |
|  |  | |(2 GPU)  | |  | |MPNN     | |  | |Multimer | |                 | |
|  |  | +---------+ |  | |(1 GPU)  | |  | |(8 GPU)  | |                 | |
|  |  +-------------+  | +---------+ |  | +---------+ |                 | |
|  |                    +-------------+  +-------------+                 | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  Model -> GPU Mapping:                                                   |
|  +------------------+----------+------------------+                     |
|  | Model            | GPU Req  | Queue Priority   |                     |
|  +------------------+----------+------------------+                     |
|  | ESM2 (inference) | 1x A100  | High             |                     |
|  | ESMFold          | 1x A100  | High             |                     |
|  | RFdiffusion      | 4x A100  | Medium           |                     |
|  | ProteinMPNN      | 1x A100  | Medium           |                     |
|  | DiffDock         | 1x A100  | Medium           |                     |
|  | AlphaFold-Mult   | 8x A100  | Low (expensive)  |                     |
|  | Boltz2           | 4x A100  | Low              |                     |
|  +------------------+----------+------------------+                     |
+--------------------------------------------------------------------------+
```

### Multi-Tier Caching Strategy

```
+--------------------------------------------------------------------------+
|                    MULTI-TIER CACHING STRATEGY                           |
+--------------------------------------------------------------------------+
|                                                                          |
|  TIER 1: IN-MEMORY CACHE (per-request)                                 |
|  - Protein lookups within single workflow run                           |
|  - Repeated sequence analysis (avoid redundant ESM2 calls)             |
|  - TTL: 0 (request-scoped)                                              |
|                                                                          |
|  TIER 2: REDIS CACHE (shared across workers)                           |
|  - UniProt/PDB/AlphaFold lookups                                        |
|  - Compound lookups (ChEMBL, PubChem)                                  |
|  - Model inference results (same input -> same output)                 |
|  - Literature search results                                            |
|  - TTL: 24h (scientific data) / 7d (model outputs)                    |
|                                                                          |
|  TIER 3: POSTGRESQL MATERIALIZED VIEWS (analytical)                    |
|  - Aggregated statistics                                                |
|  - Benchmarking results                                                 |
|  - Pre-computed pathway enrichments                                     |
|  - Refresh: Hourly / On-demand                                          |
+--------------------------------------------------------------------------+
```

### MLflow Integration

```
+--------------------------------------------------------------------------+
|                    MLflow INTEGRATION                                     |
+--------------------------------------------------------------------------+
|                                                                          |
|  Tracking Structure:                                                    |
|                                                                          |
|  MLflow Experiment                                                      |
|  +-- Run (each pipeline execution)                                      |
|      +-- Parameters                                                     |
|      |   +-- target_sequence                                            |
|      |   +-- disease                                                    |
|      |   +-- random_seed                                                |
|      |   +-- model_versions                                             |
|      |   +-- hyperparameters                                            |
|      +-- Metrics (per step)                                             |
|      |   +-- binding_affinity (Kd)                                      |
|      |   +-- docking_score                                              |
|      |   +-- stability (pLDDT)                                          |
|      |   +-- ADMET_score                                                |
|      |   +-- composite_score                                            |
|      +-- Artifacts                                                     |
|      |   +-- PDB structures                                             |
|      |   +-- SMILES files                                               |
|      |   +-- Docking poses                                              |
|      |   +-- Scientific reports                                         |
|      |   +-- Model logs                                                 |
|      +-- Tags                                                          |
|          +-- project_id                                                 |
|          +-- user_id                                                    |
|          +-- pipeline_stage                                             |
|          +-- model_backend                                              |
+--------------------------------------------------------------------------+
```

---

## API Evolution

### Complete Endpoint Map

```
EXISTING (v1)
=============
GET    /api/v1/health
GET    /api/v1/metrics
POST   /api/v1/workflows/binder-design
POST   /api/v1/workflows/binder-design/jobs
GET    /api/v1/jobs/{job_id}
GET    /api/v1/experiments/{experiment_id}
GET    /api/v1/experiments
GET    /api/v1/artifacts/{artifact_id}
GET    /api/v1/projects
GET    /api/v1/knowledge-graph
GET    /api/v1/stats
POST   /api/v1/targets/lookup
POST   /api/v1/literature/search
POST   /api/v1/docking/run
POST   /api/v1/ai-scientist/chat
GET    /api/v1/reports/{experiment_id}

NEW: COMPOUNDS (Phase 1)
========================
POST   /api/v1/compounds/lookup
POST   /api/v1/compounds/search
GET    /api/v1/compounds/{compound_id}
GET    /api/v1/compounds/{compound_id}/bioactivity
GET    /api/v1/compounds/{compound_id}/similar
POST   /api/v1/compounds/compare
GET    /api/v1/libraries
POST   /api/v1/libraries/screen

NEW: MODELS (Phase 2)
=====================
POST   /api/v1/models/esm2/embed
POST   /api/v1/models/esm2/mutate
POST   /api/v1/models/esmfold/predict
POST   /api/v1/models/rfdiffusion/generate
POST   /api/v1/models/proteinmpnn/design
POST   /api/v1/models/diffdock/dock
POST   /api/v1/models/alphafold-multimer/predict
GET    /api/v1/models/status

NEW: PIPELINE (Phase 4)
=======================
POST   /api/v1/pipeline/target-identification
POST   /api/v1/pipeline/druggability-assessment
POST   /api/v1/pipeline/hit-generation
POST   /api/v1/pipeline/lead-optimization
POST   /api/v1/pipeline/candidate-selection
POST   /api/v1/pipeline/execute
GET    /api/v1/pipeline/{pipeline_id}/status
GET    /api/v1/pipeline/{pipeline_id}/report

NEW: PATHWAYS (Phase 5)
=======================
GET    /api/v1/pathways/{pathway_id}
POST   /api/v1/pathways/enrichment
GET    /api/v1/pathways/{pathway_id}/components
GET    /api/v1/pathways/{pathway_id}/drugs

NEW: ADMET (Phase 6)
====================
POST   /api/v1/admet/predict
GET    /api/v1/admet/{compound_id}
POST   /api/v1/admet/safety-screen
GET    /api/v1/admet/compare

NEW: CLINICAL (Phase 7)
=======================
GET    /api/v1/clinical/trials
GET    /api/v1/clinical/trials/{nct_id}
GET    /api/v1/clinical/landscape/{disease}
GET    /api/v1/benchmark/{candidate_id}
GET    /api/v1/benchmark/leaderboard

NEW: AUTH (Security)
====================
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/api-keys
DELETE /api/v1/api-keys/{key_id}
```

---

## Frontend Evolution

### New Pages

```
EXISTING (Updated):
  - Dashboard              -> Enhanced with compound metrics
  - Research Projects      -> Enhanced with pipeline status
  - Target Discovery       -> Enhanced with pathway/druggability
  - Protein Analysis       -> Enhanced with ESM2 embeddings
  - Structure Prediction   -> Real predictions (ESMFold/AF)
  - Binder Generation      -> RFdiffusion/ProteinMPNN output
  - Molecule Design        -> Real docking (DiffDock)
  - Docking & Validation   -> Enhanced with interaction analysis
  - AI Scientist           -> Enhanced with pathway/drug reasoning
  - Knowledge Base         -> Enhanced with full drug discovery graph
  - Experiments            -> MLflow-integrated
  - Reports                -> Enhanced with clinical context
  - Settings               -> OAuth2/OIDC, API keys, GPU config

NEW Pages:
  - Compound Search        -> Search ChEMBL/PubChem/DrugBank
  - Compound Detail        -> Full profile with bioactivity
  - Compound Comparison    -> Side-by-side analysis
  - ADMET Profiling        -> Property prediction dashboard
  - Pathway Explorer       -> Interactive pathway visualization
  - Clinical Landscape     -> Trial data for target diseases
  - Candidate Ranking      -> Multi-objective Pareto front
  - Benchmarking           -> Compare vs. known drugs
  - Pipeline Monitor       -> Real-time pipeline execution view

NEW Components:
  - CompoundStructure2D    -> SmilesDrawer-based 2D renderer
  - CompoundStructure3D    -> 3Dmol.js conformer viewer
  - ADMETRadarChart        -> Radar chart for ADMET properties
  - BioactivityScatter     -> Scatter plot (potency vs. selectivity)
  - PathwayDiagram         -> Reactome pathway visualization
  - PipelineTimeline       -> Animated pipeline progress
  - ParetoFrontChart       -> 2D/3D Pareto front visualization
  - BenchmarkingHeatmap    -> Candidate vs. known compound heatmap
  - ClinicalTrialTimeline  -> Trial phase timeline visualization
```

### Compound Search Page Wireframe

```
+--------------------------------------------------------------------------+
|  COMPOUND SEARCH                                                         |
+--------------------------------------------------------------------------+
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  | Search: [________________________________________] [Search] [Filter]| |
|  |                                                                      | |
|  | Filters:                                                            | |
|  | Source: [All v] MW: [___] - [___] LogP: [___] - [___]             | |
|  | Lipinski: [x] RO5    Max Phase: [>= 2 v]                          | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  Results (47 compounds):                                                |
|  +--------------------------------------------------------------------+ |
|  | +----------+  Aspirin (Aspirin)                                   | |
|  | |          |  SMILES: CC(=O)Oc1ccccc1C(=O)O                      | |
|  | |  2D      |  MW: 180.16 | LogP: 1.19 | HBD: 1 | HBA: 4       | |
|  | |  Struct  |  Source: DrugBank | Phase: 4                         | |
|  | |          |  Bioactivity: 342 records across 89 targets          | |
|  | +----------+  [View Details] [Compare] [Dock to Target]           | |
|  +--------------------------------------------------------------------+ |
|  | +----------+  Ibuprofen (Advil)                                   | |
|  | |          |  SMILES: CC(C)Cc1ccc(cc1)C(C)C(=O)O                 | |
|  | |  2D      |  MW: 206.28 | LogP: 3.97 | HBD: 1 | HBA: 2       | |
|  | |  Struct  |  Source: DrugBank | Phase: 4                         | |
|  | |          |  Bioactivity: 287 records across 67 targets          | |
|  | +----------+  [View Details] [Compare] [Dock to Target]           | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  Pagination: [1] 2 3 ... 5                                              |
+--------------------------------------------------------------------------+
```

### ADMET Profiling Dashboard Wireframe

```
+--------------------------------------------------------------------------+
|  ADMET PROFILING: Aspirin                                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  +----------------------------+  +--------------------------------+   |
|  |  DRUG-LIKENESS SCORE: 87%  |  |  SAFETY RISK: Low              |   |
|  |  [||||||||||||||||||]      |  |  [o][o][o][ ][ ]               |   |
|  |  Lipinski: OK (0 violations)| |  hERG IC50: 45 uM (Safe)     |   |
|  +----------------------------+  +--------------------------------+   |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  ADMET RADAR CHART                                                  | |
|  |                                                                      | |
|  |                    Absorption                                        | |
|  |                       ^                                              | |
|  |                      /|\                                             | |
|  |                     / | \                                            | |
|  |         Excretion <  |  > Distribution                              | |
|  |                      \|/                                             | |
|  |                       v                                              | |
|  |              Metabolism    Toxicity                                  | |
|  |                                                                      | |
|  |  [####] = Candidate    [oooo] = Reference Drug (Aspirin)           | |
|  +--------------------------------------------------------------------+ |
|                                                                          |
|  +--------------------------------------------------------------------+ |
|  |  ABSORPTION            |  DISTRIBUTION          |  METABOLISM      | |
|  |  Caco-2: 12.3 nm/s     |  PPB: 92%              |  CYP2C9: Sub    | |
|  |  P-gp: No              |  Vd: 0.15 L/kg         |  CYP3A4: No     | |
|  |  Oral Bioavail: 68%    |  BBB: No               |  Stability: 45m | |
|  |  Solubility: -1.8 logS |                        |  Metabolite: Sal | |
|  +------------------------+------------------------+------------------+ |
|  |  EXCRETION             |  TOXICITY              |                   | |
|  |  CLr: 3.2 mL/min/kg   |  hERG: - (safe)       | [Export Report]  | |
|  |  Half-life: 2.1 hrs   |  Ames: - (negative)   | [Compare]        | |
|  |  Route: Renal (80%)    |  Hepato: Low risk     | [Optimize]       | |
|  +--------------------------------------------------------------------+ |
+--------------------------------------------------------------------------+
```

---

## Knowledge Graph Evolution

### Expanded Node and Relationship Types

```
NODE TYPES:
===========

  (:Protein)
    Properties: id, name, accession, sequence, organism, structure_pdb,
                alphafold_id, function, subcellular_location

  (:Gene)
    Properties: id, symbol, ensembl_id, chromosome, start_pos, end_pos

  (:Disease)
    Properties: id, name, ontology_id (OMIM/DOID), category, prevalence

  (:Compound)
    Properties: id, smiles, inchi_key, name, source, max_phase, mw, logp

  (:Pathway)
    Properties: id, name, source (reactome/kegg), organism, category

  (:Drug)
    Properties: id, name, approval_status, mechanism_of_action,
                indications, contraindications

  (:Mutation)
    Properties: id, position, wild_type, mutant_type, disease_associated

  (:Publication)
    Properties: id, pmid, title, authors, year, journal, doi

  (:ClinicalTrial)
    Properties: id, nct_id, phase, status, sponsor, enrolled_count

RELATIONSHIP TYPES:
===================

  (:Gene)-[:ENCODES]->(:Protein)
  (:Gene)-[:ASSOCIATED_WITH]->(:Disease)
  (:Protein)-[:PARTICIPATES_IN]->(:Pathway)
  (:Protein)-[:BINDS_TO {affinity, method}]->(:Compound)
  (:Protein)-[:INHIBITED_BY]->(:Drug)
  (:Protein)-[:INTERACTS_WITH]->(:Protein)
  (:Protein)-[:HOMOLOG_OF]->(:Protein)
  (:Protein)-[:HAS_MUTATION]->(:Mutation)
  (:Compound)-[:TREATS]->(:Disease)
  (:Compound)-[:SCREENED_IN]->(:Assay)
  (:Drug)-[:TARGETS]->(:Protein)
  (:Drug)-[:TREATS]->(:Disease)
  (:Drug)-[:INTERACTS_WITH]->(:Drug)
  (:Disease)-[:DYSREGULATES]->(:Pathway)
  (:Pathway)-[:REGULATES]->(:Pathway)
  (:Mutation)-[:CAUSES]->(:Disease)
  (:ClinicalTrial)-[:TESTS]->(:Drug)
  (:ClinicalTrial)-[:TARGETS]->(:Disease)
```

---

## Security Evolution

### OAuth2/OIDC and Production Security

```
CURRENT STATE:
  - Bearer token (static API keys)
  - RBAC (viewer/scientist/admin)
  - Hashed API key persistence
  - Audit logs

TARGET STATE:

  1. OAuth2/OIDC JWT VALIDATION
     Client -> Auth0/Keycloak -> FastAPI (JWT)
     - JWT token validation (RS256)
     - Token refresh flow
     - Role claims mapping
     - Project-scoped tokens

  2. RATE LIMITING
     - Redis-backed rate limiter
     - Per-user rate limits
     - Per-endpoint rate limits
     - GPU job rate limits
     - Tiered limits: Free / Pro / Enterprise

  3. API KEY MANAGEMENT
     - Key generation with prefix (obd_live_xxxx)
     - Key expiration (90 days default)
     - Key rotation (grace period for old keys)
     - Scoped keys (read-only, scientist, admin)
     - Usage tracking per key

  4. SECRETS MANAGEMENT
     - HashiCorp Vault or AWS Secrets Manager
     - Rotate database credentials
     - Rotate API keys (ChEMBL, DrugBank, etc.)
     - Encrypt at rest
     - Audit access to secrets

  5. SUPPLY CHAIN SECURITY
     - SBOM generation (Syft)
     - Container image scanning (Trivy)
     - Dependency vulnerability scanning (Snyk)
     - Signed container images (Cosign)
     - Model artifact signing
```

---

## Testing & Validation Strategy

### Test Coverage Plan

```
CURRENT COVERAGE: 89.60%
TARGET COVERAGE: >=85% (maintain), key paths >=95%

TIER 1: UNIT TESTS (Target: >=90% coverage)
  - Domain model validation (all new models)
  - Agent contract implementations
  - SMILES validation and normalization
  - ADMET rule checking
  - Scoring function calculations
  - Pathway enrichment statistics
  - Knowledge graph query logic

TIER 2: INTEGRATION TESTS (Target: >=85% coverage)
  - API endpoint testing (all new endpoints)
  - Database migration testing
  - Scientific source client testing (ChEMBL, DrugBank, etc.)
  - Model adapter testing (mock GPU responses)
  - Knowledge graph integration testing
  - Job queue integration testing
  - Cache invalidation testing

TIER 3: SCIENTIFIC VALIDATION
  - Benchmark against known binding affinities (PDBbind)
  - Validate ADMET predictions against known drugs
  - Pathway enrichment validation (known gene sets)
  - Cross-validation of docking poses (RMSD < 2A)
  - Mutation effect prediction validation (ProTherm)
  - Reproducibility: same input -> same output (deterministic)

TIER 4: E2E TESTS
  - Full pipeline: Disease -> Target -> Hit -> Lead -> Candidate
  - Frontend workflow testing (Playwright/Cypress)
  - Authentication flow testing
  - Async job completion testing
  - Report generation testing

TIER 5: PERFORMANCE TESTS
  - API response time benchmarks (< 200ms p95)
  - Model inference latency benchmarks
  - Concurrent user testing (100+ simultaneous)
  - Database query performance (index optimization)
  - Memory usage profiling
  - GPU utilization monitoring
```

### Scientific Validation Benchmarks

```
+--------------------------------------------------------------------------+
|                    BENCHMARK DATASETS                                     |
+--------------------------------------------------------------------------+
|                                                                          |
|  BENCHMARK                  | METRIC           | TARGET        | STATUS |
|  ===========================|==================|===============|========|
|  Docking (PDBbind)          | RMSD < 2A        | >=70%          | Pending|
|  Affinity Prediction        | R-squared > 0.6  | >=0.6          | Pending|
|  Mutation Effect (ProTherm) | Spearman > 0.7   | >=0.7          | Pending|
|  ADMET (Lipinski)           | Accuracy > 95%   | >=95%          | Pending|
|  hERG Prediction            | AUC > 0.8        | >=0.8          | Pending|
|  Pathway Enrichment         | FDR < 0.05       | <5%            | Pending|
|  Protein Structure (CASP)   | GDT-TS > 80      | >=80           | Pending|
|  Binder Design (self-cons.) | TM-score > 0.7   | >=0.7          | Pending|
+--------------------------------------------------------------------------+
```

---

## Deployment Strategy

### Kubernetes Production Deployment

```
+--------------------------------------------------------------------------+
|                    KUBERNETES DEPLOYMENT ARCHITECTURE                     |
+--------------------------------------------------------------------------+
|                                                                          |
|  INGRESS CONTROLLER (NGINX)                                             |
|  - TLS termination                                                       |
|  - Rate limiting                                                         |
|  - Request routing: api.openbiodesign.io -> Backend                     |
|                      app.openbiodesign.io -> Frontend                    |
|  - WebSocket support (AI Scientist chat)                                 |
|                                                                          |
|  NAMESPACE: openbiodesign-prod                                          |
|                                                                          |
|  +----------------+  +----------------+  +----------------+             |
|  | Backend        |  | Frontend       |  | Celery Workers |             |
|  | Deployment     |  | Deployment     |  | Deployment     |             |
|  | (3 replicas)   |  | (3 replicas)   |  | (CPU: 4,       |             |
|  |                |  |                |  |  GPU: 2)       |             |
|  | CPU: 2 cores   |  | CPU: 1 core    |  | CPU: 4 cores   |             |
|  | Mem: 4GB       |  | Mem: 2GB       |  | Mem: 16GB      |             |
|  +----------------+  +----------------+  | GPU: 2x A100   |             |
|                                          +----------------+             |
|  +----------------+  +----------------+                                 |
|  | Model Servers  |  | Flower         |                                 |
|  | (GPU Pool)     |  | (Celery        |                                 |
|  |                |  |  Dashboard)    |                                 |
|  | ESM2: 1 GPU    |  | CPU: 0.5 core  |                                 |
|  | ESMFold: 1 GPU |  | Mem: 512MB     |                                 |
|  | DiffDock: 1 GPU|  |                |                                 |
|  +----------------+  +----------------+                                 |
|                                                                          |
|  NAMESPACE: openbiodesign-data                                          |
|                                                                          |
|  +-----------+ +-----------+ +-----------+ +-----------+               |
|  | PostgreSQL| | Redis     | | Neo4j     | | Qdrant    |               |
|  | Stateful  | | Stateful  | | Stateful  | | Stateful  |               |
|  | Set       | | Set       | | Set       | | Set       |               |
|  | (3 repl.) | | (3 repl.) | | (3 repl.) | | (3 repl.) |               |
|  +-----------+ +-----------+ +-----------+ +-----------+               |
|                                                                          |
|  +-----------+ +-----------+ +-----------+                              |
|  | MinIO     | | Prometheus| | Grafana   |                              |
|  | (Object)  | | (Metrics) | | (Dashbrd) |                              |
|  +-----------+ +-----------+ +-----------+                              |
+--------------------------------------------------------------------------+
```

### Docker Compose (Development)

```yaml
# docker-compose.drug-discovery.yaml (additions to existing)

services:
  # Existing infrastructure
  postgres:
    image: postgres:16
    # ... existing config

  redis:
    image: redis:7-alpine
    # ... existing config

  neo4j:
    image: neo4j:5.17
    # ... existing config

  qdrant:
    image: qdrant/qdrant:v1.8
    # ... existing config

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  # New: Celery Worker
  celery-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A openbiodesign.celery_app worker -l info -Q default,gpu
    depends_on:
      - redis
      - postgres
    environment:
      - REDIS_URL=redis://redis:6379/0
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/openbiodesign
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 2
              capabilities: [gpu]

  # New: Celery Flower (monitoring)
  celery-flower:
    build:
      context: ./backend
      dockerfile: Dockerfile
    command: celery -A openbiodesign.celery_app flower --port=5555
    ports:
      - "5555:5555"
    depends_on:
      - redis

  # New: MLflow
  mlflow:
    image: ghcr.io/mlflow/mlflow:v2.10
    command: mlflow server --host 0.0.0.0 --port 5000 --backend-store-uri postgresql://postgres:postgres@postgres:5432/mlflow --default-artifact-root /mlflow/artifacts
    ports:
      - "5000:5000"
    volumes:
      - mlflow-artifacts:/mlflow/artifacts
    depends_on:
      - postgres

  # New: ESM2 Model Server
  esm2-server:
    build:
      context: ./model-servers/esm2
    ports:
      - "8081:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  mlflow-artifacts:
```

---

## Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| GPU cost overruns | Medium | High | Implement auto-scaling, spot instances, cost monitoring |
| Model inference latency | Medium | Medium | Cache results, use ESMFold for fast screening, AF-Multimer only for final candidates |
| Data source rate limits | High | Low | Implement caching, respect rate limits, use API keys |
| Database performance at scale | Medium | Medium | Connection pooling, read replicas, query optimization |
| Model version conflicts | Low | High | Pin model versions in MLflow, container-based deployment |
| Scientific accuracy of predictions | Medium | High | Validate against known benchmarks, uncertainty quantification |

### Scientific Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Predicted binders don't work in vitro | High | High | Conservative ranking, uncertainty flags, experimental validation |
| ADMET predictions are inaccurate | Medium | High | Use multiple methods, validate against known drugs |
| Pathway analysis is misleading | Low | Medium | Use multiple databases, expert review |
| Docking poses are wrong | Medium | High | Cross-validate with multiple methods, experimental validation |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Single point of failure in GPU cluster | Medium | High | Multi-node deployment, failover, health checks |
| Data source downtime | Medium | Medium | Cache aggressively, graceful degradation |
| Security breach | Low | High | OAuth2/JWT, RBAC, audit logging, encryption |
| Regulatory compliance (data privacy) | Low | High | No PII storage, encryption at rest, access controls |

---

## Implementation Timeline

### Phase Summary

```
+--------------------------------------------------------------------------+
|                    IMPLEMENTATION TIMELINE                                |
+--------------------------------------------------------------------------+
|                                                                          |
|  Week 1-4:   Phase 1 - Small Molecule Layer                             |
|              [Domain] [ChEMBL] [PubChem] [DrugBank] [API] [Frontend]   |
|                                                                          |
|  Week 2-6:   Phase 2 - Real Model Adapters                              |
|              [ESM2] [ESMFold] [RFdiffusion] [ProteinMPNN] [DiffDock]   |
|              (overlaps with Phase 1)                                     |
|                                                                          |
|  Week 4-8:   Phase 3 - Binding Affinity & Optimization                 |
|              [Affinity] [Mutation] [Ranking] [Optimization Loop]       |
|                                                                          |
|  Week 6-12:  Phase 4 - Target-to-Candidate Pipeline                    |
|              [Target ID] [Druggability] [Hit Gen] [Lead Opt] [Report]  |
|              (overlaps with Phases 2-3)                                 |
|                                                                          |
|  Week 8-14:  Phase 5 - Pathway & Systems Biology                       |
|              [Reactome] [KEGG] [Enrichment] [Neo4j Schema]             |
|              (overlaps with Phase 4)                                    |
|                                                                          |
|  Week 10-16: Phase 6 - ADMET & Safety Profiling                        |
|              [ADMET] [Safety] [Toxicity] [Profiling Pipeline]          |
|              (overlaps with Phase 5)                                    |
|                                                                          |
|  Week 14-20: Phase 7 - Clinical Translation                            |
|              [ClinicalTrials] [Benchmarking] [Leaderboard]            |
|              (overlaps with Phase 6)                                    |
|                                                                          |
|  Week 1-20:  Infrastructure (Continuous)                                |
|              [Redis] [Celery] [MLflow] [K8s] [OAuth2] [Monitoring]    |
+--------------------------------------------------------------------------+

GANTT CHART:

Week:    1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
         |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
Phase 1: [==================]
Phase 2:    [==================]
Phase 3:          [==================]
Phase 4:                [==========================]
Phase 5:                      [==========================]
Phase 6:                            [==========================]
Phase 7:                                  [==========================]
Infra:   [==========================================================]
```

### Milestone Deliverables

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| 4 | Small Molecule Ready | Compound search, ChEMBL/PubChem/DrugBank integration, compound API |
| 6 | Real Models Online | ESM2, ESMFold, RFdiffusion, ProteinMPNN, DiffDock adapters |
| 8 | Affinity Prediction | Multi-method scoring, mutation optimization loop |
| 12 | Full Pipeline | End-to-end disease-to-candidate workflow |
| 14 | Pathway Context | Reactome/KEGG integration, enrichment analysis |
| 16 | Safety Profiling | ADMET prediction, safety screening pipeline |
| 17 | Clinical Context | ClinicalTrials.gov integration, competitive landscape |
| 18 | Benchmarking | Candidate leaderboard, comparison to known drugs |
| 20 | Production Ready | OAuth2, Redis/Celery, MLflow, K8s deployment, monitoring |

---

## Documentation Updates

This document should be updated when adding:

- New data source integrations
- New model adapters
- New API endpoints
- New database tables
- New agent implementations
- Security changes
- Deployment changes
- Benchmark results
