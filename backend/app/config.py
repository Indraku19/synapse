from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "info"

    allowed_origins: str = "http://localhost:3000"

    vector_store: str = "faiss"  # "faiss" | "chroma"
    embedding_model: str = "all-MiniLM-L6-v2"

    # 0G Storage (Phase 2)
    use_zg_storage: bool = False
    zg_storage_endpoint: str = ""      # e.g. http://storage-node:5678

    # 0G Chain (Phase 2)
    use_zg_chain: bool = False
    zg_chain_rpc: str = ""
    zg_chain_private_key: str = ""
    zg_knowledge_registry_address: str = ""

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def use_0g_storage(self) -> bool:
        return self.use_zg_storage and bool(self.zg_storage_endpoint)

    @property
    def use_0g_chain(self) -> bool:
        return (
            self.use_zg_chain
            and bool(self.zg_chain_rpc)
            and bool(self.zg_chain_private_key)
            and bool(self.zg_knowledge_registry_address)
        )


settings = Settings()
