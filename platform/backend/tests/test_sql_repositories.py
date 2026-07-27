from pathlib import Path
from uuid import uuid4

import pytest

from openbiodesign.domain.models import ExperimentRecord, WorkflowStatus
from openbiodesign.infrastructure.database import (
    build_engine,
    build_session_factory,
    initialize_schema,
)
from openbiodesign.infrastructure.sql_repositories import SqlExperimentRepository, SqlKnowledgeGraph


def test_sql_experiment_repository_persists_reproducibility_record(tmp_path: Path) -> None:
    database_path = tmp_path / "experiments.db"
    engine = build_engine(f"sqlite:///{database_path}")
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    repository = SqlExperimentRepository(session_factory)

    record = ExperimentRecord(
        experiment_id=uuid4(),
        project_id="project-sql",
        workflow_name="binder_design",
        status=WorkflowStatus.running,
        input_hash="a" * 64,
        input_payload={"target": {"name": "Test", "sequence": "ACDE"}},
        environment={"python": "test"},
        random_seed=123,
        audit_events=["workflow_started"],
    )

    repository.create(record)
    completed = repository.complete(record.experiment_id, {"candidate_count": 2})
    loaded = repository.get(record.experiment_id)

    assert completed.status == WorkflowStatus.completed
    assert completed.completed_at is not None
    assert loaded.input_hash == record.input_hash
    assert loaded.random_seed == 123
    assert loaded.outputs == {"candidate_count": 2}
    assert loaded.audit_events == ["workflow_started", "workflow_completed"]
    engine.dispose()


def test_sql_experiment_repository_raises_for_missing_record(tmp_path: Path) -> None:
    database_path = tmp_path / "missing.db"
    engine = build_engine(f"sqlite:///{database_path}")
    initialize_schema(engine)
    repository = SqlExperimentRepository(build_session_factory(engine))

    with pytest.raises(KeyError):
        repository.get(uuid4())
    engine.dispose()


def test_sql_knowledge_graph_records_experiment_target_relationships(tmp_path: Path) -> None:
    database_path = tmp_path / "kg.db"
    engine = build_engine(f"sqlite:///{database_path}")
    initialize_schema(engine)
    graph = SqlKnowledgeGraph(build_session_factory(engine))
    experiment_id = uuid4()

    graph.link_experiment_to_target("project-kg", experiment_id, "Insulin")

    assert graph.relationships() == [
        ("project-kg", "HAS_EXPERIMENT", str(experiment_id)),
        (str(experiment_id), "STUDIES_TARGET", "Insulin"),
    ]
    engine.dispose()
