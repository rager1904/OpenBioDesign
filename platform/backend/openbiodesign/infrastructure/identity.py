import hashlib
import hmac
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from openbiodesign.domain.identity import (
    ROLE_ORDER,
    AuditLogRecord,
    Principal,
    Role,
)
from openbiodesign.infrastructure.database import session_scope
from openbiodesign.infrastructure.repositories import IdentityRepository
from openbiodesign.infrastructure.sql_models import (
    ApiKeyRow,
    AuditLogRow,
    ProjectMembershipRow,
    ProjectRow,
    UserRow,
)

KEY_PREFIX_LENGTH = 12


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def key_prefix(raw_key: str) -> str:
    return raw_key[:KEY_PREFIX_LENGTH]


class SqlIdentityRepository(IdentityRepository):
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self.session_factory = session_factory

    def authenticate_api_key(self, raw_key: str) -> Principal | None:
        prefix = key_prefix(raw_key)
        candidate_hash = hash_api_key(raw_key)
        with session_scope(self.session_factory) as session:
            rows = session.scalars(
                select(ApiKeyRow).where(
                    ApiKeyRow.key_prefix == prefix,
                    ApiKeyRow.is_active.is_(True),
                )
            ).all()
            for row in rows:
                if hmac.compare_digest(row.key_hash, candidate_hash):
                    user = session.get(UserRow, row.user_id)
                    if user is None or not user.is_active:
                        return None
                    return Principal(
                        subject=user.email,
                        role=Role(user.global_role),
                        user_id=UUID(user.user_id),
                        api_key_id=UUID(row.api_key_id),
                    )
        return None

    def has_project_role(self, user_id: UUID, project_id: str, required_role: Role) -> bool:
        with session_scope(self.session_factory) as session:
            user = session.get(UserRow, str(user_id))
            if user is None or not user.is_active:
                return False
            if ROLE_ORDER[Role(user.global_role)] >= ROLE_ORDER[Role.admin]:
                return True
            membership = session.scalar(
                select(ProjectMembershipRow).where(
                    ProjectMembershipRow.user_id == str(user_id),
                    ProjectMembershipRow.project_id == project_id,
                )
            )
            if membership is None:
                return False
            return ROLE_ORDER[Role(membership.role)] >= ROLE_ORDER[required_role]

    def record_audit_event(self, record: AuditLogRecord) -> AuditLogRecord:
        with session_scope(self.session_factory) as session:
            session.add(
                AuditLogRow(
                    audit_id=str(record.audit_id),
                    actor_user_id=str(record.actor_user_id) if record.actor_user_id else None,
                    api_key_id=str(record.api_key_id) if record.api_key_id else None,
                    project_id=record.project_id,
                    action=record.action,
                    resource_type=record.resource_type,
                    resource_id=record.resource_id,
                    outcome=record.outcome,
                    details=record.details,
                    created_at=record.created_at,
                )
            )
        return record

    def bootstrap_development_data(self, api_keys: dict[str, str]) -> None:
        admin_user_id = UUID("00000000-0000-0000-0000-000000000001")
        scientist_user_id = UUID("00000000-0000-0000-0000-000000000002")
        viewer_user_id = UUID("00000000-0000-0000-0000-000000000003")
        project_ids = ["demo-project", "audit-project", "project-a"]

        with session_scope(self.session_factory) as session:
            self._ensure_user(
                session,
                admin_user_id,
                "admin@openbiodesign.local",
                "Development Admin",
                Role.admin,
            )
            self._ensure_user(
                session,
                scientist_user_id,
                "scientist@openbiodesign.local",
                "Development Scientist",
                Role.scientist,
            )
            self._ensure_user(
                session,
                viewer_user_id,
                "viewer@openbiodesign.local",
                "Development Viewer",
                Role.viewer,
            )
            for project_id in project_ids:
                self._ensure_project(
                    session,
                    project_id,
                    project_id.replace("-", " ").title(),
                    admin_user_id,
                )
                self._ensure_membership(session, project_id, admin_user_id, Role.admin)
                self._ensure_membership(session, project_id, scientist_user_id, Role.scientist)
                self._ensure_membership(session, project_id, viewer_user_id, Role.viewer)

            for raw_key, role_name in api_keys.items():
                user_id = {
                    Role.admin: admin_user_id,
                    Role.scientist: scientist_user_id,
                    Role.viewer: viewer_user_id,
                }[Role(role_name)]
                self._ensure_api_key(session, raw_key, user_id, f"Development {role_name} key")

    @staticmethod
    def _ensure_user(
        session: Session,
        user_id: UUID,
        email: str,
        display_name: str,
        role: Role,
    ) -> None:
        if session.get(UserRow, str(user_id)) is not None:
            return
        session.add(
            UserRow(
                user_id=str(user_id),
                email=email,
                display_name=display_name,
                global_role=role.value,
                is_active=True,
                created_at=datetime.now(UTC),
            )
        )

    @staticmethod
    def _ensure_project(
        session: Session,
        project_id: str,
        name: str,
        created_by: UUID,
    ) -> None:
        if session.get(ProjectRow, project_id) is not None:
            return
        session.add(
            ProjectRow(
                project_id=project_id,
                name=name,
                created_by=str(created_by),
                created_at=datetime.now(UTC),
            )
        )

    @staticmethod
    def _ensure_membership(session: Session, project_id: str, user_id: UUID, role: Role) -> None:
        membership = session.scalar(
            select(ProjectMembershipRow).where(
                ProjectMembershipRow.project_id == project_id,
                ProjectMembershipRow.user_id == str(user_id),
            )
        )
        if membership is not None:
            return
        session.add(
            ProjectMembershipRow(
                membership_id=str(uuid4()),
                project_id=project_id,
                user_id=str(user_id),
                role=role.value,
                created_at=datetime.now(UTC),
            )
        )

    @staticmethod
    def _ensure_api_key(session: Session, raw_key: str, user_id: UUID, name: str) -> None:
        prefix = key_prefix(raw_key)
        existing = session.scalar(
            select(ApiKeyRow).where(
                ApiKeyRow.key_prefix == prefix,
                ApiKeyRow.key_hash == hash_api_key(raw_key),
            )
        )
        if existing is not None:
            return
        session.add(
            ApiKeyRow(
                api_key_id=str(uuid4()),
                user_id=str(user_id),
                key_prefix=prefix,
                key_hash=hash_api_key(raw_key),
                name=name,
                is_active=True,
                created_at=datetime.now(UTC),
            )
        )
