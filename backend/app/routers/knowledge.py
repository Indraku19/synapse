"""
Knowledge router — implements the core API endpoints defined in synapse_tdd.md §7.

  POST /knowledge          — store a knowledge object
  POST /knowledge/query    — semantic search
  GET  /knowledge          — list all entries (Explorer page)
  GET  /knowledge/stats    — protocol-level statistics (Network page)
"""
from fastapi import APIRouter

from app.models.knowledge import (
    KnowledgeEntry,
    StoreKnowledgeRequest,
    StoreKnowledgeResponse,
    QueryKnowledgeRequest,
    QueryKnowledgeResponse,
    QueryResult,
)
from app.services.embedding    import generate_embedding
from app.services.hashing      import hash_content
from app.services.storage      import persist_knowledge
from app.services.vector_store import get_store

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

# Simple in-process query counter (resets on restart — sufficient for demo)
_query_count: int = 0


@router.post("", response_model=StoreKnowledgeResponse, status_code=201)
async def store_knowledge(req: StoreKnowledgeRequest):
    """
    Store a knowledge object.

    Steps:
      1. Generate vector embedding.
      2. Generate SHA-256 hash of content.
      3. Persist: vector store → 0G Storage (CID) → 0G Chain (hash).
    """
    embedding    = generate_embedding(req.content)
    content_hash = hash_content(req.content)

    entry = KnowledgeEntry(
        content=req.content,
        embedding=embedding,
        source=req.source,
        agent_id=req.agent_id,
        hash=content_hash,
    )

    await persist_knowledge(entry)

    return StoreKnowledgeResponse(
        knowledge_id=entry.knowledge_id,
        status="stored",
        hash=content_hash,
        cid=entry.cid,
        on_chain=entry.on_chain,
    )


@router.post("/query", response_model=QueryKnowledgeResponse)
async def query_knowledge(req: QueryKnowledgeRequest):
    """
    Semantic search over stored knowledge.
    Results ranked by cosine similarity.
    """
    global _query_count
    _query_count += 1

    query_embedding = generate_embedding(req.query)
    store = get_store()
    hits  = store.search(query_embedding, top_k=req.top_k)

    results: list[QueryResult] = [
        entry.to_query_result(score) for entry, score in hits
    ]
    return QueryKnowledgeResponse(results=results)


@router.get("/stats")
async def get_stats():
    """
    Protocol statistics for the Network dashboard page.
    """
    store   = get_store()
    entries = store.get_all()

    unique_agents = {e.agent_id for e in entries}
    on_chain_count = sum(1 for e in entries if e.on_chain)
    stored_in_0g   = sum(1 for e in entries if e.cid and not e.cid.startswith("zg:"))

    last_entry = entries[-1] if entries else None

    return {
        "total_entries":      store.count,
        "unique_agents":      len(unique_agents),
        "total_queries":      _query_count,
        "on_chain_entries":   on_chain_count,
        "stored_in_0g":       stored_in_0g,
        "last_knowledge_id":  last_entry.knowledge_id if last_entry else None,
        "last_timestamp":     last_entry.timestamp    if last_entry else None,
        "last_agent_id":      last_entry.agent_id     if last_entry else None,
    }


@router.get("", response_model=list[dict])
async def list_knowledge():
    """
    Return all stored entries without embeddings (used by Explorer page).
    """
    store   = get_store()
    entries = store.get_all()
    return [
        {
            "knowledge_id":     e.knowledge_id,
            "content":          e.content,
            "source":           e.source,
            "timestamp":        e.timestamp,
            "agent_id":         e.agent_id,
            "confidence_score": e.confidence_score,
            "hash":             e.hash,
            "cid":              e.cid,
            "on_chain":         e.on_chain,
        }
        for e in entries
    ]
