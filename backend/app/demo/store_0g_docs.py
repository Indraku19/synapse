"""
store_0g_docs.py — Fetch 0G documentation and store as knowledge entries in Synapse.

Usage:
    python -m app.demo.store_0g_docs

Requirements:
    pip install httpx beautifulsoup4

Backend must be running at http://localhost:8000
"""

import asyncio
import httpx
import json
from datetime import datetime

SYNAPSE_URL = "http://localhost:8000"
AGENT_ID = "doc_crawler_0g"
NAMESPACE = "web3"
TTL_DAYS = 365

# ─── Curated 0G knowledge entries ────────────────────────────────────────────
# Hand-curated from official 0G docs for maximum query accuracy.
# Each entry = one atomic fact, written to match likely query patterns.

KNOWLEDGE_ENTRIES = [

    # ── Testnet / Network Config ──────────────────────────────────────────────
    {
        "content": (
            "0G Galileo Testnet configuration: "
            "Network name: 0G-Galileo-Testnet, "
            "Chain ID: 16602, "
            "Token symbol: OG, "
            "RPC URL: https://evmrpc-testnet.0g.ai, "
            "Chain explorer: https://chainscan-galileo.0g.ai, "
            "Storage explorer: https://storagescan-galileo.0g.ai"
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["testnet", "network", "rpc", "chain-id"],
    },
    {
        "content": (
            "0G Galileo Testnet faucets: "
            "Official faucet: https://faucet.0g.ai, "
            "Google Cloud faucet: https://cloud.google.com/application/web3/faucet/0g/galileo. "
            "Daily limit: 0.1 OG per wallet address."
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["faucet", "testnet", "tokens"],
    },
    {
        "content": (
            "0G Galileo Testnet smart contract addresses: "
            "Storage Flow: 0x22E03a6A89B950F1c82ec5e74F8eCa321a105296, "
            "Storage Mine: 0x00A9E9604b0538e06b268Fb297Df333337f9593b, "
            "Storage Reward: 0xA97B57b4BdFEA2D0a25e535bd849ad4e6C440A69, "
            "DA Entrance: 0xE75A073dA5bb7b0eC622170Fd268f35E675a957B. "
            "Note: addresses may change during testnet phases."
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["contracts", "testnet", "addresses"],
    },

    # ── 0G Chain ──────────────────────────────────────────────────────────────
    {
        "content": (
            "0G Chain is an EVM-compatible blockchain optimized for AI workloads. "
            "It supports standard Ethereum tooling: MetaMask, Hardhat, Foundry, ethers.js, web3.py. "
            "Use EIP-1559 (type 2) transactions — legacy type 0 is not supported on Galileo testnet."
        ),
        "source": "https://docs.0g.ai/developer-hub/getting-started",
        "tags": ["chain", "evm", "transactions"],
    },
    {
        "content": (
            "0G Chain EIP-1559 transaction requirements on Galileo testnet: "
            "Use transaction type 2 (EIP-1559). "
            "Minimum maxPriorityFeePerGas: 2 gwei. "
            "Recommended maxFeePerGas: 3 gwei. "
            "Legacy type 0 transactions return 'unknown transaction type' error."
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["chain", "gas", "eip1559", "transactions"],
    },
    {
        "content": (
            "To deploy a smart contract on 0G Chain using Hardhat: "
            "Set network chainId to 16602, "
            "RPC URL to https://evmrpc-testnet.0g.ai in hardhat.config.js. "
            "Fund deployer wallet from https://faucet.0g.ai before deploying."
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/chain",
        "tags": ["chain", "hardhat", "deploy", "smart-contract"],
    },

    # ── 0G Storage ────────────────────────────────────────────────────────────
    {
        "content": (
            "0G Storage is a decentralized high-performance storage system for large datasets. "
            "Files are split into chunks, organized as a Merkle tree. "
            "The Merkle root hash serves as the content identifier (CID). "
            "Storage is permanent and content-addressed."
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/storage",
        "tags": ["storage", "merkle", "cid", "decentralized"],
    },
    {
        "content": (
            "0G Storage Testnet indexer endpoint: https://indexer-storage-testnet-turbo.0g.ai. "
            "Use this URL as ZG_INDEXER_URL when uploading files via the TypeScript SDK. "
            "The indexer coordinates storage node selection and upload routing."
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["storage", "indexer", "endpoint", "testnet"],
    },
    {
        "content": (
            "0G Storage TypeScript SDK (@0gfoundation/0g-ts-sdk) upload flow: "
            "1. Create Indexer with indexer URL. "
            "2. Create ZgFile from file path or buffer. "
            "3. Compute Merkle tree: await zgFile.merkleTree(). "
            "4. Upload: await indexer.upload(zgFile, rpcUrl, signer). "
            "Returns root hash (0x...) as the permanent content identifier."
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk",
        "tags": ["storage", "sdk", "typescript", "upload"],
    },
    {
        "content": (
            "0G Storage SDK package versions for Galileo testnet: "
            "@0gfoundation/0g-ts-sdk version 1.2.1, "
            "ethers version 6.0.0 (not v5). "
            "Install: npm install @0gfoundation/0g-ts-sdk@1.2.1 ethers@6.0.0"
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/storage/sdk",
        "tags": ["storage", "sdk", "npm", "version"],
    },

    # ── 0G Compute ───────────────────────────────────────────────────────────
    {
        "content": (
            "0G Compute is a decentralized GPU marketplace for AI workloads. "
            "Supports AI inference and model serving. "
            "Providers register GPU resources; consumers pay per request. "
            "SDK reference available at https://docs.0g.ai/developer-hub/building-on-0g/compute-network"
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/compute-network",
        "tags": ["compute", "gpu", "inference", "marketplace"],
    },
    {
        "content": (
            "0G Compute supports AI inference workloads including: "
            "LLM inference (text generation), "
            "fine-tuning jobs, "
            "model serving via decentralized providers. "
            "Use 0G Compute SDK to submit inference jobs and receive results."
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference",
        "tags": ["compute", "inference", "llm", "fine-tuning"],
    },

    # ── 0G DA (Data Availability) ────────────────────────────────────────────
    {
        "content": (
            "0G DA (Data Availability) provides scalable data availability for any blockchain. "
            "Rollups can use 0G DA to post transaction data off-chain while keeping proofs on-chain. "
            "DAEntrance contract on Galileo: 0xE75A073dA5bb7b0eC622170Fd268f35E675a957B"
        ),
        "source": "https://docs.0g.ai/developer-hub/building-on-0g/da",
        "tags": ["da", "data-availability", "rollup"],
    },

    # ── 0G Ecosystem & Tools ─────────────────────────────────────────────────
    {
        "content": (
            "0G ecosystem explorer and tools: "
            "Main website: https://0g.ai, "
            "Builder Hub: https://build.0g.ai, "
            "Chain explorer (mainnet): https://chainscan.0g.ai, "
            "Storage explorer (mainnet): https://storagescan.0g.ai, "
            "Ecosystem explorer: https://explorer.0g.ai, "
            "GitHub: https://github.com/0gfoundation"
        ),
        "source": "https://docs.0g.ai",
        "tags": ["ecosystem", "tools", "explorer", "links"],
    },
    {
        "content": (
            "0G community channels: "
            "Discord: discord.gg/0glabs, "
            "Telegram: t.me/zgcommunity, "
            "X/Twitter: @0g_labs, "
            "0G APAC Dev Telegram: t.me/zereg_apac_dev. "
            "HackQuest is the official hackathon platform for 0G APAC 2026."
        ),
        "source": "https://docs.0g.ai",
        "tags": ["community", "social", "hackathon"],
    },

    # ── Build on 0G — Quick Reference ────────────────────────────────────────
    {
        "content": (
            "Quick reference for building on 0G Galileo testnet: "
            "Chain ID: 16602, "
            "RPC: https://evmrpc-testnet.0g.ai, "
            "Storage indexer: https://indexer-storage-testnet-turbo.0g.ai, "
            "Faucet: https://faucet.0g.ai, "
            "Explorer: https://chainscan-galileo.0g.ai. "
            "Use EIP-1559 transactions. MetaMask network name: 0G-Galileo-Testnet."
        ),
        "source": "https://docs.0g.ai/developer-hub/testnet/testnet-overview",
        "tags": ["quickref", "testnet", "build", "config"],
    },
]


async def store_entry(client: httpx.AsyncClient, entry: dict, index: int, total: int) -> bool:
    payload = {
        "agent_id": AGENT_ID,
        "content": entry["content"],
        "source": entry.get("source", "https://docs.0g.ai"),
        "namespace": NAMESPACE,
        "ttl_days": TTL_DAYS,
    }

    try:
        response = await client.post(
            f"{SYNAPSE_URL}/knowledge",
            json=payload,
            timeout=30.0,
        )
        response.raise_for_status()
        data = response.json()

        print(f"[{index}/{total}] ✓ Stored")
        print(f"         ID   : {data.get('knowledge_id', '?')}")
        print(f"         CID  : {data.get('cid', '?')}")
        print(f"         Chain: {'✓ on-chain' if data.get('on_chain') else '○ mock'}")
        print(f"         Tags : {', '.join(entry.get('tags', []))}")
        print()
        return True

    except Exception as e:
        print(f"[{index}/{total}] ✗ Failed: {e}")
        print(f"         Content: {entry['content'][:60]}...")
        print()
        return False


async def main():
    print("=" * 60)
    print("  Synapse — Store 0G Documentation")
    print(f"  Agent  : {AGENT_ID}")
    print(f"  NS     : {NAMESPACE}")
    print(f"  TTL    : {TTL_DAYS} days")
    print(f"  Target : {SYNAPSE_URL}")
    print(f"  Total  : {len(KNOWLEDGE_ENTRIES)} entries")
    print("=" * 60)
    print()

    # Check backend is running
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{SYNAPSE_URL}/health", timeout=5.0)
            r.raise_for_status()
            print("✓ Backend is running\n")
        except Exception:
            print("✗ Backend not reachable at", SYNAPSE_URL)
            print("  Run: uvicorn app.main:app --reload --port 8000")
            return

        success = 0
        for i, entry in enumerate(KNOWLEDGE_ENTRIES, 1):
            ok = await store_entry(client, entry, i, len(KNOWLEDGE_ENTRIES))
            if ok:
                success += 1
            await asyncio.sleep(0.5)  # small delay between requests

    print("=" * 60)
    print(f"  Done: {success}/{len(KNOWLEDGE_ENTRIES)} entries stored")
    print()
    print("  Try querying now:")
    print("  → 'What is the RPC URL for 0G testnet?'")
    print("  → 'How to upload file to 0G Storage?'")
    print("  → 'What contracts are deployed on Galileo?'")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
