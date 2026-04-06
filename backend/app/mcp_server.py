"""
Synapse MCP Server — exposes Synapse as an MCP tool server.

Allows any MCP-compatible AI agent (e.g. Claude Code) to directly store,
query, and verify knowledge in the Synapse collective brain — without writing
any integration code.

Usage:
    cd backend
    python -m app.mcp_server [--api-url http://localhost:8000]

Claude Code config (~/.claude/mcp_servers.json):
    {
      "synapse": {
        "command": "python",
        "args": ["-m", "app.mcp_server", "--api-url", "http://localhost:8000"],
        "cwd": "/path/to/synapse/backend"
      }
    }

Available tools:
  synapse_store          — Store knowledge into the collective brain
  synapse_query          — Semantic search across stored knowledge
  synapse_namespaces     — List available knowledge domains
  synapse_stats          — Get network statistics
  synapse_mark_useful    — Vote that a knowledge entry was helpful
  synapse_get_links      — Get an entry and everything it references
"""
import argparse
import asyncio
import json
import sys

import httpx

try:
    import mcp.server.stdio
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    _MCP_AVAILABLE = True
except ImportError:
    _MCP_AVAILABLE = False

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "synapse_store",
        "description": (
            "Store a knowledge entry in the Synapse collective brain. "
            "The content is embedded, hashed, and persisted to 0G Storage with "
            "optional on-chain verification. Use a namespace to keep knowledge "
            "domain-isolated (e.g. 'medical', 'engineering')."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "agent_id":   {"type": "string", "description": "Unique ID of the storing agent"},
                "content":    {"type": "string", "description": "Knowledge text to store"},
                "source":     {"type": "string", "description": "URI identifying the origin"},
                "namespace":  {"type": "string", "description": "Domain namespace (optional)"},
                "references": {
                    "type":  "array",
                    "items": {"type": "string"},
                    "description": "knowledge_ids this entry builds upon (optional)",
                },
                "ttl_days":   {"type": "integer", "description": "Days until expiry (optional)"},
            },
            "required": ["agent_id", "content", "source"],
        },
    },
    {
        "name": "synapse_query",
        "description": (
            "Semantic search across the Synapse collective brain. "
            "Returns knowledge ranked by cosine similarity. "
            "Set namespace for context-isolated search (only that domain is searched). "
            "Omit namespace to search the global pool across all domains."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query":     {"type": "string", "description": "Natural-language search query"},
                "top_k":     {"type": "integer", "description": "Number of results (default: 5)"},
                "namespace": {"type": "string",  "description": "Restrict to this namespace (optional)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "synapse_namespaces",
        "description": "List all active knowledge domains (namespaces) in the Synapse network.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "synapse_stats",
        "description": "Get Synapse network statistics: entry count, unique agents, query count, etc.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "synapse_mark_useful",
        "description": (
            "Vote that a knowledge entry was useful. "
            "Increments the trust_score of the entry, making it rank higher "
            "in future queries for similar content."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "knowledge_id": {"type": "string", "description": "ID of the knowledge entry to upvote"},
            },
            "required": ["knowledge_id"],
        },
    },
    {
        "name": "synapse_get_links",
        "description": (
            "Retrieve a knowledge entry and all entries it references "
            "(one-hop knowledge graph traversal)."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "knowledge_id": {"type": "string", "description": "ID of the entry to look up"},
            },
            "required": ["knowledge_id"],
        },
    },
]


# ---------------------------------------------------------------------------
# HTTP client helpers
# ---------------------------------------------------------------------------

class SynapseClient:
    def __init__(self, api_url: str):
        self.base = api_url.rstrip("/")
        self._http = httpx.AsyncClient(timeout=15.0)

    async def store(self, payload: dict) -> dict:
        r = await self._http.post(f"{self.base}/knowledge", json=payload)
        r.raise_for_status()
        return r.json()

    async def query(self, payload: dict) -> dict:
        r = await self._http.post(f"{self.base}/knowledge/query", json=payload)
        r.raise_for_status()
        return r.json()

    async def namespaces(self) -> dict:
        r = await self._http.get(f"{self.base}/knowledge/namespaces")
        r.raise_for_status()
        return r.json()

    async def stats(self) -> dict:
        r = await self._http.get(f"{self.base}/knowledge/stats")
        r.raise_for_status()
        return r.json()

    async def mark_useful(self, knowledge_id: str) -> dict:
        r = await self._http.post(f"{self.base}/knowledge/{knowledge_id}/useful")
        r.raise_for_status()
        return r.json()

    async def get_links(self, knowledge_id: str) -> dict:
        r = await self._http.get(f"{self.base}/knowledge/{knowledge_id}/links")
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# MCP Server (requires `mcp` package)
# ---------------------------------------------------------------------------

def _build_text(data: dict | list) -> str:
    return json.dumps(data, indent=2, ensure_ascii=False)


async def run_mcp_server(api_url: str) -> None:
    if not _MCP_AVAILABLE:
        print(
            "ERROR: 'mcp' package is not installed.\n"
            "Install with: pip install mcp",
            file=sys.stderr,
        )
        sys.exit(1)

    client = SynapseClient(api_url)
    server = Server("synapse")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in TOOLS
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        try:
            if name == "synapse_store":
                result = await client.store(arguments)
            elif name == "synapse_query":
                result = await client.query({
                    "query":     arguments["query"],
                    "top_k":     arguments.get("top_k", 5),
                    "namespace": arguments.get("namespace"),
                })
            elif name == "synapse_namespaces":
                result = await client.namespaces()
            elif name == "synapse_stats":
                result = await client.stats()
            elif name == "synapse_mark_useful":
                result = await client.mark_useful(arguments["knowledge_id"])
            elif name == "synapse_get_links":
                result = await client.get_links(arguments["knowledge_id"])
            else:
                result = {"error": f"Unknown tool: {name}"}
        except httpx.HTTPError as e:
            result = {"error": str(e)}

        return [TextContent(type="text", text=_build_text(result))]

    async with mcp.server.stdio.stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


# ---------------------------------------------------------------------------
# Fallback: standalone HTTP demo (when mcp package is missing)
# ---------------------------------------------------------------------------

async def demo_without_mcp(api_url: str) -> None:
    client = SynapseClient(api_url)
    print(f"Synapse MCP Server — demo mode (mcp package not installed)")
    print(f"API: {api_url}\n")
    try:
        stats = await client.stats()
        print("Network stats:", json.dumps(stats, indent=2))
    except Exception as e:
        print(f"Could not reach Synapse API at {api_url}: {e}")
        print("Start the backend with: uvicorn app.main:app --reload")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Synapse MCP Server")
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="Synapse backend URL (default: http://localhost:8000)",
    )
    args = parser.parse_args()

    if _MCP_AVAILABLE:
        asyncio.run(run_mcp_server(args.api_url))
    else:
        asyncio.run(demo_without_mcp(args.api_url))


if __name__ == "__main__":
    main()
