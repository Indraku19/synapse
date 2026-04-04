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
}

export interface StoreKnowledgeRequest {
  agent_id: string;
  content: string;
  source: string;
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
}

export interface QueryResult {
  knowledge_id: string;
  content: string;
  source: string;
  agent_id: string;
  confidence_score: number;
  timestamp: string;
}

export interface QueryKnowledgeResponse {
  results: QueryResult[];
}

export interface NetworkStats {
  total_entries: number;
  unique_agents: number;
  total_queries: number;
  on_chain_entries: number;
  stored_in_0g: number;
  last_knowledge_id: string | null;
  last_timestamp: string | null;
  last_agent_id: string | null;
}
