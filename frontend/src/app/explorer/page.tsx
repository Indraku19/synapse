"use client";

import { useEffect, useState } from "react";
import { listKnowledge } from "@/lib/api";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import type { KnowledgeEntry } from "@/lib/types";

// ─── Skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card-base p-5 flex flex-col gap-3">
      <div className="shimmer-bg h-3 rounded w-3/4" />
      <div className="shimmer-bg h-2 rounded w-full" />
      <div className="shimmer-bg h-2 rounded w-5/6" />
      <div className="flex gap-2 pt-2">
        <div className="shimmer-bg h-2 rounded w-16" />
        <div className="shimmer-bg h-2 rounded w-12" />
      </div>
    </div>
  );
}

// ─── Stat pill ───────────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  color = "text-cyan",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1 card-base px-5 py-4 text-center">
      <span className={`mono text-2xl font-semibold ${color}`}>{value}</span>
      <span className="mono text-xs text-text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExplorerPage() {
  const [entries, setEntries]   = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filter, setFilter]     = useState("");
  const [nsFilter, setNsFilter] = useState<string | null>(null);

  useEffect(() => {
    listKnowledge()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allNamespaces = [
    ...new Set(entries.map((e) => e.namespace).filter(Boolean)),
  ] as string[];

  const filtered = entries.filter((e) => {
    const matchText =
      !filter ||
      e.content.toLowerCase().includes(filter.toLowerCase()) ||
      e.agent_id.toLowerCase().includes(filter.toLowerCase()) ||
      e.source.toLowerCase().includes(filter.toLowerCase());
    const matchNs = nsFilter === null || e.namespace === nsFilter;
    return matchText && matchNs;
  });

  return (
    <div className="flex flex-col gap-10">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-4">
        <span className="mono text-xs text-text-muted uppercase tracking-widest">
          Knowledge base
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">
          Explorer
        </h1>
        <p className="text-text-muted text-sm leading-relaxed max-w-md">
          Browse all knowledge stored in the Synapse network.
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill
            label="Total Entries"
            value={entries.length.toString()}
            color="text-cyan"
          />
          <StatPill
            label="Unique Agents"
            value={new Set(entries.map((e) => e.agent_id)).size.toString()}
            color="text-purple"
          />
          <StatPill
            label="Namespaces"
            value={allNamespaces.length > 0 ? allNamespaces.length.toString() : "—"}
            color="text-cyan"
          />
          <StatPill
            label="Network"
            value="ONLINE"
            color="text-lime"
          />
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Search by content, agent, or source…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-cyber text-sm px-4 py-3 w-full max-w-lg"
          />
          {allNamespaces.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="mono text-xs text-text-muted/60">namespace:</span>
              <button
                onClick={() => setNsFilter(null)}
                className={`mono text-xs px-2.5 py-1 rounded border transition-colors ${
                  nsFilter === null
                    ? "border-lime text-lime bg-lime/10"
                    : "border-steel text-text-muted hover:border-lime hover:text-lime"
                }`}
              >
                all
              </button>
              {allNamespaces.map((ns) => (
                <button
                  key={ns}
                  onClick={() => setNsFilter(nsFilter === ns ? null : ns)}
                  className={`mono text-xs px-2.5 py-1 rounded border transition-colors ${
                    nsFilter === ns
                      ? "border-cyan text-cyan bg-cyan/10"
                      : "border-steel text-text-muted hover:border-cyan hover:text-cyan"
                  }`}
                >
                  {ns}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-cyan" />
            <span className="mono text-xs text-text-muted">Fetching from network…</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-4 py-3 bg-red-950/20">
          Error: {error}
        </div>
      )}

      {/* ── Entries ─────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="card-base p-12 text-center flex flex-col items-center gap-3">
              <span className="text-3xl text-steel">◈</span>
              <span className="text-text-muted text-sm">
                {filter || nsFilter
                  ? "No entries match your filter."
                  : "No knowledge stored yet. Be the first to publish."}
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((e, i) => (
                  <div
                    key={e.knowledge_id}
                    className="opacity-0 animate-slide-up"
                    style={{
                      animationDelay: `${Math.min(i * 40, 300)}ms`,
                      animationFillMode: "forwards",
                    }}
                  >
                    <KnowledgeCard entry={e} />
                  </div>
                ))}
              </div>
              <div className="mono text-xs text-text-muted/60 text-center pt-2">
                Showing {filtered.length} of {entries.length} entries
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
