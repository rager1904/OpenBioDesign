import pytest
from pydantic import ValidationError

from openbiodesign.domain.hashing import stable_hash
from openbiodesign.domain.models import BinderDesignRequest, ProteinTarget


def test_protein_sequence_validation_rejects_invalid_residues() -> None:
    with pytest.raises(ValidationError):
        ProteinTarget(name="Bad Target", sequence="ACDEFGHIKLMNPQRSTVWYZZ")


def test_input_hash_is_stable_for_reproducibility() -> None:
    payload = {"b": 2, "a": {"seed": 42}}
    assert stable_hash(payload) == stable_hash({"a": {"seed": 42}, "b": 2})


def test_binder_request_requires_reproducibility_seed() -> None:
    request = BinderDesignRequest(
        project_id="demo",
        target=ProteinTarget(
            accession="P01308",
            name="Insulin",
            sequence="MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKT",
        ),
        hypothesis="Design explainable binder hypotheses for a controlled test target.",
        requested_candidates=2,
        random_seed=7,
    )
    assert request.random_seed == 7
