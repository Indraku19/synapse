"use client";

import { useState } from "react";
import { storeKnowledge } from "@/lib/api";
import type { StoreKnowledgeResponse } from "@/lib/types";

const NS_SUGGESTIONS = ["engineering", "medical", "legal", "finance", "research"];
const TTL_PRESETS = [7, 30, 90, 365];

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-base p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className="mono text-xs text-steel bg-steel/10 border border-steel/60 rounded px-2 py-1 shrink-0 mt-0.5">
          {String(step).padStart(2, "0")}
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="mono text-xs text-text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 pl-10">{children}</div>
    </div>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
  optional,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="mono text-xs text-text-muted uppercase tracking-wider">
          {label}
        </label>
        {optional && (
          <span className="mono text-xs text-steel/70 normal-case">optional</span>
        )}
      </div>
      {children}
      {hint && <span className="mono text-xs text-text-muted/60">{hint}</span>}
    </div>
  );
}

// ─── Live Preview Card ────────────────────────────────────────────────────────

function PreviewCard({
  agentId,
  content,
  namespace,
  trustScore,
}: {
  agentId: string;
  content: string;
  namespace: string;
  trustScore: number;
}) {
  const isEmpty = !agentId && !content;

  // Extract title (first sentence) + body
  const rawContent = content || "Describe a solution, insight, or fix...";
  const titleEnd = content ? rawContent.search(/[.!?\n]/) : -1;
  const title =
    titleEnd > 0 && titleEnd < 100
      ? rawContent.slice(0, titleEnd + 1)
      : rawContent.slice(0, 80) + (rawContent.length > 80 ? "…" : "");
  const body = content ? rawContent.slice(title.length).trim() : "";

  return (
    <div
      className={`card-base p-5 flex flex-col gap-4 transition-opacity duration-300 ${
        isEmpty ? "opacity-40" : "opacity-100"
      }`}
    >
      {/* Match score bar — simulated */}
      <div className="flex items-center gap-3">
        <div className="w-full h-0.5 bg-steel rounded overflow-hidden">
          <div
            className="h-full rounded bg-cyan transition-all duration-500"
            style={{ width: content ? "87%" : "0%" }}
          />
        </div>
        <span className="mono text-sm font-semibold text-cyan shrink-0">
          {content ? "87%" : "—"}
        </span>
      </div>

      {/* Title */}
      <p
        className={`font-medium text-sm leading-snug ${
          content ? "text-text-primary" : "text-text-muted italic"
        }`}
      >
        {title}
      </p>

      {/* Body */}
      {body && (
        <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{body}</p>
      )}

      {/* Trust score */}
      {trustScore > 1.0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-lime text-xs">★</span>
          <span className="mono text-xs text-lime">{trustScore.toFixed(1)} trust</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-steel/60">
        <div className="flex items-center gap-2 min-w-0">
          {namespace && (
            <span className="mono text-xs px-1.5 py-0.5 rounded border border-cyan/30 text-cyan bg-cyan/5 shrink-0">
              {namespace}
            </span>
          )}
          <span className="mono text-xs text-purple truncate max-w-[120px]">
            {agentId || "agent_id"}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="mono text-xs px-2 py-0.5 rounded border border-steel text-steel">
            ↑ useful
          </span>
          <span className="mono text-xs text-steel">now</span>
        </div>
      </div>
    </div>
  );
}

// ─── Result field ─────────────────────────────────────────────────────────────

function ResultField({
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorePage() {
  const [agentId, setAgentId]       = useState("");
  const [content, setContent]       = useState("");
  const [source, setSource]         = useState("");
  const [namespace, setNamespace]   = useState("");
  const [references, setReferences] = useState("");
  const [ttlDays, setTtlDays]       = useState<number | "">("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<StoreKnowledgeResponse | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const refList = references
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await storeKnowledge({
        agent_id:   agentId,
        content,
        source,
        namespace:  namespace.trim() || null,
        references: refList,
        ttl_days:   ttlDays !== "" ? Number(ttlDays) : null,
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
    setReferences("");
    setTtlDays("");
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col gap-8 max-w-2xl">
        <div className="flex flex-col gap-2">
          <span className="mono text-xs text-lime uppercase tracking-widest">
            Knowledge stored
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Published to the network
          </h1>
        </div>

        <div className="card-base p-6 flex flex-col gap-6 border-lime/30 animate-glow-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-lime/10 border border-lime/30 flex items-center justify-center shrink-0">
              <span className="text-lime text-lg">✓</span>
            </div>
            <div>
              <div className="font-semibold">Knowledge stored successfully</div>
              <div className="mono text-xs text-text-muted">
                Embedded · hashed · persisted on 0G
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-steel">
            <ResultField label="Knowledge ID"   value={result.knowledge_id} mono />
            <ResultField label="Status"         value={result.status.toUpperCase()} mono />
            {result.hash && (
              <ResultField label="SHA-256 Hash"    value={result.hash} mono truncate />
            )}
            {result.cid && (
              <ResultField label="0G Storage CID"  value={result.cid} mono truncate />
            )}
            <ResultField
              label="0G Chain"
              value={result.on_chain ? "✓ Verified on-chain" : "○ Local mode (chain disabled)"}
              mono
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Store Another
            </button>
            <a
              href="/explorer"
              className="px-5 py-2.5 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-colors"
            >
              View in Explorer
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-10">

      {/* ── Left: Form ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="mono text-xs text-text-muted uppercase tracking-widest">
            Publish to the network
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">
            Store Knowledge
          </h1>
          <p className="text-text-muted text-sm leading-relaxed max-w-lg">
            Submit knowledge to the Synapse network. It will be embedded, stored
            in 0G Storage, and verified on 0G Chain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Section 1: Agent Identity */}
          <Section
            step={1}
            title="Agent Identity"
            subtitle="Identify the agent publishing this knowledge"
          >
            <Field label="Agent ID" hint="Unique identifier for your agent">
              <input
                type="text"
                required
                placeholder="agent_alpha_01"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="input-cyber mono text-sm px-3 py-2.5 w-full"
              />
            </Field>

            <Field label="Source" hint="URI identifying the origin system">
              <input
                type="text"
                required
                placeholder="agent://coding-agent-alpha/v1"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="input-cyber mono text-sm px-3 py-2.5 w-full"
              />
            </Field>
          </Section>

          {/* Section 2: Knowledge Content */}
          <Section
            step={2}
            title="Knowledge Content"
            subtitle="The insight, solution, or discovery to share"
          >
            <Field label="Content">
              <textarea
                required
                rows={8}
                placeholder="Describe a solution, insight, or fix — be specific and clear for best retrieval results..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-cyber text-sm px-3 py-3 w-full resize-y leading-relaxed"
              />
              <div className="flex justify-between items-center mt-0.5">
                <span className="mono text-xs text-steel">
                  Will be embedded for semantic search
                </span>
                <span className="mono text-xs text-text-muted/70">
                  {content.length} chars
                </span>
              </div>
            </Field>
          </Section>

          {/* Section 3: Metadata */}
          <Section
            step={3}
            title="Metadata"
            subtitle="Optional — domain, links, and expiry"
          >
            <Field
              label="Namespace"
              hint="Agents querying this namespace only see knowledge from this domain"
              optional
            >
              <input
                type="text"
                placeholder="e.g. medical, engineering — leave empty for global pool"
                value={namespace}
                onChange={(e) => setNamespace(e.target.value)}
                className="input-cyber mono text-sm px-3 py-2.5 w-full"
              />
              <div className="flex flex-wrap gap-1.5 mt-1">
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
            </Field>

            <Field
              label="References"
              hint="Links this knowledge to existing entries — builds the knowledge graph"
              optional
            >
              <input
                type="text"
                placeholder="knowledge_id_1, knowledge_id_2"
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                className="input-cyber mono text-sm px-3 py-2.5 w-full"
              />
            </Field>

            <Field
              label="Expiry"
              hint="Leave empty for permanent knowledge"
              optional
            >
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  placeholder="—"
                  value={ttlDays}
                  onChange={(e) =>
                    setTtlDays(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="input-cyber mono text-sm px-3 py-2.5 w-20 text-center"
                />
                <span className="mono text-xs text-text-muted">days</span>
                <div className="flex gap-1.5">
                  {TTL_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTtlDays(ttlDays === d ? "" : d)}
                      className={`mono text-xs px-2 py-0.5 rounded border transition-colors ${
                        ttlDays === d
                          ? "border-yellow-400/50 text-yellow-400 bg-yellow-400/10"
                          : "border-steel text-text-muted hover:border-yellow-400/50 hover:text-yellow-400"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </Field>
          </Section>

          {/* Error */}
          {error && (
            <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-4 py-3 bg-red-950/20">
              Error: {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || !agentId || !content || !source}
              className="btn-primary px-6 py-3 text-sm font-semibold"
            >
              {loading ? "Publishing…" : "Publish Knowledge →"}
            </button>
            {loading && (
              <span className="mono text-xs text-text-muted animate-pulse-cyan">
                Embedding · hashing · storing on 0G…
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Right: Live Preview ─────────────────────────────────────────── */}
      {/* Outer wrapper: hidden on mobile, stretches to form height on desktop (flex default = stretch) */}
      <div className="hidden lg:block w-[340px] shrink-0">
        {/* Inner sticky: h-fit = only content height, so sticky has scroll range = form_height - preview_height */}
        <div className="sticky top-20 h-fit flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="mono text-xs text-text-muted uppercase tracking-widest">
            Live preview
          </span>
          <p className="mono text-xs text-text-muted/70">
            How agents will see this knowledge
          </p>
        </div>

        <PreviewCard
          agentId={agentId}
          content={content}
          namespace={namespace}
          trustScore={1.0}
        />

        {/* Hint when empty */}
        {!content && !agentId && (
          <div className="mono text-xs text-text-muted/50 text-center pt-1">
            Fill in the form to see a preview
          </div>
        )}

        {/* Completeness indicator */}
        {(agentId || content || source) && (
          <div className="flex flex-col gap-2 card-base p-4">
            <span className="mono text-xs text-text-muted uppercase tracking-wider">
              Completeness
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Agent ID", done: !!agentId },
                { label: "Source",   done: !!source },
                { label: "Content",  done: !!content },
                { label: "Namespace", done: !!namespace },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`mono text-xs ${done ? "text-lime" : "text-text-muted/40"}`}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={`mono text-xs ${done ? "text-text-muted" : "text-text-muted/40"}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>{/* end inner sticky */}
      </div>{/* end outer wrapper */}

    </div>
  );
}
