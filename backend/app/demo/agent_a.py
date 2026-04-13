"""
Demo: Agent A — the Knowledge Producer.

Simulates a coding agent that discovers insights and stores them in
the Synapse network. Demonstrates the full storage pipeline:
  content → embedding → 0G Storage (CID) → 0G Chain (hash).

Usage:
    cd backend
    uvicorn app.main:app --reload   # in another terminal
    python -m app.demo.agent_a
"""
import sys
import httpx

API_URL  = "http://localhost:8000"
AGENT_ID = "agent_alpha_coding_v1"

KNOWLEDGE_ENTRIES = [
    # --- engineering namespace ---
    {
        "content": (
            "Bug fix: Race condition in async transaction nonce manager. "
            "Root cause: concurrent coroutines reading the nonce counter without a lock. "
            "Solution: wrap nonce read+increment in an asyncio.Lock() per wallet address. "
            "This prevents duplicate nonce assignments when broadcasting parallel transactions."
        ),
        "source": "agent://coding-agent-alpha/v1",
        "tag": "blockchain-bug-fix",
        "namespace": "engineering",
    },
    {
        "content": (
            "Performance insight: batching embedding generation reduces latency by ~60%. "
            "Instead of calling the model once per document, collect inputs in batches of 32 "
            "and run a single forward pass: sentence_transformers.encode(batch, batch_size=32). "
            "Particularly effective when indexing large knowledge bases at startup."
        ),
        "source": "agent://coding-agent-alpha/v1",
        "tag": "ml-optimization",
        "namespace": "engineering",
    },
    {
        "content": (
            "0G Chain integration tip: storeKnowledgeHash() reverts with 'already stored' "
            "if the same SHA-256 hash is submitted twice. "
            "Always call verify() first to check existence before sending a transaction. "
            "This saves gas and prevents reverting mid-pipeline."
        ),
        "source": "agent://coding-agent-alpha/v1",
        "tag": "0g-chain-tip",
        "namespace": "engineering",
    },
    # --- medical namespace ---
    {
        "content": (
            "Clinical insight: Elevated troponin levels (>0.04 ng/mL) combined with ST-segment "
            "elevation on ECG are strong indicators of acute myocardial infarction (AMI). "
            "Immediate intervention: administer aspirin 300mg, arrange urgent PCI within 90 minutes. "
            "Do not delay reperfusion therapy pending additional lab results."
        ),
        "source": "agent://medical-agent-alpha/v1",
        "tag": "cardiology",
        "namespace": "medical",
    },
    {
        "content": (
            "Drug interaction alert: combining SSRIs with MAOIs can cause serotonin syndrome — "
            "a life-threatening condition. Symptoms: hyperthermia, agitation, myoclonus, hyperreflexia. "
            "Minimum washout period: 14 days after stopping MAOI before initiating SSRI. "
            "Always cross-check patient medication list before prescribing."
        ),
        "source": "agent://medical-agent-alpha/v1",
        "tag": "pharmacology",
        "namespace": "medical",
    },
]


def _bar(char: str, width: int = 52) -> str:
    return char * width


def run():
    print(f"\n{'═' * 54}")
    print("  SYNAPSE DEMO  ·  Agent A  ·  Knowledge Producer")
    print(f"{'═' * 54}\n")

    print(f"  Agent ID  : {AGENT_ID}")
    print(f"  Endpoint  : {API_URL}")
    print(f"  Entries   : {len(KNOWLEDGE_ENTRIES)}\n")

    # Check health
    try:
        health = httpx.get(f"{API_URL}/health", timeout=5.0).json()
        zg_storage = "✓ ENABLED" if health.get("0g_storage") else "○ mock mode"
        zg_chain   = "✓ ENABLED" if health.get("0g_chain")   else "○ mock mode"
        print(f"  0G Storage : {zg_storage}")
        print(f"  0G Chain   : {zg_chain}")
        print()
    except Exception:
        print("  ✗ Cannot reach API. Start: uvicorn app.main:app --reload\n")
        sys.exit(1)

    stored = []

    for i, entry in enumerate(KNOWLEDGE_ENTRIES, 1):
        tag       = entry["tag"]
        content   = entry["content"]
        namespace = entry.get("namespace") or "global"
        print(f"  [{i}/{len(KNOWLEDGE_ENTRIES)}] Storing [{tag}]  namespace={namespace}")
        print(f"  {'─' * 50}")
        print(f"  {content[:90]}…\n")

        try:
            resp = httpx.post(
                f"{API_URL}/knowledge",
                json={
                    "agent_id":  AGENT_ID,
                    "content":   content,
                    "source":    entry["source"],
                    "namespace": entry.get("namespace"),
                },
                timeout=180.0,
            )
            resp.raise_for_status()
            data = resp.json()

            print(f"  ✓ knowledge_id  : {data['knowledge_id']}")
            print(f"  ✓ sha256 hash   : {data['hash'][:32]}…")

            cid = data.get("cid") or "—"
            cid_display = cid if len(cid) <= 48 else cid[:48] + "…"
            print(f"  ✓ 0G CID        : {cid_display}")

            chain_status = "✓ on-chain" if data.get("on_chain") else "○ local (chain disabled)"
            print(f"  ✓ chain status  : {chain_status}")
            print()

            stored.append(data)

        except httpx.ConnectError:
            print("  ✗ Connection refused. Is the API running?\n")
            sys.exit(1)
        except Exception as exc:
            print(f"  ✗ Error: {exc}\n")
            sys.exit(1)

    print(f"{'━' * 54}")
    print(f"  Agent A stored {len(stored)} knowledge entries successfully.")
    print(f"  Run Agent B to demonstrate cross-agent retrieval.\n")
    print("  Stored IDs:")
    for s in stored:
        print(f"    • {s['knowledge_id']}")
    print()


if __name__ == "__main__":
    run()
