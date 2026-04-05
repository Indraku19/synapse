"use client";

import { useState } from "react";
import { storeKnowledge } from "@/lib/api";
import type { StoreKnowledgeResponse } from "@/lib/types";

export default function StorePage() {
  const [agentId, setAgentId]       = useState("");
  const [content, setContent]       = useState("");
  const [source, setSource]         = useState("");
  const [namespace, setNamespace]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<StoreKnowledgeResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const NS_SUGGESTIONS = ["engineering", "medical", "legal", "finance", "research"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await storeKnowledge({
        agent_id: agentId,
        content,
        source,
        namespace: namespace.trim() || null,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setAgentId("");
    setContent("");
    setSource("");
    setNamespace("");
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="mono text-xs text-text-muted uppercase tracking-widest">
          POST /knowledge
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Store Knowledge
        </h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Submit knowledge to the Synapse network. The content will be
          embedded, stored in 0G Storage, and a verification hash written
          to 0G Chain.
        </p>
      </div>

      {/* Form */}
      {!result ? (
        <form onSubmit={handleSubmit} className="card-base p-6 flex flex-col gap-5">
          {/* Agent ID */}
          <div className="flex flex-col gap-1.5">
            <label className="mono text-xs text-text-muted uppercase">
              Agent ID
            </label>
            <input
              type="text"
              required
              placeholder="agent_alpha_01"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="input-cyber mono text-sm px-3 py-2 w-full"
            />
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1.5">
            <label className="mono text-xs text-text-muted uppercase">
              Source
            </label>
            <input
              type="text"
              required
              placeholder="agent://coding-agent-alpha/v1"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input-cyber mono text-sm px-3 py-2 w-full"
            />
            <span className="mono text-xs text-text-muted">
              URI identifying the origin agent or system
            </span>
          </div>

          {/* Namespace */}
          <div className="flex flex-col gap-1.5">
            <label className="mono text-xs text-text-muted uppercase">
              Namespace <span className="normal-case text-steel">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. medical, legal, engineering — leave empty for global pool"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="input-cyber mono text-sm px-3 py-2 w-full"
            />
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {NS_SUGGESTIONS.map((ns) => (
                <button
                  key={ns}
                  type="button"
                  onClick={() => setNamespace(ns === namespace ? "" : ns)}
                  className={`mono text-xs px-2 py-0.5 rounded border transition-colors ${
                    namespace === ns
                      ? "border-cyan text-cyan bg-cyan/10"
                      : "border-steel text-text-muted hover:border-cyan hover:text-cyan"
                  }`}
                >
                  {ns}
                </button>
              ))}
            </div>
            <span className="mono text-xs text-text-muted">
              Agents querying this namespace will only see knowledge from this domain
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <label className="mono text-xs text-text-muted uppercase">
              Knowledge Content
            </label>
            <textarea
              required
              rows={6}
              placeholder="Describe the knowledge, insight, bug fix, or solution..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-cyber text-sm px-3 py-2 w-full resize-y"
            />
            <span className="mono text-xs text-text-muted">
              {content.length} chars · will be embedded and stored
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-3 py-2 bg-red-950/20">
              ERROR: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !agentId || !content || !source}
            className="btn-primary px-4 py-2.5 text-sm self-start"
          >
            {loading ? "Storing…" : "Store Knowledge →"}
          </button>
        </form>
      ) : (
        /* Success state */
        <div className="card-base p-6 flex flex-col gap-4 border-lime/20">
          <div className="flex items-center gap-2">
            <span className="text-lime text-xl">✓</span>
            <span className="font-medium">Knowledge stored successfully</span>
          </div>

          <div className="flex flex-col gap-3">
            <Field label="Knowledge ID"   value={result.knowledge_id} mono />
            <Field label="Status"         value={result.status.toUpperCase()} mono />
            {result.hash && (
              <Field label="SHA-256 Hash" value={result.hash} mono truncate />
            )}
            {result.cid && (
              <Field label="0G Storage CID" value={result.cid} mono truncate />
            )}
            <Field
              label="0G Chain"
              value={result.on_chain ? "✓ Verified on-chain" : "○ Local mode (chain disabled)"}
              mono
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="btn-primary px-4 py-2 text-sm"
            >
              Store Another
            </button>
            <a
              href="/explorer"
              className="px-4 py-2 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-colors"
            >
              View in Explorer
            </a>
          </div>
        </div>
      )}

      {/* Payload preview */}
      <div className="card-base p-4">
        <div className="mono text-xs text-text-muted mb-2 uppercase">Request Preview</div>
        <pre className="mono text-xs text-text-muted overflow-x-auto leading-relaxed">
          {JSON.stringify(
            {
              agent_id: agentId || "<agent_id>",
              content: content
                ? content.slice(0, 60) + (content.length > 60 ? "…" : "")
                : "<content>",
              source: source || "<source>",
              namespace: namespace.trim() || null,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="mono text-xs text-text-muted uppercase">{label}</span>
      <span
        className={`text-sm text-text-primary ${mono ? "mono" : ""} ${
          truncate ? "truncate" : "break-all"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
