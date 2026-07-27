from dataclasses import dataclass, field
from time import perf_counter


@dataclass
class MetricRegistry:
    counters: dict[str, int] = field(default_factory=dict)
    histograms: dict[str, list[float]] = field(default_factory=dict)

    def increment(self, name: str, value: int = 1) -> None:
        self.counters[name] = self.counters.get(name, 0) + value

    def observe(self, name: str, value: float) -> None:
        self.histograms.setdefault(name, []).append(value)

    def render_prometheus(self) -> str:
        lines: list[str] = []
        for name, counter_value in sorted(self.counters.items()):
            lines.append(f"{name} {counter_value}")
        for name, values in sorted(self.histograms.items()):
            for observed_value in values:
                lines.append(f"{name}_bucket {observed_value}")
            lines.append(f"{name}_count {len(values)}")
            lines.append(f"{name}_sum {sum(values)}")
        return "\n".join(lines) + "\n"


class Timer:
    def __init__(self, registry: MetricRegistry, metric_name: str) -> None:
        self.registry = registry
        self.metric_name = metric_name
        self.started_at = 0.0

    def __enter__(self) -> "Timer":
        self.started_at = perf_counter()
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        self.registry.observe(self.metric_name, perf_counter() - self.started_at)


metrics = MetricRegistry()
