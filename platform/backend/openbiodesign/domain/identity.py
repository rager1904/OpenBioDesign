from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Role(StrEnum):
    admin = "admin"
    scientist = "scientist"
    viewer = "viewer"


ROLE_ORDER: dict[Role, int] = {
    Role.viewer: 1,
    Role.scientist: 2,
    Role.admin: 3,
}


@dataclass(frozen=True)
class Principal:
    subject: str
    role: Role
    user_id: UUID
    api_key_id: UUID


class UserRecord(BaseModel):
    user_id: UUID = Field(default_factory=uuid4)
    email: str
    display_name: str
    global_role: Role
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProjectRecord(BaseModel):
    project_id: str = Field(min_length=3, max_length=120)
    name: str
    created_by: UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ProjectMembershipRecord(BaseModel):
    membership_id: UUID = Field(default_factory=uuid4)
    project_id: str
    user_id: UUID
    role: Role
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class AuditLogRecord(BaseModel):
    audit_id: UUID = Field(default_factory=uuid4)
    actor_user_id: UUID | None
    api_key_id: UUID | None
    project_id: str | None = None
    action: str
    resource_type: str
    resource_id: str | None = None
    outcome: str
    details: dict[str, object] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
