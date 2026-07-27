import asyncio
from uuid import uuid4

import httpx

from openbiodesign.domain.embeddings import EmbeddingKind, EmbeddingRecord
from openbiodesign.infrastructure.vector_store import InMemoryVectorStore, QdrantVectorStore


def test_in_memory_vector_store_searches_by_project_and_similarity() -> None:
    async def run() -> list[str]:
        store = InMemoryVectorStore()
        await store.upsert(
            EmbeddingRecord(
                project_id="demo-project",
                kind=EmbeddingKind.sequence,
                source_id="candidate-a",
                vector=[1.0, 0.0],
                model_name="test",
                model_version="1",
            )
        )
        await store.upsert(
            EmbeddingRecord(
                project_id="other-project",
                kind=EmbeddingKind.sequence,
                source_id="candidate-b",
                vector=[1.0, 0.0],
                model_name="test",
                model_version="1",
            )
        )
        results = await store.search("demo-project", [1.0, 0.0])
        return [result.source_id for result in results]

    assert asyncio.run(run()) == ["candidate-a"]


def test_qdrant_vector_store_uses_project_filter_and_payload() -> None:
    calls: list[httpx.Request] = []
    embedding_id = uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if request.method == "POST":
            return httpx.Response(
                200,
                json={
                    "result": [
                        {
                            "id": str(embedding_id),
                            "score": 0.9,
                            "payload": {
                                "source_id": "paper-1",
                                "metadata": {"title": "Paper"},
                            },
                        }
                    ]
                },
            )
        return httpx.Response(200, json={"result": {"operation_id": 1}})

    async def run() -> tuple[int, str]:
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            store = QdrantVectorStore("http://qdrant:6333", "research", client=client)
            await store.upsert(
                EmbeddingRecord(
                    project_id="demo-project",
                    kind=EmbeddingKind.paper,
                    source_id="paper-1",
                    vector=[0.1, 0.2],
                    model_name="bge",
                    model_version="1",
                )
            )
            results = await store.search("demo-project", [0.1, 0.2])
            return len(calls), results[0].source_id

    assert asyncio.run(run()) == (2, "paper-1")
