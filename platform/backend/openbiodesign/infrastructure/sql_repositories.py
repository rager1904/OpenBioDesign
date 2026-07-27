from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.orm import Session, sessionmaker

from openbiodesign.domain.models import ExperimentRecord, WorkflowStatus
from openbiodesign.infrastructure.database import session_scope
from openbiodesign.infrastructure.repositories import ExperimentRepository, KnowledgeGraph
from openbiodesign.infrastructure.sql_models import (
    ArtifactRow,
    AuditLogRow,
    ExperimentRecordRow,
    KnowledgeGraphRelationshipRow,
    ProjectRow,
)


class SqlExperimentRepository(ExperimentRepository):
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self.session_factory = session_factory

    def create(self, record: ExperimentRecord) -> ExperimentRecord:
        with session_scope(self.session_factory) as session:
            session.add(self._to_row(record))
        return record

    def complete(self, experiment_id: UUID, outputs: dict[str, object]) -> ExperimentRecord:
        with session_scope(self.session_factory) as session:
            row = self._get_row(session, experiment_id)
            record = self._to_domain(row)
            updated = record.model_copy(
                update={
                    "status": WorkflowStatus.completed,
                    "completed_at": datetime.now(UTC),
                    "outputs": outputs,
                    "audit_events": [*record.audit_events, "workflow_completed"],
                }
            )
            self._update_row(row, updated)
            return updated

    def get(self, experiment_id: UUID) -> ExperimentRecord:
        with session_scope(self.session_factory) as session:
            return self._to_domain(self._get_row(session, experiment_id))

    @staticmethod
    def _get_row(session: Session, experiment_id: UUID) -> ExperimentRecordRow:
        row = session.get(ExperimentRecordRow, str(experiment_id))
        if row is None:
            raise KeyError(f"Experiment not found: {experiment_id}")
        return row

    @staticmethod
    def _to_row(record: ExperimentRecord) -> ExperimentRecordRow:
        return ExperimentRecordRow(
            experiment_id=str(record.experiment_id),
            project_id=record.project_id,
            workflow_name=record.workflow_name,
            status=record.status.value,
            input_hash=record.input_hash,
            input_payload=record.input_payload,
            environment=record.environment,
            random_seed=record.random_seed,
            created_at=record.created_at,
            completed_at=record.completed_at,
            outputs=record.outputs,
            audit_events=record.audit_events,
        )

    @staticmethod
    def _update_row(row: ExperimentRecordRow, record: ExperimentRecord) -> None:
        row.status = record.status.value
        row.completed_at = record.completed_at
        row.outputs = record.outputs
        row.audit_events = record.audit_events

    @staticmethod
    def _to_domain(row: ExperimentRecordRow) -> ExperimentRecord:
        return ExperimentRecord(
            experiment_id=UUID(row.experiment_id),
            project_id=row.project_id,
            workflow_name=row.workflow_name,
            status=WorkflowStatus(row.status),
            input_hash=row.input_hash,
            input_payload=row.input_payload,
            environment=row.environment,
            random_seed=row.random_seed,
            created_at=row.created_at,
            completed_at=row.completed_at,
            outputs=row.outputs,
            audit_events=row.audit_events,
        )

    def list_projects_with_counts(self) -> list[dict[str, object]]:
        from sqlalchemy import func

        with session_scope(self.session_factory) as session:
            rows = (
                session.query(
                    ProjectRow.project_id,
                    ProjectRow.name,
                    ProjectRow.created_by,
                    ProjectRow.created_at,
                    func.coalesce(
                        func.count(ExperimentRecordRow.experiment_id), 0
                    ).label("experiment_count"),
                )
                .outerjoin(
                    ExperimentRecordRow,
                    ProjectRow.project_id == ExperimentRecordRow.project_id,
                )
                .group_by(ProjectRow.project_id)
                .order_by(ProjectRow.created_at.desc())
                .all()
            )
            return [
                {
                    "project_id": row.project_id,
                    "name": row.name,
                    "created_by": row.created_by,
                    "created_at": row.created_at.isoformat(),
                    "experiment_count": row.experiment_count,
                }
                for row in rows
            ]

    def list_all_experiments(
        self, project_id: str | None = None
    ) -> list[ExperimentRecord]:
        with session_scope(self.session_factory) as session:
            query = session.query(ExperimentRecordRow)
            if project_id:
                query = query.filter(ExperimentRecordRow.project_id == project_id)
            rows = query.order_by(ExperimentRecordRow.created_at.desc()).all()
            return [self._to_domain(row) for row in rows]

    def count_experiments(self) -> int:
        from sqlalchemy import func

        with session_scope(self.session_factory) as session:
            return session.query(
                func.count(ExperimentRecordRow.experiment_id)
            ).scalar() or 0

    def count_artifacts(self) -> int:
        from sqlalchemy import func

        with session_scope(self.session_factory) as session:
            return session.query(func.count(ArtifactRow.artifact_id)).scalar() or 0

    def count_audit_events(self) -> int:
        from sqlalchemy import func

        with session_scope(self.session_factory) as session:
            return session.query(func.count(AuditLogRow.audit_id)).scalar() or 0

    def count_projects(self) -> int:
        from sqlalchemy import func

        with session_scope(self.session_factory) as session:
            return session.query(func.count(ProjectRow.project_id)).scalar() or 0

    def sum_candidate_count(self) -> int:
        with session_scope(self.session_factory) as session:
            rows = session.query(ExperimentRecordRow.outputs).all()
            total = 0
            for row in rows:
                val = row.outputs.get("candidate_count", 0)
                if isinstance(val, int):
                    total += val
            return total


class SqlKnowledgeGraph(KnowledgeGraph):
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self.session_factory = session_factory

    def link_experiment_to_target(
        self,
        project_id: str,
        experiment_id: UUID,
        target_name: str,
    ) -> None:
        rows = [
            KnowledgeGraphRelationshipRow(
                subject=project_id,
                predicate="HAS_EXPERIMENT",
                object=str(experiment_id),
            ),
            KnowledgeGraphRelationshipRow(
                subject=str(experiment_id),
                predicate="STUDIES_TARGET",
                object=target_name,
            ),
        ]
        with session_scope(self.session_factory) as session:
            session.add_all(rows)

    def relationships(self) -> list[tuple[str, str, str]]:
        with session_scope(self.session_factory) as session:
            rows = session.query(KnowledgeGraphRelationshipRow).all()
            return [(row.subject, row.predicate, row.object) for row in rows]
