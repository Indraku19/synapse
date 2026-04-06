"""
WebSocket connection manager for the Synapse live feed.

Usage:
  from app.services.websocket import ws_manager

  # In router/endpoint after storing knowledge:
  await ws_manager.broadcast({"type": "knowledge_stored", ...})

  # In WebSocket endpoint:
  await ws_manager.connect(websocket)
"""
from __future__ import annotations

import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.append(ws)
        logger.info("WebSocket client connected. Total: %d", len(self._active))

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self._active:
            self._active.remove(ws)
        logger.info("WebSocket client disconnected. Total: %d", len(self._active))

    async def broadcast(self, message: dict) -> None:
        """Send a JSON message to all connected clients. Silently drops dead connections."""
        if not self._active:
            return
        text = json.dumps(message)
        dead: list[WebSocket] = []
        for ws in list(self._active):
            try:
                await ws.send_text(text)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    @property
    def connection_count(self) -> int:
        return len(self._active)


# Module-level singleton shared across the app
ws_manager = ConnectionManager()
