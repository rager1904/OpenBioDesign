from pathlib import Path

from openbiodesign.domain.identity import AuditLogRecord, Role
from openbiodesign.infrastructure.database import (
    build_engine,
    build_session_factory,
    initialize_schema,
)
from openbiodesign.infrastructure.identity import SqlIdentityRepository, hash_api_key
from openbiodesign.infrastructure.sql_models import ApiKeyRow, AuditLogRow


def test_sql_identity_repository_authenticates_hashed_api_key(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'identity.db'}")
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    repository = SqlIdentityRepository(session_factory)

    repository.bootstrap_development_data({"dev-scientist-key": "scientist"})

    principal = repository.authenticate_api_key("dev-scientist-key")
    assert principal is not None
    assert principal.role == Role.scientist
    assert principal.subject == "scientist@openbiodesign.local"

    with session_factory() as session:
        api_key_row = session.query(ApiKeyRow).one()
        assert api_key_row.key_hash == hash_api_key("dev-scientist-key")
        assert api_key_row.key_hash != "dev-scientist-key"

    engine.dispose()


def test_sql_identity_repository_enforces_project_membership(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'membership.db'}")
    initialize_schema(engine)
    repository = SqlIdentityRepository(build_session_factory(engine))
    repository.bootstrap_development_data({"dev-scientist-key": "scientist"})
    principal = repository.authenticate_api_key("dev-scientist-key")
    assert principal is not None

    assert repository.has_project_role(principal.user_id, "demo-project", Role.scientist)
    assert not repository.has_project_role(principal.user_id, "unknown-project", Role.viewer)

    engine.dispose()


def test_sql_identity_repository_persists_audit_events(tmp_path: Path) -> None:
    engine = build_engine(f"sqlite:///{tmp_path / 'audit.db'}")
    initialize_schema(engine)
    session_factory = build_session_factory(engine)
    repository = SqlIdentityRepository(session_factory)
    repository.bootstrap_development_data({"dev-viewer-key": "viewer"})
    principal = repository.authenticate_api_key("dev-viewer-key")
    assert principal is not None

    repository.record_audit_event(
        AuditLogRecord(
            actor_user_id=principal.user_id,
            api_key_id=principal.api_key_id,
            project_id="demo-project",
            action="experiment.read",
            resource_type="experiment",
            resource_id="experiment-1",
            outcome="success",
            details={"input_hash": "abc"},
        )
    )

    with session_factory() as session:
        audit_row = session.query(AuditLogRow).one()
        assert audit_row.actor_user_id == str(principal.user_id)
        assert audit_row.action == "experiment.read"
        assert audit_row.details == {"input_hash": "abc"}

    engine.dispose()
