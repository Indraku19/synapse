# Synapse

**A decentralized memory network enabling AI agents to share and verify knowledge.**

Synapse is an AI infrastructure layer that lets agents persist, share, and retrieve knowledge across applications — powered by [0G](https://0g.ai) decentralized storage and verifiable on-chain metadata.

---

## The Problem

Most AI agents store knowledge in isolated silos. When a session ends, the knowledge is lost. When a second agent faces the same problem, it starts from scratch. There is no shared layer, no verifiable provenance, and no way for agents to learn from each other.

Synapse solves this by turning agents into participants in a **collective intelligence network**.

---

## How It Works

```
Agent A  ──store──▶  Synapse API  ──▶  Vector Store (FAISS)
                                   ──▶  0G Storage  (CID)
                                   ──▶  0G Chain    (hash)

Agent B  ──query──▶  Synapse API  ──▶  Ranked results + match scores
```

1. **Agent A** generates knowledge (e.g. a bug fix, research finding, decision log)
2. Synapse embeds the content, hashes it, and stores it — both in FAISS (for fast semantic search) and on 0G Storage (for persistence)
3. A SHA-256 hash is written on-chain via `KnowledgeRegistry.sol` for verifiability
4. **Agent B** queries by topic — Synapse returns ranked results by cosine similarity

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TailwindCSS |
| Backend | FastAPI, Python 3.11+ |
| Embeddings | `all-MiniLM-L6-v2` via sentence-transformers |
| Vector Store | FAISS (in-process) |
| Decentralized Storage | 0G Storage node |
| On-chain Registry | 0G Chain (EVM) — `KnowledgeRegistry.sol` |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Indraku19/synapse.git
cd synapse
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App → [http://localhost:3000](http://localhost:3000)

> Set `NEXT_PUBLIC_USE_MOCK=true` in `frontend/.env` to run the UI without a backend (full mock API is built in).

---

## Demo: Cross-Agent Knowledge Sharing

```bash
# Terminal 1 — start backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 — Agent A stores knowledge
cd backend && python -m app.demo.agent_a

# Terminal 3 — Agent B retrieves it
cd backend && python -m app.demo.agent_b
```

Agent A stores knowledge into `engineering` and `medical` namespaces. Agent B queries each namespace separately — demonstrating that the same agent gets different knowledge depending on the role it is acting as, with zero context pollution between domains.

---

## Namespace — Context Isolation

Synapse supports **knowledge namespaces**: isolated domains that let a single agent switch roles without mixing knowledge from unrelated fields.

```
Agent (one instance)
  ├── query(namespace="medical")    → cardiac protocols, drug interactions
  ├── query(namespace="legal")      → case law, contract terms
  └── query(namespace="engineering") → bug fixes, optimization tips
```

When an agent queries a namespace, **only that domain's knowledge is returned** — the agent's context window stays clean and focused, making it a better specialist.

Omitting `namespace` searches the global pool across all domains (original behaviour, fully preserved).

### Store with namespace
```bash
curl -X POST http://localhost:8000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "my_agent",
    "content": "Elevated troponin indicates acute myocardial infarction.",
    "source": "agent://medical-agent/v1",
    "namespace": "medical"
  }'
```

### Query with namespace isolation
```bash
curl -X POST http://localhost:8000/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{"query": "cardiac diagnosis", "top_k": 5, "namespace": "medical"}'
```

### List available namespaces
```bash
curl http://localhost:8000/knowledge/namespaces
# → { "namespaces": ["engineering", "legal", "medical"], "global_entries": 2 }
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/knowledge` | Store a knowledge entry (optional `namespace`) |
| `POST` | `/knowledge/query` | Semantic search — optionally scoped to a namespace |
| `GET` | `/knowledge` | List all entries |
| `GET` | `/knowledge/namespaces` | List all active namespaces |
| `GET` | `/knowledge/stats` | Network statistics |
| `POST` | `/agents` | Register an agent |
| `GET` | `/agents` | List agents |
| `GET` | `/agents/{id}` | Get agent by ID |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `API_HOST` | `0.0.0.0` | Bind host |
| `API_PORT` | `8000` | Bind port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS origins (comma-separated) |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | sentence-transformers model |
| `VECTOR_STORE` | `faiss` | Vector store backend |
| `USE_ZG_STORAGE` | `false` | Enable real 0G Storage uploads |
| `ZG_STORAGE_ENDPOINT` | — | 0G Storage node URL |
| `USE_ZG_CHAIN` | `false` | Enable on-chain hash writes |
| `ZG_CHAIN_RPC` | — | 0G Chain RPC URL |
| `ZG_CHAIN_PRIVATE_KEY` | — | Wallet private key for signing TXs |
| `ZG_KNOWLEDGE_REGISTRY_ADDRESS` | — | Deployed `KnowledgeRegistry` address |

Both `USE_ZG_*` flags default to **false** — the system runs fully in-process with mock values. No 0G node access required to run the demo.

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Use built-in mock API (no backend needed) |

---

## Smart Contract

`contracts/KnowledgeRegistry.sol` — deployable to 0G Chain testnet.

```solidity
storeKnowledgeHash(bytes32 hash, string agentId, string knowledgeId, string cid)
verify(bytes32 hash) → bool
totalEntries() → uint256
hashAt(uint256 index) → bytes32
```

After deploying, set `ZG_KNOWLEDGE_REGISTRY_ADDRESS` in `backend/.env`.

---

## Tests

```bash
cd backend
pytest ../tests/backend/ -v                        # all tests (68 total)
pytest ../tests/backend/test_services.py -v        # unit tests (28)
pytest ../tests/backend/test_knowledge_api.py -v   # API integration (36)
pytest ../tests/backend/test_zg_storage.py -v      # 0G storage mock (4)
```

---

## Project Structure

```
synapse/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Pydantic settings
│   │   ├── models/knowledge.py  # KnowledgeEntry schema
│   │   ├── routers/             # knowledge + agents endpoints
│   │   ├── services/            # embedding, hashing, FAISS, 0G storage/chain
│   │   └── demo/                # agent_a.py + agent_b.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       │   ├── page.tsx         # Dashboard
│       │   ├── store/           # Store knowledge
│       │   ├── query/           # Query knowledge
│       │   ├── explorer/        # Browse entries
│       │   └── network/         # Network stats
│       ├── components/          # NavBar, KnowledgeCard
│       └── lib/                 # API client, types
├── contracts/
│   └── KnowledgeRegistry.sol
└── tests/
    └── backend/
```

---

## Roadmap

| Phase | Focus |
|---|---|
| Phase 1 (MVP) | Core store/query API, FAISS, 0G integration, demo |
| Phase 2 | Developer SDK for easy agent integration |
| Phase 3 | Knowledge graph indexing |
| Phase 4 | Agent reputation system |
| Phase 5 | Decentralized knowledge marketplace |

---

## License
Copyright (c) 2026 Muhammad Indra Kusuma. All rights reserved.                                              
                                                                                                
Source code is made available for viewing and evaluation purposes (hackathon judging) only. No use, copying or modification is permitted without explicit written permission from the author.