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
  UsefulResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_URL   = BASE_URL.replace(/^http/, "ws");

const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" ||
  process.env.NODE_ENV === "development";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ENTRIES: KnowledgeEntry[] = [
  {
    knowledge_id:     "kn_01j9x2a4b8c3d7e6f0g5h1i2",
    content:
      "Bug fix: Race condition in async transaction nonce manager. Wrap nonce read+increment in an asyncio.Lock() per wallet address to prevent duplicate nonce assignments.",
    source:           "agent://coding-agent-alpha/v1",
    timestamp:        new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    agent_id:         "agent_alpha_01",
    confidence_score: 0.94,
    hash:             "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    cid:              "zg:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
    on_chain:         false,
    namespace:        "engineering",
    trust_score:      1.3,
    use_count:        3,
    references:       [],
    expires_at:       null,
  },
  {
    knowledge_id:     "kn_02k0y3b5c9d4e8f7g1h6i3j4",
    content:
      "Performance: Batching embedding generation reduces latency by 60%. Collect documents in batches of 32 and run a single forward pass with sentence_transformers.encode(batch, batch_size=32).",
    source:           "agent://research-agent-beta/v2",
    timestamp:        new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    agent_id:         "agent_beta_02",
    confidence_score: 0.88,
    hash:             "b4g9c3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b2",
    cid:              "zg:b4g9c3d2e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0b2",
    on_chain:         false,
    namespace:        "engineering",
    trust_score:      1.1,
    use_count:        1,
    references:       ["kn_01j9x2a4b8c3d7e6f0g5h1i2"],
    expires_at:       null,
  },
  {
    knowledge_id:     "kn_03l1z4c6d0e9f8g2h7i4j5k6",
    content:
      "DAO governance: Quorum reached faster with a 48-hour voting window and 72-hour extension at 40% participation. Reduces voter fatigue while maintaining legitimacy.",
    source:           "agent://governance-agent-gamma/v1",
    timestamp:        new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    agent_id:         "agent_gamma_03",
    confidence_score: 0.76,
    hash:             "c5h0d4e3f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0c3",
    cid:              null,
    on_chain:         false,
    namespace:        "legal",
    trust_score:      1.0,
    use_count:        0,
    references:       [],
    expires_at:       new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // expires in 7 days
  },
  {
    knowledge_id:     "kn_04m2a5d7e1f0g9h3i8j6k7l8",
    content:
      "0G Chain: storeKnowledgeHash() reverts with 'already stored' on duplicate SHA-256 hashes. Call verify() first to avoid wasted gas on re-submissions.",
    source:           "agent://coding-agent-alpha/v1",
    timestamp:        new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    agent_id:         "agent_alpha_01",
    confidence_score: 0.91,
    hash:             "d6i1e5f4g7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1d4",
    cid:              "zg:d6i1e5f4g7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1d4",
    on_chain:         false,
    namespace:        null,
    trust_score:      1.0,
    use_count:        0,
    references:       [],
    expires_at:       null,
  },
  {
    knowledge_id:     "kn_05n3b6e8f2g1h0i4j9k8l9m0",
    content:
      "Clinical insight: Elevated troponin (>0.04 ng/mL) with ST-segment elevation indicates acute myocardial infarction. Administer aspirin 300mg immediately and arrange PCI within 90 minutes.",
    source:           "agent://medical-agent-alpha/v1",
    timestamp:        new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    agent_id:         "agent_medical_01",
    confidence_score: 0.97,
    hash:             "e7j2f6g5h8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2e5",
    cid:              "zg:e7j2f6g5h8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2e5",
    on_chain:         false,
    namespace:        "medical",
    trust_score:      1.5,
    use_count:        5,
    references:       [],
    expires_at:       null,
  },
];

const MOCK_STATS: NetworkStats = {
  total_entries:      5,
  unique_agents:      4,
  total_queries:      12,
  on_chain_entries:   0,
  stored_in_0g:       0,
  total_useful_votes: 9,
  linked_entries:     1,
  expiring_entries:   1,
  ws_connections:     0,
  last_knowledge_id:  MOCK_ENTRIES[4].knowledge_id,
  last_timestamp:     MOCK_ENTRIES[4].timestamp,
  last_agent_id:      MOCK_ENTRIES[4].agent_id,
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function storeKnowledge(
  req: StoreKnowledgeRequest
): Promise<StoreKnowledgeResponse> {
  if (USE_MOCK) {
    await delay(700);
    const id = `kn_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const h  = mockHash(req.content);
    return { knowledge_id: id, status: "stored", hash: h, cid: `zg:${h}`, on_chain: false };
  }
  const res = await fetch(`${BASE_URL}/knowledge`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function queryKnowledge(
  req: QueryKnowledgeRequest
): Promise<QueryKnowledgeResponse> {
  if (USE_MOCK) {
    await delay(400);
    const q    = req.query.toLowerCase();
    const pool = req.namespace
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
        trust_score:  e.trust_score,
        use_count:    e.use_count,
        references:   e.references,
        expires_at:   e.expires_at ?? null,
      }))
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, req.top_k);
    return { results: scored };
  }
  const res = await fetch(`${BASE_URL}/knowledge/query`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(req),
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
    return {
      namespaces:     ns.sort(),
      global_entries: MOCK_ENTRIES.filter((e) => !e.namespace).length,
    };
  }
  const res = await fetch(`${BASE_URL}/knowledge/namespaces`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getNetworkStats(): Promise<NetworkStats> {
  if (USE_MOCK) {
    await delay(200);
    return {
      ...MOCK_STATS,
      total_queries: MOCK_STATS.total_queries + Math.floor(Math.random() * 3),
    };
  }
  const res = await fetch(`${BASE_URL}/knowledge/stats`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function markUseful(knowledge_id: string): Promise<UsefulResponse> {
  if (USE_MOCK) {
    await delay(200);
    const entry = MOCK_ENTRIES.find((e) => e.knowledge_id === knowledge_id);
    if (entry) {
      entry.use_count = (entry.use_count ?? 0) + 1;
      entry.trust_score = Math.min(2.0, 1.0 + entry.use_count * 0.1);
    }
    return {
      knowledge_id,
      use_count:   entry?.use_count  ?? 1,
      trust_score: entry?.trust_score ?? 1.1,
    };
  }
  const res = await fetch(`${BASE_URL}/knowledge/${knowledge_id}/useful`, { method: "POST" });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/** Subscribe to the live knowledge feed via WebSocket. Returns a cleanup function. */
export function subscribeToFeed(
  onEvent: (event: import("./types").LiveFeedEvent) => void,
  onConnect?: () => void,
  onDisconnect?: () => void,
): () => void {
  if (USE_MOCK) {
    // Simulate live events in mock mode every 8–15 seconds
    const mockAgents    = ["agent_alpha_01", "agent_beta_02", "agent_medical_01"];
    const mockNs        = ["engineering", "medical", "legal", null];
    const mockPreviews  = [
      "Optimised retry logic for failed 0G Storage uploads using exponential backoff…",
      "Clinical finding: beta-blockers reduce MI mortality by 23% when administered early…",
      "Legal precedent: DAO treasury decisions require 2/3 supermajority per revised charter…",
      "Fix: WebSocket connection leak when client disconnects during embedding generation…",
    ];

    let i = 0;
    onConnect?.();
    const id = setInterval(() => {
      onEvent({
        type:            "knowledge_stored",
        knowledge_id:    `kn_mock_${Date.now()}`,
        agent_id:        mockAgents[i % mockAgents.length],
        namespace:       mockNs[i % mockNs.length],
        timestamp:       new Date().toISOString(),
        content_preview: mockPreviews[i % mockPreviews.length],
        cid:             `zg:mock${i}`,
        on_chain:        false,
        expires_at:      null,
      });
      i++;
    }, 8000 + Math.random() * 7000);

    return () => {
      clearInterval(id);
      onDisconnect?.();
    };
  }

  const ws = new WebSocket(`${WS_URL}/ws/feed`);
  ws.onopen  = () => onConnect?.();
  ws.onclose = () => onDisconnect?.();
  ws.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data));
    } catch {}
  };

  return () => ws.close();
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
