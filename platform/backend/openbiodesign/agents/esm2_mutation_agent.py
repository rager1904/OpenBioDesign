"""ESM2-backed mutation analysis agent.

Uses ESM2 zero-shot prediction for mutation effect analysis.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

from openbiodesign.infrastructure.esm2_client import _AMINO_ACIDS, ESM2Client, get_esm2_client

logger = logging.getLogger(__name__)


@dataclass
class MutationImpact:
    """Result of mutation effect prediction."""
    position: int
    wild_type_residue: str
    mutant_residue: str
    wild_type_score: float
    mutant_score: float
    delta_score: float
    effect_classification: str  # "stabilizing", "destabilizing", "neutral"
    confidence: float
    per_residue_impact: list[int] = field(default_factory=list)
    method: str = "esm2-zero-shot"


@dataclass
class MutationScreenResult:
    """Result of screening all single-point mutations."""
    position: int
    mutations: list[MutationImpact]
    best_mutation: MutationImpact | None
    worst_mutation: MutationImpact | None


class ESM2MutationAnalysisAgent:
    """Mutation analysis agent using ESM2 zero-shot effect prediction.

    Algorithm:
    1. Score wild-type sequence
    2. For each mutation:
       a. Create mutant sequence
       b. Score mutant
       c. Compute delta score
       d. Classify effect
    3. Return ranked list of mutations
    """

    def __init__(self, esm2_client: ESM2Client | None = None) -> None:
        self.esm2_client = esm2_client or get_esm2_client()

    def predict_impact(
        self,
        sequence: str,
        position: int,
        mutant_residue: str,
    ) -> MutationImpact:
        """Predict the effect of a single-point mutation.

        Args:
            sequence: Wild-type amino acid sequence.
            position: Position to mutate (0-indexed).
            mutant_residue: New amino acid at the position.

        Returns:
            MutationImpact with scores and classification.
        """
        result = self.esm2_client.predict_mutation_effect(
            sequence, position, mutant_residue
        )

        return MutationImpact(
            position=result.position,
            wild_type_residue=result.wild_type_residue,
            mutant_residue=result.mutant_residue,
            wild_type_score=result.wild_type_score,
            mutant_score=result.mutant_score,
            delta_score=result.delta_score,
            effect_classification=result.effect_classification,
            confidence=result.confidence,
            per_residue_impact=result.per_residue_impact,
        )

    def screen_position(
        self,
        sequence: str,
        position: int,
    ) -> MutationScreenResult:
        """Screen all possible mutations at a position.

        Args:
            sequence: Wild-type amino acid sequence.
            position: Position to screen (0-indexed).

        Returns:
            MutationScreenResult with all mutations at the position.
        """
        wild_type_residue = sequence[position]
        mutations: list[MutationImpact] = []

        # Try all amino acids except wild-type
        from openbiodesign.infrastructure.esm2_client import _AMINO_ACIDS

        for aa in _AMINO_ACIDS:
            if aa == wild_type_residue:
                continue

            impact = self.predict_impact(sequence, position, aa)
            mutations.append(impact)

        # Sort by delta score (most stabilizing first)
        mutations.sort(key=lambda m: m.delta_score, reverse=True)

        best = mutations[0] if mutations else None
        worst = mutations[-1] if mutations else None

        return MutationScreenResult(
            position=position,
            mutations=mutations,
            best_mutation=best,
            worst_mutation=worst,
        )

    def screen_sequence(
        self,
        sequence: str,
        positions: list[int] | None = None,
        top_k: int = 10,
    ) -> list[MutationScreenResult]:
        """Screen mutations at multiple positions.

        Args:
            sequence: Wild-type amino acid sequence.
            positions: Positions to screen (default: all positions).
            top_k: Number of top positions to return.

        Returns:
            List of MutationScreenResult for each position.
        """
        if positions is None:
            # Screen all positions (can be slow for long sequences)
            positions = list(range(len(sequence)))

        results: list[MutationScreenResult] = []

        for pos in positions:
            if pos < 0 or pos >= len(sequence):
                continue

            result = self.screen_position(sequence, pos)
            results.append(result)

            logger.info(
                "Position %d: best=%s (%.3f), worst=%s (%.3f)",
                pos,
                result.best_mutation.mutant_residue if result.best_mutation else "?",
                result.best_mutation.delta_score if result.best_mutation else 0,
                result.worst_mutation.mutant_residue if result.worst_mutation else "?",
                result.worst_mutation.delta_score if result.worst_mutation else 0,
            )

        # Sort by best mutation effect
        results.sort(
            key=lambda r: r.best_mutation.delta_score if r.best_mutation else 0,
            reverse=True,
        )

        return results[:top_k]

    def find_stabilizing_mutations(
        self,
        sequence: str,
        threshold: float = 0.5,
        max_mutations: int = 10,
    ) -> list[MutationImpact]:
        """Find mutations that are predicted to stabilize the protein.

        Args:
            sequence: Wild-type amino acid sequence.
            threshold: Minimum delta score to consider as stabilizing.
            max_mutations: Maximum number of mutations to return.

        Returns:
            List of MutationImpact objects sorted by delta score.
        """
        all_mutations: list[MutationImpact] = []

        # Sample positions (check every 3rd position for efficiency)
        positions = list(range(0, len(sequence), 3))

        for pos in positions:
            for aa in _AMINO_ACIDS:
                if aa == sequence[pos]:
                    continue

                impact = self.predict_impact(sequence, pos, aa)

                if impact.delta_score > threshold:
                    all_mutations.append(impact)

        # Sort by delta score
        all_mutations.sort(key=lambda m: m.delta_score, reverse=True)

        return all_mutations[:max_mutations]
