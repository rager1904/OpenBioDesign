from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ArtifactKind(StrEnum):
    report = "report"
    fasta = "fasta"
    pdb = "pdb"
    model_output = "model_output"
    evidence_package = "evidence_package"
    manifest = "manifest"


class ArtifactRecord(BaseModel):
    artifact_id: UUID = Field(default_factory=uuid4)
    project_id: str
    experiment_id: UUID
    kind: ArtifactKind
    filename: str
    content_type: str
    size_bytes: int = Field(ge=0)
    sha256: str = Field(min_length=64, max_length=64)
    storage_backend: str
    storage_uri: str
    metadata: dict[str, object] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
