"""
Content hashing service.
Produces SHA-256 hex digests of knowledge content for on-chain verification.
"""
import hashlib


def hash_content(content: str) -> str:
    """Return the SHA-256 hex digest of the given text content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def verify_hash(content: str, expected_hash: str) -> bool:
    """Return True if the content matches the expected SHA-256 hash."""
    return hash_content(content) == expected_hash
