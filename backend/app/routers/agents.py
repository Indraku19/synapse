"""
Agent router — manages agent registration, identity, and reputation.

Agents are persisted to {DATA_DIR}/agents.json so they survive redeploys.
Reputation is derived on-the-fly from the vector store — no separate state needed.
"""
import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models.knowledge import AgentRecord, AgentReputation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])

# ---------------------------------------------------------------------------
# Persistent agent registry
# ---------------------------------------------------------------------------

_agents: dict[str, AgentRecord] = {}
_agents_path: Path | None = None


def _get_path() -> Path:
    global _agents_path
    if _agents_path is None:
        from app.config import settings
        _agents_path = Path(settings.data_dir) / "agents.json"
    return _agents_path


def _load_agents() -> None:
    path = _get_path()
    if not path.exists():
        return
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        for raw in data:
            record = AgentRecord(**raw)
            _agents[record.agent_id] = record
        logger.info("Loaded %d agents from snapshot.", len(_agents))
    except Exception as exc:
        logger.error("Failed to load agents snapshot: %s", exc)


def _save_agents() -> None:
    path = _get_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps([a.model_dump() for a in _agents.values()]),
            encoding="utf-8",
        )
    except Exception as exc:
        logger.error("Failed to save agents snapshot: %s", exc)


def load_agents_on_startup() -> None:
    _load_agents()


# ---------------------------------------------------------------------------
# Reputation helper
# ---------------------------------------------------------------------------

def _compute_reputation(agent_id: str) -> AgentReputation:
    from app.services.vector_store import get_store
    entries = get_store().get_all()
    own = [e for e in entries if e.agent_id == agent_id]
    total_stores = len(own)
    total_useful = sum(e.use_count for e in own)
    if total_stores == 0:
        score = 1.0
    else:
        # bonus = ratio of useful votes per entry, capped at +4.0
        score = min(5.0, 1.0 + (total_useful / total_stores) * 2.0)
    return AgentReputation(
        agent_id=agent_id,
        total_stores=total_stores,
        total_useful_received=total_useful,
        reputation_score=round(score, 3),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=AgentRecord, status_code=201)
async def register_agent(agent_name: str, developer: str):
    record = AgentRecord(agent_name=agent_name, developer=developer)
    _agents[record.agent_id] = record
    _save_agents()
    return record


@router.get("/{agent_id}/reputation", response_model=AgentReputation)
async def get_agent_reputation(agent_id: str):
    """
    Return the reputation of an agent based on how much of its stored knowledge
    has been marked useful by other agents.

    reputation_score = 1.0 + (total_useful_votes / total_stores) * 2.0  (capped at 5.0)
    """
    return _compute_reputation(agent_id)


@router.get("/{agent_id}", response_model=AgentRecord)
async def get_agent(agent_id: str):
    record = _agents.get(agent_id)
    if not record:
        raise HTTPException(status_code=404, detail="Agent not found")
    return record


@router.get("", response_model=list[AgentRecord])
async def list_agents():
    return list(_agents.values())
