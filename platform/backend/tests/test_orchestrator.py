import asyncio

from openbiodesign.agents.baseline import (
    DeterministicBinderGenerationAgent,
    DeterministicExperimentalDesignAgent,
    DeterministicLiteratureAgent,
    DeterministicProteinAnalysisAgent,
    DeterministicReportAgent,
)
from openbiodesign.domain.models import (
    BinderDesignRequest,
    BinderDesignResult,
    ProteinTarget,
    WorkflowStatus,
)
from openbiodesign.infrastructure.repositories import (
    InMemoryExperimentRepository,
    InMemoryKnowledgeGraph,
)
from openbiodesign.orchestrator import BinderDesignOrchestrator


def test_workflow_returns_auditable_explainable_candidates() -> None:
    result, relationships = asyncio.run(_run_workflow())

    assert result.experiment.status == WorkflowStatus.completed
    assert len(result.candidates) == 3
    assert result.candidates[0].binding_score >= result.candidates[-1].binding_score
    assert result.candidates[0].confidence_metrics
    assert result.candidates[0].provenance[0].random_seed == 42
    assert result.candidates[0].uncertainty.failure_modes
    assert result.report.references
    assert relationships


async def _run_workflow() -> tuple[BinderDesignResult, list[tuple[str, str, str]]]:
    kg = InMemoryKnowledgeGraph()
    orchestrator = BinderDesignOrchestrator(
        protein_analysis_agent=DeterministicProteinAnalysisAgent(),
        binder_generation_agent=DeterministicBinderGenerationAgent(),
        literature_agent=DeterministicLiteratureAgent(),
        experimental_design_agent=DeterministicExperimentalDesignAgent(),
        report_agent=DeterministicReportAgent(),
        experiment_repository=InMemoryExperimentRepository(),
        knowledge_graph=kg,
    )
    result = await orchestrator.run(
        BinderDesignRequest(
            project_id="project-a",
            target=ProteinTarget(
                accession="P01308",
                name="Insulin",
                sequence="MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            ),
            hypothesis="Generate explainable binder hypotheses for reproducibility testing.",
            requested_candidates=3,
            random_seed=42,
        )
    )
    return result, kg.relationships()
