"""
In-memory vector store backed by FAISS (with a dict fallback for environments
where faiss-cpu is not installed).

For MVP this is purely in-process. Stage 5 will swap the persistence layer
for 0G Storage while keeping this interface stable.
"""
from __future__ import annotations

import logging
import math
from typing import Optional

from app.models.knowledge import KnowledgeEntry

logger = logging.getLogger(__name__)


class VectorStore:
    """
    Simple wrapper around FAISS IndexFlatIP (inner-product / cosine similarity
    on normalised vectors).  Falls back to brute-force linear scan if faiss is
    not available.
    """

    def __init__(self, dim: int = 384):
        self.dim = dim
        self._entries: list[KnowledgeEntry] = []
        self._index = None
        self._use_faiss = False
        self._init_index()

    # ------------------------------------------------------------------
    def _init_index(self):
        try:
            import faiss  # type: ignore
            self._index = faiss.IndexFlatIP(self.dim)
            self._use_faiss = True
            logger.info("FAISS index initialised (dim=%d).", self.dim)
        except ImportError:
            logger.warning("faiss not available — using brute-force search.")

    # ------------------------------------------------------------------
    def add(self, entry: KnowledgeEntry) -> None:
        """Add a knowledge entry (must have embedding set)."""
        self._entries.append(entry)
        if self._use_faiss and entry.embedding:
            import numpy as np  # type: ignore
            vec = np.array([entry.embedding], dtype="float32")
            self._index.add(vec)

    # ------------------------------------------------------------------
    def search(
        self,
        query_embedding: list[float],
        top_k: int,
        namespace: Optional[str] = None,
    ) -> list[tuple[KnowledgeEntry, float]]:
        """
        Return up to top_k (entry, score) pairs sorted by descending similarity.
        Expired entries are automatically excluded.

        namespace:
          None  → search the global pool (all entries, original behaviour).
          str   → search only within entries that match this namespace,
                  isolating the context window from unrelated domains.
        """
        live = [e for e in self._entries if not e.is_expired()]
        if not live:
            return []

        if namespace is not None:
            subset = [e for e in live if e.namespace == namespace]
            if not subset:
                return []
            k = min(top_k, len(subset))
            return self._linear_search(query_embedding, k, entries=subset)

        k = min(top_k, len(live))
        if self._use_faiss and self._index.ntotal > 0 and len(live) == len(self._entries):
            # FAISS index mirrors _entries exactly only when nothing expired
            return self._faiss_search(query_embedding, k)
        return self._linear_search(query_embedding, k, entries=live)

    def _faiss_search(
        self, query_embedding: list[float], k: int
    ) -> list[tuple[KnowledgeEntry, float]]:
        import numpy as np  # type: ignore
        q = np.array([query_embedding], dtype="float32")
        scores, indices = self._index.search(q, k)
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            results.append((self._entries[idx], float(score)))
        return results

    def _linear_search(
        self,
        query_embedding: list[float],
        k: int,
        entries: Optional[list[KnowledgeEntry]] = None,
    ) -> list[tuple[KnowledgeEntry, float]]:
        source = entries if entries is not None else self._entries
        scored = [
            (entry, _cosine(query_embedding, entry.embedding))
            for entry in source
            if entry.embedding
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]

    # ------------------------------------------------------------------
    def mark_useful(self, knowledge_id: str) -> Optional[KnowledgeEntry]:
        """Increment use_count and recalculate trust_score for the entry."""
        entry = self.get_by_id(knowledge_id)
        if entry is None:
            return None
        entry.use_count += 1
        entry.trust_score = min(2.0, 1.0 + entry.use_count * 0.1)
        return entry

    # ------------------------------------------------------------------
    def get_all(self) -> list[KnowledgeEntry]:
        """Return all non-expired entries."""
        return [e for e in self._entries if not e.is_expired()]

    def get_all_including_expired(self) -> list[KnowledgeEntry]:
        return list(self._entries)

    def get_by_id(self, knowledge_id: str) -> Optional[KnowledgeEntry]:
        for e in self._entries:
            if e.knowledge_id == knowledge_id:
                return e
        return None

    @property
    def count(self) -> int:
        return len([e for e in self._entries if not e.is_expired()])


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na  = math.sqrt(sum(x * x for x in a))
    nb  = math.sqrt(sum(x * x for x in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# Module-level singleton — shared across requests
_store: Optional[VectorStore] = None


def get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
