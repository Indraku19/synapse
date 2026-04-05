/**
 * Synapse API client.
 * Falls back to mock data when NEXT_PUBLIC_USE_MOCK=true
 * or when NODE_ENV is development and the backend is not running.
 */
import type {
  StoreKnowledgeRequest,
  StoreKnowledgeResponse,
  QueryKnowledgeRequest,
  QueryKnowledgeResponse,
  KnowledgeEntry,
  NetworkStats,
  NamespacesResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: KnowledgeEntry[] = [
  {
    knowledge_id: "kn_01j9x2a4b8c3d7e6f0g5h1i2",
    content:
      "Bug fix: Race condition in async transaction nonce manager. Wrap nonce read+increment in an asyncio.Lock() per wallet address to prevent duplicate nonce assignments.",
    source: "agent://coding-agent-alpha/v1",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    agent_id: "agent_alpha_01",
    confidence_score: 0.94,
    hash: "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    cid: "zg:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    on_chain: false,
    namespace: "engineering",
  },
  {
    knowledge_id: "kn_02k0y3b5c9d4e8f7g1h6i3j4",
    content:
      "Performance: Batching embedding generation reduces latency by 60%. Collect documents in batches of 32 and run a single forward pass with sentence_transformers.encode(batch, batch_size=32).",
    source: "agent://research-agent-beta/v2",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    agent_id: "agent_beta_02",
    confidence_score: 0.88,
    hash: "b4g9c3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b2",
    cid: "zg:b4g9c3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b2",
    on_chain: false,
    namespace: "engineering",
  },
  {
    knowledge_id: "kn_03l1z4c6d0e9f8g2h7i4j5k6",
    content:
      "DAO governance: Quorum reached faster with a 48-hour voting window and 72-hour extension at 40% participation. Reduces voter fatigue while maintaining legitimacy.",
    source: "agent://governance-agent-gamma/v1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    agent_id: "agent_gamma_03",
    confidence_score: 0.76,
    hash: "c5h0d4e3f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0c3",
    cid: null,
    on_chain: false,
    namespace: "legal",
  },
  {
    knowledge_id: "kn_04m2a5d7e1f0g9h3i8j6k7l8",
    content:
      "0G Chain: storeKnowledgeHash() reverts with 'already stored' on duplicate SHA-256 hashes. Call verify() first to avoid wasted gas on re-submissions.",
    source: "agent://coding-agent-alpha/v1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    agent_id: "agent_alpha_01",
    confidence_score: 0.91,
    hash: "d6i1e5f4g7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1d4",
    cid: "zg:d6i1e5f4g7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1d4",
    on_chain: false,
    namespace: null,
  },
  {
    knowledge_id: "kn_05n3b6e8f2g1h0i4j9k8l9m0",
    content:
      "Clinical insight: Elevated troponin (>0.04 ng/mL) with ST-segment elevation indicates acute myocardial infarction. Administer aspirin 300mg immediately and arrange PCI within 90 minutes.",
    source: "agent://medical-agent-alpha/v1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    agent_id: "agent_medical_01",
    confidence_score: 0.97,
    hash: "e7j2f6g5h8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2e5",
    cid: "zg:e7j2f6g5h8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2e5",
    on_chain: false,
    namespace: "medical",
  },
];

const MOCK_STATS: NetworkStats = {
  total_entries:    4,
  unique_agents:    3,
  total_queries:    12,
  on_chain_entries: 0,
  stored_in_0g:     0,
  last_knowledge_id: MOCK_ENTRIES[3].knowledge_id,
  last_timestamp:    MOCK_ENTRIES[3].timestamp,
  last_agent_id:     MOCK_ENTRIES[3].agent_id,
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function storeKnowledge(
  req: StoreKnowledgeRequest
): Promise<StoreKnowledgeResponse> {
  if (USE_MOCK) {
    await delay(700);
    const id  = `kn_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const h   = mockHash(req.content);
    return { knowledge_id: id, status: "stored", hash: h, cid: `zg:${h}`, on_chain: false };
  }
  const res = await fetch(`${BASE_URL}/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function queryKnowledge(
  req: QueryKnowledgeRequest
): Promise<QueryKnowledgeResponse> {
  if (USE_MOCK) {
    await delay(400);
    const q      = req.query.toLowerCase();
    const pool   = req.namespace
      ? MOCK_ENTRIES.filter((e) => e.namespace === req.namespace)
      : MOCK_ENTRIES;
    const scored = pool
      .map((e) => ({
        knowledge_id:     e.knowledge_id,
        content:          e.content,
        source:           e.source,
        agent_id:         e.agent_id,
        timestamp:        e.timestamp,
        namespace:        e.namespace ?? null,
        confidence_score:
          e.content.toLowerCase().includes(q) || e.source.toLowerCase().includes(q)
            ? e.confidence_score
            : Math.max(0.1, e.confidence_score - 0.35),
      }))
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, req.top_k);
    return { results: scored };
  }
  const res = await fetch(`${BASE_URL}/knowledge/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function listKnowledge(): Promise<KnowledgeEntry[]> {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_ENTRIES;
  }
  const res = await fetch(`${BASE_URL}/knowledge`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function listNamespaces(): Promise<NamespacesResponse> {
  if (USE_MOCK) {
    await delay(150);
    const ns = [...new Set(MOCK_ENTRIES.map((e) => e.namespace).filter(Boolean))] as string[];
    return { namespaces: ns.sort(), global_entries: MOCK_ENTRIES.filter((e) => !e.namespace).length };
  }
  const res = await fetch(`${BASE_URL}/knowledge/namespaces`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getNetworkStats(): Promise<NetworkStats> {
  if (USE_MOCK) {
    await delay(200);
    // Increment mock query count slightly to feel live
    return { ...MOCK_STATS, total_queries: MOCK_STATS.total_queries + Math.floor(Math.random() * 3) };
  }
  const res = await fetch(`${BASE_URL}/knowledge/stats`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockHash(content: string): string {
  let h = 0;
  for (let i = 0; i < content.length; i++) {
    h = (Math.imul(31, h) + content.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0").repeat(8).slice(0, 64);
}
