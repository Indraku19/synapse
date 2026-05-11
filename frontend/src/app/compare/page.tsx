"use client";

import React from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Feature matrix data
───────────────────────────────────────────── */
type Support = "yes" | "partial" | "no";

interface Project {
  name: string;
  category: string;
  url: string;
  highlight?: boolean;
}

const PROJECTS: Project[] = [
  { name: "Synapse", category: "Knowledge Layer + Decentralized", url: "https://synapse02.vercel.app", highlight: true },
  { name: "Mem0", category: "AI Agent Memory", url: "https://mem0.ai" },
  { name: "Zep / Graphiti", category: "Knowledge Graph Memory", url: "https://getzep.com" },
  { name: "Cognee", category: "Hybrid Memory", url: "https://cognee.ai" },
  { name: "Graphlit", category: "Semantic + MCP", url: "https://graphlit.com" },
  { name: "CrewAI", category: "Multi-agent Framework", url: "https://crewai.com" },
  { name: "claude-code-flow", category: "Agent Orchestration", url: "https://github.com/INTGworld/claude-code-flow" },
  { name: "Bittensor", category: "Decentralized AI", url: "https://bittensor.ai" },
  { name: "Autonolas", category: "On-chain Agents", url: "https://autonolas.ai" },
  { name: "Pinecone", category: "Vector Database", url: "https://pinecone.io" },
];

interface Feature {
  label: string;
  group: string;
  values: Support[];
  synapseNote?: string;
}

const FEATURES: Feature[] = [
  // Core knowledge
  { label: "Semantic Vector Search", group: "Knowledge", values: ["yes","yes","yes","yes","yes","partial","no","no","no","yes"], synapseNote: "FAISS / all-MiniLM-L6-v2" },
  { label: "Knowledge Graph", group: "Knowledge", values: ["yes","no","yes","yes","partial","no","no","no","no","no"], synapseNote: "Multi-hop BFS traversal" },
  { label: "Multi-hop Graph Traversal", group: "Knowledge", values: ["yes","no","no","yes","no","no","no","no","no","no"], synapseNote: "direction: forward / backward / both" },
  { label: "Namespace Isolation", group: "Knowledge", values: ["yes","partial","no","partial","partial","no","no","no","no","yes"], synapseNote: "Explicit per-query, per-store" },
  { label: "Knowledge TTL / Expiry", group: "Knowledge", values: ["yes","no","yes","no","no","no","no","no","no","no"], synapseNote: "Per-entry ttl_days" },
  // Trust & reputation
  { label: "Trust Score per Entry", group: "Trust & Reputation", values: ["yes","no","no","no","no","no","no","partial","no","no"], synapseNote: "1.0 → 2.0 via collective votes" },
  { label: "Agent Reputation Score", group: "Trust & Reputation", values: ["yes","no","no","no","no","no","no","yes","partial","no"], synapseNote: "1.0 → 5.0 · useful_votes / total_stores" },
  // Decentralized / blockchain
  { label: "On-Chain Verification", group: "Decentralized (0G)", values: ["yes","no","no","no","no","no","no","yes","yes","no"], synapseNote: "SHA-256 hash on KnowledgeRegistry.sol" },
  { label: "Decentralized Storage", group: "Decentralized (0G)", values: ["yes","no","no","no","no","no","no","partial","no","no"], synapseNote: "0G Storage — CID per entry" },
  { label: "Tamper-proof / Immutable", group: "Decentralized (0G)", values: ["yes","no","no","no","no","no","no","yes","yes","no"], synapseNote: "Blockchain-enforced" },
  { label: "Censorship Resistant", group: "Decentralized (0G)", values: ["yes","no","no","no","no","no","no","yes","yes","no"], synapseNote: "No single point of control" },
  { label: "Verifiable Provenance", group: "Decentralized (0G)", values: ["yes","no","no","no","no","no","no","partial","yes","no"], synapseNote: "agentId + timestamp on-chain" },
  // Integration
  { label: "MCP Server Native", group: "Integration", values: ["yes","no","no","yes","yes","no","yes","no","no","no"], synapseNote: "6 tools: store, query, graph, vote…" },
  { label: "WebSocket Live Feed", group: "Integration", values: ["yes","no","no","no","no","no","yes","no","no","no"], synapseNote: "Real-time broadcast on store" },
  { label: "Developer SDK", group: "Integration", values: ["yes","yes","yes","yes","yes","yes","yes","partial","yes","yes"], synapseNote: "sdk/synapse_sdk.py — single file" },
  // Persistence & sharing
  { label: "Cross-Session Persistence", group: "Persistence", values: ["yes","yes","yes","yes","yes","yes","no","yes","yes","yes"], synapseNote: "JSON snapshot + 0G Storage" },
  { label: "Cross-Agent Knowledge Sharing", group: "Persistence", values: ["yes","partial","partial","partial","partial","yes","yes","yes","yes","partial"], synapseNote: "Any agent, any language, via API" },
  { label: "Cross-Project Knowledge Sharing", group: "Persistence", values: ["yes","partial","no","no","no","no","no","yes","yes","partial"], synapseNote: "Same namespace, different projects" },
  // Access
  { label: "Open Source", group: "Access", values: ["yes","yes","yes","yes","no","yes","yes","yes","yes","no"] },
  { label: "Self-hostable", group: "Access", values: ["yes","yes","yes","yes","no","yes","yes","yes","yes","no"] },
  { label: "No Vendor Lock-in", group: "Access", values: ["yes","partial","partial","yes","no","yes","yes","yes","yes","no"] },
];

/* ─────────────────────────────────────────────
   Advantage cards (per competitor)
───────────────────────────────────────────── */
const COMPETITOR_CARDS = [
  {
    name: "Mem0",
    url: "https://mem0.ai",
    similar: "Persistent storage, semantic embeddings, cross-session memory",
    diff: "Centralized — no blockchain, no trust score, no knowledge graph. Data owned by the vendor.",
  },
  {
    name: "Zep / Graphiti",
    url: "https://getzep.com",
    similar: "Temporal knowledge graph, semantic storage, knowledge graph structure",
    diff: "Centralized — no namespace isolation, no on-chain verification, limited multi-agent sharing.",
  },
  {
    name: "Cognee",
    url: "https://cognee.ai",
    similar: "Vector + graph hybrid, MCP integration, multi-backend support",
    diff: "Centralized — no blockchain, no trust scoring, no agent reputation. Closest to Synapse but missing the decentralized layer.",
  },
  {
    name: "Graphlit",
    url: "https://graphlit.com",
    similar: "Semantic retrieval, knowledge graph, MCP native, 30+ connectors",
    diff: "Closed-source, centralized SaaS — no blockchain, no trust scoring, no self-hosting.",
  },
  {
    name: "CrewAI",
    url: "https://crewai.com",
    similar: "Role-based multi-agent teams, long-term memory per agent",
    diff: "Knowledge is framework-scoped — does not persist cross-project or cross-framework. No blockchain.",
  },
  {
    name: "claude-code-flow",
    url: "https://github.com/INTGworld/claude-code-flow",
    similar: "Multi-agent orchestration, shared memory within session, MCP integration",
    diff: "In-session memory only — lost on session end. No blockchain, no cross-project persistence.",
  },
  {
    name: "Bittensor",
    url: "https://bittensor.ai",
    similar: "Decentralized validation, token incentives, trust scoring via Proof of Intelligence",
    diff: "Compute network — not a knowledge persistence layer. No semantic search, no knowledge graph.",
  },
  {
    name: "Autonolas",
    url: "https://autonolas.ai",
    similar: "On-chain agent coordination, DAO governance, agent registry",
    diff: "Agent orchestration — no persistent semantic knowledge storage or retrieval.",
  },
  {
    name: "Pinecone",
    url: "https://pinecone.io",
    similar: "Semantic vector search, namespace isolation, production-grade infrastructure",
    diff: "Pure vector database — no knowledge graph, no blockchain, no trust scoring, no agent features.",
  },
];

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const GROUPS = Array.from(new Set(FEATURES.map((f) => f.group)));

function SupportIcon({ v }: { v: Support }) {
  if (v === "yes")     return <span className="text-lime font-bold text-sm leading-none" title="Supported">✓</span>;
  if (v === "partial") return <span className="text-amber-400 text-xs font-medium leading-none" title="Partial / limited">~</span>;
  return                      <span className="text-gray-700 text-base leading-none" title="Not supported">—</span>;
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */
export default function ComparePage() {
  return (
    <div className="flex flex-col gap-16 pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 pt-8">
        <span className="mono text-xs text-text-muted uppercase tracking-widest">Competitive Landscape</span>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          How Synapse Compares
        </h1>
        <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
          Synapse is the <span className="text-text-primary font-medium">only AI knowledge layer</span> that combines
          semantic search, knowledge graphs, trust scoring, and agent reputation — with every entry{" "}
          <span className="text-cyan">verified on-chain</span> via{" "}
          <a href="https://0g.ai" target="_blank" rel="noopener noreferrer" className="text-cyan hover:opacity-80 transition-opacity font-medium">0G Network</a>{" "}
          and stored on <span className="text-cyan">decentralized infrastructure</span>. No other platform occupies this space.
        </p>
      </div>

      {/* ── Unique position callout ── */}
      <div className="card-base border border-cyan/30 p-6 bg-cyan/[0.03] flex flex-col gap-4">
        <span className="mono text-xs text-cyan uppercase tracking-widest">Unique Position</span>
        <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
          After surveying <span className="text-text-primary font-semibold">52 projects</span> across AI agent memory, multi-agent frameworks,
          decentralized AI, vector databases, and on-chain verification —{" "}
          <span className="text-text-primary font-semibold">no single project</span> combines all of the following simultaneously:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
          {[
            "Semantic Vector Search",
            "Knowledge Graph (multi-hop)",
            "Namespace Isolation",
            "Trust Score per Entry",
            "Agent Reputation",
            "On-Chain Verification (0G)",
            "Decentralized Storage (0G)",
            "MCP Server Native",
            "WebSocket Live Feed",
            "Disk Persistence",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 mono text-xs text-text-primary">
              <span className="text-lime shrink-0">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-steel/50 pt-4 mt-2">
          <p className="mono text-xs text-gray-400">
            Closest competitor:{" "}
            <span className="text-text-primary font-medium">Cognee</span>{" "}
            <span className="text-gray-500">(vector+graph+MCP) · Missing: blockchain layer, trust scoring, agent reputation</span>
            <span className="mx-2 text-gray-600">·</span>
            <span className="text-cyan font-semibold">Synapse = Cognee + 0G Chain + trust scoring + agent reputation</span>
          </p>
        </div>
      </div>

      {/* ── 0G Advantage callout ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">The 0G Advantage</h2>
        <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
          Every competitor stores knowledge on <span className="text-gray-500">centralized servers</span>. Synapse stores knowledge on{" "}
          <a href="https://0g.ai" target="_blank" rel="noopener noreferrer" className="text-cyan font-medium hover:opacity-80">0G Network</a>,
          the first AI-native <span className="text-text-primary font-medium">decentralized storage and chain</span>. This changes the trust model fundamentally.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: "Data Ownership", centralized: "Vendor holds your data", synapse: "Agent / developer owns data on 0G" },
            { label: "Verification", centralized: '"Trust us" — no audit trail', synapse: "SHA-256 hash on-chain, publicly verifiable" },
            { label: "Availability", centralized: "Server down = data inaccessible", synapse: "Decentralized nodes — no single point of failure" },
            { label: "Censorship", centralized: "Provider can delete or modify entries", synapse: "Immutable once written to 0G Chain" },
            { label: "Provenance", centralized: "No proof of who stored what, when", synapse: "agentId + timestamp permanently on-chain" },
            { label: "Throughput", centralized: "Depends on cloud SLA", synapse: "0G DA Layer: 50 Gbps — AI-scale" },
          ].map(({ label, centralized, synapse }) => (
            <div key={label} className="card-base border border-steel p-4 flex flex-col gap-3">
              <span className="text-xs font-medium text-text-primary">{label}</span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <span className="mono text-xs text-gray-600 shrink-0 mt-0.5">✕</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{centralized}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mono text-xs text-lime shrink-0 mt-0.5 font-bold">✓</span>
                  <span className="text-xs text-gray-200 leading-relaxed">{synapse}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature matrix ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Feature Matrix</h2>
          <p className="text-text-muted text-xs mono">
            <span className="text-lime">✓</span> Supported ·{" "}
            <span className="text-yellow-400">~</span> Partial ·{" "}
            <span className="text-steel">—</span> Not supported
          </p>
        </div>

        <div className="overflow-x-auto rounded border border-steel">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-steel" style={{ background: "#0a0a0a" }}>
                <th className="text-left px-4 py-3 mono text-text-muted font-normal w-56 sticky left-0 z-10 border-r border-steel" style={{ background: "#0a0a0a" }}>
                  Feature
                </th>
                {PROJECTS.map((p) => (
                  <th
                    key={p.name}
                    className={`px-3 py-3 text-center font-normal mono text-xs ${
                      p.highlight
                        ? "text-cyan bg-cyan/5 border-x border-cyan/20"
                        : "text-gray-400"
                    }`}
                  >
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hover:opacity-80 transition-opacity ${p.highlight ? "text-cyan font-medium" : ""}`}
                    >
                      {p.name}
                    </a>
                    {p.highlight && (
                      <div className="text-cyan/60 text-[9px] mt-0.5">← this project</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => {
                const groupFeatures = FEATURES.filter((f) => f.group === group);
                return (
                  <React.Fragment key={group}>
                    <tr className="border-t-2 border-steel/40">
                      <td
                        colSpan={PROJECTS.length + 1}
                        className="px-4 py-2 mono text-[10px] uppercase tracking-widest sticky left-0"
                        style={{ background: "#080808", color: groupColor(group) }}
                      >
                        {group}
                      </td>
                    </tr>
                    {groupFeatures.map((feature, fi) => (
                      <tr
                        key={feature.label}
                        className={`border-t border-steel/20 hover:bg-steel/10 transition-colors ${fi % 2 === 0 ? "" : ""}`}
                      >
                        <td className="px-4 py-2.5 text-text-primary sticky left-0 border-r border-steel/20 z-10" style={{ background: "#050505" }}>
                          <div className="leading-tight">{feature.label}</div>
                          {feature.synapseNote && (
                            <div className="mono text-[10px] text-cyan mt-0.5">{feature.synapseNote}</div>
                          )}
                        </td>
                        {PROJECTS.map((p, pi) => (
                          <td
                            key={p.name}
                            className={`px-3 py-2.5 text-center ${
                              p.highlight ? "bg-cyan/[0.03] border-x border-cyan/10" : ""
                            }`}
                          >
                            <SupportIcon v={feature.values[pi]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Competitor cards ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Project-by-Project Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COMPETITOR_CARDS.map(({ name, url, similar, diff }) => (
            <div key={name} className="card-base border border-steel p-4 flex flex-col gap-3 card-hover">
              <div className="flex items-center justify-between">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-sm font-medium text-text-primary hover:text-cyan transition-colors"
                >
                  {name} ↗
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="mono text-[10px] text-lime shrink-0 mt-0.5 uppercase tracking-widest w-12">Similar</span>
                  <span className="text-xs text-gray-300 leading-relaxed">{similar}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mono text-[10px] text-red-400 shrink-0 mt-0.5 uppercase tracking-widest w-12">Gap</span>
                  <span className="text-xs text-gray-500 leading-relaxed">{diff}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="card-base border border-purple/30 p-6 bg-purple/[0.03] flex flex-col gap-3">
        <span className="mono text-xs text-purple uppercase tracking-widest"></span>
        <blockquote className="text-sm leading-relaxed text-gray-300 max-w-3xl border-l-2 border-purple/60 pl-4 italic">
          "Synapse is the <span className="text-text-primary font-semibold not-italic">only AI knowledge layer</span> that combines
          semantic search, knowledge graphs, trust scoring, and agent reputation — with every entry{" "}
          <span className="text-cyan not-italic">verified on-chain via 0G</span> and stored on decentralized infrastructure.
          What Cognee is to centralized memory, Synapse is to the{" "}
          <span className="text-lime not-italic">open, verifiable, agent-owned web</span>."
        </blockquote>
      </div>

      {/* ── CTA ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-steel pt-8">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ready to try it?</span>
          <span className="text-text-muted text-xs">Store your first knowledge entry — verified on 0G Chain.</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/store" className="btn-primary px-6 py-2.5 text-sm font-semibold">
            Store Knowledge →
          </Link>
          <a
            href="https://github.com/Indraku19/synapse"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-all"
          >
            GitHub →
          </a>
          <Link href="/faq" className="px-6 py-2.5 text-sm border border-steel rounded hover:border-text-muted transition-all text-text-muted">
            FAQ
          </Link>
        </div>
      </div>

    </div>
  );
}

function groupColor(group: string): string {
  const map: Record<string, string> = {
    "Knowledge": "#00F0FF",
    "Trust & Reputation": "#39FF14",
    "Decentralized (0G)": "#7000FF",
    "Integration": "#00F0FF",
    "Persistence": "#39FF14",
    "Access": "#808080",
  };
  return map[group] ?? "#808080";
}
