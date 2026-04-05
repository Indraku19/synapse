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

# Queries that map to what Agent A stored.
# namespace=None  → search global pool (original behaviour, all domains)
# namespace=str   → context isolation: only that domain's knowledge is returned
QUERIES = [
    {
        "query": "race condition transaction nonce async",
        "top_k": 3,
        "namespace": None,
        "label": "Global search — nonce bug fix",
    },
    {
        "query": "drug interaction patient medication",
        "top_k": 3,
        "namespace": "medical",
        "label": "Agent acting as DOCTOR — drug interaction (namespace=medical)",
    },
    {
        "query": "drug interaction patient medication",
        "top_k": 3,
        "namespace": "engineering",
        "label": "Same query, ENGINEER namespace — should return NO medical results",
    },
    {
        "query": "performance optimization latency",
        "top_k": 3,
        "namespace": "engineering",
        "label": "Agent acting as ENGINEER — performance tip (namespace=engineering)",
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
        query     = q_info["query"]
        top_k     = q_info["top_k"]
        label     = q_info["label"]
        namespace = q_info.get("namespace")

        ns_label = f"namespace={namespace}" if namespace else "namespace=global (all domains)"
        print(f"  ◎ {label}")
        print(f"  Query    : \"{query}\"")
        print(f"  Context  : {ns_label}")
        print(f"  {'─' * 50}")

        try:
            payload = {"query": query, "top_k": top_k}
            if namespace:
                payload["namespace"] = namespace
            resp = httpx.post(
                f"{API_URL}/knowledge/query",
                json=payload,
                timeout=15.0,
            )
            resp.raise_for_status()
            results = resp.json()["results"]
        except Exception as exc:
            print(f"  ✗ Query failed: {exc}\n")
            continue

        if not results:
            print("  ○ No results — namespace is isolated from other domains.\n")
            continue

        for rank, r in enumerate(results, 1):
            score_pct = f"{r['confidence_score'] * 100:.1f}%"
            ns_tag    = f"[{r.get('namespace') or 'global'}]"
            print(f"  [{rank}] match={score_pct}  {ns_tag}  agent={r['agent_id']}")
            print(f"      {r['content'][:110]}…")
            print(f"      source: {r['source']}  |  {r['timestamp'][:19]}")
            print()

    print(f"{'━' * 54}")
    print("  Agent B retrieved knowledge from the Synapse network.")
    print("  Cross-agent knowledge sharing : DEMONSTRATED.")
    print("  Namespace context isolation   : DEMONSTRATED.\n")


if __name__ == "__main__":
    run()
