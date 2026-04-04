"""
0G Chain client — submits verification hashes to the KnowledgeRegistry
smart contract via web3.py.

Requires:
  USE_ZG_CHAIN=true
  ZG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
  ZG_CHAIN_PRIVATE_KEY=0x...
  ZG_KNOWLEDGE_REGISTRY_ADDRESS=0x...

When USE_ZG_CHAIN=false (default) this module is never imported.

ABI is the minimal subset needed for storeKnowledgeHash and verify.
"""
from __future__ import annotations

import asyncio
import logging
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)

# Minimal ABI — only the functions the backend calls
_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
            {"internalType": "string",  "name": "agentId",     "type": "string"},
            {"internalType": "string",  "name": "knowledgeId", "type": "string"},
            {"internalType": "string",  "name": "cid",         "type": "string"},
        ],
        "name": "storeKnowledgeHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "contentHash", "type": "bytes32"},
        ],
        "name": "verify",
        "outputs": [
            {"internalType": "bool",   "name": "exists",      "type": "bool"},
            {"internalType": "string", "name": "agentId",     "type": "string"},
            {"internalType": "string", "name": "knowledgeId", "type": "string"},
            {"internalType": "string", "name": "cid",         "type": "string"},
            {"internalType": "uint256","name": "timestamp",   "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


@lru_cache(maxsize=1)
def _get_contract():
    """Lazy-load web3 and return the contract instance (cached)."""
    from web3 import Web3  # type: ignore

    w3 = Web3(Web3.HTTPProvider(settings.zg_chain_rpc))
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to 0G Chain RPC: {settings.zg_chain_rpc}")

    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.zg_knowledge_registry_address),
        abi=_REGISTRY_ABI,
    )
    return w3, contract


async def store_knowledge_hash(
    content_hash: str,
    agent_id: str,
    knowledge_id: str,
    cid: str,
) -> str:
    """
    Call storeKnowledgeHash on the KnowledgeRegistry contract.

    content_hash is a hex string (64 chars); converted to bytes32 before sending.
    Returns the transaction hash as a hex string.
    """
    # Run blocking web3 calls in a thread pool
    return await asyncio.get_event_loop().run_in_executor(
        None,
        _store_hash_sync,
        content_hash,
        agent_id,
        knowledge_id,
        cid,
    )


def _store_hash_sync(
    content_hash: str,
    agent_id: str,
    knowledge_id: str,
    cid: str,
) -> str:
    from web3 import Web3  # type: ignore

    w3, contract = _get_contract()
    account = w3.eth.account.from_key(settings.zg_chain_private_key)

    # Convert hex string to bytes32
    hash_bytes = bytes.fromhex(content_hash.lstrip("0x"))

    # First check for duplicates to avoid wasting gas
    exists, *_ = contract.functions.verify(hash_bytes).call()
    if exists:
        logger.info("[0G Chain] Hash already on-chain, skipping: %s", content_hash[:16])
        return "already_stored"

    tx = contract.functions.storeKnowledgeHash(
        hash_bytes,
        agent_id,
        knowledge_id,
        cid,
    ).build_transaction({
        "from":  account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas":   200_000,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

    if receipt["status"] != 1:
        raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")

    logger.info("[0G Chain] Stored. tx=%s block=%s", tx_hash.hex(), receipt["blockNumber"])
    return tx_hash.hex()
