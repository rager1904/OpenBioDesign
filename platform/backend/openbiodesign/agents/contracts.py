from abc import ABC, abstractmethod

from openbiodesign.domain.models import (
    BindingSite,
    CandidateSequence,
    EvidenceItem,
    ExperimentalRecommendation,
    ProteinTarget,
    ScientificReport,
)


class ProteinAnalysisAgent(ABC):
    @abstractmethod
    async def analyze(self, target: ProteinTarget, random_seed: int) -> list[BindingSite]:
        raise NotImplementedError


class BinderGenerationAgent(ABC):
    @abstractmethod
    async def generate(
        self,
        target: ProteinTarget,
        binding_sites: list[BindingSite],
        requested_candidates: int,
        random_seed: int,
    ) -> list[CandidateSequence]:
        raise NotImplementedError


class LiteratureAgent(ABC):
    @abstractmethod
    async def retrieve_evidence(self, target: ProteinTarget) -> list[EvidenceItem]:
        raise NotImplementedError


class ExperimentalDesignAgent(ABC):
    @abstractmethod
    async def recommend(
        self,
        target: ProteinTarget,
        candidates: list[CandidateSequence],
    ) -> list[ExperimentalRecommendation]:
        raise NotImplementedError


class ReportAgent(ABC):
    @abstractmethod
    async def write_report(
        self,
        target: ProteinTarget,
        candidates: list[CandidateSequence],
        evidence: list[EvidenceItem],
        recommendations: list[ExperimentalRecommendation],
    ) -> ScientificReport:
        raise NotImplementedError
