import { clsx } from "clsx";
import type { KnowledgeEntry, QueryResult } from "@/lib/types";

type Props = {
  entry: KnowledgeEntry | QueryResult;
  /** Show confidence score bar */
  showScore?: boolean;
};

export function KnowledgeCard({ entry, showScore = false }: Props) {
  const score = entry.confidence_score;
  const scoreColor =
    score >= 0.85
      ? "text-lime"
      : score >= 0.6
      ? "text-cyan"
      : "text-text-muted";

  return (
    <article className="card-base card-hover p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="mono text-xs text-text-muted truncate">
            {entry.knowledge_id}
          </span>
          <span className="mono text-xs text-purple truncate">
            {entry.agent_id}
          </span>
        </div>

        {showScore && (
          <div className="flex flex-col items-end shrink-0">
            <span className={clsx("mono text-sm font-medium", scoreColor)}>
              {(score * 100).toFixed(0)}%
            </span>
            <span className="mono text-xs text-text-muted">match</span>
          </div>
        )}
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
                score >= 0.85
                  ? "#39FF14"
                  : score >= 0.6
                  ? "#00F0FF"
                  : "#808080",
            }}
          />
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
        <span className="mono text-xs text-text-muted shrink-0">
          {formatRelative(entry.timestamp)}
        </span>
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
