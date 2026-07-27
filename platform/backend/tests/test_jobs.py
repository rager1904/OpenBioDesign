from pathlib import Path

from openbiodesign.domain.jobs import JobRecord, JobStatus
from openbiodesign.infrastructure.database import (
    build_engine,
    build_session_factory,
    initialize_schema,
)
from openbiodesign.infrastructure.jobs import InMemoryJobQueue, SqlJobRepository


def test_sql_job_repository_tracks_status_and_idempotency(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'jobs.db'}")
    initialize_schema(engine)
    repository = SqlJobRepository(build_session_factory(engine))
    job = JobRecord(
        project_id="demo-project",
        job_type="binder_design",
        payload={"target": "P01308"},
        idempotency_key="same-request",
    )

    created = repository.create(job)
    duplicate = repository.create(
        JobRecord(
            project_id="demo-project",
            job_type="binder_design",
            payload={"target": "P01308"},
            idempotency_key="same-request",
        )
    )
    completed = repository.update_status(
        created.job_id,
        JobStatus.completed,
        result={"experiment_id": "experiment-1"},
    )

    assert duplicate.job_id == created.job_id
    assert completed.status == JobStatus.completed
    assert completed.result == {"experiment_id": "experiment-1"}

    engine.dispose()


def test_in_memory_job_queue_enqueues_and_dequeues() -> None:
    queue = InMemoryJobQueue()
    job = JobRecord(project_id="demo-project", job_type="binder_design", payload={})

    queue.enqueue(job.job_id)

    assert queue.dequeue() == job.job_id
    assert queue.dequeue() is None
