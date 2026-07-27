from abc import ABC, abstractmethod
from datetime import UTC, datetime
from threading import Lock
from uuid import UUID, uuid4

from openbiodesign.domain.identity import ROLE_ORDER, AuditLogRecord, Principal, Role
from openbiodesign.domain.models import ExperimentRecord, WorkflowStatus


class ExperimentRepository(ABC):
    @abstractmethod
    def create(self, record: ExperimentRecord) -> ExperimentRecord:
        raise NotImplementedError

    @abstractmethod
    def complete(self, experiment_id: UUID, outputs: dict[str, object]) -> ExperimentRecord:
        raise NotImplementedError

    @abstractmethod
    def get(self, experiment_id: UUID) -> ExperimentRecord:
        raise NotImplementedError


class InMemoryExperimentRepository(ExperimentRepository):
    def __init__(self) -> None:
        self._records: dict[UUID, ExperimentRecord] = {}
        self._lock = Lock()

    def create(self, record: ExperimentRecord) -> ExperimentRecord:
        with self._lock:
            self._records[record.experiment_id] = record
            return record

    def complete(self, experiment_id: UUID, outputs: dict[str, object]) -> ExperimentRecord:
        with self._lock:
            record = self._records[experiment_id]
            updated = record.model_copy(
                update={
                    "status": WorkflowStatus.completed,
                    "completed_at": datetime.now(UTC),
                    "outputs": outputs,
                    "audit_events": [*record.audit_events, "workflow_completed"],
                }
            )
            self._records[experiment_id] = updated
            return updated

    def get(self, experiment_id: UUID) -> ExperimentRecord:
        return self._records[experiment_id]


class KnowledgeGraph(ABC):
    @abstractmethod
    def link_experiment_to_target(
        self,
        project_id: str,
        experiment_id: UUID,
        target_name: str,
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    def relationships(self) -> list[tuple[str, str, str]]:
        raise NotImplementedError


class InMemoryKnowledgeGraph(KnowledgeGraph):
    def __init__(self) -> None:
        self._relationships: list[tuple[str, str, str]] = []
        self._lock = Lock()

    def link_experiment_to_target(
        self,
        project_id: str,
        experiment_id: UUID,
        target_name: str,
    ) -> None:
        with self._lock:
            self._relationships.extend(
                [
                    (project_id, "HAS_EXPERIMENT", str(experiment_id)),
                    (str(experiment_id), "STUDIES_TARGET", target_name),
                ]
            )

    def relationships(self) -> list[tuple[str, str, str]]:
        return list(self._relationships)


class IdentityRepository(ABC):
    @abstractmethod
    def authenticate_api_key(self, raw_key: str) -> Principal | None:
        raise NotImplementedError

    @abstractmethod
    def has_project_role(self, user_id: UUID, project_id: str, required_role: Role) -> bool:
        raise NotImplementedError

    @abstractmethod
    def record_audit_event(self, record: AuditLogRecord) -> AuditLogRecord:
        raise NotImplementedError


class InMemoryIdentityRepository(IdentityRepository):
    def __init__(self) -> None:
        self.admin_user_id = UUID("00000000-0000-0000-0000-000000000001")
        self.scientist_user_id = UUID("00000000-0000-0000-0000-000000000002")
        self.viewer_user_id = UUID("00000000-0000-0000-0000-000000000003")
        self._api_keys: dict[str, Principal] = {
            "dev-admin-key": Principal(
                subject="admin@openbiodesign.local",
                role=Role.admin,
                user_id=self.admin_user_id,
                api_key_id=uuid4(),
            ),
            "dev-scientist-key": Principal(
                subject="scientist@openbiodesign.local",
                role=Role.scientist,
                user_id=self.scientist_user_id,
                api_key_id=uuid4(),
            ),
            "dev-viewer-key": Principal(
                subject="viewer@openbiodesign.local",
                role=Role.viewer,
                user_id=self.viewer_user_id,
                api_key_id=uuid4(),
            ),
        }
        self._memberships: dict[tuple[UUID, str], Role] = {}
        self._audit_events: list[AuditLogRecord] = []
        for project_id in ["demo-project", "audit-project", "project-a"]:
            self._memberships[(self.admin_user_id, project_id)] = Role.admin
            self._memberships[(self.scientist_user_id, project_id)] = Role.scientist
            self._memberships[(self.viewer_user_id, project_id)] = Role.viewer

    def authenticate_api_key(self, raw_key: str) -> Principal | None:
        return self._api_keys.get(raw_key)

    def has_project_role(self, user_id: UUID, project_id: str, required_role: Role) -> bool:
        if user_id == self.admin_user_id:
            return True
        role = self._memberships.get((user_id, project_id))
        if role is None:
            return False
        return ROLE_ORDER[role] >= ROLE_ORDER[required_role]

    def record_audit_event(self, record: AuditLogRecord) -> AuditLogRecord:
        self._audit_events.append(record)
        return record
