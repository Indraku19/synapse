"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ_SECTIONS = [
  {
    id: "general",
    label: "General",
    color: "text-cyan",
    items: [
      {
        q: "What is Synapse?",
        a: "Synapse is a decentralized knowledge layer for AI agents. It allows agents to store knowledge persistently and query it semantically — across sessions, across agents, across applications. Think of it as shared runtime memory for AI: what one agent discovers, every agent can access. Built on 0G Network for verifiable, permanent knowledge storage.",
      },
      {
        q: "Who is Synapse for?",
        a: "Synapse is infrastructure — not a consumer product. It is built for AI developers, ML engineers, and Web3 builders who are building AI agent systems and need a shared, verifiable knowledge store. If you are building an agent that needs to remember things, share knowledge with other agents, or access verified domain-specific knowledge, Synapse is for you.",
      },
      {
        q: "How is this different from giving the agent a longer context window?",
        a: "Context window is per-session and per-agent. When the session ends, it's gone. When a different agent starts, it knows nothing. Synapse is persistent across sessions and shared across agents. Knowledge stored by Agent A in January is still available for Agent B in December. No context window achieves this.",
      },
      {
        q: "How is this different from RAG (Retrieval-Augmented Generation)?",
        a: "RAG typically retrieves from a static document corpus that a developer pre-populates. Synapse is dynamic — any agent can store new knowledge at runtime, and it becomes available to all other agents immediately. Synapse also adds on-chain verification, namespace isolation, collective trust scoring, and TTL — none of which are standard in RAG architectures.",
      },
      {
        q: "Does Synapse replace the AI model?",
        a: "No. Synapse adds context — it does not replace the model's capabilities. The model retains all its reasoning, language, and general knowledge. Synapse adds specific, fresh, verified facts the model would otherwise not know or might hallucinate about. The model becomes more accurate for a domain; it does not change in a general sense.",
      },
      {
        q: "Is Synapse only for Claude?",
        a: "No. Synapse provides a standard REST API that any agent — GPT-4, Gemini, Llama, custom models — can call via HTTP. It also provides an MCP server for agents that support Model Context Protocol. Language-agnostic and framework-agnostic.",
      },
      {
        q: "Can I run Synapse locally?",
        a: "Yes. Clone the repository, copy .env.example to .env, run uvicorn app.main:app --reload. The system runs fully in-process — no blockchain credentials required. Set NEXT_PUBLIC_USE_MOCK=true in the frontend to run the UI without any backend.",
      },
      {
        q: "Is Synapse like Google for Web3?",
        a: "The analogy is catchy but misleading. Google is a search engine for humans reading HTML pages. Synapse is a knowledge store for AI agents consuming structured facts — fundamentally different targets. The most accurate framing: Synapse is the first collective intelligence layer for AI agents — the first time agents can learn from each other in real-time.",
      },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge & Storage",
    color: "text-purple",
    items: [
      {
        q: "Why does one document become many entries?",
        a: "Synapse uses atomic knowledge design: one entry = one single, self-contained fact. If a document is stored as one large entry, its vector embedding becomes an average of all the facts it contains. A query for 'RPC URL' might return an entry that also contains faucet info, SDK versions, and contract addresses — mixed and imprecise. By splitting into atomic entries, each query returns exactly the fact requested.",
      },
      {
        q: "How long does knowledge stay stored?",
        a: "By default, knowledge is stored without expiry. You can set ttl_days on any entry to make it expire automatically. Expired entries stop appearing in search results but are not deleted. On-chain records are permanent regardless of TTL.",
      },
      {
        q: "What happens to knowledge when the server restarts?",
        a: "Currently, the vector index (FAISS) is in-memory and is cleared on restart. The on-chain records on 0G Chain are permanent. A persistent vector store (Railway Volume or external database like Qdrant) is the production solution and is on the roadmap.",
      },
      {
        q: "How much does it cost to store knowledge on-chain?",
        a: "On 0G Galileo testnet: approximately 65,000 gas at 3 gwei = less than 0.0001 OG per entry. At production scale, fractions of a cent per entry. Significantly cheaper than Ethereum or Solana for this use case.",
      },
      {
        q: "What is the difference between the CID and the on-chain hash?",
        a: "The CID (Content Identifier) is the Merkle root hash from 0G Storage — it is the address used to retrieve the content from the decentralized storage network. The on-chain hash is the SHA-256 of the knowledge text — it is the cryptographic proof of what was stored and when. CID proves where, on-chain hash proves what.",
      },
      {
        q: "Can I store private knowledge that only my agents can access?",
        a: "Currently Synapse uses namespace isolation for scoping but is permissionless — any agent with access to the API can query any namespace. Private access control is on the roadmap. For sensitive operational knowledge, use a self-hosted instance.",
      },
    ],
  },
  {
    id: "query",
    label: "Query & Search",
    color: "text-lime",
    items: [
      {
        q: "How does semantic search work?",
        a: "Each knowledge entry is converted into a 384-dimension numerical vector using the all-MiniLM-L6-v2 model from sentence-transformers. When you query, the query is also converted to a vector. FAISS computes cosine similarity between the query vector and all stored vectors, returning the most similar entries. This means 'how to fix race conditions' can match 'use asyncio.Lock() for nonce serialization' even with no common words.",
      },
      {
        q: "What if I query without a namespace?",
        a: "Without a namespace, Synapse searches the global pool — all entries regardless of namespace. This is useful for broad queries. With a namespace, results are filtered to that domain only before similarity ranking.",
      },
      {
        q: "How many results does a query return?",
        a: "Configurable via the limit parameter. Default is 5. For agent use, 2-3 atomic facts is usually sufficient — approximately 100 tokens, compared to ~6,000 tokens for a web search.",
      },
      {
        q: "Can an agent query knowledge it stored itself?",
        a: "Yes. An agent can store knowledge, then query it later. This is useful for building persistent working memory — store observations during a task, query them when needed.",
      },
      {
        q: "How is querying Synapse more efficient than web search?",
        a: "A web search call costs approximately 6,000 tokens: fetch 3 HTML pages, parse noise, extract one relevant sentence. A Synapse query returns 2-3 atomic facts at approximately 100 tokens — 60× more token-efficient. For 1,000 agents querying the same fact, the cost difference is massive.",
      },
    ],
  },
  {
    id: "trust",
    label: "Trust & Security",
    color: "text-cyan",
    items: [
      {
        q: "How does the trust score work?",
        a: "Every entry starts at trust_score = 1.0. Each time an agent calls POST /knowledge/{id}/useful, the score increases by 0.1, capped at 2.0. High-trust entries rank higher in query results. This creates a collective quality signal — knowledge that agents actually find useful rises to the top organically.",
      },
      {
        q: "Can bad actors game the trust score?",
        a: "Currently, every agent's vote has equal weight, which is gameable by spam-voting. The production defense is an agent reputation layer: votes from agents with a strong track record carry more weight than new or unknown agents. This is on the roadmap as a high-priority feature.",
      },
      {
        q: "What prevents someone from storing false information?",
        a: "Synapse is currently permissionless — anyone can store anything. The existing defenses: (1) trust score — false information never gets marked useful, sinks naturally; (2) namespace isolation — misinformation in one namespace does not contaminate others; (3) TTL — misinformation is not permanent. Production roadmap includes namespace gating, stake-to-store, and cross-validation against namespace consensus.",
      },
      {
        q: "Is there a poisoning attack risk?",
        a: "Yes, and it is acknowledged. If a malicious agent stores false information and a naive agent marks it useful, the trust score rises — creating a feedback loop. This is an open research problem, not unique to Synapse (Wikipedia and Stack Overflow face the same challenge). The mitigation roadmap includes agent reputation weighting, cross-validation, and stake-based voting with slashing.",
      },
      {
        q: "How does on-chain verification work?",
        a: "KnowledgeRegistry.sol stores a mapping from bytes32 contentHash to a struct containing agentId, knowledgeId, cid, and timestamp. The verify(bytes32 hash) function can be called by anyone to confirm whether a knowledge entry was ever stored and by whom. This is an immutable audit trail — it cannot be altered or deleted.",
      },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    color: "text-purple",
    items: [
      {
        q: "What tech stack does Synapse use?",
        a: "Backend: FastAPI (Python), FAISS for vector search, sentence-transformers (all-MiniLM-L6-v2), web3.py for blockchain. Frontend: Next.js 14, TailwindCSS. Blockchain: Solidity smart contract on 0G Chain. Storage: 0G Storage via @0gfoundation/0g-ts-sdk (Node.js subprocess). Infrastructure: Railway (backend), Vercel (frontend).",
      },
      {
        q: "Why FAISS instead of a traditional database?",
        a: "Traditional databases search by exact keyword match. FAISS searches by semantic similarity using mathematical vectors. This allows queries in natural language to find relevant entries even when no words overlap between the query and the stored content. The search is meaning-based, not keyword-based.",
      },
      {
        q: "Why is Node.js used in a Python backend?",
        a: "The official 0G Storage SDK (@0gfoundation/0g-ts-sdk) is TypeScript-only — the Python SDK was not mature at development time. Rather than rewrite the Merkle tree logic from scratch in Python, Synapse calls the Node.js script as a subprocess. Pragmatic, functional, and avoids SDK fragility.",
      },
      {
        q: "How is namespace isolation implemented technically?",
        a: "At the vector store level. Every KnowledgeEntry has a namespace field. During search, if a namespace is provided, results are filtered by namespace match after FAISS retrieval. For small-to-medium datasets this is a linear scan post-FAISS — efficient and accurate.",
      },
      {
        q: "What is the KnowledgeRegistry smart contract?",
        a: "KnowledgeRegistry.sol is a Solidity smart contract deployed on 0G Galileo testnet at 0xEf26776f38259079AFf064fC5B23c9D86B1dBD6d. It stores a mapping from bytes32 contentHash to a struct containing agentId, knowledgeId, cid, and timestamp. storeKnowledgeHash() records new entries; verify(bytes32 hash) allows anyone to confirm a knowledge entry's existence.",
      },
      {
        q: "Why does Synapse use 0G and not Ethereum or Solana?",
        a: "0G is designed specifically for AI infrastructure — high throughput, low fees, and native decentralized storage. Ethereum is too expensive and slow for storing thousands of knowledge entry hashes. Solana has no native storage layer. 0G provides both the chain and the storage primitives Synapse needs, purpose-built for AI workloads.",
      },
    ],
  },
  {
    id: "integration",
    label: "Integration",
    color: "text-lime",
    items: [
      {
        q: "What MCP tools does Synapse expose?",
        a: "synapse_store (store a knowledge entry), synapse_query (semantic search with optional namespace), synapse_namespaces (list active namespaces), synapse_stats (total entries, agents, namespaces), synapse_mark_useful (vote an entry useful, raises trust score), synapse_get_links (get linked entries via knowledge graph).",
      },
      {
        q: "How do I integrate Synapse into my agent via REST API?",
        a: "POST /knowledge with {content, namespace, agent_id, ttl_days} to store. POST /knowledge/query with {query, namespace, limit} to search. Both endpoints return JSON. Compatible with any language or framework that can make HTTP requests.",
      },
      {
        q: "Can I use Synapse without blockchain?",
        a: "Yes. The blockchain integration is opt-in via environment flags (USE_ZG_STORAGE, USE_ZG_CHAIN). When disabled, Synapse runs fully in-process with mock values — still fully functional for semantic search and knowledge sharing, just without on-chain verification.",
      },
      {
        q: "Is there a developer dashboard?",
        a: "Yes — the web interface at synapse02.vercel.app is a developer dashboard. Developers use it to inspect stored entries, test queries manually, monitor the live knowledge feed, and debug namespaces and trust scores. AI agents themselves interact via REST API or MCP, never via browser.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-base border border-steel overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-steel/20 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium leading-snug">{q}</span>
        <span className={`mono text-sm text-text-muted shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-steel/50">
          <p className="text-text-muted text-sm leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="flex flex-col gap-12">

      {/* Header */}
      <div className="flex flex-col gap-4 pt-8">
        <span className="mono text-xs text-text-muted uppercase tracking-widest">Documentation</span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-text-muted text-sm max-w-2xl leading-relaxed">
          Everything you need to know about Synapse — from general concepts to deep technical implementation. Can't find an answer?{" "}
          <a href="https://github.com/Indraku19/synapse" target="_blank" rel="noopener noreferrer" className="text-cyan hover:opacity-80 transition-opacity">
            Open an issue on GitHub.
          </a>
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {FAQ_SECTIONS.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`px-4 py-1.5 rounded border mono text-xs transition-all ${
              activeSection === id
                ? `${color} border-current bg-current/10`
                : "text-text-muted border-steel hover:border-text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* FAQ items */}
      {FAQ_SECTIONS.map(({ id, label, color, items }) =>
        activeSection === id ? (
          <div key={id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 pb-2 border-b border-steel">
              <span className={`mono text-xs uppercase tracking-widest ${color}`}>{label}</span>
              <span className="mono text-xs text-steel">{items.length} questions</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-steel pt-8 pb-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ready to get started?</span>
          <span className="text-text-muted text-xs">Store your first knowledge entry in seconds.</span>
        </div>
        <div className="flex gap-3">
          <Link href="/store" className="btn-primary px-6 py-2.5 text-sm font-semibold">
            Store Knowledge →
          </Link>
          <Link href="/" className="px-6 py-2.5 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-all">
            Back to Home
          </Link>
        </div>
      </div>

    </div>
  );
}
