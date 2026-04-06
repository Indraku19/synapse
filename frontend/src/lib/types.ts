// Core data models — mirrors the backend Pydantic schemas and synapse_tdd.md

export interface KnowledgeEntry {
  knowledge_id: string;
  content: string;
  source: string;
  timestamp: string;
  agent_id: string;
  confidence_score: number;
  hash: string;
  cid?: string | null;        // 0G Storage content identifier
  on_chain?: boolean;         // true when hash is verified on 0G Chain
  namespace?: string | null;  // knowledge domain; null = global pool
  // Phase 2 — trust
  trust_score?: number;       // 1.0 + use_count * 0.1, capped at 2.0
  use_count?: number;         // times marked as useful by agents
  // Phase 3 — knowledge graph
  references?: string[];      // knowledge_ids this entry builds upon
  // Phase 4 — TTL
  expires_at?: string | null; // ISO datetime; null = no expiry
}

export interface StoreKnowledgeRequest {
  agent_id: string;
  content: string;
  source: string;
  namespace?: string | null;
  references?: string[];
  ttl_days?: number | null;
}

export interface StoreKnowledgeResponse {
  knowledge_id: string;
  status: "stored" | "error";
  hash?: string;
  cid?: string | null;
  on_chain?: boolean;
}

export interface QueryKnowledgeRequest {
  query: string;
  top_k: number;
  namespace?: string | null;
}

export interface QueryResult {
  knowledge_id: string;
  content: string;
  source: string;
  agent_id: string;
  confidence_score: number;
  timestamp: string;
  namespace?: string | null;
  trust_score?: number;
  use_count?: number;
  references?: string[];
  expires_at?: string | null;
}

export interface QueryKnowledgeResponse {
  results: QueryResult[];
}

export interface NamespacesResponse {
  namespaces: string[];
  global_entries: number;
}

export interface NetworkStats {
  total_entries: number;
  unique_agents: number;
  total_queries: number;
  on_chain_entries: number;
  stored_in_0g: number;
  total_useful_votes?: number;
  linked_entries?: number;
  expiring_entries?: number;
  ws_connections?: number;
  last_knowledge_id: string | null;
  last_timestamp: string | null;
  last_agent_id: string | null;
}

export interface LiveFeedEvent {
  type: "knowledge_stored";
  knowledge_id: string;
  agent_id: string;
  namespace: string | null;
  timestamp: string;
  content_preview: string;
  cid?: string | null;
  on_chain?: boolean;
  expires_at?: string | null;
}

export interface UsefulResponse {
  knowledge_id: string;
  use_count: number;
  trust_score: number;
}
