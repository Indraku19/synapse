"""
demo_0g_docs.py — Query demo: AI agent retrieves 0G knowledge from Synapse.

Prerequisite: run store_0g_docs.py first to populate knowledge base.

Usage:
    python -m app.demo.demo_0g_docs

Shows:
  1. New AI agent queries Synapse — no prior knowledge, no web search
  2. Namespace isolation — same query, wrong namespace = no results
"""

import asyncio
import httpx

SYNAPSE_URL = "http://localhost:8000"
NAMESPACE = "web3"

DEMO_QUERIES = [
    {
        "question": "What is the RPC URL for 0G Galileo testnet?",
        "namespace": "web3",
    },
    {
        "question": "How to get testnet tokens for 0G?",
        "namespace": "web3",
    },
    {
        "question": "What SDK version should I use for 0G Storage upload?",
        "namespace": "web3",
    },
    {
        "question": "What are the smart contract addresses on 0G Galileo?",
        "namespace": "web3",
    },
    {
        "question": "What transaction type does 0G Chain require?",
        "namespace": "web3",
    },
]


def divider(char="─", width=60):
    print(char * width)


def section(title: str):
    print()
    divider("═")
    print(f"  {title}")
    divider("═")
    print()


async def query_phase(client: httpx.AsyncClient):
    section("PHASE 1 — New AI agent queries Synapse")
    print("  Agent has ZERO prior knowledge about 0G Network.")
    print("  No web search. No system prompt. Only Synapse.")
    print()

    for i, q in enumerate(DEMO_QUERIES, 1):
        print(f"  Q{i}: \"{q['question']}\"")
        print(f"       namespace={q['namespace']}")
        print()

        try:
            r = await client.post(
                f"{SYNAPSE_URL}/knowledge/query",
                json={
                    "query": q["question"],
                    "namespace": q["namespace"],
                    "top_k": 1,
                },
                timeout=15.0,
            )
            r.raise_for_status()
            results = r.json().get("results", [])

            if results:
                top = results[0]
                score = top.get("similarity_score", 0)
                content = top.get("content", "")
                agent = top.get("agent_id", "?")
                trust = top.get("trust_score", 1.0)

                print(f"  → Score : {score:.3f}  |  Trust: ★{trust:.1f}  |  Stored by: {agent}")
                print(f"  → Answer: {content[:140]}{'...' if len(content) > 140 else ''}")
            else:
                print("  → No results found")

        except Exception as e:
            print(f"  → Error: {e}")

        print()
        divider("·", 60)
        print()
        await asyncio.sleep(0.3)


async def namespace_isolation_phase(client: httpx.AsyncClient):
    section("PHASE 2 — Namespace isolation")
    print("  Same query. Different namespace. Different results.")
    print()

    query = "RPC URL and chain configuration for blockchain development"

    for ns in ["web3", "engineering", "medical"]:
        try:
            r = await client.post(
                f"{SYNAPSE_URL}/knowledge/query",
                json={"query": query, "namespace": ns, "top_k": 1},
                timeout=15.0,
            )
            r.raise_for_status()
            results = r.json().get("results", [])
            count = len(results)
            score = f"{results[0]['similarity_score']:.3f}" if results else "—"
        except Exception:
            count, score = 0, "error"

        status = "✓ results found" if count > 0 else "○ no match"
        print(f"  namespace={ns:<14} → {status:<20} (score: {score})")

    print()
    print("  Only 'web3' returns results — 0G docs live in that namespace.")
    print("  A medical agent will never see blockchain config. Zero contamination.")


async def main():
    print()
    divider("═")
    print("  SYNAPSE — Query Demo: 0G Documentation")
    print("  One agent stores. Every agent learns.")
    divider("═")
    print()
    print("  Prerequisite: run store_0g_docs.py first")
    print(f"  Target      : {SYNAPSE_URL}")
    print()

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{SYNAPSE_URL}/health", timeout=5.0)
            r.raise_for_status()
            print("  ✓ Backend running\n")
        except Exception:
            print("  ✗ Backend not reachable. Run:")
            print("    uvicorn app.main:app --reload --port 8000")
            return

        await query_phase(client)
        await namespace_isolation_phase(client)

    print()
    divider("═")
    print("  Done. Explorer: http://localhost:3000/explorer")
    print("  Query UI    : http://localhost:3000/query")
    divider("═")
    print()


if __name__ == "__main__":
    asyncio.run(main())
