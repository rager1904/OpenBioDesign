from openbiodesign.agents.contracts import LiteratureAgent, ProteinAnalysisAgent
from openbiodesign.domain.models import BindingSite, EvidenceItem, ProteinTarget
from openbiodesign.infrastructure.scientific_sources import ScientificEvidenceService


class SourceBackedLiteratureAgent(LiteratureAgent):
    def __init__(self, evidence_service: ScientificEvidenceService) -> None:
        self.evidence_service = evidence_service

    async def retrieve_evidence(self, target: ProteinTarget) -> list[EvidenceItem]:
        return await self.evidence_service.target_evidence(target)


class SourceBackedProteinAnalysisAgent(ProteinAnalysisAgent):
    def __init__(self, evidence_service: ScientificEvidenceService) -> None:
        self.evidence_service = evidence_service

    async def analyze(self, target: ProteinTarget, random_seed: int) -> list[BindingSite]:
        evidence = await self.evidence_service.target_evidence(target)
        database_confidence = max(
            [
                item.confidence
                for item in evidence
                if item.source in {"UniProt", "RCSB PDB", "AlphaFold DB"}
            ],
            default=0.5,
        )
        window_start = max(1, min(len(target.sequence) - 8, len(target.sequence) // 3))
        return [
            BindingSite(
                residues=list(range(window_start, window_start + 8)),
                description=(
                    "Evidence-informed baseline interface window. Production deployments should "
                    "replace this with structural pocket and hotspot detection."
                ),
                confidence=min(database_confidence, 0.85),
                method="source-backed-baseline",
            )
        ]
