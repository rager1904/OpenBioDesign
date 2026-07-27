from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class BenchmarkCase(BaseModel):
    case_id: UUID = Field(default_factory=uuid4)
    name: str
    target_accession: str
    target_sequence: str
    known_binder_sequence: str | None = None
    source: str
    metadata: dict[str, object] = Field(default_factory=dict)


class BenchmarkResult(BaseModel):
    result_id: UUID = Field(default_factory=uuid4)
    case_id: UUID
    experiment_id: UUID
    metrics: dict[str, float]
    rank: int | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CandidateBenchmarkScorer:
    def score(
        self,
        binding_score: float,
        stability_score: float,
        manufacturability_score: float,
        novelty_score: float,
    ) -> dict[str, float]:
        aggregate = (
            binding_score * 0.4
            + stability_score * 0.25
            + manufacturability_score * 0.2
            + novelty_score * 0.15
        )
        return {
            "binding_score": binding_score,
            "stability_score": stability_score,
            "manufacturability_score": manufacturability_score,
            "novelty_score": novelty_score,
            "aggregate_score": round(aggregate, 4),
        }
