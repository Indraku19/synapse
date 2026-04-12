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
  const score = entry.confidence_score;
  const scoreColor =
    score >= 0.85 ? "text-lime" : score >= 0.6 ? "text-cyan" : "text-text-muted";
  const scoreBarColor =
    score >= 0.85 ? "#39FF14" : score >= 0.6 ? "#00F0FF" : "#808080";

  const [useCount, setUseCount] = useState(entry.use_count ?? 0);
  const [trustScore, setTrust] = useState(entry.trust_score ?? 1.0);
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

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
    expires !== null && expires.getTime() - Date.now() < 1000 * 60 * 60 * 24 * 3;

  const refs = entry.references ?? [];

  // Extract a short "title" from the first sentence / 80 chars
  const rawContent = entry.content ?? "";
  const titleEnd = rawContent.search(/[.!?\n]/);
  const title =
    titleEnd > 0 && titleEnd < 100
      ? rawContent.slice(0, titleEnd + 1)
      : rawContent.slice(0, 80) + (rawContent.length > 80 ? "…" : "");
  const body = rawContent.slice(title.length).trim();

  return (
    <article className="card-base card-hover p-5 flex flex-col gap-4 group">

      {/* Score badge (query results) */}
      {showScore && (
        <div className="flex items-center justify-between gap-3">
          <div className="w-full h-0.5 bg-steel rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-700"
              style={{ width: `${score * 100}%`, background: scoreBarColor }}
            />
          </div>
          <span className={clsx("mono text-sm font-semibold shrink-0", scoreColor)}>
            {(score * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Title — prominent */}
      <p className="font-medium text-text-primary leading-snug text-sm">{title}</p>

      {/* Body — muted, truncated */}
      {body && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{body}</p>
      )}

      {/* Trust score */}
      {trustScore > 1.0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-lime text-xs">★</span>
          <span className="mono text-xs text-lime">{trustScore.toFixed(1)} trust</span>
          {useCount > 0 && (
            <span className="mono text-xs text-text-muted">· {useCount} votes</span>
          )}
        </div>
      )}

      {/* References */}
      {refs.length > 0 && (
        <div className="flex items-center gap-1.5 mono text-xs text-text-muted">
          <span className="text-steel">⊸</span>
          <span>
            {refs.length} linked entr{refs.length === 1 ? "y" : "ies"}
          </span>
        </div>
      )}

      {/* Expiry */}
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
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-steel/60">
        <div className="flex items-center gap-2 min-w-0">
          {entry.namespace && (
            <span className="mono text-xs px-1.5 py-0.5 rounded border border-cyan/30 text-cyan bg-cyan/5 shrink-0">
              {entry.namespace}
            </span>
          )}
          <span className="mono text-xs text-purple truncate max-w-[120px]">
            {entry.agent_id}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
            {marked
              ? `✓ useful`
              : `↑ useful${useCount > 0 ? ` (${useCount})` : ""}`}
          </button>
          <span className="mono text-xs text-text-muted/60">{formatRelative(entry.timestamp)}</span>
        </div>
      </div>

    </article>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
