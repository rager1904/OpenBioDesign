from uuid import uuid4

from openbiodesign.infrastructure.neo4j_graph import Neo4jKnowledgeGraph


class FakeNeo4jDriver:
    def __init__(self) -> None:
        self.calls: list[tuple[str, dict[str, object]]] = []

    def execute_query(
        self,
        statement: str,
        **parameters: object,
    ) -> tuple[list[dict[str, str]], None, None]:
        self.calls.append((statement, parameters))
        if "MATCH (subject)-[relationship]->(object)" in statement:
            return (
                [
                    {
                        "subject": "demo-project",
                        "predicate": "HAS_EXPERIMENT",
                        "object": "experiment-1",
                    }
                ],
                None,
                None,
            )
        return ([], None, None)

    def close(self) -> None:
        self.calls.append(("close", {}))


def test_neo4j_graph_initializes_constraints_and_links_target() -> None:
    driver = FakeNeo4jDriver()
    graph = Neo4jKnowledgeGraph("bolt://localhost:7687", "neo4j", "password", driver=driver)
    experiment_id = uuid4()

    graph.initialize_schema()
    graph.link_experiment_to_target("demo-project", experiment_id, "Insulin")

    statements = [call[0] for call in driver.calls]
    assert any("CREATE CONSTRAINT project_id" in statement for statement in statements)
    assert any("MERGE (project:Project" in statement for statement in statements)
    assert driver.calls[-1][1] == {
        "project_id": "demo-project",
        "experiment_id": str(experiment_id),
        "target_name": "Insulin",
    }


def test_neo4j_graph_returns_relationship_tuples() -> None:
    graph = Neo4jKnowledgeGraph(
        "bolt://localhost:7687",
        "neo4j",
        "password",
        driver=FakeNeo4jDriver(),
    )

    assert graph.relationships() == [("demo-project", "HAS_EXPERIMENT", "experiment-1")]
