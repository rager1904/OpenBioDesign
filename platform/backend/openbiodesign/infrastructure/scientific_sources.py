from abc import ABC, abstractmethod
from typing import Any

import httpx

from openbiodesign.domain.models import EvidenceItem, EvidenceType, ProteinTarget


class ScientificSourceError(RuntimeError):
    pass


class CachedJsonClient:
    def __init__(
        self,
        base_url: str,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float = 20,
        max_retries: int = 2,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.client = client
        self.timeout_seconds = timeout_seconds
        self.max_retries = max(1, max_retries)
        self._cache: dict[str, dict[str, Any]] = {}

    async def get_json(
        self,
        path: str,
        params: dict[str, str | int] | None = None,
        source_name: str = "scientific source",
    ) -> dict[str, Any]:
        cache_key = self._cache_key(path, params)
        if cache_key in self._cache:
            return self._cache[cache_key]

        last_error: Exception | None = None
        for _ in range(self.max_retries):
            try:
                response = await self._get(path, params)
                if response.status_code >= 500:
                    last_error = ScientificSourceError(
                        f"{source_name} request failed: {response.status_code}"
                    )
                    continue
                if response.status_code >= 400:
                    raise ScientificSourceError(
                        f"{source_name} request failed: {response.status_code}"
                    )
                data = response.json()
                if not isinstance(data, dict):
                    raise ScientificSourceError(f"{source_name} response was not a JSON object.")
                self._cache[cache_key] = data
                return data
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_error = exc

        raise ScientificSourceError(f"{source_name} request failed after retries.") from last_error

    async def _get(
        self,
        path: str,
        params: dict[str, str | int] | None = None,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        if self.client is not None:
            return await self.client.get(url, params=params)
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            return await client.get(url, params=params)

    @staticmethod
    def _cache_key(path: str, params: dict[str, str | int] | None = None) -> str:
        if not params:
            return path
        serialized = "&".join(f"{key}={params[key]}" for key in sorted(params))
        return f"{path}?{serialized}"


class UniProtClient:
    def __init__(
        self,
        base_url: str = "https://rest.uniprot.org",
        client: httpx.AsyncClient | None = None,
        max_retries: int = 2,
    ) -> None:
        self.json_client = CachedJsonClient(base_url, client=client, max_retries=max_retries)

    async def fetch_entry(self, accession: str) -> dict[str, Any]:
        return await self.json_client.get_json(
            f"/uniprotkb/{accession}.json",
            source_name="UniProt",
        )


class RcsbPdbClient:
    def __init__(
        self,
        base_url: str = "https://data.rcsb.org/rest/v1/core",
        client: httpx.AsyncClient | None = None,
        max_retries: int = 2,
    ) -> None:
        self.json_client = CachedJsonClient(base_url, client=client, max_retries=max_retries)

    async def fetch_entry(self, pdb_id: str) -> dict[str, Any]:
        return await self.json_client.get_json(
            f"/entry/{pdb_id.lower()}",
            source_name="RCSB PDB",
        )


class AlphaFoldDbClient:
    def __init__(
        self,
        base_url: str = "https://alphafold.ebi.ac.uk/api",
        client: httpx.AsyncClient | None = None,
        max_retries: int = 2,
    ) -> None:
        self.json_client = CachedJsonClient(base_url, client=client, max_retries=max_retries)

    async def fetch_prediction(self, accession: str) -> dict[str, Any]:
        return await self.json_client.get_json(
            f"/prediction/{accession}",
            source_name="AlphaFold DB",
        )


class EuropePmcClient:
    def __init__(
        self,
        base_url: str = "https://www.ebi.ac.uk/europepmc/webservices/rest",
        client: httpx.AsyncClient | None = None,
        max_retries: int = 2,
    ) -> None:
        self.json_client = CachedJsonClient(base_url, client=client, max_retries=max_retries)

    async def search(self, query: str, page_size: int = 5) -> dict[str, Any]:
        params: dict[str, str | int] = {"query": query, "format": "json", "pageSize": page_size}
        return await self.json_client.get_json(
            "/search",
            params=params,
            source_name="Europe PMC",
        )


class EvidenceNormalizer(ABC):
    @abstractmethod
    def normalize(self, payload: dict[str, Any]) -> EvidenceItem:
        raise NotImplementedError


class UniProtEvidenceNormalizer(EvidenceNormalizer):
    def normalize(self, payload: dict[str, Any]) -> EvidenceItem:
        accession = str(payload.get("primaryAccession", "unknown"))
        protein = payload.get("proteinDescription", {})
        recommended = protein.get("recommendedName", {}) if isinstance(protein, dict) else {}
        full_name = recommended.get("fullName", {}) if isinstance(recommended, dict) else {}
        title = full_name.get("value", accession) if isinstance(full_name, dict) else accession
        annotation_score = payload.get("annotationScore", 0.0)
        confidence = min(float(annotation_score) / 5.0, 1.0) if annotation_score else 0.5
        return EvidenceItem(
            evidence_type=EvidenceType.database,
            source="UniProt",
            identifier=accession,
            title=str(title),
            url=f"https://www.uniprot.org/uniprotkb/{accession}",
            confidence=confidence,
            summary="UniProt target annotation evidence normalized from UniProtKB.",
        )


class RcsbEvidenceNormalizer(EvidenceNormalizer):
    def normalize(self, payload: dict[str, Any]) -> EvidenceItem:
        entry = payload.get("entry", {})
        identifier = str(entry.get("id", payload.get("rcsb_id", "unknown"))).upper()
        struct = payload.get("struct", {})
        title = struct.get("title", identifier) if isinstance(struct, dict) else identifier
        return EvidenceItem(
            evidence_type=EvidenceType.database,
            source="RCSB PDB",
            identifier=identifier,
            title=str(title),
            url=f"https://www.rcsb.org/structure/{identifier}",
            confidence=0.75,
            summary="PDB structure metadata evidence normalized from RCSB.",
        )


class AlphaFoldEvidenceNormalizer(EvidenceNormalizer):
    def normalize(self, payload: dict[str, Any]) -> EvidenceItem:
        accession = str(payload.get("uniprotAccession", payload.get("entryId", "unknown")))
        entry_id = str(payload.get("entryId", accession))
        confidence = self._confidence_from_plddt(payload.get("confidenceScore"))
        return EvidenceItem(
            evidence_type=EvidenceType.database,
            source="AlphaFold DB",
            identifier=entry_id,
            title=f"AlphaFold predicted structure for {accession}",
            url=str(payload.get("url", f"https://alphafold.ebi.ac.uk/entry/{accession}")),
            confidence=confidence,
            summary=(
                "AlphaFold DB predicted structure metadata normalized for target context. "
                "Confidence is derived from the reported pLDDT score when available."
            ),
        )

    @staticmethod
    def _confidence_from_plddt(value: object) -> float:
        if value is None:
            return 0.7
        if not isinstance(value, int | float | str):
            return 0.7
        try:
            return min(max(float(value) / 100.0, 0.0), 1.0)
        except ValueError:
            return 0.7


class EuropePmcEvidenceNormalizer:
    def normalize_many(self, payload: dict[str, Any]) -> list[EvidenceItem]:
        result_list = payload.get("resultList", {})
        results = result_list.get("result", []) if isinstance(result_list, dict) else []
        evidence: list[EvidenceItem] = []
        for item in results:
            if not isinstance(item, dict):
                continue
            identifier = str(item.get("id", item.get("pmid", "unknown")))
            title = str(item.get("title", "Untitled publication"))
            doi = item.get("doi")
            evidence.append(
                EvidenceItem(
                    evidence_type=EvidenceType.literature,
                    source="Europe PMC",
                    identifier=identifier,
                    title=title,
                    url=f"https://doi.org/{doi}" if doi else None,
                    confidence=0.65,
                    summary="Literature evidence normalized from Europe PMC search results.",
                )
            )
        return evidence


class ScientificEvidenceService:
    def __init__(
        self,
        uniprot_client: UniProtClient,
        rcsb_client: RcsbPdbClient | None,
        europe_pmc_client: EuropePmcClient,
        alphafold_client: AlphaFoldDbClient | None = None,
    ) -> None:
        self.uniprot_client = uniprot_client
        self.rcsb_client = rcsb_client
        self.europe_pmc_client = europe_pmc_client
        self.alphafold_client = alphafold_client
        self.uniprot_normalizer = UniProtEvidenceNormalizer()
        self.rcsb_normalizer = RcsbEvidenceNormalizer()
        self.alphafold_normalizer = AlphaFoldEvidenceNormalizer()
        self.europe_pmc_normalizer = EuropePmcEvidenceNormalizer()

    async def target_evidence(self, target: ProteinTarget) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        if target.accession:
            evidence.extend(await self._safe_database_evidence(target.accession))

        literature_payload = await self.europe_pmc_client.search(target.name)
        evidence.extend(self.europe_pmc_normalizer.normalize_many(literature_payload))
        return evidence

    async def _safe_database_evidence(self, accession: str) -> list[EvidenceItem]:
        evidence: list[EvidenceItem] = []
        try:
            uniprot_payload = await self.uniprot_client.fetch_entry(accession)
            evidence.append(self.uniprot_normalizer.normalize(uniprot_payload))
        except ScientificSourceError:
            pass

        if self.alphafold_client is not None:
            try:
                alphafold_payload = await self.alphafold_client.fetch_prediction(accession)
                evidence.append(self.alphafold_normalizer.normalize(alphafold_payload))
            except ScientificSourceError:
                pass
        return evidence
