from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Protocol
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from openbiodesign.domain.models import ModelProvenance


class ModelTask(StrEnum):
    binder_backbone_generation = "binder_backbone_generation"
    sequence_design = "sequence_design"
    structure_prediction = "structure_prediction"
    complex_prediction = "complex_prediction"
    docking = "docking"
    mutation_effect = "mutation_effect"


class ModelBackend(StrEnum):
    rfdiffusion = "rfdiffusion"
    proteinmpnn = "proteinmpnn"
    openfold = "openfold"
    esmfold = "esmfold"
    diffdock = "diffdock"
    esm2 = "esm2"


class ModelAdapterRequest(BaseModel):
    request_id: UUID = Field(default_factory=uuid4)
    project_id: str
    experiment_id: UUID
    task: ModelTask
    backend: ModelBackend
    inputs: dict[str, Any]
    parameters: dict[str, Any]
    random_seed: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ModelAdapterResult(BaseModel):
    request_id: UUID
    task: ModelTask
    backend: ModelBackend
    outputs: dict[str, Any]
    confidence_metrics: dict[str, float]
    artifact_ids: list[UUID]
    provenance: ModelProvenance
    completed_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ModelAdapter(Protocol):
    backend: ModelBackend
    supported_tasks: set[ModelTask]

    async def run(self, request: ModelAdapterRequest) -> ModelAdapterResult:
        raise NotImplementedError


class ModelRegistry:
    def __init__(self) -> None:
        self._adapters: dict[ModelBackend, ModelAdapter] = {}

    def register(self, adapter: ModelAdapter) -> None:
        self._adapters[adapter.backend] = adapter

    def get(self, backend: ModelBackend) -> ModelAdapter:
        try:
            return self._adapters[backend]
        except KeyError as exc:
            raise KeyError(f"No adapter registered for backend: {backend}") from exc

    def supported_backends(self) -> list[ModelBackend]:
        return sorted(self._adapters.keys(), key=lambda item: item.value)
