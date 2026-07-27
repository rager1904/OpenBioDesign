from fastapi.testclient import TestClient

from openbiodesign.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_binder_design_requires_authentication() -> None:
    client = TestClient(app)
    response = client.post("/api/v1/workflows/binder-design", json={})
    assert response.status_code == 401


def test_binder_design_endpoint_returns_candidates() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "demo-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Generate explainable binder hypotheses for API testing.",
            "requested_candidates": 2,
            "random_seed": 42,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["experiment"]["status"] == "completed"
    assert payload["experiment"]["outputs"]["report_artifact_id"]
    assert payload["experiment"]["outputs"]["report_artifact_sha256"]
    assert len(payload["candidates"]) == 2
    assert payload["candidates"][0]["confidence_metrics"]
    assert payload["candidates"][0]["provenance"]


def test_binder_design_job_endpoint_creates_and_completes_local_job() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/workflows/binder-design/jobs",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "demo-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Submit deterministic binder design through the local job workflow.",
            "requested_candidates": 2,
            "random_seed": 42,
        },
    )

    assert response.status_code == 202
    job_id = response.json()["job_id"]

    status_response = client.get(
        f"/api/v1/jobs/{job_id}",
        headers={"Authorization": "Bearer dev-viewer-key"},
    )

    assert status_response.status_code == 200
    payload = status_response.json()
    assert payload["status"] == "completed"
    assert payload["experiment_id"]
    assert payload["result"]["candidate_count"] == 2
    assert payload["result"]["experiment_id"] == payload["experiment_id"]


def test_binder_design_job_endpoint_is_idempotent_per_project() -> None:
    client = TestClient(app)
    request_payload = {
        "project_id": "demo-project",
        "target": {
            "accession": "P01308",
            "name": "Insulin",
            "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
        },
        "hypothesis": "Submit the same deterministic job twice.",
        "requested_candidates": 1,
        "random_seed": 43,
    }
    headers = {
        "Authorization": "Bearer dev-scientist-key",
        "Idempotency-Key": "same-binder-job",
    }

    first_response = client.post(
        "/api/v1/workflows/binder-design/jobs",
        headers=headers,
        json=request_payload,
    )
    second_response = client.post(
        "/api/v1/workflows/binder-design/jobs",
        headers=headers,
        json=request_payload,
    )

    assert first_response.status_code == 202
    assert second_response.status_code == 202
    assert second_response.json()["job_id"] == first_response.json()["job_id"]


def test_binder_design_job_requires_project_scientist_role() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/workflows/binder-design/jobs",
        headers={"Authorization": "Bearer dev-viewer-key"},
        json={
            "project_id": "demo-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Attempt a job without sufficient project permissions.",
            "requested_candidates": 1,
            "random_seed": 44,
        },
    )

    assert response.status_code == 403


def test_binder_design_requires_project_scientist_role() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-viewer-key"},
        json={
            "project_id": "demo-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Attempt a workflow without sufficient project permissions.",
            "requested_candidates": 1,
            "random_seed": 11,
        },
    )

    assert response.status_code == 403


def test_binder_design_denies_unknown_project_membership() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "unknown-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Attempt a workflow for a project without membership.",
            "requested_candidates": 1,
            "random_seed": 12,
        },
    )

    assert response.status_code == 403


def test_experiment_endpoint_returns_persisted_provenance() -> None:
    client = TestClient(app)
    create_response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "audit-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Generate auditable binder hypotheses for API provenance testing.",
            "requested_candidates": 1,
            "random_seed": 9,
        },
    )
    experiment_id = create_response.json()["experiment"]["experiment_id"]

    response = client.get(
        f"/api/v1/experiments/{experiment_id}",
        headers={"Authorization": "Bearer dev-scientist-key"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["experiment_id"] == experiment_id
    assert payload["input_hash"]
    assert payload["random_seed"] == 9
    assert payload["audit_events"] == ["workflow_started", "workflow_completed"]


def test_experiment_endpoint_requires_project_viewer_role() -> None:
    client = TestClient(app)
    create_response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "audit-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Generate a private experiment for authorization testing.",
            "requested_candidates": 1,
            "random_seed": 13,
        },
    )
    experiment_id = create_response.json()["experiment"]["experiment_id"]

    response = client.get(
        f"/api/v1/experiments/{experiment_id}",
        headers={"Authorization": "Bearer dev-admin-key"},
    )

    assert response.status_code == 200


def test_artifact_endpoint_returns_report_metadata() -> None:
    client = TestClient(app)
    create_response = client.post(
        "/api/v1/workflows/binder-design",
        headers={"Authorization": "Bearer dev-scientist-key"},
        json={
            "project_id": "demo-project",
            "target": {
                "accession": "P01308",
                "name": "Insulin",
                "sequence": "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
            },
            "hypothesis": "Generate a report artifact for metadata retrieval testing.",
            "requested_candidates": 1,
            "random_seed": 14,
        },
    )
    artifact_id = create_response.json()["experiment"]["outputs"]["report_artifact_id"]

    response = client.get(
        f"/api/v1/artifacts/{artifact_id}",
        headers={"Authorization": "Bearer dev-viewer-key"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["artifact_id"] == artifact_id
    assert payload["kind"] == "report"
    assert payload["sha256"]
