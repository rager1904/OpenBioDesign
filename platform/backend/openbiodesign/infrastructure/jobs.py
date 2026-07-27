from abc import ABC, abstractmethod
from datetime import UTC, datetime
from queue import Queue
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from openbiodesign.domain.jobs import JobRecord, JobStatus
from openbiodesign.domain.models import BinderDesignRequest
from openbiodesign.infrastructure.database import session_scope
from openbiodesign.infrastructure.sql_models import JobRow
from openbiodesign.orchestrator import BinderDesignOrchestrator


class JobRepository(ABC):
    @abstractmethod
    def create(self, job: JobRecord) -> JobRecord:
        raise NotImplementedError

    @abstractmethod
    def get(self, job_id: UUID) -> JobRecord:
        raise NotImplementedError

    @abstractmethod
    def update_status(
        self,
        job_id: UUID,
        status: JobStatus,
        result: dict[str, object] | None = None,
        error: str | None = None,
        experiment_id: UUID | None = None,
    ) -> JobRecord:
        raise NotImplementedError


class InMemoryJobRepository(JobRepository):
    def __init__(self) -> None:
        self._jobs: dict[UUID, JobRecord] = {}

    def create(self, job: JobRecord) -> JobRecord:
        if job.idempotency_key:
            for existing in self._jobs.values():
                if (
                    existing.project_id == job.project_id
                    and existing.idempotency_key == job.idempotency_key
                ):
                    return existing
        self._jobs[job.job_id] = job
        return job

    def get(self, job_id: UUID) -> JobRecord:
        try:
            return self._jobs[job_id]
        except KeyError as exc:
            raise KeyError(f"Job not found: {job_id}") from exc

    def update_status(
        self,
        job_id: UUID,
        status: JobStatus,
        result: dict[str, object] | None = None,
        error: str | None = None,
        experiment_id: UUID | None = None,
    ) -> JobRecord:
        job = self.get(job_id)
        updated = job.model_copy(
            update={
                "status": status,
                "result": result or job.result,
                "error": error,
                "experiment_id": experiment_id or job.experiment_id,
                "updated_at": datetime.now(UTC),
            }
        )
        self._jobs[job_id] = updated
        return updated


class SqlJobRepository(JobRepository):
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self.session_factory = session_factory

    def create(self, job: JobRecord) -> JobRecord:
        with session_scope(self.session_factory) as session:
            if job.idempotency_key:
                existing = session.scalar(
                    select(JobRow).where(
                        JobRow.project_id == job.project_id,
                        JobRow.idempotency_key == job.idempotency_key,
                    )
                )
                if existing is not None:
                    return self._to_domain(existing)
            session.add(self._to_row(job))
        return job

    def get(self, job_id: UUID) -> JobRecord:
        with session_scope(self.session_factory) as session:
            row = session.get(JobRow, str(job_id))
            if row is None:
                raise KeyError(f"Job not found: {job_id}")
            return self._to_domain(row)

    def update_status(
        self,
        job_id: UUID,
        status: JobStatus,
        result: dict[str, object] | None = None,
        error: str | None = None,
        experiment_id: UUID | None = None,
    ) -> JobRecord:
        with session_scope(self.session_factory) as session:
            row = session.get(JobRow, str(job_id))
            if row is None:
                raise KeyError(f"Job not found: {job_id}")
            row.status = status.value
            row.result = result or row.result
            row.error = error
            row.experiment_id = str(experiment_id) if experiment_id else row.experiment_id
            row.updated_at = datetime.now(UTC)
            return self._to_domain(row)

    @staticmethod
    def _to_row(job: JobRecord) -> JobRow:
        return JobRow(
            job_id=str(job.job_id),
            project_id=job.project_id,
            experiment_id=str(job.experiment_id) if job.experiment_id else None,
            job_type=job.job_type,
            status=job.status.value,
            payload=job.payload,
            result=job.result,
            error=job.error,
            idempotency_key=job.idempotency_key,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )

    @staticmethod
    def _to_domain(row: JobRow) -> JobRecord:
        return JobRecord(
            job_id=UUID(row.job_id),
            project_id=row.project_id,
            experiment_id=UUID(row.experiment_id) if row.experiment_id else None,
            job_type=row.job_type,
            status=JobStatus(row.status),
            payload=row.payload,
            result=row.result,
            error=row.error,
            idempotency_key=row.idempotency_key,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )


class InMemoryJobQueue:
    def __init__(self) -> None:
        self._queue: Queue[UUID] = Queue()

    def enqueue(self, job_id: UUID) -> None:
        self._queue.put(job_id)

    def dequeue(self) -> UUID | None:
        if self._queue.empty():
            return None
        return self._queue.get()


class LocalWorkflowJobService:
    def __init__(
        self,
        repository: JobRepository,
        queue: InMemoryJobQueue,
        orchestrator: BinderDesignOrchestrator,
    ) -> None:
        self.repository = repository
        self.queue = queue
        self.orchestrator = orchestrator

    def submit_binder_design(
        self,
        request: BinderDesignRequest,
        idempotency_key: str | None = None,
    ) -> JobRecord:
        job = JobRecord(
            project_id=request.project_id,
            job_type="binder_design",
            payload=request.model_dump(mode="json"),
            idempotency_key=idempotency_key,
        )
        created = self.repository.create(job)
        if created.job_id == job.job_id and created.status == JobStatus.queued:
            self.queue.enqueue(created.job_id)
        return created

    async def run_next(self) -> JobRecord | None:
        job_id = self.queue.dequeue()
        if job_id is None:
            return None
        return await self.run(job_id)

    async def run(self, job_id: UUID) -> JobRecord:
        job = self.repository.get(job_id)
        if job.status != JobStatus.queued:
            return job

        self.repository.update_status(job_id, JobStatus.running)
        try:
            request = BinderDesignRequest.model_validate(job.payload)
            result = await self.orchestrator.run(request)
        except Exception as exc:
            return self.repository.update_status(
                job_id,
                JobStatus.failed,
                error=str(exc),
            )

        return self.repository.update_status(
            job_id,
            JobStatus.completed,
            result={
                "experiment_id": str(result.experiment.experiment_id),
                "candidate_count": len(result.candidates),
                "top_candidate_id": str(result.candidates[0].candidate_id),
            },
            experiment_id=result.experiment.experiment_id,
        )
