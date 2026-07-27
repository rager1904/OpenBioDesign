import random

from openbiodesign.agents.contracts import (
    BinderGenerationAgent,
    ExperimentalDesignAgent,
    LiteratureAgent,
    ProteinAnalysisAgent,
    ReportAgent,
)
from openbiodesign.domain.models import (
    BindingSite,
    CandidateSequence,
    ConfidenceMetric,
    EvidenceItem,
    EvidenceType,
    ExperimentalRecommendation,
    ModelProvenance,
    ProteinTarget,
    ScientificReport,
    UncertaintyAnalysis,
)


class DeterministicProteinAnalysisAgent(ProteinAnalysisAgent):
    async def analyze(self, target: ProteinTarget, random_seed: int) -> list[BindingSite]:
        window_start = max(1, min(len(target.sequence) - 8, len(target.sequence) // 3))
        residues = list(range(window_start, window_start + 8))
        confidence = min(0.82, 0.45 + len(target.sequence) / 1000)
        return [
            BindingSite(
                residues=residues,
                description="Heuristic surface-exposed candidate interface window.",
                confidence=confidence,
                method="deterministic-sequence-window-baseline",
            )
        ]


class DeterministicLiteratureAgent(LiteratureAgent):
    async def retrieve_evidence(self, target: ProteinTarget) -> list[EvidenceItem]:
        identifier = target.accession or target.name.replace(" ", "-").lower()
        return [
            EvidenceItem(
                evidence_type=EvidenceType.database,
                source="UniProt/PDB/AlphaFold adapter placeholder",
                identifier=identifier,
                title=f"Curated target context for {target.name}",
                url=None,
                confidence=0.4,
                summary=(
                    "Baseline evidence package. Production deployments should replace this "
                    "with fetched UniProt, PDB, AlphaFold DB, PubMed, and Europe PMC evidence."
                ),
            )
        ]


class DeterministicBinderGenerationAgent(BinderGenerationAgent):
    motif_pool = ["EAL", "KQW", "NVT", "YSG", "DHR", "LIP", "QKD", "TSW"]

    async def generate(
        self,
        target: ProteinTarget,
        binding_sites: list[BindingSite],
        requested_candidates: int,
        random_seed: int,
    ) -> list[CandidateSequence]:
        rng = random.Random(random_seed)  # noqa: S311 - deterministic scientific reproducibility.
        evidence = [
            EvidenceItem(
                evidence_type=EvidenceType.model,
                source="baseline-binder-generator",
                identifier="baseline-v0.1",
                title="Deterministic baseline binder candidate generator",
                confidence=0.35,
                summary="Local deterministic candidate used for workflow validation only.",
            )
        ]
        site = binding_sites[0]
        candidates: list[CandidateSequence] = []
        for idx in range(requested_candidates):
            motifs = rng.sample(self.motif_pool, k=4)
            sequence = "G" + "A".join(motifs) + "G"
            binding_score = round(0.52 + (idx / max(requested_candidates, 1)) * 0.2, 3)
            stability_score = round(0.58 + rng.random() * 0.18, 3)
            manufacturability_score = round(0.62 + rng.random() * 0.16, 3)
            novelty_score = round(0.45 + rng.random() * 0.35, 3)
            aggregate_confidence = round(
                min(binding_score, stability_score, manufacturability_score) * 0.75,
                3,
            )
            candidates.append(
                CandidateSequence(
                    sequence=sequence,
                    scaffold_id=f"baseline-scaffold-{idx + 1}",
                    interface_residues=site.residues,
                    manufacturability_score=manufacturability_score,
                    stability_score=stability_score,
                    binding_score=binding_score,
                    novelty_score=novelty_score,
                    risk_flags=[
                        "computational-only",
                        "requires-structure-prediction",
                        "requires-wet-lab-validation",
                    ],
                    confidence_metrics=[
                        ConfidenceMetric(
                            name="aggregate_model_confidence",
                            value=aggregate_confidence,
                            rationale=(
                                "Down-weighted deterministic baseline score because no GPU "
                                "structure model or binding assay has been executed."
                            ),
                        ),
                        ConfidenceMetric(
                            name="binding_site_confidence",
                            value=site.confidence,
                            rationale="Inherited from the protein analysis agent.",
                        ),
                    ],
                    uncertainty=UncertaintyAnalysis(
                        summary="High uncertainty; candidate is a reproducible workflow artifact.",
                        confidence=aggregate_confidence,
                        failure_modes=[
                            "False-positive interface prediction",
                            "Poor folded stability",
                            "Aggregation or expression failure",
                        ],
                        known_unknowns=[
                            "No predicted complex structure",
                            "No experimental affinity data",
                            "No immunogenicity assessment",
                        ],
                    ),
                    evidence=evidence,
                    provenance=[
                        ModelProvenance(
                            model_name="deterministic-baseline",
                            model_version="0.1.0",
                            adapter_name="DeterministicBinderGenerationAgent",
                            random_seed=random_seed,
                            parameters={"candidate_index": idx, "motifs": motifs},
                        )
                    ],
                )
            )
        return sorted(candidates, key=lambda item: item.binding_score, reverse=True)


class DeterministicExperimentalDesignAgent(ExperimentalDesignAgent):
    async def recommend(
        self,
        target: ProteinTarget,
        candidates: list[CandidateSequence],
    ) -> list[ExperimentalRecommendation]:
        return [
            ExperimentalRecommendation(
                assay="AlphaFold/OpenFold complex prediction",
                purpose="Filter candidates with low predicted interface confidence.",
                controls=["Native target structure", "Scrambled binder sequence"],
                acceptance_criteria=["pLDDT >= 70", "Interface PAE <= 10"],
                priority=1,
            ),
            ExperimentalRecommendation(
                assay="SPR or BLI binding assay",
                purpose="Measure target-binder affinity and kinetics.",
                controls=["No-target blank", "Known non-binding protein"],
                acceptance_criteria=[
                    "KD below project threshold",
                    "Reproducible association curve",
                ],
                priority=2,
            ),
            ExperimentalRecommendation(
                assay="Thermal shift or DSF stability assay",
                purpose="Evaluate manufacturability and folded stability.",
                controls=["Buffer-only blank", "Reference stable protein"],
                acceptance_criteria=["Monophasic melt curve", "Tm compatible with workflow"],
                priority=3,
            ),
        ]


class DeterministicReportAgent(ReportAgent):
    async def write_report(
        self,
        target: ProteinTarget,
        candidates: list[CandidateSequence],
        evidence: list[EvidenceItem],
        recommendations: list[ExperimentalRecommendation],
    ) -> ScientificReport:
        best = candidates[0]
        return ScientificReport(
            abstract=(
                f"Generated {len(candidates)} explainable binder hypotheses for {target.name}. "
                f"The top candidate is {best.scaffold_id} with binding score {best.binding_score}."
            ),
            methods=(
                "A deterministic baseline protein-analysis and binder-generation workflow was "
                "executed with explicit random seed tracking. This is a validation scaffold, not "
                "a substitute for RFdiffusion, ProteinMPNN, OpenFold, or experimental assays."
            ),
            results=(
                f"Candidates were ranked by binding, stability, manufacturability, novelty, "
                f"confidence metrics, and uncertainty annotations. Top sequence: {best.sequence}."
            ),
            discussion=(
                "The workflow demonstrates traceable candidate generation and ranking. Production "
                "interpretation requires structure prediction, docking or complex modeling, "
                "literature-backed target evidence, and wet-lab validation."
            ),
            limitations=(
                "Baseline agents are deterministic heuristics with intentionally conservative "
                "confidence. No generated sequence should be interpreted as experimentally "
                "validated or clinically useful."
            ),
            references=evidence,
        )
