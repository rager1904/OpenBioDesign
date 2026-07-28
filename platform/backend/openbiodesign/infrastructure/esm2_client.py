"""ESM2-650M client for protein sequence analysis.

Provides:
- Per-residue embeddings
- Sequence fitness scoring (log-likelihood)
- Attention-based binding site detection
- Masked language model predictions
- Zero-shot mutation effect prediction

Model: facebook/esm2_t33_650M_UR50D (650M params, ~2.5GB VRAM)
"""

from __future__ import annotations

import logging
import threading
from dataclasses import dataclass, field

import numpy as np
import torch

logger = logging.getLogger(__name__)

_AMINO_ACIDS = list("ACDEFGHIKLMNPQRSTVWY")
_AA_TO_IDX = {aa: i + 4 for i, aa in enumerate(_AMINO_ACIDS)}
_IDX_TO_AA = {i + 4: aa for i, aa in enumerate(_AMINO_ACIDS)}


@dataclass
class BindingSitePrediction:
    """Result of attention-based binding site detection."""
    residues: list[int]
    attention_scores: list[float]
    confidence: float
    method: str = "esm2-attention-based"


@dataclass
class SequenceScore:
    """Per-residue and aggregate sequence fitness score."""
    mean_log_likelihood: float
    per_residue_log_likelihood: list[float]
    sequence_length: int


@dataclass
class MaskedPrediction:
    """Token probabilities at a masked position."""
    position: int
    top_k_tokens: list[str]
    top_k_probs: list[float]
    top_k_indices: list[int]


@dataclass
class MutationEffect:
    """Zero-shot mutation effect prediction."""
    position: int
    wild_type_residue: str
    mutant_residue: str
    wild_type_score: float
    mutant_score: float
    delta_score: float
    effect_classification: str  # "stabilizing", "destabilizing", "neutral"
    confidence: float
    per_residue_impact: list[int] = field(default_factory=list)


class ESM2Client:
    """Thread-safe ESM2-650M model wrapper.

    Usage:
        client = ESM2Client()
        client.load_model()
        embedding = client.embed("MKFLIVALT...")
        scores = client.score("MKFLIVALT...")
        sites = client.attention_binding_sites("MKFLIVALT...")
    """

    _instance: ESM2Client | None = None
    _lock = threading.Lock()

    def __new__(cls) -> ESM2Client:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if hasattr(self, "_initialized"):
            return
        self._initialized = True
        self.model = None
        self.tokenizer = None
        self.device: torch.device | None = None
        self._model_loaded = False

    def load_model(self, model_name: str = "facebook/esm2_t33_650M_UR50D") -> None:
        """Load ESM2 model and tokenizer to GPU (or CPU fallback)."""
        if self._model_loaded:
            return

        from transformers import AutoModelForMaskedLM, AutoTokenizer

        logger.info("Loading ESM2 model: %s", model_name)

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForMaskedLM.from_pretrained(model_name)

        # Ensure mask_token_id is set (AutoTokenizer may leave it as None)
        if getattr(self.tokenizer, "mask_token_id", None) is None:
            mask_id = self.tokenizer.convert_tokens_to_ids("<mask>")
            if mask_id != self.tokenizer.unk_token_id:
                self.tokenizer.mask_token_id = mask_id
            else:
                # Fallback: search vocabulary for any token containing "mask"
                vocab = self.tokenizer.get_vocab()
                for tok, tid in vocab.items():
                    if "mask" in tok.lower():
                        self.tokenizer.mask_token_id = tid
                        break

        self.model.to(self.device)
        self.model.eval()
        self._model_loaded = True

        device_name = "GPU" if self.device.type == "cuda" else "CPU"
        logger.info("ESM2 loaded on %s", device_name)

    def _ensure_loaded(self) -> None:
        if not self._model_loaded:
            self.load_model()

    def _tokenize(self, sequence: str) -> dict[str, torch.Tensor]:
        """Tokenize a protein sequence."""
        sequence = sequence.strip().upper()
        tokens = self.tokenizer(sequence, return_tensors="pt")
        return {k: v.to(self.device) for k, v in tokens.items()}

    @torch.no_grad()
    def embed(self, sequence: str) -> np.ndarray:
        """Compute per-residue embeddings.

        Args:
            sequence: Amino acid sequence (20-10000 residues).

        Returns:
            numpy array of shape (L, 1280) where L is sequence length.
        """
        self._ensure_loaded()
        tokens = self._tokenize(sequence)
        outputs = self.model.esm(**tokens, output_hidden_states=True)
        # Use last hidden state
        hidden = outputs.last_hidden_state[0, 1:-1, :]  # Remove CLS and EOS
        return hidden.cpu().numpy()

    @torch.no_grad()
    def score(self, sequence: str) -> SequenceScore:
        """Compute per-residue log-likelihood scores.

        Higher score = more "protein-like" = more stable.

        Args:
            sequence: Amino acid sequence.

        Returns:
            SequenceScore with mean and per-residue log-likelihoods.
        """
        self._ensure_loaded()
        tokens = self._tokenize(sequence)
        logits = self.model(**tokens).logits[0, 1:-1, :]

        # Get token IDs for the input sequence
        input_ids = tokens["input_ids"][0, 1:-1]

        # Compute log-softmax
        log_probs = torch.log_softmax(logits, dim=-1)

        # Extract log-likelihood of actual tokens
        per_residue_ll = log_probs.gather(1, input_ids.unsqueeze(1)).squeeze(1)

        return SequenceScore(
            mean_log_likelihood=per_residue_ll.mean().item(),
            per_residue_log_likelihood=per_residue_ll.cpu().tolist(),
            sequence_length=len(sequence),
        )

    @torch.no_grad()
    def attention_map(self, sequence: str) -> np.ndarray:
        """Compute attention map for the sequence.

        Args:
            sequence: Amino acid sequence.

        Returns:
            numpy array of shape (L, L) with averaged attention weights.
        """
        self._ensure_loaded()
        tokens = self._tokenize(sequence)
        outputs = self.model.esm(**tokens, output_attentions=True)
        attentions = outputs.attentions  # Tuple of (num_layers) tensors

        # Average attention across last 6 layers
        num_layers = len(attentions)
        layers_to_use = attentions[max(0, num_layers - 6):]

        # Stack and average: (num_selected_layers, batch, heads, seq, seq)
        avg_attention = torch.stack(layers_to_use).mean(dim=0)[0]

        # Average across heads
        avg_attention = avg_attention.mean(dim=0)

        # Remove CLS and EOS tokens
        avg_attention = avg_attention[1:-1, 1:-1]

        return avg_attention.cpu().numpy()

    def attention_binding_sites(
        self,
        sequence: str,
        top_k: int = 8,
        min_cluster_distance: int = 3,
    ) -> BindingSitePrediction:
        """Detect binding sites using attention-based importance scores.

        Algorithm:
        1. Compute attention map
        2. Calculate per-residue importance (sum of attention to/from each residue)
        3. Smooth with a window of 3
        4. Select top-k residues
        5. Cluster nearby residues

        Args:
            sequence: Amino acid sequence.
            top_k: Number of key residues to identify.
            min_cluster_distance: Minimum distance to consider residues as separate.

        Returns:
            BindingSitePrediction with residue positions and confidence scores.
        """
        attention = self.attention_map(sequence)
        L = attention.shape[0]

        # Compute per-residue importance
        # Sum of attention weights FROM each residue to all others
        importance = attention.sum(axis=1)
        # Also add attention TO each residue from all others (bidirectional)
        importance += attention.sum(axis=0)

        # Smooth with window of 3
        kernel = np.ones(3) / 3
        importance_smooth = np.convolve(importance, kernel, mode="same")

        # Select top-k positions
        top_indices = np.argsort(importance_smooth)[-top_k:][::-1]

        # Sort by position
        top_indices = sorted(top_indices.tolist())

        # Cluster nearby residues
        clusters: list[list[int]] = []
        current_cluster: list[int] = []
        current_scores: list[float] = []

        for idx in top_indices:
            if current_cluster and idx - current_cluster[-1] > min_cluster_distance:
                if current_cluster:
                    clusters.append(current_cluster)
                current_cluster = [idx]
                current_scores = [importance_smooth[idx]]
            else:
                current_cluster.append(idx)
                current_scores.append(importance_smooth[idx])

        if current_cluster:
            clusters.append(current_cluster)

        # Use the largest cluster as the primary binding site
        if not clusters:
            # Fallback: use middle of sequence
            mid = L // 2
            return BindingSitePrediction(
                residues=list(range(mid, min(mid + 8, L))),
                attention_scores=[0.5] * min(8, L - mid),
                confidence=0.3,
                method="esm2-attention-fallback",
            )

        primary_cluster = max(clusters, key=len)
        scores = [float(importance_smooth[i]) for i in primary_cluster]

        # Normalize confidence to [0, 1]
        max_score = importance_smooth.max()
        if max_score > 0:
            normalized_scores = [s / max_score for s in scores]
        else:
            normalized_scores = [0.5] * len(scores)

        confidence = float(np.mean(normalized_scores))

        return BindingSitePrediction(
            residues=primary_cluster,
            attention_scores=normalized_scores,
            confidence=min(0.95, max(0.1, confidence)),
            method="esm2-650m-attention",
        )

    @torch.no_grad()
    def masked_predict(
        self,
        sequence: str,
        mask_position: int,
        top_k: int = 5,
    ) -> MaskedPrediction:
        """Predict token probabilities at a masked position.

        Args:
            sequence: Amino acid sequence.
            mask_position: Position to mask (0-indexed).
            top_k: Number of top predictions to return.

        Returns:
            MaskedPrediction with top-k tokens and probabilities.
        """
        self._ensure_loaded()

        # Create masked sequence by replacing one AA with <mask>
        seq_list = list(sequence)
        seq_list[mask_position] = "<mask>"
        masked_seq = "".join(seq_list)

        tokens = self._tokenize(masked_seq)
        logits = self.model(**tokens).logits[0]

        # Find the position of the mask token in the output
        input_ids = tokens["input_ids"][0]
        mask_token_id = self.tokenizer.mask_token_id

        if mask_token_id is None:
            # Fallback: try to find <mask> in the vocabulary
            mask_token_id = self.tokenizer.convert_tokens_to_ids("<mask>")

        if mask_token_id is None or mask_token_id == getattr(self.tokenizer, "unk_token_id", -1):
            raise ValueError(
                "Cannot find <mask> token in vocabulary. "
                f"mask_token_id={self.tokenizer.mask_token_id}, "
                f"vocab_size={self.tokenizer.vocab_size}"
            )

        mask_positions = (input_ids == mask_token_id).nonzero(as_tuple=True)[0]

        if len(mask_positions) == 0:
            # Debug: show what tokens were produced
            decoded = [self.tokenizer.decode([tid.item()]) for tid in input_ids]
            raise ValueError(
                f"No mask token found in input. mask_token_id={mask_token_id}, "
                f"tokens={decoded[:10]}..."
            )

        mask_logits = logits[mask_positions[0]]
        probs = torch.softmax(mask_logits, dim=-1)

        top_probs, top_indices = torch.topk(probs, top_k)

        return MaskedPrediction(
            position=mask_position,
            top_k_tokens=[self.tokenizer.decode([idx.item()]) for idx in top_indices],
            top_k_probs=top_probs.cpu().tolist(),
            top_k_indices=top_indices.cpu().tolist(),
        )

    def generate_candidate(
        self,
        template_sequence: str,
        mask_positions: list[int],
        temperature: float = 0.8,
        seed: int | None = None,
    ) -> str:
        """Generate a candidate sequence by masking and infilling.

        Args:
            template_sequence: Starting sequence (will be modified).
            mask_positions: Positions to mask and regenerate.
            temperature: Sampling temperature (higher = more diverse).
            seed: Random seed for reproducibility.

        Returns:
            New candidate sequence with infilled positions.
        """
        if seed is not None:
            torch.manual_seed(seed)

        seq_list = list(template_sequence)

        for pos in mask_positions:
            prediction = self.masked_predict(
                "".join(seq_list), pos, top_k=10
            )

            # Sample from top-k with temperature
            probs = np.array(prediction.top_k_probs)
            probs = probs ** (1 / temperature)
            probs = probs / probs.sum()

            sampled_idx = np.random.choice(len(probs), p=probs)
            predicted_token = prediction.top_k_tokens[sampled_idx]

            # Handle multi-character tokens (shouldn't happen with ESM2 but just in case)
            if len(predicted_token) == 1 and predicted_token in _AMINO_ACIDS:
                seq_list[pos] = predicted_token

        return "".join(seq_list)

    @torch.no_grad()
    def predict_mutation_effect(
        self,
        sequence: str,
        position: int,
        mutant_residue: str,
        window_size: int = 10,
    ) -> MutationEffect:
        """Predict the effect of a single-point mutation.

        Args:
            sequence: Wild-type amino acid sequence.
            position: Position to mutate (0-indexed).
            mutant_residue: New amino acid at the position.
            window_size: Window around mutation to compute local impact.

        Returns:
            MutationEffect with scores and classification.
        """
        mutant_residue = mutant_residue.upper()
        if mutant_residue not in _AMINO_ACIDS:
            raise ValueError(f"Invalid amino acid: {mutant_residue}")

        wild_type = sequence.upper()
        if position < 0 or position >= len(wild_type):
            raise ValueError(
                f"Position {position} out of range for sequence of length {len(wild_type)}"
            )

        # Score wild-type
        wt_score = self.score(wild_type)

        # Create and score mutant
        mutant_seq = list(wild_type)
        mutant_seq[position] = mutant_residue
        mutant_seq = "".join(mutant_seq)
        mut_score = self.score(mutant_seq)

        # Compute delta
        delta = mut_score.mean_log_likelihood - wt_score.mean_log_likelihood

        # Classify effect
        if delta > 0.5:
            classification = "stabilizing"
        elif delta < -0.5:
            classification = "destabilizing"
        else:
            classification = "neutral"

        # Compute confidence based on magnitude relative to background variance
        wt_per_residue = np.array(wt_score.per_residue_log_likelihood)
        background_std = float(wt_per_residue.std()) if len(wt_per_residue) > 1 else 1.0
        confidence = min(0.95, abs(delta) / max(background_std, 0.1))

        # Identify nearby residues affected
        per_residue_delta = [
            abs(mut_score.per_residue_log_likelihood[i] - wt_score.per_residue_log_likelihood[i])
            for i in range(len(wild_type))
        ]

        # Find residues with significant change within window
        start = max(0, position - window_size)
        end = min(len(wild_type), position + window_size + 1)
        affected = [
            i for i in range(start, end)
            if per_residue_delta[i] > 0.1 and i != position
        ]

        return MutationEffect(
            position=position,
            wild_type_residue=wild_type[position],
            mutant_residue=mutant_residue,
            wild_type_score=wt_score.mean_log_likelihood,
            mutant_score=mut_score.mean_log_likelihood,
            delta_score=delta,
            effect_classification=classification,
            confidence=confidence,
            per_residue_impact=affected,
        )

    def unload_model(self) -> None:
        """Unload model to free GPU memory."""
        if self.model is not None:
            del self.model
            self.model = None
        if self.tokenizer is not None:
            del self.tokenizer
            self.tokenizer = None
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        self._model_loaded = False
        logger.info("ESM2 model unloaded")


def get_esm2_client() -> ESM2Client:
    """Get the singleton ESM2 client instance."""
    return ESM2Client()
