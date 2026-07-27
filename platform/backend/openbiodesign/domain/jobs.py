from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class JobStatus(StrEnum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class JobRecord(BaseModel):
    job_id: UUID = Field(default_factory=uuid4)
    project_id: str
    experiment_id: UUID | None = None
    job_type: str
    status: JobStatus = JobStatus.queued
    payload: dict[str, object]
    result: dict[str, object] = Field(default_factory=dict)
    error: str | None = None
    idempotency_key: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
