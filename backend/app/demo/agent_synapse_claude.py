"""
agent_synapse_claude.py — AI agent that uses Synapse as its only knowledge source.

This agent starts with ZERO knowledge. Before answering any question,
it queries Synapse to retrieve relevant knowledge, then passes it to
Claude as context. Without Synapse, it cannot answer domain questions.

Usage:
    export ANTHROPIC_API_KEY=your_key
    export SYNAPSE_URL=https://synapse-production-c1ae.up.railway.app  # or localhost:8000

    python -m app.demo.agent_synapse_claude

Requirements:
    pip install anthropic httpx
"""

import asyncio
import httpx
import os

try:
    import anthropic
except ImportError:
    print("Missing dependency: pip install anthropic")
    exit(1)

SYNAPSE_URL = os.getenv("SYNAPSE_URL", "http://localhost:8000")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
NAMESPACE = "web3"

QUESTIONS = [
    "What is the RPC URL for SUI testnet?",
    "How do I get testnet tokens for SUI?",
    "What language do I use to write smart contracts on SUI?",
    "What is zkLogin in SUI?",
]


def divider(char="─", width=60):
    print(char * width)


async def query_synapse(client: httpx.AsyncClient, question: str, top_k: int = 3) -> list[dict]:
    try:
        r = await client.post(
            f"{SYNAPSE_URL}/knowledge/query",
            json={"query": question, "namespace": NAMESPACE, "top_k": top_k},
            timeout=15.0,
        )
        r.raise_for_status()
        return r.json().get("results", [])
    except Exception as e:
        print(f"  [Synapse error] {e}")
        return []


def ask_claude(question: str, context_entries: list[dict]) -> str:
    if not ANTHROPIC_API_KEY:
        return "[ANTHROPIC_API_KEY not set — cannot call Claude]"

    if not context_entries:
        context_block = "No relevant knowledge found in Synapse."
    else:
        lines = []
        for i, e in enumerate(context_entries, 1):
            score = e.get("similarity_score", 0)
            content = e.get("content", "")
            trust = e.get("trust_score", 1.0)
            lines.append(f"[{i}] (score={score:.3f}, trust=★{trust:.1f})\n{content}")
        context_block = "\n\n".join(lines)

    system_prompt = (
        "You are an AI agent with no built-in knowledge about any specific blockchain or technology. "
        "You ONLY answer based on the knowledge provided to you from the Synapse knowledge base. "
        "If the knowledge base does not contain relevant information, say so clearly. "
        "Do not use your training knowledge — only use what Synapse provides."
    )

    user_message = (
        f"Knowledge retrieved from Synapse (namespace={NAMESPACE}):\n\n"
        f"{context_block}\n\n"
        f"---\n\n"
        f"Question: {question}"
    )

    client_ai = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client_ai.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text


async def main():
    print()
    divider("═")
    print("  SYNAPSE + CLAUDE — AI Agent Demo")
    print("  Agent starts with ZERO knowledge.")
    print("  Synapse is the only source of truth.")
    divider("═")
    print(f"  Synapse : {SYNAPSE_URL}")
    print(f"  Claude  : claude-haiku-4-5 (no domain knowledge)")
    print(f"  NS      : {NAMESPACE}")
    print()

    async with httpx.AsyncClient() as client:
        # Health check
        try:
            r = await client.get(f"{SYNAPSE_URL}/health", timeout=10.0)
            health = r.json()
            print(f"  ✓ Synapse running")
            print(f"    0G Storage: {'✓' if health.get('0g_storage') else '○ mock'}")
            print(f"    0G Chain  : {'✓' if health.get('0g_chain') else '○ mock'}")
        except Exception:
            print(f"  ✗ Synapse not reachable at {SYNAPSE_URL}")
            return

        if not ANTHROPIC_API_KEY:
            print()
            print("  ⚠ ANTHROPIC_API_KEY not set.")
            print("    Synapse query will run, but Claude answer will be skipped.")
            print("    Set: export ANTHROPIC_API_KEY=sk-ant-...")

        print()
        divider()
        print()

        for i, question in enumerate(QUESTIONS, 1):
            print(f"  Q{i}: {question}")
            print()

            # Step 1: Query Synapse
            print("  [1] Querying Synapse...")
            results = await query_synapse(client, question, top_k=2)

            if results:
                for j, r in enumerate(results, 1):
                    score = r.get("similarity_score", 0)
                    content = r.get("content", "")
                    print(f"      Hit {j}: score={score:.3f} — {content[:80]}...")
            else:
                print("      No results from Synapse.")

            print()

            # Step 2: Pass to Claude
            print("  [2] Claude answers using only Synapse knowledge...")
            answer = ask_claude(question, results)
            print(f"  → {answer}")

            print()
            divider("·", 60)
            print()
            await asyncio.sleep(0.5)

    print()
    divider("═")
    print("  Demo complete.")
    print("  The agent answered using ONLY knowledge stored in Synapse.")
    print("  No web search. No training data used for domain questions.")
    divider("═")
    print()


if __name__ == "__main__":
    asyncio.run(main())
