"""
demo_sui_docs.py — Query demo: AI agent retrieves SUI knowledge from Synapse.

Prerequisite: run store_sui_docs.py first.

Usage (local):
    python -m app.demo.demo_sui_docs

Usage (production Railway):
    SYNAPSE_URL=https://synapse-production-c1ae.up.railway.app python -m app.demo.demo_sui_docs
"""

import asyncio
import httpx
import os

SYNAPSE_URL = os.getenv("SYNAPSE_URL", "http://localhost:8000")
NAMESPACE = "web3"

DEMO_QUERIES = [
    "What is the RPC URL for SUI testnet?",
    "How to get testnet tokens for SUI?",
    "How do I publish a Move smart contract on SUI?",
    "What is the difference between SUI and Ethereum?",
    "What is zkLogin in SUI?",
    "What TypeScript SDK should I use to build on SUI?",
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
    print("  Agent has ZERO prior knowledge about SUI.")
    print("  No web search. No system prompt. Only Synapse.")
    print()

    for i, question in enumerate(DEMO_QUERIES, 1):
        print(f"  Q{i}: \"{question}\"")
        try:
            r = await client.post(
                f"{SYNAPSE_URL}/knowledge/query",
                json={"query": question, "namespace": NAMESPACE, "top_k": 1},
                timeout=15.0,
            )
            r.raise_for_status()
            results = r.json().get("results", [])

            if results:
                top = results[0]
                score = top.get("similarity_score", 0)
                content = top.get("content", "")
                trust = top.get("trust_score", 1.0)
                agent = top.get("agent_id", "?")
                print(f"  → Score: {score:.3f}  Trust: ★{trust:.1f}  By: {agent}")
                print(f"  → {content[:150]}{'...' if len(content) > 150 else ''}")
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

    query = "blockchain RPC URL and network configuration"

    for ns in ["web3", "engineering", "medical"]:
        try:
            r = await client.post(
                f"{SYNAPSE_URL}/knowledge/query",
                json={"query": query, "namespace": ns, "top_k": 1},
                timeout=15.0,
            )
            r.raise_for_status()
            results = r.json().get("results", [])
            score = f"{results[0]['similarity_score']:.3f}" if results else "—"
            status = "✓ results found" if results else "○ no match"
        except Exception:
            score, status = "error", "✗ error"

        print(f"  namespace={ns:<14} → {status:<22} (score: {score})")

    print()
    print("  SUI docs live in 'web3' namespace only.")
    print("  Other namespaces return nothing — zero contamination.")


async def main():
    print()
    divider("═")
    print("  SYNAPSE — Query Demo: SUI Documentation")
    print("  One agent stores. Every agent learns.")
    divider("═")
    print(f"  Target: {SYNAPSE_URL}")
    print()

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{SYNAPSE_URL}/health", timeout=10.0)
            r.raise_for_status()
            health = r.json()
            print(f"  ✓ Backend running")
            print(f"    0G Storage : {'✓ live' if health.get('0g_storage') else '○ mock'}")
            print(f"    0G Chain   : {'✓ live' if health.get('0g_chain') else '○ mock'}")
            print()
        except Exception:
            print(f"  ✗ Backend not reachable at {SYNAPSE_URL}")
            return

        await query_phase(client)
        await namespace_isolation_phase(client)

    print()
    divider("═")
    print("  Done.")
    print(f"  Explorer: https://synapse02.vercel.app/explorer")
    print(f"  Query UI: https://synapse02.vercel.app/query")
    divider("═")
    print()


if __name__ == "__main__":
    asyncio.run(main())
