from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OpenBioDesign"
    app_version: str = "0.1.0"
    environment: str = "development"
    database_url: str = "sqlite:///./openbiodesign.db"
    use_persistent_repositories: bool = True
    artifact_root: str = "./artifacts"
    artifact_backend: str = "local"
    neo4j_uri: str | None = None
    neo4j_user: str | None = None
    neo4j_password: str | None = None
    knowledge_graph_backend: str = "sql"
    api_keys: dict[str, str] = Field(
        default_factory=lambda: {
            "dev-scientist-key": "scientist",
            "dev-admin-key": "admin",
            "dev-viewer-key": "viewer",
        }
    )

    # ML Model Settings
    use_ml_agents: bool = True
    esm2_model_name: str = "facebook/esm2_t33_650M_UR50D"
    esmfold_model_name: str = "facebook/esmfold_v1"
    device: str = "auto"  # "auto", "cuda", "cpu"
    max_sequence_length: int = 1024
    binding_site_top_k: int = 8
    candidate_temperature: float = 0.8
    mutation_screen_step: int = 3  # Check every Nth position for efficiency

    model_config = SettingsConfigDict(env_prefix="OPENBIODESIGN_", env_file=".env")


@lru_cache
def get_settings() -> Settings:
    return Settings()
