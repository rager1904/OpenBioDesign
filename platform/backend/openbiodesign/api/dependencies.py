from functools import lru_cache
from pathlib import Path

from openbiodesign.agents.baseline import (
    DeterministicBinderGenerationAgent,
    DeterministicExperimentalDesignAgent,
    DeterministicReportAgent,
)
from openbiodesign.agents.source_backed import (
    SourceBackedLiteratureAgent,
    SourceBackedProteinAnalysisAgent,
)
from openbiodesign.core.config import get_settings
from openbiodesign.infrastructure.artifacts import (
    ArtifactService,
    LocalArtifactStorage,
    SqlArtifactRepository,
)
from openbiodesign.infrastructure.database import (
    build_engine,
    build_session_factory,
    initialize_schema,
)
from openbiodesign.infrastructure.identity import SqlIdentityRepository
from openbiodesign.infrastructure.jobs import (
    InMemoryJobQueue,
    InMemoryJobRepository,
    JobRepository,
    LocalWorkflowJobService,
    SqlJobRepository,
)
from openbiodesign.infrastructure.repositories import (
    ExperimentRepository,
    IdentityRepository,
    InMemoryExperimentRepository,
    InMemoryIdentityRepository,
    InMemoryKnowledgeGraph,
    KnowledgeGraph,
)
from openbiodesign.infrastructure.scientific_sources import (
    AlphaFoldDbClient,
    EuropePmcClient,
    RcsbPdbClient,
    ScientificEvidenceService,
    UniProtClient,
)
from openbiodesign.infrastructure.sql_repositories import SqlExperimentRepository, SqlKnowledgeGraph
from openbiodesign.orchestrator import BinderDesignOrchestrator


@lru_cache
def get_repository_pair() -> tuple[ExperimentRepository, KnowledgeGraph]:
    settings = get_settings()
    if not settings.use_persistent_repositories:
        return InMemoryExperimentRepository(), InMemoryKnowledgeGraph()

    engine = build_engine(settings.database_url)
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    knowledge_graph: KnowledgeGraph
    if settings.knowledge_graph_backend == "sql":
        knowledge_graph = SqlKnowledgeGraph(session_factory)
    elif settings.knowledge_graph_backend == "neo4j":
        if not settings.neo4j_uri or not settings.neo4j_user or not settings.neo4j_password:
            raise ValueError("Neo4j backend requires uri, user, and password settings.")
        from openbiodesign.infrastructure.neo4j_graph import Neo4jKnowledgeGraph
        knowledge_graph = Neo4jKnowledgeGraph(
            settings.neo4j_uri,
            settings.neo4j_user,
            settings.neo4j_password,
        )
        knowledge_graph.initialize_schema()
    else:
        raise ValueError(f"Unsupported knowledge graph backend: {settings.knowledge_graph_backend}")

    return SqlExperimentRepository(session_factory), knowledge_graph


@lru_cache
def get_artifact_service() -> ArtifactService | None:
    settings = get_settings()
    if not settings.use_persistent_repositories:
        return None
    if settings.artifact_backend != "local":
        raise ValueError(f"Unsupported artifact backend: {settings.artifact_backend}")

    engine = build_engine(settings.database_url)
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    return ArtifactService(
        repository=SqlArtifactRepository(session_factory),
        storage=LocalArtifactStorage(Path(settings.artifact_root)),
    )


@lru_cache
def get_identity_repository() -> IdentityRepository:
    settings = get_settings()
    if not settings.use_persistent_repositories:
        return InMemoryIdentityRepository()

    engine = build_engine(settings.database_url)
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    repository = SqlIdentityRepository(session_factory)
    repository.bootstrap_development_data(settings.api_keys)
    return repository


@lru_cache
def get_job_repository() -> JobRepository:
    settings = get_settings()
    if not settings.use_persistent_repositories:
        return InMemoryJobRepository()

    engine = build_engine(settings.database_url)
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    return SqlJobRepository(session_factory)


@lru_cache
def get_job_queue() -> InMemoryJobQueue:
    return InMemoryJobQueue()


@lru_cache
def get_evidence_service() -> ScientificEvidenceService:
    return ScientificEvidenceService(
        uniprot_client=UniProtClient(),
        rcsb_client=RcsbPdbClient(),
        europe_pmc_client=EuropePmcClient(),
        alphafold_client=AlphaFoldDbClient(),
    )


@lru_cache
def get_orchestrator() -> BinderDesignOrchestrator:
    settings = get_settings()
    experiment_repository, knowledge_graph = get_repository_pair()
    artifact_service = get_artifact_service()
    evidence_service = get_evidence_service()

    if settings.use_ml_agents:
        try:
            from openbiodesign.agents.esm2_binder_agent import ESM2BinderGenerationAgent
            from openbiodesign.agents.esm2_protein_agent import ESM2ProteinAnalysisAgent
            protein_analysis_agent = ESM2ProteinAnalysisAgent()
            binder_generation_agent = ESM2BinderGenerationAgent()
        except Exception:
            protein_analysis_agent = SourceBackedProteinAnalysisAgent(evidence_service)
            binder_generation_agent = DeterministicBinderGenerationAgent()
    else:
        protein_analysis_agent = SourceBackedProteinAnalysisAgent(evidence_service)
        binder_generation_agent = DeterministicBinderGenerationAgent()

    return BinderDesignOrchestrator(
        protein_analysis_agent=protein_analysis_agent,
        binder_generation_agent=binder_generation_agent,
        literature_agent=SourceBackedLiteratureAgent(evidence_service),
        experimental_design_agent=DeterministicExperimentalDesignAgent(),
        report_agent=DeterministicReportAgent(),
        experiment_repository=experiment_repository,
        knowledge_graph=knowledge_graph,
        artifact_service=artifact_service,
    )


@lru_cache
def get_workflow_job_service() -> LocalWorkflowJobService:
    return LocalWorkflowJobService(
        repository=get_job_repository(),
        queue=get_job_queue(),
        orchestrator=get_orchestrator(),
    )
