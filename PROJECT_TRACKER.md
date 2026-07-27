# OpenBioDesign Project Tracker

Last updated: 2026-06-13

## Project Mission

Build OpenBioDesign: an open-source, research-grade, explainable AI-assisted drug discovery platform that can analyze protein targets, design binders, generate and optimize candidate sequences, predict structures/interactions, rank candidates, explain predictions, retrieve literature evidence, recommend experiments, and generate scientific reports.

The platform must enforce:

- Reproducibility
- Explainability
- Provenance
- Versioning
- Auditability
- Security
- Scientific rigor

## Current Repository Baseline

The original repository contained the NVIDIA BioNeMo Protein Binder Design Blueprint assets:

- Notebook-based protein binder workflow.
- Docker Compose deployment for NVIDIA NIM services.
- Helm charts for AlphaFold2, AlphaFold2-Multimer, RFdiffusion, and ProteinMPNN NIMs.
- Basic documentation and security policy.

The repository did not initially contain a production application backend, frontend, database schema, experiment tracking system, knowledge graph, API gateway, or persistent audit layer.

## Work Completed So Far

### 1. Workspace Operating Instructions

Created:

- `AGENTS.md`

Purpose:

- Captures the full production architecture, scientific requirements, security requirements, reproducibility requirements, model stack, database stack, observability requirements, delivery format, and review checklist.

Status:

- Complete.

### 2. Platform Scaffold

Created:

- `platform/README.md`
- `platform/docs/architecture.md`
- `platform/docker-compose.open-source.yaml`
- `platform/backend/`

Purpose:

- Introduces OpenBioDesign as an open-source platform layer around the original NVIDIA blueprint.
- Keeps the existing NVIDIA assets intact.
- Adds an extensible backend foundation for open-source and vendor-neutral model adapters.

Status:

- Initial scaffold complete.

### 3. FastAPI Backend

Created:

- `platform/backend/openbiodesign/main.py`
- `platform/backend/openbiodesign/api/v1/router.py`
- `platform/backend/openbiodesign/api/dependencies.py`
- `platform/backend/pyproject.toml`

Implemented:

- Versioned FastAPI API.
- Health endpoint.
- Binder design workflow endpoint.
- Experiment provenance retrieval endpoint.
- Dependency-injected orchestrator.

Current API:

- `GET /api/v1/health`
- `POST /api/v1/workflows/binder-design`
- `GET /api/v1/experiments/{experiment_id}`

Status:

- Functional baseline complete.

### 4. Domain Models

Created:

- `platform/backend/openbiodesign/domain/models.py`
- `platform/backend/openbiodesign/domain/hashing.py`

Implemented typed models for:

- Protein targets.
- Binding sites.
- Candidate sequences.
- Confidence metrics.
- Uncertainty analysis.
- Evidence items.
- Model provenance.
- Experimental recommendations.
- Scientific reports.
- Experiment records.
- Binder design requests/results.

Implemented validation:

- Amino acid sequence validation.
- Stable input hashing for reproducibility.
- Required random seed tracking.

Status:

- Production-oriented baseline complete.

### 5. Scientific Agent Contracts

Created:

- `platform/backend/openbiodesign/agents/contracts.py`
- `platform/backend/openbiodesign/agents/baseline.py`

Implemented contracts for:

- Protein Analysis Agent.
- Binder Generation Agent.
- Literature Agent.
- Experimental Design Agent.
- Report Agent.

Implemented deterministic baseline agents:

- Heuristic protein analysis.
- Deterministic binder candidate generation.
- Placeholder literature evidence package.
- Experimental validation recommendations.
- Publication-style report generation.

Important limitation:

- These are not real drug discovery models.
- They exist to validate workflow structure, reproducibility, explainability, and auditability before GPU model adapters are integrated.

Status:

- Contracts complete.
- Baseline agents complete for development/testing.
- Real model adapters pending.

### 6. AI Scientist Orchestrator

Created:

- `platform/backend/openbiodesign/orchestrator.py`

Implemented:

- Binder design workflow orchestration.
- Experiment creation.
- Input hashing.
- Environment metadata capture.
- Agent execution sequence.
- Candidate evidence enrichment.
- Candidate ranking rationale.
- Experimental recommendations.
- Scientific report assembly.
- Knowledge graph relationship creation.

Status:

- Initial orchestrator complete.
- Needs async job execution for long-running model workloads.

### 7. Authentication and RBAC Baseline

Created:

- `platform/backend/openbiodesign/security.py`

Implemented:

- Bearer-token authentication for development.
- Role model: `viewer`, `scientist`, `admin`.
- Role ordering and FastAPI dependencies.
- Scientist-only workflow execution.
- Viewer-level experiment retrieval.

Important limitation:

- Current API keys are development-only.
- No OAuth2/OIDC.
- No project-scoped authorization.
- No hashed API-key persistence.

Status:

- Local development security baseline complete.
- Production security layer pending.

### 8. Persistent Experiment and Audit Layer

Created:

- `platform/backend/openbiodesign/infrastructure/database.py`
- `platform/backend/openbiodesign/infrastructure/sql_models.py`
- `platform/backend/openbiodesign/infrastructure/sql_repositories.py`

Implemented:

- SQLAlchemy engine/session setup.
- Automatic schema initialization for development.
- SQL-backed experiment repository.
- SQL-backed minimal knowledge graph relationship store.
- SQLite default database for local development.
- PostgreSQL-compatible SQLAlchemy URL configuration.

Implemented tables:

- `experiment_records`
- `knowledge_graph_relationships`

Experiment records store:

- Experiment ID.
- Project ID.
- Workflow name.
- Status.
- Input hash.
- Full input payload.
- Environment metadata.
- Random seed.
- Created/completed timestamps.
- Outputs.
- Audit events.

Status:

- Critical persistence baseline complete.
- Initial Alembic migration complete.

### 11. Phase 1 Security, Ownership, and Audit Foundation

Created:

- `platform/backend/openbiodesign/domain/identity.py`
- `platform/backend/openbiodesign/infrastructure/identity.py`

Implemented:

- User identity model.
- Project model.
- Project membership model.
- Hashed API key authentication.
- API key prefix lookup.
- Constant-time API key hash comparison.
- Project-scoped role checks.
- Persistent audit log records.
- Development bootstrap identities for admin, scientist, and viewer.
- Workflow execution audit events.
- Experiment read audit events.

Security behavior:

- Workflow execution requires global `scientist` role and project `scientist` membership.
- Experiment retrieval requires global `viewer` role and project `viewer` membership.
- Admin users are allowed across projects.
- Raw API keys are not stored in the database.

Status:

- Phase 1 core complete.
- Remaining production hardening: OAuth2/OIDC, API key rotation/expiration, rate limiting, secrets manager integration.

### 12. Phase 2 Formal Database Migrations

Created:

- `platform/backend/alembic.ini`
- `platform/backend/migrations/env.py`
- `platform/backend/migrations/versions/0001_initial_platform_schema.py`
- `platform/backend/migrations/README.md`

Implemented:

- Alembic migration configuration.
- Initial migration for experiments, SQL relationship store, users, projects, memberships, API keys, and audit logs.
- Migration validation against a fresh SQLite database.

Status:

- Phase 2 initial migration complete.
- Remaining production hardening: PostgreSQL migration validation in CI and migration autogeneration workflow policy.

### 13. Phase 3 Durable Artifact and Report Storage

Created:

- `platform/backend/openbiodesign/domain/artifacts.py`
- `platform/backend/openbiodesign/infrastructure/artifacts.py`
- `platform/backend/migrations/versions/0002_artifacts.py`

Implemented:

- Artifact domain model.
- Artifact kind taxonomy.
- SQL artifact metadata table.
- Local content-addressed artifact storage.
- SHA-256 hashing for artifact integrity.
- Scientific report JSON artifact creation during binder workflows.
- Experiment output links to `report_artifact_id` and `report_artifact_sha256`.
- Artifact metadata retrieval endpoint.
- Project-scoped artifact read authorization.
- Artifact read audit logging.

Current API:

- `GET /api/v1/artifacts/{artifact_id}`

Status:

- Phase 3 complete for local/SQl-backed artifact metadata and local object storage.
- Remaining production hardening: MinIO/S3 adapter, artifact download policies, signed URLs, retention policy, malware scanning for uploaded artifacts.

### 14. Phase 4 Neo4j Knowledge Graph Adapter

Created:

- `platform/backend/openbiodesign/infrastructure/neo4j_graph.py`

Implemented:

- Neo4j knowledge graph adapter.
- Constraint initialization for project, experiment, and protein nodes.
- Cypher-based project-experiment-target relationship creation.
- Relationship retrieval for diagnostics.
- Configurable backend selection between SQL fallback and Neo4j.

Configuration:

- `OPENBIODESIGN_KNOWLEDGE_GRAPH_BACKEND=sql`
- `OPENBIODESIGN_KNOWLEDGE_GRAPH_BACKEND=neo4j`
- `OPENBIODESIGN_NEO4J_URI=bolt://neo4j:7687`
- `OPENBIODESIGN_NEO4J_USER=neo4j`
- `OPENBIODESIGN_NEO4J_PASSWORD=<secret>`

Status:

- Phase 4 adapter complete.
- Remaining production hardening: richer graph schema, publication/drug/disease/mutation/pathway nodes, Neo4j integration test profile, graph backfill jobs.

### 15. Phase 5 Scientific Data Source Integrations

Created:

- `platform/backend/openbiodesign/infrastructure/scientific_sources.py`

Implemented:

- UniProt client.
- RCSB/PDB client.
- AlphaFold DB client.
- Europe PMC client.
- UniProt evidence normalizer.
- RCSB evidence normalizer.
- AlphaFold DB evidence normalizer.
- Europe PMC evidence normalizer.
- Scientific evidence service.
- Bounded retry behavior for transient source failures.
- In-process response caching for repeated local lookups.
- Mock-transport tests for offline validation.

Status:

- Phase 5 CPU-friendly source foundation complete.
- Remaining production hardening: persistent caching, rate limits, source version snapshots, richer PubMed/Europe PMC citation metadata.

### 16. Phase 6 Source-Backed Protein Analysis Foundation

Created:

- `platform/backend/openbiodesign/agents/source_backed.py`

Implemented:

- Source-backed literature agent.
- Source-backed protein analysis agent.
- Evidence-informed binding-site confidence baseline.

Status:

- Phase 6 foundation complete.
- Remaining production hardening: real pocket detection, active site detection, domain annotation, hotspot prediction, structural confidence metrics.

### 17. Phase 7 Model Adapter Layer

Created:

- `platform/backend/openbiodesign/domain/model_adapters.py`

Implemented:

- Model task taxonomy.
- Model backend taxonomy.
- Model adapter request/result contracts.
- Model registry.
- Provenance-aware adapter result structure.

Status:

- Phase 7 foundation complete.
- Remaining production hardening: RFdiffusion, ProteinMPNN, OpenFold/ESMFold, DiffDock, and ESM2 adapters.

### 18. Phase 8 Queue and Worker Foundation

Created:

- `platform/backend/openbiodesign/domain/jobs.py`
- `platform/backend/openbiodesign/infrastructure/jobs.py`
- `platform/backend/migrations/versions/0003_jobs.py`

Implemented:

- Job record model.
- Job status lifecycle.
- SQL job repository.
- Idempotency key support.
- In-memory local queue.
- Job migration.
- Local deterministic workflow job service.
- Binder-design job submission endpoint.
- Job status retrieval endpoint.
- Project-scoped authorization and audit logs for job creation/read.

Status:

- Phase 8 local CPU workflow complete.
- Remaining production hardening: Redis/Celery/RQ/Arq worker runtime, cancellation, retries, scheduling, GPU resource claims.

### 19. Phase 9 Vector Database and Research Memory Foundation

Created:

- `platform/backend/openbiodesign/domain/embeddings.py`
- `platform/backend/openbiodesign/infrastructure/vector_store.py`

Implemented:

- Embedding record model.
- Vector search result model.
- In-memory vector store.
- Qdrant HTTP adapter.
- Project-filtered vector search.

Status:

- Phase 9 foundation complete.
- Remaining production hardening: embedding generation models, ingestion pipelines, Qdrant collection management, hybrid search.

### 20. Phase 11 Benchmarking Foundation

Created:

- `platform/backend/openbiodesign/domain/benchmarking.py`

Implemented:

- Benchmark case model.
- Benchmark result model.
- Weighted candidate benchmark scorer.

Status:

- Phase 11 foundation complete.
- Remaining production hardening: benchmark datasets from PDB/UniProt, leaderboard persistence, regression evaluation jobs.

### 21. Phase 12 Observability Foundation

Created:

- `platform/backend/openbiodesign/observability.py`

Implemented:

- Metric registry.
- Timer utility.
- Prometheus text rendering.
- `/api/v1/metrics` endpoint.
- Binder design request count and duration metrics.

Status:

- Phase 12 foundation complete.
- Remaining production hardening: OpenTelemetry tracing, Prometheus client integration, GPU metrics, Grafana dashboards.

### 22. Phase 13 Deployment Hardening Foundation

Created:

- `platform/backend/Dockerfile`

Implemented:

- Backend container build definition.
- Uvicorn runtime command.
- Migration files included in image context.

Status:

- Phase 13 foundation complete.
- Remaining production hardening: Kubernetes manifests, worker deployment, secrets manager, SBOM, image scanning, readiness checks.

### 9. Tests and Quality Gates

Created:

- `platform/backend/tests/test_domain_models.py`
- `platform/backend/tests/test_orchestrator.py`
- `platform/backend/tests/test_api.py`
- `platform/backend/tests/test_sql_repositories.py`

Validated:

- Domain validation.
- Stable hashing.
- Required random seed.
- Orchestrator output quality.
- Candidate confidence/provenance/uncertainty.
- API authentication.
- Binder design endpoint.
- Experiment provenance retrieval endpoint.
- SQL experiment persistence.
- SQL knowledge graph relationship persistence.

Current validation commands:

```powershell
cd platform/backend
.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe -m mypy openbiodesign tests
```

Latest validation result:

- Tests: `37 passed`
- Coverage: `89.60%`
- Ruff: passed
- Mypy: passed

Known warning:

- FastAPI/Starlette test client emits a deprecation warning related to future `httpx2` support.

Status:

- Quality gate currently passing.

### 10. Development Environment

Created:

- `platform/backend/.venv`
- `platform/backend/.env.example`
- `platform/backend/.gitignore`

Installed:

- FastAPI.
- Uvicorn.
- Pydantic.
- Pydantic Settings.
- SQLAlchemy.
- Pytest.
- Pytest coverage.
- Ruff.
- Mypy.
- HTTPX.

Status:

- Local backend development environment complete.

## Current Platform Capabilities

The platform can currently:

1. Accept a protein target sequence.
2. Validate amino acid input.
3. Require a scientific hypothesis and random seed.
4. Run a deterministic binder-design workflow.
5. Generate candidate binder sequences.
6. Attach confidence metrics.
7. Attach model provenance.
8. Attach uncertainty analysis.
9. Attach evidence records.
10. Rank candidates.
11. Recommend validation experiments.
12. Generate a scientific report.
13. Persist experiment records.
14. Retrieve experiment provenance by ID.
15. Store minimal experiment-target graph relationships.
16. Enforce basic bearer-token RBAC.
17. Submit binder-design workflows as durable local jobs.
18. Retrieve job status and resulting experiment IDs.
19. Normalize UniProt, AlphaFold DB, RCSB/PDB, and Europe PMC evidence.
20. Retry and locally cache scientific source lookups during deterministic runs.

## Current Limitations

### Scientific Limitations

- No real RFdiffusion adapter yet.
- No real ProteinMPNN adapter yet.
- No OpenFold, AlphaFold-Multimer, RoseTTAFold, or ESMFold adapter yet.
- No DiffDock adapter.
- No ESM2 mutation/stability model.
- No real protein pocket detection.
- No real structure prediction.
- No real binding affinity prediction.
- No real molecular docking.
- No real sequence optimization loop.
- No benchmarking against known binders.
- No wet-lab validation integration.

### Data and Knowledge Limitations

- UniProt client foundation exists with bounded retry and local cache behavior.
- PDB/RCSB client foundation exists with bounded retry and local cache behavior.
- AlphaFold DB metadata integration exists.
- No ChEMBL integration.
- No DrugBank integration.
- No DisGeNET or OMIM integration.
- No Reactome or KEGG integration.
- Europe PMC retrieval foundation exists with bounded retry and local cache behavior; richer PubMed metadata is pending.
- No ClinicalTrials.gov integration.
- No Ensembl integration.

### Platform Limitations

- No Next.js frontend yet.
- No project management UI.
- No candidate explorer UI.
- No protein visualization UI.
- No report UI.
- No agent chat interface.
- No collaboration workflows.

### Security Limitations

- Development API keys are stored in config.
- API keys are not hashed.
- No OAuth2/OIDC.
- No JWT validation.
- No project-scoped authorization.
- No user/project membership model.
- No persistent actor-level audit log.
- No rate limiting.
- No CSRF concerns yet because there is no browser-authenticated frontend.

### MLOps and Infrastructure Limitations

- Model adapter registry foundation exists; real adapters are pending.
- No MLflow integration yet.
- Local artifact store integration exists; MinIO/S3 production adapter is pending.
- SQL job repository and in-memory queue foundation exist; production worker runtime is pending.
- Binder-design job endpoints exist for deterministic local CPU execution.
- No GPU scheduler integration.
- No Slurm integration.
- No KubeRay integration.
- No Kubernetes deployment for the new backend.
- No OpenTelemetry instrumentation.
- Prometheus text metrics endpoint exists; production Prometheus client integration is pending.
- No Grafana dashboards.

### Database Limitations

- SQL schema is initialized directly with SQLAlchemy metadata.
- No Alembic migrations yet.
- No production PostgreSQL schema hardening.
- Knowledge graph supports SQL fallback and configurable Neo4j adapter; richer graph schema is pending.
- Vector database is not wired.
- Local object storage is wired; MinIO/S3 is pending.

## Priority Roadmap to Production

### Phase 1: Security, Ownership, and Audit Foundation

Priority:

- Critical.

Tasks:

- Add users table. Complete.
- Add projects table. Complete.
- Add project memberships table. Complete.
- Add API keys table with hashed keys. Complete.
- Add project-scoped authorization. Complete.
- Add persistent audit log table. Complete.
- Add request IDs and actor IDs to workflow records. Partially complete through audit logs.
- Add rate limiting.
- Add OAuth2/OIDC JWT validation path.

Reason:

- Research data and experiment records must be access-controlled before collaboration, frontend work, or shared deployments.

### Phase 2: Formal Database Migrations

Priority:

- Critical.

Tasks:

- Add Alembic. Complete.
- Create initial migration for users/projects/experiments/audit/KG relationship tables. Complete.
- Add migration tests.
- Add PostgreSQL CI/test profile.

Reason:

- Production databases require explicit, versioned schema evolution.

### Phase 3: Durable Artifact and Report Storage

Priority:

- Critical.

Tasks:

- Add artifact model. Complete.
- Add MinIO/S3 adapter.
- Store generated reports as immutable artifacts. Complete with local storage.
- Store PDB/FASTA/model-output artifacts with content hashes. Framework complete; model adapters pending.
- Attach artifacts to experiment records. Complete.

Reason:

- Scientific outputs must be traceable to immutable artifacts, not only JSON payloads.

### Phase 4: Real Knowledge Graph Adapter

Priority:

- High.

Tasks:

- Add Neo4j driver. Complete.
- Define graph schema. Partial: project, experiment, protein.
- Add nodes for proteins, genes, diseases, drugs, publications, mutations, pathways, experiments, candidates. Partial.
- Add relationship constraints and indexes. Partial.
- Replace SQL placeholder relationship store with Neo4j adapter. Complete as configurable backend.

Reason:

- The knowledge graph is the reasoning substrate for the AI scientist.

### Phase 5: Scientific Data Source Integrations

Priority:

- High.

Tasks:

- Add UniProt client.
- Add PDB/RCSB client.
- Add AlphaFold DB client.
- Add PubMed/Europe PMC client.
- Add ChEMBL client.
- Add Reactome client.
- Add ClinicalTrials.gov client.
- Add evidence normalization models.
- Add caching and source provenance.

Reason:

- Scientific predictions need evidence packages, citations, and target context.

### Phase 6: Real Protein Analysis Agent

Priority:

- High.

Tasks:

- Domain identification.
- Functional annotation.
- Pocket detection integration.
- Active site detection.
- Druggability scoring.
- Hotspot residue prediction.
- Confidence and uncertainty reporting.

Reason:

- Binder generation quality depends on target understanding.

### Phase 7: Model Adapter Layer

Priority:

- High.

Tasks:

- Add adapter interface for long-running model jobs.
- Add RFdiffusion adapter.
- Add ProteinMPNN adapter.
- Add OpenFold/ESMFold adapter.
- Add DiffDock adapter.
- Add ESM2 mutation/stability adapter.
- Add model version registry.
- Capture container digests, model hashes, seeds, parameters, hardware, and runtime metadata.

Reason:

- This converts the platform from deterministic scaffold to actual computational biology system.

### Phase 8: Queue and Worker System

Priority:

- High.

Tasks:

- Add Redis/RQ, Celery, Dramatiq, or Arq.
- Convert binder workflows to async jobs.
- Add job status endpoint.
- Add cancellation.
- Add retry policy.
- Add idempotency keys.
- Add GPU resource metadata.

Reason:

- Real protein design and structure prediction are long-running workloads and should not block HTTP requests.

### Phase 9: Vector Database and Research Memory

Priority:

- Medium-high.

Tasks:

- Add Qdrant adapter.
- Store paper embeddings.
- Store protein embeddings.
- Store sequence embeddings.
- Store experiment/candidate embeddings.
- Add retrieval APIs.
- Add long-term project memory.

Reason:

- Research memory and semantic retrieval are required for the AI computational biologist experience.

### Phase 10: Frontend Research Workspace

Priority:

- Medium-high.

Tasks:

- Create Next.js TypeScript frontend.
- Add authentication flow.
- Add project dashboard.
- Add experiment tracker.
- Add candidate explorer.
- Add protein visualization.
- Add literature explorer.
- Add report viewer.
- Add agent chat workspace.

Reason:

- Researchers need a collaborative interface to operate and inspect the platform.

### Phase 11: Benchmarking and Evaluation

Priority:

- Medium-high.

Tasks:

- Build benchmark datasets from PDB and UniProt.
- Add candidate evaluation pipeline.
- Add leaderboard tables.
- Add regression benchmarks.
- Add scientific validation reports.

Reason:

- Generated binders must be evaluated against known binders and reproducible baselines.

### Phase 12: Observability and SRE

Priority:

- Medium.

Tasks:

- Add OpenTelemetry.
- Add Prometheus metrics.
- Add Grafana dashboards.
- Track GPU utilization.
- Track model latency.
- Track queue time.
- Track failure rates.
- Track candidate generation success metrics.

Reason:

- Production model infrastructure must be observable and debuggable.

### Phase 13: Deployment Hardening

Priority:

- Medium.

Tasks:

- Add Dockerfile for backend.
- Add Kubernetes manifests or Helm chart for backend.
- Add worker deployment.
- Add secrets management.
- Add health/readiness checks.
- Add SBOM generation.
- Add image scanning.
- Add backup/restore plan.

Reason:

- The current platform is development-ready, not production-deployment-ready.

## Production Completion Checklist

- [x] Repository-level operating instructions.
- [x] Backend scaffold.
- [x] Domain model baseline.
- [x] Agent contracts.
- [x] Deterministic baseline workflow.
- [x] Experiment provenance model.
- [x] Persistent experiment repository.
- [x] Minimal knowledge graph relationship store.
- [x] API authentication baseline.
- [x] Tests with coverage above 85%.
- [x] User/project ownership model.
- [x] Project-scoped authorization.
- [x] Hashed API keys.
- [ ] OAuth2/OIDC JWT validation.
- [x] Persistent actor audit logs.
- [x] Alembic migrations.
- [ ] PostgreSQL production schema.
- [x] Neo4j adapter.
- [x] Qdrant adapter.
- [x] Local artifact adapter.
- [ ] MinIO/S3 artifact adapter.
- [ ] MLflow or custom experiment tracking integration.
- [x] Europe PMC integration foundation.
- [x] UniProt integration foundation.
- [x] PDB/RCSB integration foundation.
- [x] AlphaFold DB integration.
- [ ] ChEMBL integration.
- [ ] Protein analysis model integration.
- [ ] RFdiffusion adapter.
- [ ] ProteinMPNN adapter.
- [ ] OpenFold/ESMFold adapter.
- [ ] DiffDock adapter.
- [ ] ESM2 mutation/stability adapter.
- [x] Queue and worker foundation.
- [x] Local deterministic binder-design job API.
- [ ] GPU scheduling integration.
- [x] Benchmarking foundation.
- [ ] Benchmarking datasets.
- [ ] Evaluation leaderboard.
- [ ] Next.js frontend.
- [ ] Protein visualization UI.
- [ ] Candidate explorer UI.
- [ ] Literature explorer UI.
- [ ] Report generator UI.
- [ ] Agent chat UI.
- [ ] OpenTelemetry tracing.
- [x] Prometheus metrics foundation.
- [ ] Grafana dashboards.
- [x] Production Dockerfile foundation.
- [ ] Kubernetes/Helm deployment.
- [ ] Security hardening.
- [ ] Full production documentation.

## Recommended Next Implementation

The next most critical implementation is source-backed scientific hardening that remains CPU-friendly:

1. Add persistent source provenance snapshots with experiment records.
2. Feed source-backed agents into a configurable workflow mode.
3. Add persistent HTTP cache or Redis-backed cache for source responses.
4. Add richer PubMed/Europe PMC citation metadata.
5. Add provider-specific rate-limit handling.

This should be completed before real model adapters so generated candidates remain grounded in
traceable external scientific evidence without requiring GPU hardware.
