"""
Integration tests for the Synapse Knowledge API endpoints.
Uses FastAPI's TestClient so no running server is needed.

Run:
    cd backend
    pytest ../tests/backend/ -v
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.vector_store import get_store

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_store():
    """Wipe the in-process vector store between tests."""
    import app.services.vector_store as vs
    vs._store = None
    yield
    vs._store = None


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# POST /knowledge
# ---------------------------------------------------------------------------

class TestStoreKnowledge:
    PAYLOAD = {
        "agent_id": "agent_test_01",
        "content":  "Fixed a null pointer exception in the payment processor module.",
        "source":   "agent://test-agent/v1",
    }

    def test_store_returns_201(self):
        res = client.post("/knowledge", json=self.PAYLOAD)
        assert res.status_code == 201

    def test_store_returns_knowledge_id(self):
        res = client.post("/knowledge", json=self.PAYLOAD)
        data = res.json()
        assert "knowledge_id" in data
        assert len(data["knowledge_id"]) > 0

    def test_store_returns_status_stored(self):
        data = client.post("/knowledge", json=self.PAYLOAD).json()
        assert data["status"] == "stored"

    def test_store_returns_hash(self):
        data = client.post("/knowledge", json=self.PAYLOAD).json()
        assert "hash" in data
        assert len(data["hash"]) == 64

    def test_store_returns_cid(self):
        data = client.post("/knowledge", json=self.PAYLOAD).json()
        # CID is always populated (mock or real)
        assert "cid" in data
        assert data["cid"] is not None

    def test_store_returns_on_chain_false_in_local_mode(self):
        data = client.post("/knowledge", json=self.PAYLOAD).json()
        # on_chain is False when USE_ZG_CHAIN is not set
        assert data["on_chain"] is False

    def test_store_missing_agent_id(self):
        res = client.post("/knowledge", json={"content": "x", "source": "s"})
        assert res.status_code == 422

    def test_store_empty_content(self):
        res = client.post("/knowledge", json={**self.PAYLOAD, "content": ""})
        assert res.status_code == 422

    def test_store_persists_to_vector_store(self):
        client.post("/knowledge", json=self.PAYLOAD)
        store = get_store()
        assert store.count == 1


# ---------------------------------------------------------------------------
# POST /knowledge/query
# ---------------------------------------------------------------------------

class TestQueryKnowledge:
    def _store(self, content: str, agent_id: str = "qa_agent"):
        client.post("/knowledge", json={
            "agent_id": agent_id,
            "content":  content,
            "source":   "agent://qa/v1",
        })

    def test_query_empty_store(self):
        res = client.post("/knowledge/query", json={"query": "anything", "top_k": 5})
        assert res.status_code == 200
        assert res.json()["results"] == []

    def test_query_returns_results(self):
        self._store("Authentication token expiry bug fix")
        self._store("Database connection pooling optimisation")
        res = client.post("/knowledge/query", json={"query": "auth token", "top_k": 5})
        assert res.status_code == 200
        results = res.json()["results"]
        assert len(results) >= 1

    def test_query_result_fields(self):
        self._store("Test knowledge content for field validation")
        res = client.post("/knowledge/query", json={"query": "test", "top_k": 3})
        result = res.json()["results"][0]
        for field in ("knowledge_id", "content", "source", "agent_id", "confidence_score", "timestamp"):
            assert field in result, f"Missing field: {field}"

    def test_query_top_k_limits_results(self):
        for i in range(6):
            self._store(f"Knowledge item number {i} with unique text")
        res = client.post("/knowledge/query", json={"query": "knowledge item", "top_k": 3})
        assert len(res.json()["results"]) <= 3

    def test_query_invalid_top_k_zero(self):
        res = client.post("/knowledge/query", json={"query": "x", "top_k": 0})
        assert res.status_code == 422

    def test_query_empty_string(self):
        res = client.post("/knowledge/query", json={"query": "", "top_k": 5})
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# GET /knowledge
# ---------------------------------------------------------------------------

class TestStats:
    def test_stats_empty(self):
        res = client.get("/knowledge/stats")
        assert res.status_code == 200
        data = res.json()
        assert data["total_entries"]  == 0
        assert data["unique_agents"]  == 0
        assert data["total_queries"]  == 0
        assert data["on_chain_entries"] == 0

    def test_stats_after_store_and_query(self):
        client.post("/knowledge", json={
            "agent_id": "stats_agent",
            "content":  "Stats test knowledge",
            "source":   "agent://stats/v1",
        })
        client.post("/knowledge/query", json={"query": "stats", "top_k": 3})
        data = client.get("/knowledge/stats").json()
        assert data["total_entries"] == 1
        assert data["unique_agents"] == 1
        assert data["total_queries"] >= 1
        assert data["last_knowledge_id"] is not None


class TestListKnowledge:
    def test_list_empty(self):
        res = client.get("/knowledge")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_after_store(self):
        client.post("/knowledge", json={
            "agent_id": "list_agent",
            "content":  "Entry for listing",
            "source":   "agent://list/v1",
        })
        res = client.get("/knowledge")
        assert res.status_code == 200
        entries = res.json()
        assert len(entries) == 1
        assert entries[0]["content"] == "Entry for listing"

    def test_list_no_embeddings_in_response(self):
        client.post("/knowledge", json={
            "agent_id": "agent_x",
            "content":  "Content without embedding",
            "source":   "src",
        })
        entry = client.get("/knowledge").json()[0]
        assert "embedding" not in entry

    def test_list_includes_namespace_field(self):
        client.post("/knowledge", json={
            "agent_id":  "agent_x",
            "content":   "Medical knowledge entry",
            "source":    "src",
            "namespace": "medical",
        })
        entry = client.get("/knowledge").json()[0]
        assert "namespace" in entry
        assert entry["namespace"] == "medical"


# ---------------------------------------------------------------------------
# Namespace — store & query isolation
# ---------------------------------------------------------------------------

class TestNamespace:
    def _store(self, content: str, namespace: str | None = None):
        client.post("/knowledge", json={
            "agent_id":  "ns_agent",
            "content":   content,
            "source":    "agent://ns-test/v1",
            "namespace": namespace,
        })

    def test_store_with_namespace_returns_201(self):
        res = client.post("/knowledge", json={
            "agent_id":  "ns_agent",
            "content":   "Namespace test content",
            "source":    "src",
            "namespace": "engineering",
        })
        assert res.status_code == 201

    def test_store_without_namespace_defaults_to_global(self):
        client.post("/knowledge", json={
            "agent_id": "ns_agent",
            "content":  "Global pool content",
            "source":   "src",
        })
        entry = client.get("/knowledge").json()[0]
        assert entry["namespace"] is None

    def test_query_namespace_isolates_results(self):
        """Querying 'medical' must not return 'engineering' entries."""
        self._store("cardiac arrest treatment protocol", namespace="medical")
        self._store("async race condition nonce fix",    namespace="engineering")

        res = client.post("/knowledge/query", json={
            "query":     "cardiac arrest",
            "top_k":     5,
            "namespace": "medical",
        })
        results = res.json()["results"]
        assert len(results) >= 1
        for r in results:
            assert r["namespace"] == "medical"

    def test_query_namespace_returns_empty_when_no_match(self):
        """Querying a namespace with no entries returns empty list."""
        self._store("some engineering knowledge", namespace="engineering")

        res = client.post("/knowledge/query", json={
            "query":     "some engineering knowledge",
            "top_k":     5,
            "namespace": "medical",
        })
        assert res.json()["results"] == []

    def test_query_global_returns_all_namespaces(self):
        """Query without namespace searches across all entries."""
        self._store("medical entry", namespace="medical")
        self._store("engineering entry", namespace="engineering")

        res = client.post("/knowledge/query", json={
            "query":  "entry",
            "top_k":  10,
        })
        results = res.json()["results"]
        assert len(results) == 2

    def test_query_result_includes_namespace_field(self):
        self._store("namespace field check", namespace="legal")
        res = client.post("/knowledge/query", json={
            "query": "namespace field", "top_k": 1, "namespace": "legal"
        })
        result = res.json()["results"][0]
        assert "namespace" in result
        assert result["namespace"] == "legal"


# ---------------------------------------------------------------------------
# GET /knowledge/namespaces
# ---------------------------------------------------------------------------

class TestListNamespaces:
    def test_namespaces_empty(self):
        res = client.get("/knowledge/namespaces")
        assert res.status_code == 200
        data = res.json()
        assert data["namespaces"] == []
        assert data["global_entries"] == 0

    def test_namespaces_lists_stored_domains(self):
        for ns in ("medical", "legal", "engineering"):
            client.post("/knowledge", json={
                "agent_id":  "ns_agent",
                "content":   f"{ns} knowledge entry",
                "source":    "src",
                "namespace": ns,
            })
        data = client.get("/knowledge/namespaces").json()
        assert sorted(data["namespaces"]) == ["engineering", "legal", "medical"]

    def test_namespaces_global_entries_counted_separately(self):
        client.post("/knowledge", json={
            "agent_id": "ns_agent", "content": "global entry", "source": "src"
        })
        client.post("/knowledge", json={
            "agent_id": "ns_agent", "content": "medical entry",
            "source": "src", "namespace": "medical"
        })
        data = client.get("/knowledge/namespaces").json()
        assert data["global_entries"] == 1
        assert "medical" in data["namespaces"]
