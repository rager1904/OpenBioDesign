import math
from abc import ABC, abstractmethod
from typing import Any
from uuid import UUID

import httpx

from openbiodesign.domain.embeddings import EmbeddingRecord, VectorSearchResult


class VectorStore(ABC):
    @abstractmethod
    async def upsert(self, record: EmbeddingRecord) -> EmbeddingRecord:
        raise NotImplementedError

    @abstractmethod
    async def search(
        self,
        project_id: str,
        vector: list[float],
        limit: int = 10,
    ) -> list[VectorSearchResult]:
        raise NotImplementedError


class InMemoryVectorStore(VectorStore):
    def __init__(self) -> None:
        self._records: dict[UUID, EmbeddingRecord] = {}

    async def upsert(self, record: EmbeddingRecord) -> EmbeddingRecord:
        self._records[record.embedding_id] = record
        return record

    async def search(
        self,
        project_id: str,
        vector: list[float],
        limit: int = 10,
    ) -> list[VectorSearchResult]:
        scored: list[VectorSearchResult] = []
        for record in self._records.values():
            if record.project_id != project_id:
                continue
            scored.append(
                VectorSearchResult(
                    embedding_id=record.embedding_id,
                    score=_cosine_similarity(vector, record.vector),
                    source_id=record.source_id,
                    metadata=record.metadata,
                )
            )
        return sorted(scored, key=lambda item: item.score, reverse=True)[:limit]


class QdrantVectorStore(VectorStore):
    def __init__(
        self,
        base_url: str,
        collection_name: str,
        api_key: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.collection_name = collection_name
        self.api_key = api_key
        self.client = client

    async def upsert(self, record: EmbeddingRecord) -> EmbeddingRecord:
        payload = {
            "points": [
                {
                    "id": str(record.embedding_id),
                    "vector": record.vector,
                    "payload": {
                        "project_id": record.project_id,
                        "kind": record.kind.value,
                        "source_id": record.source_id,
                        "metadata": record.metadata,
                        "model_name": record.model_name,
                        "model_version": record.model_version,
                    },
                }
            ]
        }
        await self._request(
            "PUT",
            f"/collections/{self.collection_name}/points",
            json=payload,
        )
        return record

    async def search(
        self,
        project_id: str,
        vector: list[float],
        limit: int = 10,
    ) -> list[VectorSearchResult]:
        response = await self._request(
            "POST",
            f"/collections/{self.collection_name}/points/search",
            json={
                "vector": vector,
                "limit": limit,
                "filter": {"must": [{"key": "project_id", "match": {"value": project_id}}]},
                "with_payload": True,
            },
        )
        result = response.get("result", [])
        if not isinstance(result, list):
            return []
        return [
            VectorSearchResult(
                embedding_id=UUID(item["id"]),
                score=float(item["score"]),
                source_id=str(item.get("payload", {}).get("source_id", "")),
                metadata=dict(item.get("payload", {}).get("metadata", {})),
            )
            for item in result
            if isinstance(item, dict)
        ]

    async def _request(self, method: str, path: str, json: dict[str, Any]) -> dict[str, Any]:
        headers = {"api-key": self.api_key} if self.api_key else {}
        if self.client is not None:
            response = await self.client.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                json=json,
            )
        else:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.request(
                    method,
                    f"{self.base_url}{path}",
                    headers=headers,
                    json=json,
                )
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, dict) else {}


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot / (left_norm * right_norm)
