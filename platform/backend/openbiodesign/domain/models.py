from datetime import UTC, datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator

AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")


class WorkflowStatus(StrEnum):
    planned = "planned"
    running = "running"
    completed = "completed"
    failed = "failed"


class EvidenceType(StrEnum):
    database = "database"
    literature = "literature"
    model = "model"
    experiment = "experiment"


class ModelProvenance(BaseModel):
    model_name: str
    model_version: str
    adapter_name: str
    code_version: str = "local-dev"
    container_digest: str | None = None
    data_versions: dict[str, str] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    random_seed: int
    executed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ConfidenceMetric(BaseModel):
    name: str
    value: float = Field(ge=0.0, le=1.0)
    rationale: str


class UncertaintyAnalysis(BaseModel):
    summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    failure_modes: list[str]
    known_unknowns: list[str]


class EvidenceItem(BaseModel):
    evidence_type: EvidenceType
    source: str
    identifier: str
    title: str
    url: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str


class ProteinTarget(BaseModel):
    accession: str | None = None
    name: str
    sequence: str = Field(min_length=20, max_length=10000)
    organism: str | None = None

    @field_validator("sequence")
    @classmethod
    def validate_sequence(cls, value: str) -> str:
        normalized = value.strip().upper()
        invalid = sorted(set(normalized) - AMINO_ACIDS)
        if invalid:
            raise ValueError(f"Sequence contains invalid amino acid codes: {invalid}")
        return normalized


class BindingSite(BaseModel):
    residues: list[int]
    description: str
    confidence: float = Field(ge=0.0, le=1.0)
    method: str


class CandidateSequence(BaseModel):
    candidate_id: UUID = Field(default_factory=uuid4)
    sequence: str = Field(min_length=8, max_length=500)
    scaffold_id: str
    interface_residues: list[int]
    manufacturability_score: float = Field(ge=0.0, le=1.0)
    stability_score: float = Field(ge=0.0, le=1.0)
    binding_score: float = Field(ge=0.0, le=1.0)
    novelty_score: float = Field(ge=0.0, le=1.0)
    risk_flags: list[str]
    confidence_metrics: list[ConfidenceMetric]
    uncertainty: UncertaintyAnalysis
    evidence: list[EvidenceItem]
    provenance: list[ModelProvenance]

    @field_validator("sequence")
    @classmethod
    def validate_sequence(cls, value: str) -> str:
        normalized = value.strip().upper()
        invalid = sorted(set(normalized) - AMINO_ACIDS)
        if invalid:
            raise ValueError(f"Candidate contains invalid amino acid codes: {invalid}")
        return normalized


class ExperimentalRecommendation(BaseModel):
    assay: str
    purpose: str
    controls: list[str]
    acceptance_criteria: list[str]
    priority: int = Field(ge=1, le=5)


class ScientificReport(BaseModel):
    abstract: str
    methods: str
    results: str
    discussion: str
    limitations: str
    references: list[EvidenceItem]


class BinderDesignRequest(BaseModel):
    project_id: str = Field(min_length=3, max_length=120)
    target: ProteinTarget
    hypothesis: str = Field(min_length=20, max_length=2000)
    requested_candidates: int = Field(default=5, ge=1, le=50)
    random_seed: int = Field(ge=0)


class ExperimentRecord(BaseModel):
    experiment_id: UUID = Field(default_factory=uuid4)
    project_id: str
    workflow_name: str
    status: WorkflowStatus
    input_hash: str
    input_payload: dict[str, Any]
    environment: dict[str, str]
    random_seed: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    outputs: dict[str, Any] = Field(default_factory=dict)
    audit_events: list[str] = Field(default_factory=list)


class BinderDesignResult(BaseModel):
    experiment: ExperimentRecord
    target: ProteinTarget
    binding_sites: list[BindingSite]
    candidates: list[CandidateSequence]
    ranking_rationale: str
    experimental_recommendations: list[ExperimentalRecommendation]
    report: ScientificReport
