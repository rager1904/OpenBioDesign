from typing import Any
from uuid import UUID

from neo4j import GraphDatabase

from openbiodesign.infrastructure.repositories import KnowledgeGraph


class Neo4jKnowledgeGraph(KnowledgeGraph):
    def __init__(
        self,
        uri: str,
        user: str,
        password: str,
        driver: Any | None = None,
    ) -> None:
        self.driver = driver or GraphDatabase.driver(uri, auth=(user, password))

    def initialize_schema(self) -> None:
        constraints = [
            "CREATE CONSTRAINT project_id IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE",
            (
                "CREATE CONSTRAINT experiment_id IF NOT EXISTS "
                "FOR (e:Experiment) REQUIRE e.id IS UNIQUE"
            ),
            "CREATE CONSTRAINT protein_name IF NOT EXISTS FOR (p:Protein) REQUIRE p.name IS UNIQUE",
        ]
        for statement in constraints:
            self.driver.execute_query(statement)

    def link_experiment_to_target(
        self,
        project_id: str,
        experiment_id: UUID,
        target_name: str,
    ) -> None:
        self.driver.execute_query(
            """
            MERGE (project:Project {id: $project_id})
            MERGE (experiment:Experiment {id: $experiment_id})
            MERGE (target:Protein {name: $target_name})
            MERGE (project)-[:HAS_EXPERIMENT]->(experiment)
            MERGE (experiment)-[:STUDIES_TARGET]->(target)
            """,
            project_id=project_id,
            experiment_id=str(experiment_id),
            target_name=target_name,
        )

    def relationships(self) -> list[tuple[str, str, str]]:
        records, _, _ = self.driver.execute_query(
            """
            MATCH (subject)-[relationship]->(object)
            RETURN coalesce(subject.id, subject.name) AS subject,
                   type(relationship) AS predicate,
                   coalesce(object.id, object.name) AS object
            ORDER BY subject, predicate, object
            """
        )
        return [
            (
                str(record["subject"]),
                str(record["predicate"]),
                str(record["object"]),
            )
            for record in records
        ]

    def close(self) -> None:
        self.driver.close()
