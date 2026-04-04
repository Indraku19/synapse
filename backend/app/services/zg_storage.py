"""
0G Storage client.

Uploads knowledge objects as JSON blobs to a 0G Storage node via its
HTTP API and returns the content identifier (root hash / CID).

When USE_ZG_STORAGE=false (default) the upload is skipped and a
deterministic mock CID is returned so the rest of the pipeline still
has a value to work with.

0G Storage HTTP API (storage node):
  POST /file/upload          multipart or raw bytes upload
  GET  /file/download?cid=…  download by CID

The node endpoint is configured via ZG_STORAGE_ENDPOINT.
"""
from __future__ import annotations

import hashlib
import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Request timeout for storage uploads
_TIMEOUT = 30.0


async def upload_knowledge(entry_dict: dict) -> str:
    """
    Serialize a knowledge entry dict to JSON and upload to 0G Storage.

    Returns the CID (root hash string) assigned by the storage node.
    Falls back to a mock CID when 0G Storage is not configured.
    """
    payload = json.dumps(entry_dict, default=str).encode("utf-8")

    if not settings.use_0g_storage:
        cid = _mock_cid(payload)
        logger.debug("[0G Storage] Mock CID generated: %s", cid)
        return cid

    return await _upload_to_node(payload)


async def _upload_to_node(data: bytes) -> str:
    """
    POST raw JSON bytes to the 0G Storage node.

    The node returns a JSON body:
        {"root": "<hex-root-hash>"}
    which we use as the CID.
    """
    endpoint = settings.zg_storage_endpoint.rstrip("/")
    url = f"{endpoint}/file/upload"

    logger.info("[0G Storage] Uploading %d bytes to %s", len(data), url)

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            resp = await client.post(
                url,
                content=data,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            body = resp.json()
            cid = body.get("root") or body.get("cid") or body.get("hash")
            if not cid:
                raise ValueError(f"Storage node returned no CID: {body}")
            logger.info("[0G Storage] Uploaded successfully. CID: %s", cid)
            return str(cid)

    except httpx.HTTPStatusError as e:
        logger.error("[0G Storage] Upload failed: %s", e)
        raise
    except httpx.RequestError as e:
        logger.error("[0G Storage] Network error: %s", e)
        raise


def _mock_cid(data: bytes) -> str:
    """
    Deterministic mock CID — SHA-256 of the content bytes, prefixed
    with 'zg:' to distinguish from the real on-chain hash.
    """
    digest = hashlib.sha256(data).hexdigest()
    return f"zg:{digest}"
