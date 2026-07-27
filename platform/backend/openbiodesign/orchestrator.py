import platform

from openbiodesign.agents.contracts import (
    BinderGenerationAgent,
    ExperimentalDesignAgent,
    LiteratureAgent,
    ProteinAnalysisAgent,
    ReportAgent,
)
from openbiodesign.domain.hashing import stable_hash
from openbiodesign.domain.models import (
    BinderDesignRequest,
    BinderDesignResult,
    ExperimentRecord,
    WorkflowStatus,
)
from openbiodesign.infrastructure.artifacts import ArtifactService
from openbiodesign.infrastructure.repositories import ExperimentRepository, KnowledgeGraph


class BinderDesignOrchestrator:
    def __init__(
        self,
        protein_analysis_agent: ProteinAnalysisAgent,
        binder_generation_agent: BinderGenerationAgent,
        literature_agent: LiteratureAgent,
        experimental_design_agent: ExperimentalDesignAgent,
        report_agent: ReportAgent,
        experiment_repository: ExperimentRepository,
        knowledge_graph: KnowledgeGraph,
        artifact_service: ArtifactService | None = None,
    ) -> None:
        self.protein_analysis_agent = protein_analysis_agent
        self.binder_generation_agent = binder_generation_agent
        self.literature_agent = literature_agent
        self.experimental_design_agent = experimental_design_agent
        self.report_agent = report_agent
        self.experiment_repository = experiment_repository
        self.knowledge_graph = knowledge_graph
        self.artifact_service = artifact_service

    async def run(self, request: BinderDesignRequest) -> BinderDesignResult:
        payload = request.model_dump(mode="json")
        experiment = self.experiment_repository.create(
            ExperimentRecord(
                project_id=request.project_id,
                workflow_name="binder_design",
                status=WorkflowStatus.running,
                input_hash=stable_hash(payload),
                input_payload=payload,
                environment=self._environment_metadata(),
                random_seed=request.random_seed,
                audit_events=["workflow_started"],
            )
        )

        evidence = await self.literature_agent.retrieve_evidence(request.target)
        binding_sites = await self.protein_analysis_agent.analyze(
            request.target,
            request.random_seed,
        )
        candidates = await self.binder_generation_agent.generate(
            request.target,
            binding_sites,
            request.requested_candidates,
            request.random_seed,
        )
        for candidate in candidates:
            candidate.evidence.extend(evidence)

        recommendations = await self.experimental_design_agent.recommend(
            request.target,
            candidates,
        )
        report = await self.report_agent.write_report(
            request.target,
            candidates,
            evidence,
            recommendations,
        )
        report_artifact = None
        if self.artifact_service is not None:
            report_artifact = self.artifact_service.store_report(
                request.project_id,
                experiment.experiment_id,
                report,
            )

        outputs: dict[str, object] = {
            "candidate_count": len(candidates),
            "top_candidate_id": str(candidates[0].candidate_id),
            "binding_site_count": len(binding_sites),
            "evidence_sources": sorted({item.source for item in evidence}),
            "evidence_count": len(evidence),
        }
        if report_artifact is not None:
            outputs["report_artifact_id"] = str(report_artifact.artifact_id)
            outputs["report_artifact_sha256"] = report_artifact.sha256

        completed = self.experiment_repository.complete(
            experiment.experiment_id,
            outputs=outputs,
        )
        self.knowledge_graph.link_experiment_to_target(
            request.project_id,
            completed.experiment_id,
            request.target.name,
        )

        return BinderDesignResult(
            experiment=completed,
            target=request.target,
            binding_sites=binding_sites,
            candidates=candidates,
            ranking_rationale=(
                "Candidates are ranked by ESM2-derived binding score, with confidence metrics, "
                "risk flags, provenance, uncertainty, and evidence retained for audit. "
                "Scores are based on sequence fitness (log-likelihood) and embedding similarity."
            ),
            experimental_recommendations=recommendations,
            report=report,
        )

    @staticmethod
    def _environment_metadata() -> dict[str, str]:
        return {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "implementation": platform.python_implementation(),
        }
