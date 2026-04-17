"""
0G Storage client.

Uploads knowledge objects as JSON blobs to 0G Storage via a Node.js
helper script (zg_upload/upload.mjs) that uses @0gfoundation/0g-ts-sdk.

Flow:
  1. Serialize entry dict to JSON
  2. Call `node zg_upload/upload.mjs <json>` as subprocess
  3. Script computes Merkle tree, submits on-chain tx, uploads to indexer
  4. Returns root_hash as CID

When USE_ZG_STORAGE=false (default) the upload is skipped and a
deterministic mock CID is returned so the rest of the pipeline still
has a value to work with.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import subprocess
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

# Path to the Node.js upload helper (relative to backend working directory)
_UPLOAD_SCRIPT = Path(__file__).parent.parent.parent / "zg_upload" / "upload.mjs"


async def upload_knowledge(entry_dict: dict) -> str:
    """
    Serialize a knowledge entry dict to JSON and upload to 0G Storage.

    Returns the CID (root hash string) assigned by the storage indexer.
    Falls back to a mock CID when 0G Storage is not configured.
    """
    payload = json.dumps(entry_dict, default=str)

    if not settings.use_0g_storage:
        cid = _mock_cid(payload.encode())
        logger.debug("[0G Storage] Mock CID generated: %s", cid)
        return cid

    try:
        return await asyncio.get_event_loop().run_in_executor(
            None, _upload_sync, payload
        )
    except Exception as exc:
        logger.warning("[0G Storage] Upload failed, falling back to mock CID: %s", exc)
        return _mock_cid(payload.encode())


def _upload_sync(payload: str) -> str:
    """
    Call the Node.js upload helper synchronously (runs in thread pool).
    """
    env = {
        **os.environ,
        "ZG_CHAIN_RPC":          settings.zg_chain_rpc,
        "ZG_CHAIN_PRIVATE_KEY":  settings.zg_chain_private_key,
        "ZG_INDEXER_URL":        settings.zg_storage_endpoint,
    }

    logger.info("[0G Storage] Calling upload script: %s", _UPLOAD_SCRIPT)

    try:
        result = subprocess.run(
            ["node", str(_UPLOAD_SCRIPT), payload],
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError("[0G Storage] Upload timed out after 120s")
    except FileNotFoundError:
        raise RuntimeError("[0G Storage] 'node' not found — is Node.js installed?")

    stdout = result.stdout.strip()
    stderr = result.stderr.strip()

    if stderr:
        logger.debug("[0G Storage] Script stderr: %s", stderr)

    if not stdout:
        raise RuntimeError(f"[0G Storage] No output from upload script. stderr={stderr}")

    # SDK writes debug logs to stdout — find the last line that is valid JSON
    body = None
    for line in reversed(stdout.splitlines()):
        line = line.strip()
        if line.startswith("{"):
            try:
                body = json.loads(line)
                break
            except json.JSONDecodeError:
                continue

    if body is None:
        raise RuntimeError(f"[0G Storage] No JSON found in upload script output: {stdout[-500:]}")

    if "error" in body:
        raise RuntimeError(f"[0G Storage] Upload failed: {body['error']}")

    cid = body.get("root_hash") or body.get("cid")
    if not cid:
        raise RuntimeError(f"[0G Storage] No root_hash in response: {body}")

    logger.info("[0G Storage] Uploaded. CID=%s tx=%s", cid, body.get("tx_hash", ""))
    return str(cid)


def _mock_cid(data: bytes) -> str:
    """
    Deterministic mock CID — SHA-256 of the content bytes, prefixed
    with 'zg:' to distinguish from the real on-chain hash.
    """
    digest = hashlib.sha256(data).hexdigest()
    return f"zg:{digest}"
