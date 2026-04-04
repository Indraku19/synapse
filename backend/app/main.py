"""
Synapse API — entry point.

Run with:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import knowledge, agents

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
    version="0.1.0",
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
        "status": "ok",
        "version": "0.1.0",
        "0g_storage": settings.use_0g_storage,
        "0g_chain":   settings.use_0g_chain,
    }


@app.on_event("startup")
async def on_startup():
    logger.info("Synapse API starting up.")
    logger.info(
        "0G Storage: %s | 0G Chain: %s",
        "enabled" if settings.use_0g_storage else "local mock",
        "enabled" if settings.use_0g_chain  else "local mock",
    )
