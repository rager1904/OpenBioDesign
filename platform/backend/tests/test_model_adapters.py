import asyncio
from uuid import uuid4

import pytest

from openbiodesign.domain.model_adapters import (
    ModelAdapterRequest,
    ModelAdapterResult,
    ModelBackend,
    ModelRegistry,
    ModelTask,
)
from openbiodesign.domain.models import ModelProvenance


class FakeAdapter:
    backend = ModelBackend.rfdiffusion
    supported_tasks = {ModelTask.binder_backbone_generation}

    async def run(self, request: ModelAdapterRequest) -> ModelAdapterResult:
        return ModelAdapterResult(
            request_id=request.request_id,
            task=request.task,
            backend=request.backend,
            outputs={"backbone_count": 1},
            confidence_metrics={"designability": 0.5},
            artifact_ids=[],
            provenance=ModelProvenance(
                model_name="fake-rfdiffusion",
                model_version="test",
                adapter_name="FakeAdapter",
                random_seed=request.random_seed,
            ),
        )


def test_model_registry_registers_and_runs_adapter() -> None:
    registry = ModelRegistry()
    registry.register(FakeAdapter())
    request = ModelAdapterRequest(
        project_id="demo-project",
        experiment_id=uuid4(),
        task=ModelTask.binder_backbone_generation,
        backend=ModelBackend.rfdiffusion,
        inputs={"target": "ACDE"},
        parameters={"num_designs": 1},
        random_seed=42,
    )

    result = asyncio.run(registry.get(ModelBackend.rfdiffusion).run(request))

    assert result.outputs == {"backbone_count": 1}
    assert result.provenance.random_seed == 42


def test_model_registry_raises_for_missing_adapter() -> None:
    with pytest.raises(KeyError):
        ModelRegistry().get(ModelBackend.diffdock)
