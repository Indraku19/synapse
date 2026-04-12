"use client";

import { useState, useEffect } from "react";
import { queryKnowledge, listNamespaces } from "@/lib/api";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import type { QueryResult } from "@/lib/types";

const SUGGESTED = [
  "race condition fix",
  "RAG chunking strategy",
  "DAO governance quorum",
  "ethers.js ABI decoding",
  "vector embedding best practice",
  "memory leak detection",
];

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="card-base p-5 flex flex-col gap-3 opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="shimmer-bg h-2 rounded w-full" />
      <div className="shimmer-bg h-3 rounded w-3/4" />
      <div className="shimmer-bg h-2 rounded w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="shimmer-bg h-2 rounded w-16" />
        <div className="shimmer-bg h-2 rounded w-10" />
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function QueryPage() {
  const [query, setQuery]           = useState("");
  const [namespace, setNamespace]   = useState<string | null>(null);
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState<QueryResult[] | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [searched, setSearched]     = useState(false);

  useEffect(() => {
    listNamespaces()
      .then((r) => setNamespaces(r.namespaces))
      .catch(() => {});
  }, []);

  const handleSearch = async (q?: string) => {
    const finalQuery = q ?? query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(false);
    setResults(null);

    try {
      const res = await queryKnowledge({
        query: finalQuery,
        top_k: 5,
        namespace,
      });
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
    <div className="flex flex-col gap-12 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 pt-8 text-center">
        <span className="mono text-xs text-text-muted uppercase tracking-widest">
          Semantic knowledge search
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Ask the network
        </h1>
        <p className="text-text-muted text-sm leading-relaxed max-w-sm mx-auto">
          Search across all knowledge stored by agents. Results are ranked by
          semantic similarity.
        </p>
      </div>

      {/* ── Search area ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {/* Main search input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="What do you want to know?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input-cyber text-base px-4 py-4 flex-1 text-text-primary"
            autoFocus
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary px-6 py-4 text-sm font-semibold shrink-0"
          >
            {loading ? "…" : "Search →"}
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => handleSearch(s)}
              className="mono text-xs px-3 py-1.5 border border-steel rounded text-text-muted hover:border-cyan hover:text-cyan transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Namespace + topK filters */}
        {(namespaces.length > 0 || true) && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-xs text-text-muted/60">namespace:</span>
              <button
                onClick={() => setNamespace(null)}
                className={`mono text-xs px-2.5 py-1 rounded border transition-colors ${
                  namespace === null
                    ? "border-lime text-lime bg-lime/10"
                    : "border-steel text-text-muted hover:border-lime hover:text-lime"
                }`}
              >
                all
              </button>
              {namespaces.map((ns) => (
                <button
                  key={ns}
                  onClick={() => setNamespace(namespace === ns ? null : ns)}
                  className={`mono text-xs px-2.5 py-1 rounded border transition-colors ${
                    namespace === ns
                      ? "border-cyan text-cyan bg-cyan/10"
                      : "border-steel text-text-muted hover:border-cyan hover:text-cyan"
                  }`}
                >
                  {ns}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-4 py-3 bg-red-950/20">
          Error: {error}
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-cyan" />
            <span className="mono text-xs text-text-muted">
              Searching the knowledge network…
            </span>
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} delay={i * 80} />
          ))}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {searched && results && !loading && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="mono text-xs text-text-muted uppercase tracking-widest">
              {results.length} result{results.length !== 1 ? "s" : ""}
              {namespace && (
                <span className="ml-2 px-1.5 py-0.5 rounded border border-cyan/30 text-cyan bg-cyan/5 normal-case">
                  {namespace}
                </span>
              )}
            </span>
            <span className="mono text-xs text-text-muted/60">ranked by similarity</span>
          </div>

          {results.length === 0 ? (
            <div className="card-base p-12 text-center flex flex-col items-center gap-3">
              <span className="text-3xl text-steel">◎</span>
              <span className="text-text-muted text-sm">
                No knowledge found for this query.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((r, i) => (
                <div
                  key={r.knowledge_id}
                  className="opacity-0 animate-slide-up"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <KnowledgeCard entry={r} showScore />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!searched && !loading && (
        <div className="card-base p-14 text-center flex flex-col items-center gap-4">
          <span className="text-4xl text-steel/60">◎</span>
          <span className="text-text-muted text-sm">
            Enter a query or pick a suggestion to search
          </span>
        </div>
      )}
    </div>
  );
}
