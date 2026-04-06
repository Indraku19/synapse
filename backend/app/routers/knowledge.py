"""
Knowledge router — implements the core API endpoints defined in synapse_tdd.md §7.

  POST /knowledge                     — store a knowledge object
  POST /knowledge/query               — semantic search
  GET  /knowledge                     — list all entries (Explorer page)
  GET  /knowledge/stats               — protocol-level statistics (Network page)
  GET  /knowledge/namespaces          — list active namespaces
  POST /knowledge/{id}/useful         — mark a knowledge entry as useful (trust vote)
  GET  /knowledge/{id}/links          — get an entry and all entries it references
"""
from fastapi import APIRouter, HTTPException

from app.models.knowledge import (
    KnowledgeEntry,
    StoreKnowledgeRequest,
    StoreKnowledgeResponse,
    QueryKnowledgeRequest,
    QueryKnowledgeResponse,
    QueryResult,
    compute_expires_at,
)
from app.services.embedding    import generate_embedding
from app.services.hashing      import hash_content
from app.services.storage      import persist_knowledge
from app.services.vector_store import get_store
from app.services.websocket    import ws_manager

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
      4. Broadcast to WebSocket subscribers (live feed).
    """
    embedding    = generate_embedding(req.content)
    content_hash = hash_content(req.content)

    entry = KnowledgeEntry(
        content=req.content,
        embedding=embedding,
        source=req.source,
        agent_id=req.agent_id,
        hash=content_hash,
        namespace=req.namespace,
        references=req.references,
        expires_at=compute_expires_at(req.ttl_days),
    )

    await persist_knowledge(entry)

    # Broadcast to all live-feed WebSocket subscribers
    await ws_manager.broadcast({
        "type":            "knowledge_stored",
        "knowledge_id":    entry.knowledge_id,
        "agent_id":        entry.agent_id,
        "namespace":       entry.namespace,
        "timestamp":       entry.timestamp,
        "content_preview": entry.content[:120],
        "cid":             entry.cid,
        "on_chain":        entry.on_chain,
        "expires_at":      entry.expires_at,
    })

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
    hits  = store.search(query_embedding, top_k=req.top_k, namespace=req.namespace)

    results: list[QueryResult] = [
        entry.to_query_result(score) for entry, score in hits
    ]
    return QueryKnowledgeResponse(results=results)


@router.post("/{knowledge_id}/useful", status_code=200)
async def mark_useful(knowledge_id: str):
    """
    Mark a knowledge entry as useful.
    Increments use_count and raises trust_score by 0.1 (capped at 2.0).
    Agents call this after successfully applying knowledge from a query result.
    """
    store = get_store()
    entry = store.mark_useful(knowledge_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    return {
        "knowledge_id": entry.knowledge_id,
        "use_count":    entry.use_count,
        "trust_score":  entry.trust_score,
    }


@router.get("/{knowledge_id}/links")
async def get_knowledge_links(knowledge_id: str):
    """
    Return a knowledge entry and all entries it references (one hop).
    Enables graph traversal of chained insights.
    """
    store = get_store()
    entry = store.get_by_id(knowledge_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")

    referenced = []
    for ref_id in entry.references:
        ref = store.get_by_id(ref_id)
        if ref:
            referenced.append({
                "knowledge_id":    ref.knowledge_id,
                "content":         ref.content,
                "agent_id":        ref.agent_id,
                "source":          ref.source,
                "timestamp":       ref.timestamp,
                "namespace":       ref.namespace,
                "trust_score":     ref.trust_score,
            })

    return {
        "entry": {
            "knowledge_id": entry.knowledge_id,
            "content":      entry.content,
            "agent_id":     entry.agent_id,
            "namespace":    entry.namespace,
            "references":   entry.references,
            "trust_score":  entry.trust_score,
        },
        "referenced_entries": referenced,
        "reference_count":    len(referenced),
    }


@router.get("/stats")
async def get_stats():
    """
    Protocol statistics for the Network dashboard page.
    """
    store   = get_store()
    entries = store.get_all()

    unique_agents  = {e.agent_id for e in entries}
    on_chain_count = sum(1 for e in entries if e.on_chain)
    stored_in_0g   = sum(1 for e in entries if e.cid and not e.cid.startswith("zg:"))
    total_useful   = sum(e.use_count for e in entries)
    linked_entries = sum(1 for e in entries if e.references)
    expiring_soon  = sum(
        1 for e in entries
        if e.expires_at is not None
    )

    last_entry = entries[-1] if entries else None

    return {
        "total_entries":     store.count,
        "unique_agents":     len(unique_agents),
        "total_queries":     _query_count,
        "on_chain_entries":  on_chain_count,
        "stored_in_0g":      stored_in_0g,
        "total_useful_votes":total_useful,
        "linked_entries":    linked_entries,
        "expiring_entries":  expiring_soon,
        "ws_connections":    ws_manager.connection_count,
        "last_knowledge_id": last_entry.knowledge_id if last_entry else None,
        "last_timestamp":    last_entry.timestamp    if last_entry else None,
        "last_agent_id":     last_entry.agent_id     if last_entry else None,
    }


@router.get("/namespaces")
async def list_namespaces():
    """
    Return all distinct namespaces currently stored in the network.
    None entries are labelled as 'global'.
    Used by frontends to let agents discover available knowledge domains.
    """
    store   = get_store()
    entries = store.get_all()
    namespaces = sorted({e.namespace for e in entries if e.namespace})
    return {
        "namespaces":     namespaces,
        "global_entries": sum(1 for e in entries if e.namespace is None),
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
            "namespace":        e.namespace,
            "trust_score":      e.trust_score,
            "use_count":        e.use_count,
            "references":       e.references,
            "expires_at":       e.expires_at,
        }
        for e in entries
    ]
