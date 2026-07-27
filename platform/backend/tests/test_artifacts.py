from pathlib import Path
from uuid import uuid4

from openbiodesign.domain.models import EvidenceItem, EvidenceType, ScientificReport
from openbiodesign.infrastructure.artifacts import (
    ArtifactService,
    LocalArtifactStorage,
    SqlArtifactRepository,
)
from openbiodesign.infrastructure.database import (
    build_engine,
    build_session_factory,
    initialize_schema,
)


def test_artifact_service_stores_report_with_content_hash(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'artifacts.db'}")
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    service = ArtifactService(
        repository=SqlArtifactRepository(session_factory),
        storage=LocalArtifactStorage(tmp_path / "objects"),
    )
    experiment_id = uuid4()
    report = ScientificReport(
        abstract="Abstract",
        methods="Methods",
        results="Results",
        discussion="Discussion",
        limitations="Limitations",
        references=[
            EvidenceItem(
                evidence_type=EvidenceType.database,
                source="test",
                identifier="evidence-1",
                title="Evidence",
                confidence=0.5,
                summary="Evidence summary",
            )
        ],
    )

    artifact = service.store_report("demo-project", experiment_id, report)
    loaded = service.repository.get(artifact.artifact_id)

    assert loaded.sha256 == artifact.sha256
    assert loaded.size_bytes > 0
    assert loaded.storage_backend == "local"
    assert Path(loaded.storage_uri).exists()
    assert loaded.metadata == {"schema": "ScientificReport", "format": "json"}

    engine.dispose()
