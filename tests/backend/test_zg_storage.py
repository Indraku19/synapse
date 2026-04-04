"""
Unit tests for the 0G Storage client (mock path — no network required).
"""
import pytest
from app.services.zg_storage import _mock_cid, upload_knowledge


def test_mock_cid_format():
    cid = _mock_cid(b"hello world")
    assert cid.startswith("zg:")
    assert len(cid) == 3 + 64   # "zg:" + 64-char hex sha256


def test_mock_cid_deterministic():
    assert _mock_cid(b"test") == _mock_cid(b"test")


def test_mock_cid_different_inputs():
    assert _mock_cid(b"a") != _mock_cid(b"b")


@pytest.mark.asyncio
async def test_upload_knowledge_returns_mock_cid_when_disabled(monkeypatch):
    """When USE_ZG_STORAGE=false, upload_knowledge returns a mock CID."""
    from app.config import settings
    monkeypatch.setattr(settings, "use_zg_storage", False, raising=False)
    # Ensure property reflects patched flag
    monkeypatch.setattr(type(settings), "use_0g_storage",
                        property(lambda s: False), raising=False)

    cid = await upload_knowledge({"knowledge_id": "test", "content": "hello"})
    assert cid.startswith("zg:")
