"""
Unit tests for Synapse backend services:
  - hashing
  - embedding (mock path)
  - vector store (linear-search fallback)
"""
import math
import pytest

from app.services.hashing    import hash_content, verify_hash
from app.services.embedding  import _mock_embedding
from app.services.vector_store import VectorStore, _cosine
from app.models.knowledge    import KnowledgeEntry


# ---------------------------------------------------------------------------
# Hashing
# ---------------------------------------------------------------------------

class TestHashing:
    def test_produces_64_char_hex(self):
        h = hash_content("hello world")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)

    def test_deterministic(self):
        assert hash_content("test") == hash_content("test")

    def test_different_inputs_differ(self):
        assert hash_content("a") != hash_content("b")

    def test_verify_correct(self):
        content = "Synapse knowledge entry"
        assert verify_hash(content, hash_content(content)) is True

    def test_verify_wrong_hash(self):
        assert verify_hash("content", "a" * 64) is False


# ---------------------------------------------------------------------------
# Embedding (mock path — no model download required in CI)
# ---------------------------------------------------------------------------

class TestEmbedding:
    def test_returns_list_of_floats(self):
        vec = _mock_embedding("hello")
        assert isinstance(vec, list)
        assert all(isinstance(x, float) for x in vec)

    def test_default_dim_384(self):
        assert len(_mock_embedding("hello")) == 384

    def test_unit_norm(self):
        vec = _mock_embedding("unit norm test")
        norm = math.sqrt(sum(x * x for x in vec))
        assert abs(norm - 1.0) < 1e-6

    def test_deterministic(self):
        assert _mock_embedding("same text") == _mock_embedding("same text")

    def test_different_texts_differ(self):
        assert _mock_embedding("text A") != _mock_embedding("text B")


# ---------------------------------------------------------------------------
# Vector store
# ---------------------------------------------------------------------------

class TestVectorStore:
    def _make_entry(self, content: str, agent_id: str = "agent_test") -> KnowledgeEntry:
        from app.services.embedding import _mock_embedding
        from app.services.hashing   import hash_content
        return KnowledgeEntry(
            content=content,
            embedding=_mock_embedding(content),
            source="test://",
            agent_id=agent_id,
            hash=hash_content(content),
        )

    def test_add_and_count(self):
        store = VectorStore()
        store.add(self._make_entry("entry one"))
        store.add(self._make_entry("entry two"))
        assert store.count == 2

    def test_search_returns_top_k(self):
        store = VectorStore()
        for i in range(5):
            store.add(self._make_entry(f"knowledge item {i}"))
        results = store.search(_mock_embedding("knowledge item 2"), top_k=3)
        assert len(results) == 3

    def test_search_empty_store(self):
        store = VectorStore()
        results = store.search(_mock_embedding("query"), top_k=5)
        assert results == []

    def test_scores_in_range(self):
        store = VectorStore()
        for i in range(4):
            store.add(self._make_entry(f"document {i}"))
        results = store.search(_mock_embedding("document"), top_k=4)
        for _, score in results:
            assert -1.0 <= score <= 1.0

    def test_get_all(self):
        store = VectorStore()
        store.add(self._make_entry("alpha"))
        store.add(self._make_entry("beta"))
        all_entries = store.get_all()
        assert len(all_entries) == 2

    def test_get_by_id(self):
        store = VectorStore()
        entry = self._make_entry("find me")
        store.add(entry)
        found = store.get_by_id(entry.knowledge_id)
        assert found is not None
        assert found.content == "find me"

    def test_get_by_id_missing(self):
        store = VectorStore()
        assert store.get_by_id("nonexistent-id") is None


def _mock_embedding(text: str) -> list[float]:
    from app.services.embedding import _mock_embedding as _me
    return _me(text)
