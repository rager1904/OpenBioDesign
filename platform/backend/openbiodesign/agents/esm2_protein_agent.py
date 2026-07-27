"""ESM2-backed protein analysis agent.

Uses ESM2-650M attention maps for binding site detection.
"""

from __future__ import annotations

import logging

from openbiodesign.agents.contracts import ProteinAnalysisAgent
from openbiodesign.domain.models import BindingSite, ProteinTarget
from openbiodesign.infrastructure.esm2_client import ESM2Client, get_esm2_client

logger = logging.getLogger(__name__)


class ESM2ProteinAnalysisAgent(ProteinAnalysisAgent):
    """Protein analysis agent using ESM2 attention-based binding site detection.

    Algorithm:
    1. Compute attention map for target sequence
    2. Calculate per-residue importance scores
    3. Identify high-attention residue clusters
    4. Return BindingSite[] with residue positions and confidence
    """

    def __init__(self, esm2_client: ESM2Client | None = None) -> None:
        self.esm2_client = esm2_client or get_esm2_client()

    async def analyze(self, target: ProteinTarget, random_seed: int) -> list[BindingSite]:
        """Analyze protein target to identify binding sites.

        Uses ESM2 attention maps to identify functionally important
        residues that are likely to be at binding interfaces.

        Args:
            target: Protein target with sequence.
            random_seed: Random seed for reproducibility.

        Returns:
            List of BindingSite objects with residue positions and confidence.
        """
        logger.info("Analyzing target: %s (%d residues)", target.name, len(target.sequence))

        # Use ESM2 attention-based detection
        prediction = self.esm2_client.attention_binding_sites(
            target.sequence,
            top_k=8,
            min_cluster_distance=3,
        )

        # Create description based on residue positions
        if len(prediction.residues) >= 3:
            residue_range = f"residues {min(prediction.residues)+1}-{max(prediction.residues)+1}"
        else:
            residue_range = f"residues {[r+1 for r in prediction.residues]}"

        site = BindingSite(
            residues=prediction.residues,
            description=(
                f"ESM2 attention-identified interface hotspot at {residue_range}. "
                f"These residues show high attention weights, indicating potential "
                f"involvement in protein-protein interactions."
            ),
            confidence=prediction.confidence,
            method=prediction.method,
        )

        logger.info(
            "Found binding site at %s with confidence %.3f",
            residue_range,
            prediction.confidence,
        )

        return [site]
