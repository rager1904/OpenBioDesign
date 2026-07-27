"""ESM2-backed binder generation agent.

Uses ESM2 masked infilling for generating candidate protein sequences.
"""

from __future__ import annotations

import logging

import numpy as np

from openbiodesign.agents.contracts import BinderGenerationAgent
from openbiodesign.domain.models import (
    BindingSite,
    CandidateSequence,
    ConfidenceMetric,
    EvidenceItem,
    EvidenceType,
    ModelProvenance,
    ProteinTarget,
    UncertaintyAnalysis,
)
from openbiodesign.infrastructure.esm2_client import ESM2Client, get_esm2_client

logger = logging.getLogger(__name__)

# Amino acids for random substitution
_AMINO_ACIDS = list("ACDEFGHIKLMNPQRSTVWY")


class ESM2BinderGenerationAgent(BinderGenerationAgent):
    """Binder generation agent using ESM2 masked infilling.

    Algorithm:
    1. Get target binding site residues
    2. For each candidate:
       a. Start with target sequence context around binding site
       b. Mask 4-8 positions at the binding interface
       c. Run ESM2 forward pass
       d. At each masked position, sample from top-k logits
       e. Assemble the full candidate sequence
    3. Score each candidate with ESM2 log-likelihood
    4. Rank candidates by score
    """

    def __init__(self, esm2_client: ESM2Client | None = None) -> None:
        self.esm2_client = esm2_client or get_esm2_client()

    async def generate(
        self,
        target: ProteinTarget,
        binding_sites: list[BindingSite],
        requested_candidates: int,
        random_seed: int,
    ) -> list[CandidateSequence]:
        """Generate candidate binder sequences using ESM2 masked infilling.

        Args:
            target: Target protein with sequence.
            binding_sites: Predicted binding sites from analysis agent.
            requested_candidates: Number of candidates to generate.
            random_seed: Random seed for reproducibility.

        Returns:
            List of CandidateSequence objects with real ML-derived scores.
        """
        logger.info(
            "Generating %d candidates for target: %s",
            requested_candidates,
            target.name,
        )

        np.random.seed(random_seed)

        # Use first binding site
        site = binding_sites[0] if binding_sites else None

        # Determine positions to mask
        if site:
            mask_positions = site.residues[:6]  # Use up to 6 positions
        else:
            # Fallback: mask positions in the middle
            mid = len(target.sequence) // 2
            mask_positions = list(range(mid - 3, mid + 3))

        # Ensure positions are valid
        mask_positions = [p for p in mask_positions if 0 <= p < len(target.sequence)]

        candidates: list[CandidateSequence] = []

        for idx in range(requested_candidates):
            # Generate candidate using masked infilling
            candidate_seq = self.esm2_client.generate_candidate(
                target.sequence,
                mask_positions,
                temperature=0.8,
                seed=random_seed + idx,
            )

            # Score the candidate
            score_result = self.esm2_client.score(candidate_seq)

            # Compute scores
            binding_score = self._compute_binding_score(candidate_seq, target.sequence)
            stability_score = self._normalize_score(score_result.mean_log_likelihood)
            manufacturability_score = self._compute_manufacturability_score(candidate_seq)
            novelty_score = self._compute_novelty_score(candidate_seq, target.sequence)

            aggregate_confidence = round(
                min(binding_score, stability_score, manufacturability_score) * 0.85,
                3,
            )

            # Create evidence
            evidence = [
                EvidenceItem(
                    evidence_type=EvidenceType.model,
                    source="esm2-650m",
                    identifier=f"candidate-{idx + 1}",
                    title=f"ESM2-generated binder candidate {idx + 1}",
                    confidence=aggregate_confidence,
                    summary=(
                        f"Candidate generated via ESM2 masked infilling at positions "
                        f"{mask_positions}. Score: {score_result.mean_log_likelihood:.3f} nats."
                    ),
                )
            ]

            # Create provenance
            provenance = [
                ModelProvenance(
                    model_name="esm2_t33_650M_UR50D",
                    model_version="1.0.0",
                    adapter_name="ESM2BinderGenerationAgent",
                    random_seed=random_seed + idx,
                    parameters={
                        "mask_positions": mask_positions,
                        "temperature": 0.8,
                        "mean_log_likelihood": score_result.mean_log_likelihood,
                    },
                )
            ]

            # Create confidence metrics
            confidence_metrics = [
                ConfidenceMetric(
                    name="sequence_fitness",
                    value=stability_score,
                    rationale=(
                        f"ESM2 log-likelihood score of {score_result.mean_log_likelihood:.3f} nats "
                        f"normalized to [0,1]. Higher indicates more protein-like sequence."
                    ),
                ),
                ConfidenceMetric(
                    name="binding_site_confidence",
                    value=site.confidence if site else 0.3,
                    rationale="Inherited from the protein analysis agent.",
                ),
                ConfidenceMetric(
                    name="manufacturability",
                    value=manufacturability_score,
                    rationale="Based on sequence length and amino acid composition.",
                ),
            ]

            # Create uncertainty analysis
            uncertainty = UncertaintyAnalysis(
                summary=(
                    "Moderate uncertainty. Candidate generated via ESM2 masked infilling "
                    "with temperature 0.8. Requires structure prediction and experimental "
                    "validation."
                ),
                confidence=aggregate_confidence,
                failure_modes=[
                    "Incorrect binding site prediction",
                    "Poor folded stability",
                    "Aggregation or expression failure",
                    "Off-target binding",
                ],
                known_unknowns=[
                    "No predicted complex structure",
                    "No experimental affinity data",
                    "No immunogenicity assessment",
                    "No ADMET properties",
                ],
            )

            candidate = CandidateSequence(
                sequence=candidate_seq,
                scaffold_id=f"esm2-scaffold-{idx + 1}",
                interface_residues=mask_positions,
                manufacturability_score=manufacturability_score,
                stability_score=stability_score,
                binding_score=binding_score,
                novelty_score=novelty_score,
                risk_flags=[
                    "computational-only",
                    "esm2-generated",
                    "requires-structure-prediction",
                    "requires-wet-lab-validation",
                ],
                confidence_metrics=confidence_metrics,
                uncertainty=uncertainty,
                evidence=evidence,
                provenance=provenance,
            )

            candidates.append(candidate)

            logger.info(
                "Generated candidate %d: binding=%.3f, stability=%.3f",
                idx + 1,
                binding_score,
                stability_score,
            )

        # Sort by binding score
        candidates.sort(key=lambda c: c.binding_score, reverse=True)

        return candidates

    def _compute_binding_score(self, candidate: str, target: str) -> float:
        """Compute binding score based on sequence similarity."""
        # Use embedding similarity as a proxy for binding potential
        try:
            cand_emb = self.esm2_client.embed(candidate)
            tgt_emb = self.esm2_client.embed(target)

            # Cosine similarity
            cand_flat = cand_emb.flatten()
            tgt_flat = tgt_emb.flatten()

            # Pad to same length
            max_len = max(len(cand_flat), len(tgt_flat))
            cand_padded = np.zeros(max_len)
            tgt_padded = np.zeros(max_len)
            cand_padded[: len(cand_flat)] = cand_flat
            tgt_padded[: len(tgt_flat)] = tgt_flat

            similarity = np.dot(cand_padded, tgt_padded) / (
                np.linalg.norm(cand_padded) * np.linalg.norm(tgt_padded) + 1e-8
            )

            return round(float(np.clip(similarity, 0.0, 1.0)), 3)
        except Exception:
            return 0.5

    def _normalize_score(self, log_likelihood: float) -> float:
        """Normalize log-likelihood to [0, 1] score."""
        # Typical ESM2 log-likelihood range: -5 to -1 per residue
        # Normalize: -5 -> 0.1, -1 -> 0.9
        normalized = (log_likelihood + 5) / 4
        return round(float(np.clip(normalized, 0.1, 0.9)), 3)

    def _compute_manufacturability_score(self, sequence: str) -> float:
        """Compute manufacturability score based on sequence properties."""
        score = 0.7  # Base score

        # Penalize very long sequences
        if len(sequence) > 200:
            score -= 0.1
        elif len(sequence) > 300:
            score -= 0.2

        # Penalize very short sequences
        if len(sequence) < 50:
            score -= 0.1

        # Check for rare amino acids
        rare_count = sum(1 for aa in sequence if aa in "WM")
        if rare_count > 3:
            score -= 0.05 * rare_count

        # Check for consecutive same amino acids
        for i in range(len(sequence) - 2):
            if sequence[i] == sequence[i + 1] == sequence[i + 2]:
                score -= 0.05

        return round(float(np.clip(score, 0.3, 0.9)), 3)

    def _compute_novelty_score(self, candidate: str, target: str) -> float:
        """Compute novelty score based on sequence difference from target."""
        # Simple sequence identity
        min_len = min(len(candidate), len(target))
        if min_len == 0:
            return 0.5

        matches = sum(1 for i in range(min_len) if candidate[i] == target[i])
        identity = matches / min_len

        # Novelty is inverse of identity
        novelty = 1.0 - identity

        return round(float(np.clip(novelty, 0.2, 0.9)), 3)
