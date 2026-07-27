# OpenBioDesign Architecture

## Architecture Impact

The platform introduces a clean architecture boundary around the original protein binder blueprint:

- `api`: FastAPI HTTP boundary, validation, versioning, and authentication dependencies.
- `domain`: scientific data models, reproducibility metadata, evidence, uncertainty, and candidate contracts.
- `agents`: model-agnostic scientific agent interfaces plus deterministic local baselines.
- `orchestrator`: workflow planning, task ordering, audit events, experiment records, and knowledge graph linkage.
- `infrastructure`: repositories and future database adapters.

This avoids coupling the product to one vendor deployment model. NVIDIA NIM, open-source models, local GPU jobs, Slurm, KubeRay, or Kubernetes services can be implemented as adapters.

## Database Impact

Initial persistence is abstracted behind repositories. The current implementation includes a
SQLAlchemy-backed experiment repository and SQL-backed relationship store for local SQLite and
PostgreSQL-compatible URLs.

Implemented tables:

- `experiment_records`: durable workflow status, input hash, input payload, environment metadata,
  random seed, outputs, and audit event list.
- `knowledge_graph_relationships`: minimal relationship substrate used until the Neo4j adapter is
  enabled.
- `users`: active user identities and global roles.
- `projects`: research project ownership boundary.
- `project_memberships`: project-scoped RBAC.
- `api_keys`: hashed API keys with non-secret prefixes for lookup.
- `audit_logs`: actor, API key, project, action, resource, outcome, and structured details.
- `artifacts`: immutable artifact metadata including experiment linkage, kind, content type,
  size, SHA-256 digest, backend, URI, and structured metadata.

Schema changes are versioned through Alembic under `platform/backend/migrations`.

Production should implement or harden:

- PostgreSQL for projects, experiments, candidates, users, reports, and audit logs.
- Neo4j for protein, disease, pathway, drug, mutation, publication, and experiment relationships.
- Qdrant for protein, sequence, paper, and experiment embeddings.
- MinIO for immutable artifacts including PDB files, FASTA inputs, reports, and model logs.
- Redis for queues, rate limits, and short-lived orchestration state.

## API Impact

Current API:

- `GET /api/v1/health`
- `GET /api/v1/metrics`
- `POST /api/v1/workflows/binder-design`
- `POST /api/v1/workflows/binder-design/jobs`
- `GET /api/v1/jobs/{job_id}`
- `GET /api/v1/experiments/{experiment_id}`
- `GET /api/v1/artifacts/{artifact_id}`

Every binder workflow request requires:

- Target sequence.
- Scientific hypothesis.
- Requested candidate count.
- Random seed.
- Bearer credential with at least `scientist` role.

## Scientific Impact

The baseline agents are not drug discovery models. They exist to validate traceability, explainability, ranking, and reproducibility plumbing before GPU model adapters are connected.

Production model adapters must return:

- Model version and code version.
- Parameters and seeds.
- Confidence metrics.
- Evidence.
- Uncertainty and failure modes.
- Artifact references and hashes.

## Security Impact

Implemented:

- Bearer-key authentication for local development.
- RBAC dependency for workflow execution.
- Hashed API key persistence.
- Project-scoped authorization checks.
- Persistent actor-level audit logs for workflow execution and experiment reads.
- Artifact metadata read authorization.
- Strict Pydantic request validation.
- No shell execution from API inputs.

Required before production:

- OAuth2/OIDC JWT validation.
- API key rotation and expiration.
- Rate limiting.
- Secrets manager integration.
- SBOM and image scanning.

## Performance Impact

The current baseline is CPU-only and deterministic. Production model adapters should use asynchronous job submission with queues, GPU scheduling, cancellation, idempotency keys, and artifact streaming rather than blocking HTTP requests for long-running inference.

## Testing Strategy

The test suite covers:

- Amino acid sequence validation.
- Stable input hashing for reproducibility.
- Workflow completion and knowledge graph linkage.
- Candidate provenance, uncertainty, evidence, and confidence metrics.
- API authentication behavior.

Maintain at least 85% coverage.

## Deployment Strategy

Use `platform/docker-compose.open-source.yaml` for local infrastructure experiments. For production:

- Package backend as a container.
- Deploy API and worker services separately.
- Run model workloads through Kubernetes, KubeRay, or Slurm.
- Use managed or hardened PostgreSQL, Redis, Neo4j, Qdrant, and S3-compatible storage.
- Export OpenTelemetry traces and Prometheus metrics.

## Artifact Storage

The current artifact implementation stores report JSON as immutable content-addressed files through
`LocalArtifactStorage` and records metadata in SQL. Artifact records include SHA-256 hashes so
scientific reports and later model outputs can be verified against tampering or accidental mutation.

Configuration:

- `OPENBIODESIGN_ARTIFACT_BACKEND=local`
- `OPENBIODESIGN_ARTIFACT_ROOT=./artifacts`

Production should replace or supplement local storage with a MinIO/S3 adapter and lifecycle policies.

## Knowledge Graph

The platform supports two knowledge graph backends:

- `sql`: local fallback using `knowledge_graph_relationships`.
- `neo4j`: production graph adapter using the official Neo4j driver.

Neo4j configuration:

- `OPENBIODESIGN_KNOWLEDGE_GRAPH_BACKEND=neo4j`
- `OPENBIODESIGN_NEO4J_URI=bolt://neo4j:7687`
- `OPENBIODESIGN_NEO4J_USER=neo4j`
- `OPENBIODESIGN_NEO4J_PASSWORD=<secret>`

The Neo4j adapter initializes constraints for project, experiment, and protein nodes and writes
project-experiment-target relationships during binder workflows.

## Scientific Evidence

Scientific source clients currently support UniProt, RCSB/PDB, AlphaFold DB, and Europe PMC. They
normalize external records into `EvidenceItem` objects so agents can consume evidence consistently.
The HTTP client layer includes bounded retries for transient failures and in-process response
caching for repeated lookups during a local run.

Production deployments should add persistent caching, source version snapshots, richer PubMed
citation metadata, and provider-specific rate-limit handling before relying on these clients for
high-volume workflows.

## Jobs And Model Adapters

The backend has typed model adapter contracts and a SQL-backed job record foundation. This supports
future conversion of long-running model execution from blocking HTTP calls into queued worker jobs.

Current binder-design jobs can be submitted through `POST /api/v1/workflows/binder-design/jobs`.
The local CPU-friendly worker uses the deterministic baseline agents and records job status,
idempotency keys, experiment IDs, errors, and result summaries. No real protein design models are
plugged in yet.

Current queue implementation is local/in-memory for development. Production should use Redis-backed
workers, cancellation controls, retry policies, and GPU-aware schedulers.

## Vector Memory

The platform includes embedding record models, an in-memory vector store, and a Qdrant HTTP adapter.
Vector search is project-filtered to preserve research workspace boundaries.

## Documentation Updates

Update this document when adding:

- New API routes.
- New agents or model adapters.
- Persistence schema changes.
- Workflow semantics.
- Security controls.
- Scientific validation criteria.
