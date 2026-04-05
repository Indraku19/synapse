"""
Pydantic data models for knowledge objects.
Matches the data model defined in synapse_tdd.md §6.
"""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
import uuid


# ---------------------------------------------------------------------------
# Request / Response schemas (API surface)
# ---------------------------------------------------------------------------

class StoreKnowledgeRequest(BaseModel):
    agent_id: str           = Field(..., description="Unique identifier of the submitting agent")
    content: str            = Field(..., min_length=1, description="Knowledge text content")
    source: str             = Field(..., description="URI or label identifying the knowledge origin")
    namespace: Optional[str] = Field(None, description="Knowledge domain/role namespace (e.g. 'medical', 'legal'). None = global pool.")


class StoreKnowledgeResponse(BaseModel):
    knowledge_id: str
    status: str = "stored"
    hash: Optional[str] = None
    cid: Optional[str] = None          # 0G Storage content identifier
    on_chain: bool = False             # True when hash was written to 0G Chain


class QueryKnowledgeRequest(BaseModel):
    query: str            = Field(..., min_length=1, description="Natural-language search query")
    top_k: int            = Field(5, ge=1, le=50, description="Number of results to return")
    namespace: Optional[str] = Field(None, description="Filter results to this namespace only. None = search global pool.")


class QueryResult(BaseModel):
    knowledge_id: str
    content: str
    source: str
    agent_id: str
    confidence_score: float
    timestamp: str
    namespace: Optional[str] = None


class QueryKnowledgeResponse(BaseModel):
    results: list[QueryResult]


# ---------------------------------------------------------------------------
# Internal / storage model
# ---------------------------------------------------------------------------

class KnowledgeEntry(BaseModel):
    """Full knowledge object stored internally and in 0G Storage."""
    knowledge_id: str             = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    embedding: list[float]        = Field(default_factory=list)
    source: str
    timestamp: str                = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    agent_id: str
    confidence_score: float       = 1.0
    hash: str                     = ""
    cid: Optional[str]            = None   # 0G Storage content identifier
    on_chain: bool                = False  # True after successful chain write
    namespace: Optional[str]      = None   # Domain namespace (e.g. "medical", "legal"); None = global pool

    def to_query_result(self, score: float) -> QueryResult:
        return QueryResult(
            knowledge_id=self.knowledge_id,
            content=self.content,
            source=self.source,
            agent_id=self.agent_id,
            confidence_score=score,
            timestamp=self.timestamp,
            namespace=self.namespace,
        )


# ---------------------------------------------------------------------------
# Agent model
# ---------------------------------------------------------------------------

class AgentRecord(BaseModel):
    agent_id: str     = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_name: str
    developer: str
    created_at: str   = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
