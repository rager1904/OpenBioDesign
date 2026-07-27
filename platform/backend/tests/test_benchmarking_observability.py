from openbiodesign.domain.benchmarking import CandidateBenchmarkScorer
from openbiodesign.observability import MetricRegistry, Timer


def test_candidate_benchmark_scorer_calculates_weighted_aggregate() -> None:
    score = CandidateBenchmarkScorer().score(
        binding_score=0.8,
        stability_score=0.7,
        manufacturability_score=0.6,
        novelty_score=0.5,
    )

    assert score["aggregate_score"] == 0.69


def test_metric_registry_renders_prometheus_text() -> None:
    registry = MetricRegistry()
    registry.increment("workflow_runs_total")
    with Timer(registry, "workflow_duration_seconds"):
        pass

    rendered = registry.render_prometheus()

    assert "workflow_runs_total 1" in rendered
    assert "workflow_duration_seconds_count 1" in rendered
