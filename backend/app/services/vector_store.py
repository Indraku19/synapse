"""
In-memory vector store backed by FAISS (with a dict fallback for environments
where faiss-cpu is not installed).

Persistence: on every write the store is snapshotted to
  {DATA_DIR}/knowledge_store.json
so knowledge survives Railway redeploys.  Mount a persistent volume at DATA_DIR
(default /app/data) in Railway → Settings → Volumes.
"""
from __future__ import annotations

import json
import logging
import math
import os
from pathlib import Path
from typing import Optional

from app.models.knowledge import KnowledgeEntry

logger = logging.getLogger(__name__)


class VectorStore:
    """
    FAISS IndexFlatIP (inner-product / cosine similarity on normalised vectors).
    Falls back to brute-force linear scan if faiss is not available.
    """

    def __init__(self, dim: int = 384, snapshot_path: Optional[Path] = None):
        self.dim = dim
        self._snapshot_path = snapshot_path
        self._entries: list[KnowledgeEntry] = []
        self._index = None
        self._use_faiss = False
        self._init_index()
        if snapshot_path:
            self._load_snapshot()

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
        self._entries.append(entry)
        if self._use_faiss and entry.embedding:
            import numpy as np  # type: ignore
            vec = np.array([entry.embedding], dtype="float32")
            self._index.add(vec)
        self._save_snapshot()

    # ------------------------------------------------------------------
    def search(
        self,
        query_embedding: list[float],
        top_k: int,
        namespace: Optional[str] = None,
    ) -> list[tuple[KnowledgeEntry, float]]:
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
        entry = self.get_by_id(knowledge_id)
        if entry is None:
            return None
        entry.use_count += 1
        entry.trust_score = min(2.0, 1.0 + entry.use_count * 0.1)
        self._save_snapshot()
        return entry

    # ------------------------------------------------------------------
    # Graph traversal (Phase 9)
    # ------------------------------------------------------------------

    def get_referencing_entries(self, knowledge_id: str) -> list[KnowledgeEntry]:
        """Reverse lookup: return non-expired entries that reference knowledge_id."""
        return [
            e for e in self._entries
            if knowledge_id in e.references and not e.is_expired()
        ]

    def traverse_graph(
        self,
        root_id: str,
        max_hops: int = 3,
        direction: str = "both",  # "forward" | "backward" | "both"
    ) -> tuple[list[tuple["KnowledgeEntry", int]], list[tuple[str, str]]]:
        """
        BFS multi-hop traversal from root_id.

        direction:
          "forward"  — follow .references (what this entry builds on)
          "backward" — follow reverse references (what builds on this entry)
          "both"     — bidirectional

        Returns:
          nodes : list of (KnowledgeEntry, hop_distance)
          edges : list of (from_id, to_id) deduplicated directed edges
        """
        from collections import deque

        root = self.get_by_id(root_id)
        if root is None:
            return [], []

        visited: set[str] = {root_id}
        queue: deque[tuple[str, int]] = deque([(root_id, 0)])
        nodes: list[tuple[KnowledgeEntry, int]] = [(root, 0)]
        edge_set: set[tuple[str, str]] = set()

        while queue:
            current_id, hop = queue.popleft()
            if hop >= max_hops:
                continue

            current = self.get_by_id(current_id)
            if current is None:
                continue

            if direction in ("forward", "both"):
                for ref_id in current.references:
                    edge_set.add((current_id, ref_id))
                    if ref_id not in visited:
                        ref = self.get_by_id(ref_id)
                        if ref and not ref.is_expired():
                            visited.add(ref_id)
                            nodes.append((ref, hop + 1))
                            queue.append((ref_id, hop + 1))

            if direction in ("backward", "both"):
                for rev in self.get_referencing_entries(current_id):
                    edge_set.add((rev.knowledge_id, current_id))
                    if rev.knowledge_id not in visited:
                        visited.add(rev.knowledge_id)
                        nodes.append((rev, hop + 1))
                        queue.append((rev.knowledge_id, hop + 1))

        edges = list(edge_set)
        return nodes, edges

    def full_graph(self) -> tuple[list[KnowledgeEntry], list[tuple[str, str]]]:
        """Return all non-expired entries and all reference edges."""
        entries = self.get_all()
        id_set = {e.knowledge_id for e in entries}
        edges: set[tuple[str, str]] = set()
        for e in entries:
            for ref_id in e.references:
                if ref_id in id_set:
                    edges.add((e.knowledge_id, ref_id))
        return entries, list(edges)

    # ------------------------------------------------------------------
    def get_all(self) -> list[KnowledgeEntry]:
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

    # ------------------------------------------------------------------
    # Disk persistence
    # ------------------------------------------------------------------

    def _save_snapshot(self) -> None:
        if not self._snapshot_path:
            return
        try:
            self._snapshot_path.parent.mkdir(parents=True, exist_ok=True)
            data = [e.model_dump() for e in self._entries]
            self._snapshot_path.write_text(json.dumps(data), encoding="utf-8")
        except Exception as exc:
            logger.error("Failed to save knowledge snapshot: %s", exc)

    def _load_snapshot(self) -> None:
        if not self._snapshot_path or not self._snapshot_path.exists():
            return
        try:
            data = json.loads(self._snapshot_path.read_text(encoding="utf-8"))
            for raw in data:
                entry = KnowledgeEntry(**raw)
                self._entries.append(entry)
                if self._use_faiss and entry.embedding:
                    import numpy as np  # type: ignore
                    vec = np.array([entry.embedding], dtype="float32")
                    self._index.add(vec)
            logger.info("Loaded %d knowledge entries from snapshot.", len(self._entries))
        except Exception as exc:
            logger.error("Failed to load knowledge snapshot: %s", exc)


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
        from app.config import settings
        snapshot_path = Path(settings.data_dir) / "knowledge_store.json"
        _store = VectorStore(snapshot_path=snapshot_path)
    return _store
