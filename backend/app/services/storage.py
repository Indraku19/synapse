"""
Storage service — orchestrates the full persistence pipeline.

Flow for each knowledge entry:
  1.  Add to in-process FAISS vector store (always — enables local queries).
  2.  Upload JSON blob to 0G Storage (when USE_ZG_STORAGE=true).
      → entry.cid is populated with the returned root hash.
  3.  Write verification hash to 0G Chain (when USE_ZG_CHAIN=true).
      → entry.on_chain is set to True on success.

Local mode (default) skips steps 2 & 3, using mock CIDs so the rest
of the pipeline always has a value.
"""
from __future__ import annotations

import logging

from app.config import settings
from app.models.knowledge import KnowledgeEntry
from app.services.vector_store import get_store
from app.services.zg_storage import upload_knowledge

logger = logging.getLogger(__name__)


async def persist_knowledge(entry: KnowledgeEntry) -> None:
    """
    Full persistence pipeline. Mutates entry in-place with cid / on_chain.
    """
    # Step 1 — local vector store (always required for queries)
    store = get_store()

    # Step 2 — 0G Storage upload (real or mock)
    entry_dict = {
        "knowledge_id":    entry.knowledge_id,
        "content":         entry.content,
        "source":          entry.source,
        "timestamp":       entry.timestamp,
        "agent_id":        entry.agent_id,
        "confidence_score": entry.confidence_score,
        "hash":            entry.hash,
    }
    try:
        cid = await upload_knowledge(entry_dict)
        entry.cid = cid
        logger.info("Knowledge persisted to storage. CID: %s", cid)
    except Exception as exc:
        logger.error("Storage upload failed — continuing without CID: %s", exc)

    # Step 3 — 0G Chain write
    if settings.use_0g_chain:
        await _chain_write(entry)

    # Add to vector store after CID is populated
    store.add(entry)
    logger.info("Knowledge added to vector store: %s", entry.knowledge_id)


async def _chain_write(entry: KnowledgeEntry) -> None:
    """
    Submit knowledge verification hash to KnowledgeRegistry on 0G Chain.
    Imported lazily to avoid requiring web3 when chain is disabled.
    """
    try:
        from app.services.zg_chain import store_knowledge_hash  # noqa: PLC0415
        tx_hash = await store_knowledge_hash(
            content_hash=entry.hash,
            agent_id=entry.agent_id,
            knowledge_id=entry.knowledge_id,
            cid=entry.cid or "",
        )
        entry.on_chain = True
        logger.info("[0G Chain] Hash stored. tx: %s", tx_hash)
    except Exception as exc:
        logger.error("[0G Chain] Write failed: %s", exc)
