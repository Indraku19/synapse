"""
store_sui_docs.py — Store SUI blockchain documentation into Synapse.

Usage (local):
    python -m app.demo.store_sui_docs

Usage (production Railway):
    SYNAPSE_URL=https://synapse-production-c1ae.up.railway.app python -m app.demo.store_sui_docs
"""

import asyncio
import httpx
import os

SYNAPSE_URL = os.getenv("SYNAPSE_URL", "http://localhost:8000")
AGENT_ID = "doc_crawler_sui"
NAMESPACE = "web3"
TTL_DAYS = 365

KNOWLEDGE_ENTRIES = [

    # ── Network Config ────────────────────────────────────────────────────────
    {
        "content": (
            "SUI Testnet configuration: "
            "Network name: Sui Testnet, "
            "Chain ID: sui:testnet, "
            "RPC URL: https://fullnode.testnet.sui.io:443, "
            "WebSocket: wss://fullnode.testnet.sui.io:443, "
            "Explorer: https://suiscan.xyz/testnet"
        ),
        "source": "https://docs.sui.io/guides/developer/getting-started/connect",
    },
    {
        "content": (
            "SUI Mainnet configuration: "
            "RPC URL: https://fullnode.mainnet.sui.io:443, "
            "WebSocket: wss://fullnode.mainnet.sui.io:443, "
            "Explorer: https://suiscan.xyz/mainnet. "
            "SUI token symbol: SUI. Native decimals: 9 (1 SUI = 1,000,000,000 MIST)."
        ),
        "source": "https://docs.sui.io/guides/developer/getting-started/connect",
    },
    {
        "content": (
            "SUI Devnet faucet: https://faucet.devnet.sui.io. "
            "SUI Testnet faucet: https://faucet.testnet.sui.io. "
            "CLI faucet command: sui client faucet. "
            "Discord faucet: #devnet-faucet or #testnet-faucet in SUI Discord."
        ),
        "source": "https://docs.sui.io/guides/developer/getting-started/get-coins",
    },

    # ── SUI Move Language ─────────────────────────────────────────────────────
    {
        "content": (
            "SUI uses Move as its smart contract language. "
            "Move is a resource-oriented language — assets are represented as objects, not balances. "
            "Objects have unique IDs (UID), owners, and can be transferred or shared. "
            "Move modules are deployed as packages on SUI."
        ),
        "source": "https://docs.sui.io/concepts/sui-move-concepts",
    },
    {
        "content": (
            "SUI Move object types: "
            "Owned objects — owned by an address or another object. "
            "Shared objects — accessible by anyone, require consensus. "
            "Immutable objects — frozen, readable by anyone, no consensus needed. "
            "Wrapped objects — stored inside another object's field."
        ),
        "source": "https://docs.sui.io/concepts/object-ownership",
    },
    {
        "content": (
            "SUI transaction structure: "
            "Transactions consume gas paid in SUI. "
            "Gas budget must be set explicitly. "
            "Programmable Transaction Blocks (PTB) allow multiple operations in one transaction. "
            "PTBs can chain outputs of one command as inputs to another."
        ),
        "source": "https://docs.sui.io/concepts/transactions",
    },

    # ── SUI SDK & CLI ─────────────────────────────────────────────────────────
    {
        "content": (
            "SUI TypeScript SDK: @mysten/sui package. "
            "Install: npm install @mysten/sui. "
            "Create client: new SuiClient({ url: getFullnodeUrl('testnet') }). "
            "Sign transactions with Ed25519Keypair. "
            "GitHub: https://github.com/MystenLabs/sui/tree/main/sdk/typescript"
        ),
        "source": "https://sdk.mystenlabs.com/typescript",
    },
    {
        "content": (
            "SUI CLI installation: cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui. "
            "Or download binary from https://github.com/MystenLabs/sui/releases. "
            "Key commands: sui client, sui move build, sui move publish, sui move test."
        ),
        "source": "https://docs.sui.io/guides/developer/getting-started/sui-install",
    },
    {
        "content": (
            "SUI Move publish command: sui client publish --gas-budget 100000000. "
            "Build before publish: sui move build. "
            "Test locally: sui move test. "
            "Published package ID is the address of the deployed module."
        ),
        "source": "https://docs.sui.io/guides/developer/first-app/publish",
    },

    # ── SUI Concepts ──────────────────────────────────────────────────────────
    {
        "content": (
            "SUI consensus mechanism: Mysticeti (DAG-based BFT). "
            "Finality in under 500ms for simple transactions (owned objects). "
            "Shared object transactions go through full consensus. "
            "Validators stake SUI to participate in consensus."
        ),
        "source": "https://docs.sui.io/concepts/sui-architecture/consensus",
    },
    {
        "content": (
            "SUI vs Ethereum key differences: "
            "SUI uses object model, Ethereum uses account model. "
            "SUI gas paid in SUI token only. "
            "SUI has parallel execution for owned-object transactions. "
            "No global nonce — SUI uses object versioning. "
            "Move language vs Solidity."
        ),
        "source": "https://docs.sui.io/concepts/sui-architecture",
    },

    # ── SUI Ecosystem ─────────────────────────────────────────────────────────
    {
        "content": (
            "SUI ecosystem tools and resources: "
            "Explorer: https://suiscan.xyz, "
            "Docs: https://docs.sui.io, "
            "GitHub: https://github.com/MystenLabs/sui, "
            "Discord: discord.gg/sui, "
            "X/Twitter: @SuiNetwork. "
            "Wallets: Sui Wallet, Suiet, Ethos."
        ),
        "source": "https://docs.sui.io",
    },
    {
        "content": (
            "SUI zkLogin: allows users to sign SUI transactions using OAuth providers "
            "(Google, Facebook, Twitch) without a traditional private key. "
            "Uses zero-knowledge proofs to link OAuth identity to SUI address. "
            "Enables social login for Web3 apps on SUI."
        ),
        "source": "https://docs.sui.io/concepts/cryptography/zklogin",
    },
]


async def store_entry(client: httpx.AsyncClient, entry: dict, index: int, total: int) -> bool:
    payload = {
        "agent_id": AGENT_ID,
        "content": entry["content"],
        "source": entry.get("source", "https://docs.sui.io"),
        "namespace": NAMESPACE,
        "ttl_days": TTL_DAYS,
    }
    try:
        r = await client.post(f"{SYNAPSE_URL}/knowledge", json=payload, timeout=180.0)
        r.raise_for_status()
        data = r.json()
        print(f"  [{index}/{total}] ✓ Stored")
        print(f"           ID   : {data.get('knowledge_id', '?')}")
        print(f"           CID  : {data.get('cid', '?')}")
        print(f"           Chain: {'✓ on-chain' if data.get('on_chain') else '○ mock'}")
        print()
        return True
    except Exception as e:
        print(f"  [{index}/{total}] ✗ Failed: {e}\n")
        return False


async def main():
    print()
    print("=" * 60)
    print("  Synapse — Store SUI Documentation")
    print(f"  Target : {SYNAPSE_URL}")
    print(f"  Agent  : {AGENT_ID}")
    print(f"  NS     : {NAMESPACE}")
    print(f"  Entries: {len(KNOWLEDGE_ENTRIES)}")
    print("=" * 60)
    print()

    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{SYNAPSE_URL}/health", timeout=10.0)
            r.raise_for_status()
            health = r.json()
            print(f"  ✓ Backend running")
            print(f"    0G Storage : {'✓' if health.get('0g_storage') else '○ mock'}")
            print(f"    0G Chain   : {'✓' if health.get('0g_chain') else '○ mock'}")
            print()
        except Exception:
            print(f"  ✗ Backend not reachable at {SYNAPSE_URL}")
            return

        success = 0
        for i, entry in enumerate(KNOWLEDGE_ENTRIES, 1):
            ok = await store_entry(client, entry, i, len(KNOWLEDGE_ENTRIES))
            if ok:
                success += 1
            await asyncio.sleep(1.0)

    print("=" * 60)
    print(f"  Done: {success}/{len(KNOWLEDGE_ENTRIES)} entries stored")
    print()
    print("  Query test:")
    print("  → 'What is the RPC URL for SUI testnet?'")
    print("  → 'How to publish a Move package on SUI?'")
    print("  → 'What is zkLogin in SUI?'")
    print("=" * 60)
    print()


if __name__ == "__main__":
    asyncio.run(main())
