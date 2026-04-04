"use client";

import { useState } from "react";
import { queryKnowledge } from "@/lib/api";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import type { QueryResult } from "@/lib/types";

const SUGGESTED = [
  "race condition fix",
  "RAG chunking strategy",
  "DAO governance quorum",
  "ethers.js ABI decoding",
];

export default function QueryPage() {
  const [query, setQuery]       = useState("");
  const [topK, setTopK]         = useState(5);
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState<QueryResult[] | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q?: string) => {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(false);

    try {
      const res = await queryKnowledge({ query: finalQuery, top_k: topK });
      setResults(res.results);
      setSearched(true);
      if (q) setQuery(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="mono text-xs text-text-muted uppercase tracking-widest">
          POST /knowledge/query
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Query Knowledge
        </h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Perform a semantic search across all knowledge in the network.
          Results are ranked by vector similarity.
        </p>
      </div>

      {/* Search form */}
      <div className="card-base p-5 flex flex-col gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search the knowledge network…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input-cyber text-sm px-3 py-2.5 flex-1"
          />
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="input-cyber mono text-sm px-3 py-2.5 w-16 text-center"
            title="top_k — number of results"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary px-4 py-2.5 text-sm shrink-0"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>

        {/* top_k hint */}
        <div className="mono text-xs text-text-muted">
          top_k = {topK} · vector similarity search
        </div>

        {/* Suggested queries */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="mono text-xs px-2.5 py-1 border border-steel rounded text-text-muted hover:border-cyan hover:text-cyan transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-3 py-2 bg-red-950/20">
          ERROR: {error}
        </div>
      )}

      {/* Results */}
      {searched && results && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="mono text-xs text-text-muted uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </span>
            <span className="mono text-xs text-text-muted">
              Ranked by semantic similarity
            </span>
          </div>

          {results.length === 0 ? (
            <div className="card-base p-8 text-center text-text-muted text-sm">
              No knowledge found matching your query.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((r) => (
                <KnowledgeCard key={r.knowledge_id} entry={r} showScore />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && !loading && (
        <div className="card-base p-10 text-center flex flex-col items-center gap-3">
          <span className="text-3xl text-steel">◎</span>
          <span className="text-text-muted text-sm">
            Enter a query to search the knowledge network
          </span>
        </div>
      )}
    </div>
  );
}
