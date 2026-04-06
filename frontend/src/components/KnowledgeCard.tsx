"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { markUseful } from "@/lib/api";
import type { KnowledgeEntry, QueryResult } from "@/lib/types";

type Props = {
  entry: KnowledgeEntry | QueryResult;
  showScore?: boolean;
};

export function KnowledgeCard({ entry, showScore = false }: Props) {
  const score     = entry.confidence_score;
  const scoreColor =
    score >= 0.85 ? "text-lime" : score >= 0.6 ? "text-cyan" : "text-text-muted";

  const [useCount, setUseCount]   = useState(entry.use_count ?? 0);
  const [trustScore, setTrust]    = useState(entry.trust_score ?? 1.0);
  const [marking, setMarking]     = useState(false);
  const [marked, setMarked]       = useState(false);

  const handleMarkUseful = async () => {
    if (marking || marked) return;
    setMarking(true);
    try {
      const res = await markUseful(entry.knowledge_id);
      setUseCount(res.use_count);
      setTrust(res.trust_score);
      setMarked(true);
    } catch {
      // non-critical
    }
    setMarking(false);
  };

  const expires = entry.expires_at ? new Date(entry.expires_at) : null;
  const isExpiringSoon =
    expires !== null && expires.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3; // < 3 days

  const refs = entry.references ?? [];

  return (
    <article className="card-base card-hover p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="mono text-xs text-text-muted truncate">
            {entry.knowledge_id}
          </span>
          <span className="mono text-xs text-purple truncate">{entry.agent_id}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Trust score badge */}
          {trustScore > 1.0 && (
            <span
              className="mono text-xs px-1.5 py-0.5 rounded border border-lime/30 text-lime bg-lime/5"
              title={`Trust score: ${trustScore.toFixed(1)}`}
            >
              ★ {trustScore.toFixed(1)}
            </span>
          )}

          {showScore && (
            <div className="flex flex-col items-end">
              <span className={clsx("mono text-sm font-medium", scoreColor)}>
                {(score * 100).toFixed(0)}%
              </span>
              <span className="mono text-xs text-text-muted">match</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-text-primary leading-relaxed line-clamp-4">
        {entry.content}
      </p>

      {/* Confidence bar */}
      {showScore && (
        <div className="w-full h-0.5 bg-steel rounded overflow-hidden">
          <div
            className="h-full rounded transition-all duration-500"
            style={{
              width: `${score * 100}%`,
              background:
                score >= 0.85 ? "#39FF14" : score >= 0.6 ? "#00F0FF" : "#808080",
            }}
          />
        </div>
      )}

      {/* References */}
      {refs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs mono text-text-muted">
          <span className="text-steel">⊸</span>
          <span>refs {refs.length} entr{refs.length === 1 ? "y" : "ies"}</span>
          <span className="text-steel truncate max-w-[200px]">
            ({refs[0].slice(0, 12)}…{refs.length > 1 ? ` +${refs.length - 1}` : ""})
          </span>
        </div>
      )}

      {/* Expiry warning */}
      {expires && (
        <div
          className={clsx(
            "mono text-xs flex items-center gap-1",
            isExpiringSoon ? "text-yellow-400" : "text-text-muted"
          )}
        >
          <span>⏱</span>
          <span>
            {isExpiringSoon ? "Expires soon — " : "Expires "}
            {expires.toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-steel">
        <div className="flex items-center gap-2 min-w-0">
          {entry.namespace && (
            <span className="mono text-xs px-1.5 py-0.5 rounded border border-cyan/30 text-cyan bg-cyan/5 shrink-0">
              {entry.namespace}
            </span>
          )}
          <span className="mono text-xs text-text-muted truncate max-w-[180px]">
            {entry.source}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mark useful button */}
          <button
            onClick={handleMarkUseful}
            disabled={marking || marked}
            className={clsx(
              "mono text-xs px-2 py-0.5 rounded border transition-colors",
              marked
                ? "border-lime/30 text-lime bg-lime/5 cursor-default"
                : "border-steel text-text-muted hover:border-lime hover:text-lime"
            )}
            title="Mark as useful — increases trust score"
          >
            {marked ? `✓ useful (${useCount})` : `↑ useful${useCount > 0 ? ` (${useCount})` : ""}`}
          </button>

          <span className="mono text-xs text-text-muted">
            {formatRelative(entry.timestamp)}
          </span>
        </div>
      </div>

      {"hash" in entry && entry.hash && (
        <div className="mono text-xs text-steel truncate" title={entry.hash}>
          0x{entry.hash.slice(0, 32)}…
        </div>
      )}
    </article>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
