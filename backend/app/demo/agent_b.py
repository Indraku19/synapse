"""
Demo: Agent B — the Knowledge Consumer.

Simulates a coding agent that encounters problems and queries the
Synapse network to find solutions stored by other agents.

Run Agent A first so there is knowledge to retrieve.

Usage:
    cd backend
    python -m app.demo.agent_b
"""
import sys
import httpx

API_URL = "http://localhost:8000"

# Queries that map to what Agent A stored
QUERIES = [
    {
        "query": "race condition transaction nonce async",
        "top_k": 3,
        "label": "Looking for nonce bug fix",
    },
    {
        "query": "embedding batch performance optimization",
        "top_k": 3,
        "label": "Looking for embedding speed tip",
    },
    {
        "query": "0G chain duplicate hash already stored",
        "top_k": 3,
        "label": "Looking for 0G Chain guidance",
    },
]


def run():
    print(f"\n{'═' * 54}")
    print("  SYNAPSE DEMO  ·  Agent B  ·  Knowledge Consumer")
    print(f"{'═' * 54}\n")

    print(f"  Endpoint : {API_URL}")
    print(f"  Queries  : {len(QUERIES)}\n")

    # Network stats
    try:
        stats = httpx.get(f"{API_URL}/knowledge/stats", timeout=5.0).json()
        print(f"  Network state:")
        print(f"    Total entries  : {stats['total_entries']}")
        print(f"    Unique agents  : {stats['unique_agents']}")
        print(f"    Total queries  : {stats['total_queries']}")
        print()
    except Exception:
        print("  ✗ Cannot reach API. Start: uvicorn app.main:app --reload\n")
        sys.exit(1)

    for q_info in QUERIES:
        query   = q_info["query"]
        top_k   = q_info["top_k"]
        label   = q_info["label"]

        print(f"  ◎ {label}")
        print(f"  Query: \"{query}\"")
        print(f"  {'─' * 50}")

        try:
            resp = httpx.post(
                f"{API_URL}/knowledge/query",
                json={"query": query, "top_k": top_k},
                timeout=15.0,
            )
            resp.raise_for_status()
            results = resp.json()["results"]
        except Exception as exc:
            print(f"  ✗ Query failed: {exc}\n")
            continue

        if not results:
            print("  No results found.\n")
            continue

        for rank, r in enumerate(results, 1):
            score_pct = f"{r['confidence_score'] * 100:.1f}%"
            print(f"  [{rank}] match={score_pct}  agent={r['agent_id']}")
            print(f"      {r['content'][:110]}…")
            print(f"      source: {r['source']}  |  {r['timestamp'][:19]}")
            print()

    print(f"{'━' * 54}")
    print("  Agent B retrieved knowledge from the Synapse network.")
    print("  Cross-agent knowledge sharing: DEMONSTRATED.\n")


if __name__ == "__main__":
    run()
