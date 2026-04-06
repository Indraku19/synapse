"""
Synapse API — entry point.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import knowledge, agents
from app.services.websocket import ws_manager

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Synapse API",
    description=(
        "Decentralized memory network for AI agents. "
        "Enables agents to store, retrieve, and verify knowledge."
    ),
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(knowledge.router)
app.include_router(agents.router)


@app.get("/health", tags=["system"])
async def health():
    """Liveness check."""
    return {
        "status":      "ok",
        "version":     "0.2.0",
        "0g_storage":  settings.use_0g_storage,
        "0g_chain":    settings.use_0g_chain,
        "ws_clients":  ws_manager.connection_count,
    }


@app.websocket("/ws/feed")
async def websocket_feed(ws: WebSocket):
    """
    Live knowledge feed.

    Connect to receive real-time events whenever a knowledge entry is stored:
      { "type": "knowledge_stored", "knowledge_id": "...", "agent_id": "...",
        "namespace": "...", "timestamp": "...", "content_preview": "..." }

    Usage (JavaScript):
        const ws = new WebSocket("ws://localhost:8000/ws/feed");
        ws.onmessage = (e) => console.log(JSON.parse(e.data));
    """
    await ws_manager.connect(ws)
    try:
        while True:
            # Keep the connection alive — clients can send pings
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)


@app.on_event("startup")
async def on_startup():
    logger.info("Synapse API v0.2.0 starting up.")
    logger.info(
        "0G Storage: %s | 0G Chain: %s",
        "enabled" if settings.use_0g_storage else "local mock",
        "enabled" if settings.use_0g_chain  else "local mock",
    )
    logger.info("WebSocket live feed: ws://0.0.0.0:%s/ws/feed", settings.api_port)
