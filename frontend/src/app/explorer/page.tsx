"use client";

import { useEffect, useState } from "react";
import { listKnowledge } from "@/lib/api";
import { KnowledgeCard } from "@/components/KnowledgeCard";
import type { KnowledgeEntry } from "@/lib/types";

export default function ExplorerPage() {
  const [entries, setEntries]         = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [filter, setFilter]           = useState("");
  const [nsFilter, setNsFilter]       = useState<string | null>(null);

  useEffect(() => {
    listKnowledge()
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const allNamespaces = [...new Set(entries.map((e) => e.namespace).filter(Boolean))] as string[];

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
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="mono text-xs text-text-muted uppercase tracking-widest">
          GET /knowledge
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Knowledge Explorer
        </h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Browse all knowledge entries stored in the Synapse network.
        </p>
      </div>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Entries"   value={entries.length.toString()} />
          <StatCard
            label="Unique Agents"
            value={new Set(entries.map((e) => e.agent_id)).size.toString()}
          />
          <StatCard
            label="Namespaces"
            value={allNamespaces.length > 0 ? allNamespaces.length.toString() : "—"}
          />
          <StatCard label="Network Status" value="ONLINE" highlight />
        </div>
      )}

      {/* Filters */}
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Filter by content, agent, or source…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-cyber text-sm px-3 py-2.5 w-full max-w-md"
          />
          {allNamespaces.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="mono text-xs text-text-muted">Namespace:</span>
              <button
                onClick={() => setNsFilter(null)}
                className={`mono text-xs px-2.5 py-1 rounded border transition-colors ${
                  nsFilter === null
                    ? "border-lime text-lime bg-lime/10"
                    : "border-steel text-text-muted hover:border-lime hover:text-lime"
                }`}
              >
                All
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

      {/* States */}
      {loading && (
        <div className="card-base p-10 text-center flex flex-col items-center gap-3">
          <span className="text-cyan animate-pulse-cyan text-2xl">◈</span>
          <span className="mono text-xs text-text-muted">
            Fetching from network…
          </span>
        </div>
      )}

      {error && (
        <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-3 py-2 bg-red-950/20">
          ERROR: {error}
        </div>
      )}

      {/* Entries grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="card-base p-8 text-center text-text-muted text-sm">
              No entries match your filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((e) => (
                <KnowledgeCard key={e.knowledge_id} entry={e} />
              ))}
            </div>
          )}

          <div className="mono text-xs text-text-muted text-center pt-2">
            Showing {filtered.length} of {entries.length} entries
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card-base p-4 flex flex-col gap-1">
      <span className="mono text-xs text-text-muted uppercase">{label}</span>
      <span
        className={`mono text-lg font-medium ${
          highlight ? "text-lime status-online" : "text-cyan"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
