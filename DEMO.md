# Synapse — Demo Guide

**Tidak perlu API key. Tidak perlu akun 0G.** Semua integrasi 0G berjalan dalam mode mock secara default.

---

## Prasyarat

- Python 3.11+
- Node.js 18+
- pip

---

## Opsi A — Full Stack (Backend + Frontend)

Demo ini menunjukkan UI lengkap dengan koneksi WebSocket live feed.

### Langkah 1 — Setup Backend

```bash

  brew install python@3.12
  cd synapse/backend
  rm -rf .venv
  python3.12 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

```

Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

> File `.env` sudah berisi `USE_ZG_STORAGE=false` dan `USE_ZG_CHAIN=false`. Tidak perlu diubah.

### Langkah 2 — Jalankan Backend

> Pastikan venv aktif (ada `(.venv)` di prompt). Jika buka terminal baru: `source .venv/bin/activate`

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Tunggu hingga muncul log:

```
Synapse API v0.2.0 starting up.
0G Storage: local mock | 0G Chain: local mock
WebSocket live feed: ws://0.0.0.0:8000/ws/feed
```

Swagger UI tersedia di: http://localhost:8000/docs

### Langkah 3 — Setup Frontend

Buka terminal baru:

```bash
cd synapse/frontend
npm install
```

Buat file `.env.local`:

```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_USE_MOCK=false" >> .env.local
```

### Langkah 4 — Jalankan Frontend

```bash
npm run dev
```

Buka browser: http://localhost:3000

### Langkah 5 — Jalankan Demo Cross-Agent

Buka terminal ketiga:

```bash
cd synapse/backend
python -m app.demo.agent_a
```

Agent A menyimpan 5 knowledge entries (3 `engineering`, 2 `medical`). Output yang diharapkan:

```
══════════════════════════════════════════════════════
  SYNAPSE DEMO  ·  Agent A  ·  Knowledge Producer
══════════════════════════════════════════════════════

  Agent ID  : agent_alpha_coding_v1
  0G Storage : ○ mock mode
  0G Chain   : ○ mock mode

  [1/5] Storing [blockchain-bug-fix]  namespace=engineering
  ✓ knowledge_id  : <uuid>
  ✓ sha256 hash   : <hash>…
  ✓ 0G CID        : zg:<sha256>…
  ✓ chain status  : ○ local (chain disabled)
  ...
```

> Di halaman **Network** pada frontend, event baru akan muncul di live feed secara real-time via WebSocket.

Buka terminal keempat:

```bash
cd synapse/backend
python -m app.demo.agent_b
```

Agent B menjalankan 4 query, mendemonstrasikan namespace isolation:

| Query | Namespace | Hasil |
|---|---|---|
| "race condition nonce" | global | Mengembalikan hasil dari semua domain |
| "drug interaction medication" | `medical` | Hanya hasil medis |
| "drug interaction medication" | `engineering` | **Tidak ada hasil** — konteks terisolasi |
| "performance optimization latency" | `engineering` | Hanya hasil engineering |

---

## Opsi B — Frontend Saja (Tanpa Backend)

Cocok jika hanya ingin melihat UI.

```bash
cd synapse/frontend
npm install
```

Buat `.env.local`:

```bash
echo "NEXT_PUBLIC_USE_MOCK=true" > .env.local
```

```bash
npm run dev
```

Buka: http://localhost:3000

UI akan menggunakan mock data bawaan. Live feed juga berjalan (simulasi event setiap 8–15 detik).

---

## Opsi C — Backend API Saja (via curl / Swagger)

Jika hanya ingin menguji API tanpa frontend.

```bash
cd synapse/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Simpan knowledge

```bash
curl -X POST http://localhost:8000/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "demo_agent",
    "content": "asyncio.Lock() prevents race conditions in async nonce managers.",
    "source": "agent://demo/v1",
    "namespace": "engineering"
  }'
```

### Query dengan namespace isolation

```bash
curl -X POST http://localhost:8000/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{"query": "race condition nonce", "top_k": 3, "namespace": "engineering"}'
```

### Tandai sebagai useful (trust vote)

```bash
curl -X POST http://localhost:8000/knowledge/<knowledge_id>/useful
```

### Lihat statistik jaringan

```bash
curl http://localhost:8000/knowledge/stats
```

### Lihat daftar namespace

```bash
curl http://localhost:8000/knowledge/namespaces
```

### Cek health

```bash
curl http://localhost:8000/health
```

---

## Opsi D — MCP Server (Untuk Agent Claude)

Memungkinkan Claude atau MCP-compatible agent menggunakan Synapse sebagai native tool.

```bash
cd synapse/backend
python -m app.mcp_server --api-url http://localhost:8000
```

Tambahkan ke `~/.claude/mcp_servers.json`:

```json
{
  "synapse": {
    "command": "python",
    "args": ["-m", "app.mcp_server", "--api-url", "http://localhost:8000"],
    "cwd": "/path/to/synapse/backend"
  }
}
```

Tools yang tersedia: `synapse_store`, `synapse_query`, `synapse_namespaces`, `synapse_stats`, `synapse_mark_useful`, `synapse_get_links`.

---

## Jalankan Tests

```bash
cd synapse/backend
pytest ../tests/backend/ -v
```

---

## Catatan Mode Mock

| Komponen | Mode Default | Perilaku |
|---|---|---|
| 0G Storage | **Mock** | CID dihasilkan secara lokal: `zg:<sha256>` |
| 0G Chain | **Mock** | `on_chain: false`, tidak ada transaksi nyata |
| Embedding | Real (download otomatis) | `all-MiniLM-L6-v2` diunduh saat pertama kali dijalankan (~90 MB) |
| FAISS | Real | Vector search berjalan sepenuhnya in-process |
| WebSocket | Real | Live feed berjalan secara lokal |

Untuk mengaktifkan integrasi 0G yang sesungguhnya, ubah di `backend/.env`:

```env
USE_ZG_STORAGE=true
ZG_STORAGE_ENDPOINT=http://your-0g-node:5678

USE_ZG_CHAIN=true
ZG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
ZG_CHAIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ZG_KNOWLEDGE_REGISTRY_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```
