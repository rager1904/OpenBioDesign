import hashlib
import json
from abc import ABC, abstractmethod
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session, sessionmaker

from openbiodesign.domain.artifacts import ArtifactKind, ArtifactRecord
from openbiodesign.domain.models import ScientificReport
from openbiodesign.infrastructure.database import session_scope
from openbiodesign.infrastructure.sql_models import ArtifactRow


class ArtifactRepository(ABC):
    @abstractmethod
    def create(self, artifact: ArtifactRecord) -> ArtifactRecord:
        raise NotImplementedError

    @abstractmethod
    def get(self, artifact_id: UUID) -> ArtifactRecord:
        raise NotImplementedError


class ArtifactStorage(ABC):
    @abstractmethod
    def put_bytes(self, project_id: str, filename: str, content: bytes) -> tuple[str, str, int]:
        raise NotImplementedError


class LocalArtifactStorage(ArtifactStorage):
    def __init__(self, root: Path) -> None:
        self.root = root

    def put_bytes(self, project_id: str, filename: str, content: bytes) -> tuple[str, str, int]:
        digest = hashlib.sha256(content).hexdigest()
        safe_filename = Path(filename).name
        artifact_dir = self.root / project_id / digest[:2] / digest[2:4]
        artifact_dir.mkdir(parents=True, exist_ok=True)
        artifact_path = artifact_dir / f"{digest}-{safe_filename}"
        artifact_path.write_bytes(content)
        return artifact_path.as_posix(), digest, len(content)


class SqlArtifactRepository(ArtifactRepository):
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self.session_factory = session_factory

    def create(self, artifact: ArtifactRecord) -> ArtifactRecord:
        with session_scope(self.session_factory) as session:
            session.add(self._to_row(artifact))
        return artifact

    def get(self, artifact_id: UUID) -> ArtifactRecord:
        with session_scope(self.session_factory) as session:
            row = session.get(ArtifactRow, str(artifact_id))
            if row is None:
                raise KeyError(f"Artifact not found: {artifact_id}")
            return self._to_domain(row)

    @staticmethod
    def _to_row(artifact: ArtifactRecord) -> ArtifactRow:
        return ArtifactRow(
            artifact_id=str(artifact.artifact_id),
            project_id=artifact.project_id,
            experiment_id=str(artifact.experiment_id),
            kind=artifact.kind.value,
            filename=artifact.filename,
            content_type=artifact.content_type,
            size_bytes=artifact.size_bytes,
            sha256=artifact.sha256,
            storage_backend=artifact.storage_backend,
            storage_uri=artifact.storage_uri,
            artifact_metadata=artifact.metadata,
            created_at=artifact.created_at,
        )

    @staticmethod
    def _to_domain(row: ArtifactRow) -> ArtifactRecord:
        return ArtifactRecord(
            artifact_id=UUID(row.artifact_id),
            project_id=row.project_id,
            experiment_id=UUID(row.experiment_id),
            kind=ArtifactKind(row.kind),
            filename=row.filename,
            content_type=row.content_type,
            size_bytes=row.size_bytes,
            sha256=row.sha256,
            storage_backend=row.storage_backend,
            storage_uri=row.storage_uri,
            metadata=row.artifact_metadata,
            created_at=row.created_at,
        )


class ArtifactService:
    def __init__(self, repository: ArtifactRepository, storage: ArtifactStorage) -> None:
        self.repository = repository
        self.storage = storage

    def store_report(
        self,
        project_id: str,
        experiment_id: UUID,
        report: ScientificReport,
    ) -> ArtifactRecord:
        content = json.dumps(
            report.model_dump(mode="json"),
            indent=2,
            sort_keys=True,
        ).encode("utf-8")
        filename = f"{experiment_id}-scientific-report.json"
        storage_uri, digest, size_bytes = self.storage.put_bytes(project_id, filename, content)
        return self.repository.create(
            ArtifactRecord(
                project_id=project_id,
                experiment_id=experiment_id,
                kind=ArtifactKind.report,
                filename=filename,
                content_type="application/json",
                size_bytes=size_bytes,
                sha256=digest,
                storage_backend="local",
                storage_uri=storage_uri,
                metadata={"schema": "ScientificReport", "format": "json"},
            )
        )
