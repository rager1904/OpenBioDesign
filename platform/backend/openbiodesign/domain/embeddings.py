from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EmbeddingKind(StrEnum):
    protein = "protein"
    sequence = "sequence"
    paper = "paper"
    experiment = "experiment"
    candidate = "candidate"


class EmbeddingRecord(BaseModel):
    embedding_id: UUID = Field(default_factory=uuid4)
    project_id: str
    kind: EmbeddingKind
    source_id: str
    vector: list[float]
    metadata: dict[str, object] = Field(default_factory=dict)
    model_name: str
    model_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class VectorSearchResult(BaseModel):
    embedding_id: UUID
    score: float
    source_id: str
    metadata: dict[str, object] = Field(default_factory=dict)
