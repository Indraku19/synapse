"""
Agent router — manages agent registration and identity.
Agent registration is a prerequisite for knowledge submission.
"""
from fastapi import APIRouter, HTTPException

from app.models.knowledge import AgentRecord

router = APIRouter(prefix="/agents", tags=["agents"])

# In-process agent registry (Phase 2: persist to 0G Storage)
_agents: dict[str, AgentRecord] = {}


@router.post("", response_model=AgentRecord, status_code=201)
async def register_agent(agent_name: str, developer: str):
    """
    Register a new agent identity.
    Returns the created agent record including the generated agent_id.
    """
    record = AgentRecord(agent_name=agent_name, developer=developer)
    _agents[record.agent_id] = record
    return record


@router.get("/{agent_id}", response_model=AgentRecord)
async def get_agent(agent_id: str):
    """Retrieve an agent record by ID."""
    record = _agents.get(agent_id)
    if not record:
        raise HTTPException(status_code=404, detail="Agent not found")
    return record


@router.get("", response_model=list[AgentRecord])
async def list_agents():
    """List all registered agents."""
    return list(_agents.values())
