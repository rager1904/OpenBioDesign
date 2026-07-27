import asyncio

import httpx

from openbiodesign.domain.models import ProteinTarget
from openbiodesign.infrastructure.scientific_sources import (
    AlphaFoldDbClient,
    AlphaFoldEvidenceNormalizer,
    EuropePmcClient,
    RcsbEvidenceNormalizer,
    ScientificEvidenceService,
    UniProtClient,
)


def test_scientific_evidence_service_normalizes_uniprot_and_literature() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        if "uniprotkb" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "primaryAccession": "P01308",
                    "annotationScore": 5,
                    "proteinDescription": {
                        "recommendedName": {"fullName": {"value": "Insulin"}}
                    },
                },
            )
        if "alphafold" in str(request.url):
            return httpx.Response(
                200,
                json={
                    "entryId": "AF-P01308-F1",
                    "uniprotAccession": "P01308",
                    "confidenceScore": 92.5,
                    "url": "https://alphafold.ebi.ac.uk/entry/P01308",
                },
            )
        return httpx.Response(
            200,
            json={
                "resultList": {
                    "result": [
                        {
                            "id": "123",
                            "title": "Insulin receptor binding study",
                            "doi": "10.1000/example",
                        }
                    ]
                }
            },
        )

    async def run() -> list[str]:
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            service = ScientificEvidenceService(
                uniprot_client=UniProtClient(client=client),
                rcsb_client=None,
                europe_pmc_client=EuropePmcClient(client=client),
                alphafold_client=AlphaFoldDbClient(client=client),
            )
            evidence = await service.target_evidence(
                ProteinTarget(
                    accession="P01308",
                    name="Insulin",
                    sequence="MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
                )
            )
            return [item.source for item in evidence]

    assert asyncio.run(run()) == ["UniProt", "AlphaFold DB", "Europe PMC"]


def test_scientific_source_client_retries_transient_failures() -> None:
    attempts = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(503, json={"error": "temporarily unavailable"})
        return httpx.Response(
            200,
            json={
                "primaryAccession": "P01308",
                "annotationScore": 5,
                "proteinDescription": {"recommendedName": {"fullName": {"value": "Insulin"}}},
            },
        )

    async def run() -> str:
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            payload = await UniProtClient(client=client, max_retries=2).fetch_entry("P01308")
            return str(payload["primaryAccession"])

    assert asyncio.run(run()) == "P01308"
    assert attempts == 2


def test_scientific_source_client_caches_successful_responses() -> None:
    attempts = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(
            200,
            json={
                "primaryAccession": "P01308",
                "annotationScore": 5,
                "proteinDescription": {"recommendedName": {"fullName": {"value": "Insulin"}}},
            },
        )

    async def run() -> tuple[str, str]:
        transport = httpx.MockTransport(handler)
        async with httpx.AsyncClient(transport=transport) as client:
            uniprot = UniProtClient(client=client)
            first = await uniprot.fetch_entry("P01308")
            second = await uniprot.fetch_entry("P01308")
            return str(first["primaryAccession"]), str(second["primaryAccession"])

    assert asyncio.run(run()) == ("P01308", "P01308")
    assert attempts == 1


def test_rcsb_evidence_normalizer_extracts_structure_metadata() -> None:
    evidence = RcsbEvidenceNormalizer().normalize(
        {
            "entry": {"id": "1abc"},
            "struct": {"title": "Example protein structure"},
        }
    )

    assert evidence.source == "RCSB PDB"
    assert evidence.identifier == "1ABC"
    assert evidence.url == "https://www.rcsb.org/structure/1ABC"


def test_alphafold_evidence_normalizer_derives_confidence_from_plddt() -> None:
    evidence = AlphaFoldEvidenceNormalizer().normalize(
        {
            "entryId": "AF-P01308-F1",
            "uniprotAccession": "P01308",
            "confidenceScore": 91.2,
        }
    )

    assert evidence.source == "AlphaFold DB"
    assert evidence.identifier == "AF-P01308-F1"
    assert evidence.confidence == 0.912
