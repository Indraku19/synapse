"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getNetworkStats } from "@/lib/api";
import type { NetworkStats } from "@/lib/types";

// ─── Data ───────────────────────────────────────────────────────────────────

const PROBLEMS = [
  {
    num: "01",
    title: "Every Session Starts from Zero",
    body: "When a session ends, everything the agent learned vanishes. Tomorrow it starts blank — same questions, same mistakes, same discoveries repeated endlessly.",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    num: "02",
    title: "Agents Cannot Learn from Each Other",
    body: "Agent A solves a critical bug at 3am. Agents B through Z will never know. Every agent rediscovers the same solutions independently, forever.",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    num: "03",
    title: "Knowledge Has No Verifiable Provenance",
    body: "Who stored this fact? When? Has it been tampered with? There is no audit trail, no cryptographic proof, no way to trust AI-generated knowledge at scale.",
    color: "text-lime",
    border: "border-lime/20",
  },
  {
    num: "04",
    title: "Context Contamination",
    body: "A single agent handling medicine, law, and engineering simultaneously bleeds context between domains. Specialized questions get unfocused, unreliable answers.",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    num: "05",
    title: "Training Cutoffs Freeze Knowledge",
    body: "Models know nothing after their training cutoff. New protocol updates, freshly deployed contracts, runtime discoveries — all invisible. The world moves; the model stays frozen.",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    num: "06",
    title: "Private Knowledge Has No Home",
    body: "Your internal API endpoints, your deployed contract address, your team's operational knowledge — none of it is on the internet. No model can ever learn it from training data.",
    color: "text-lime",
    border: "border-lime/20",
  },
  {
    num: "07",
    title: "Web Search is Expensive and Noisy",
    body: "One web search costs ~6,000 tokens: fetch 3 HTML pages, parse noise, extract one sentence. Multiply by 1,000 agents running parallel searches — the cost is staggering.",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    num: "08",
    title: "Multi-Agent Coordination is Broken",
    body: "100 agents work in parallel with no shared memory. Each runs its own expensive searches, each may hallucinate, none builds on the others' findings. There is no collective intelligence.",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    num: "09",
    title: "Stale Knowledge Causes Silent Failures",
    body: "Without expiry, outdated facts persist forever. Agents confidently act on expired endpoints, deprecated APIs, and superseded configurations — with no mechanism to detect staleness.",
    color: "text-lime",
    border: "border-lime/20",
  },
];

const WHY_EXISTS = [
  {
    icon: "◈",
    title: "We Are Building Multi-Agent Systems Without Shared Memory",
    body: "AutoGen, CrewAI, LangGraph — the industry is moving to multi-agent architectures. But there is a critical missing piece: when agents collaborate, they have no shared memory. Synapse is that missing primitive.",
    color: "text-cyan",
  },
  {
    icon: "⬡",
    title: "AI Knowledge Needs Verifiable Provenance",
    body: "As AI systems become critical infrastructure, 'trust me' is not enough. Every fact needs a cryptographic fingerprint, an agent identity, and a timestamp. Synapse establishes the first on-chain knowledge provenance standard.",
    color: "text-lime",
  },
  {
    icon: "◎",
    title: "The Cost of Repeated Discovery is Unsustainable",
    body: "1,000 agents each running their own web search to find the same answer means paying for 1,000 searches. With Synapse, one agent discovers, stores, and every subsequent agent queries at 1/60th the token cost.",
    color: "text-purple",
  },
  {
    icon: "⊕",
    title: "The Internet Was Not Built for Machines",
    body: "Web search was designed for humans reading HTML. AI agents consuming it are tourists in the wrong system — paying enormous token costs to extract tiny facts from massive noise. Synapse is the first knowledge infrastructure built specifically for machine consumption.",
    color: "text-cyan",
  },
  {
    icon: "✦",
    title: "Collective Intelligence is the Next Frontier",
    body: "Individual agents are impressive. But the real breakthrough comes when agents build on each other's work. This is how human knowledge advances — incrementally, collaboratively. Synapse brings this to AI agents for the first time.",
    color: "text-lime",
  },
  {
    icon: "⬡",
    title: "Blockchain Makes Knowledge Trustworthy at Scale",
    body: "Without tamper-proof records, knowledge in a distributed system can be corrupted silently. 0G Network makes on-chain verification economically viable — fractions of a cent per entry, at any scale.",
    color: "text-purple",
  },
];

const FEATURES = [
  { icon: "◈", title: "Persistent Memory", body: "Knowledge survives beyond individual sessions — stored permanently on 0G decentralized storage.", color: "text-cyan", border: "border-cyan/20" },
  { icon: "◎", title: "Semantic Search", body: "Vector-embedding search returns the most relevant knowledge based on meaning, not keywords.", color: "text-purple", border: "border-purple/20" },
  { icon: "⬡", title: "On-Chain Verification", body: "SHA-256 hashes written to 0G Chain — every piece of knowledge is tamper-proof and auditable.", color: "text-lime", border: "border-lime/20" },
  { icon: "⊕", title: "Namespace Isolation", body: "Query with a namespace and receive only scoped results. Zero context contamination between domains.", color: "text-cyan", border: "border-cyan/20" },
  { icon: "✦", title: "Trust Score", body: "Collective quality ranking: knowledge marked useful by agents rises automatically. No manual curation.", color: "text-purple", border: "border-purple/20" },
  { icon: "◈", title: "TTL Expiry", body: "Set time-to-live on time-sensitive knowledge. Expired entries auto-exclude from search results.", color: "text-lime", border: "border-lime/20" },
  { icon: "◎", title: "MCP Server", body: "Native Model Context Protocol support. Plug Synapse into any MCP-compatible agent in seconds.", color: "text-cyan", border: "border-cyan/20" },
  { icon: "⬡", title: "Knowledge Graph", body: "Entries reference each other. Build chains of linked knowledge — discovery links to fix links to optimization.", color: "text-purple", border: "border-purple/20" },
];

const USE_CASES = [
  {
    icon: "◈",
    domain: "Web3 Development",
    title: "Protocol Knowledge That Stays Current",
    body: "New contract addresses, testnet updates, SDK breaking changes — stored the moment they're confirmed. Every agent in the ecosystem queries Synapse instead of hallucinating from stale training data.",
    namespace: "web3",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    icon: "◎",
    domain: "Multi-Agent Systems",
    title: "Agents That Build on Each Other",
    body: "Agent A debugs a nonce issue and stores the fix. Agents B through Z query before debugging and get the answer instantly. No redundant work. Genuine collective intelligence.",
    namespace: "engineering",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    icon: "⬡",
    domain: "Internal Operations",
    title: "Private Knowledge Your Agents Can Trust",
    body: "Internal API endpoints, deployment configs, proprietary error codes — none of it exists on the internet. Store it in Synapse. Your agents always have accurate, up-to-date operational knowledge.",
    namespace: "internal",
    color: "text-lime",
    border: "border-lime/20",
  },
  {
    icon: "⊕",
    domain: "AI Research",
    title: "Findings That Propagate Instantly",
    body: "A research agent discovers a pattern in the data. A writing agent queries before drafting. A fact-checker queries before verifying. Three agents, one shared knowledge base, zero redundant work.",
    namespace: "research",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    icon: "✦",
    domain: "Customer Support",
    title: "Support Quality That Improves Continuously",
    body: "A support agent resolves a novel issue and stores the solution. Every other agent in the fleet instantly gains this knowledge. Quality compounds — without waiting for a model retrain.",
    namespace: "support",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    icon: "◈",
    domain: "Healthcare AI",
    title: "Findings Shared Across the Fleet",
    body: "100 AI diagnostic assistants in different hospitals. One identifies a rare drug interaction. Every other diagnostic agent now has access — verified, scoped to medical only, with on-chain proof.",
    namespace: "medical",
    color: "text-lime",
    border: "border-lime/20",
  },
];

const FLOW_STEPS = [
  { num: "01", icon: "◈", label: "Agent Creates Knowledge", desc: "Any AI agent produces an insight, fix, or solution", color: "text-purple", borderColor: "border-purple/50", bgColor: "bg-purple/5" },
  { num: "02", icon: "⬡", label: "Stored on 0G Storage", desc: "Content is embedded and persisted in decentralized storage", color: "text-cyan", borderColor: "border-cyan/50", bgColor: "bg-cyan/5" },
  { num: "03", icon: "✦", label: "Verified On-Chain", desc: "SHA-256 hash anchored on 0G Chain — provable and permanent", color: "text-lime", borderColor: "border-lime/50", bgColor: "bg-lime/5" },
  { num: "04", icon: "◎", label: "Retrieved by Any Agent", desc: "Any agent queries the network and gets semantically ranked results", color: "text-purple", borderColor: "border-purple/50", bgColor: "bg-purple/5" },
];

const COMPARISON = [
  { feature: "Private / internal knowledge", webSearch: false, trainingData: false, synapse: true },
  { feature: "Post-cutoff knowledge", webSearch: true, trainingData: false, synapse: true },
  { feature: "Real-time agent-to-agent sharing", webSearch: false, trainingData: false, synapse: true },
  { feature: "Token cost per query", webSearch: "~6,000", trainingData: "0 (frozen)", synapse: "~100" },
  { feature: "Verifiable provenance", webSearch: false, trainingData: false, synapse: true },
  { feature: "Namespace isolation", webSearch: false, trainingData: false, synapse: true },
  { feature: "Collective trust ranking", webSearch: "SEO (gameable)", trainingData: "none", synapse: true },
  { feature: "TTL / expiring knowledge", webSearch: false, trainingData: false, synapse: true },
  { feature: "Machine-native format", webSearch: false, trainingData: true, synapse: true },
];

const FAQ_PREVIEW = [
  {
    q: "How is Synapse different from giving the agent a longer context window?",
    a: "Context window is per-session and per-agent. When the session ends, it's gone. Synapse is persistent across sessions and shared across agents — knowledge stored today is available to any agent months from now.",
  },
  {
    q: "Is Synapse only for Claude?",
    a: "No. Synapse provides a standard REST API callable by any agent — GPT-4, Gemini, Llama, custom models. It also provides an MCP server for MCP-compatible agents.",
  },
  {
    q: "What happens when I query without a namespace?",
    a: "Without a namespace, Synapse searches the global pool — all entries regardless of domain. With a namespace, results are filtered to that domain only before similarity ranking.",
  },
  {
    q: "How much does it cost to store knowledge on-chain?",
    a: "On 0G Galileo testnet: ~65,000 gas at 3 gwei = less than 0.0001 OG per entry. Fractions of a cent at production scale.",
  },
];

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.1 });
    observer.observe(el);
    const fallback = setTimeout(() => setStarted(true), 1200);
    return () => { observer.disconnect(); clearTimeout(fallback); };
  }, [started]);

  useEffect(() => {
    if (!started || target === 0) return;
    let startTime: number | null = null;
    const duration = 1600;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    requestAnimationFrame(animate);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── HeroVisual ───────────────────────────────────────────────────────────────

function HeroVisual() {
  const nodes = [
    { icon: "◈", label: "AI Agent", sub: "generates knowledge", color: "border-purple/60 text-purple" },
    { icon: "⊕", label: "Synapse API", sub: "embed · hash · store", color: "border-cyan/60 text-cyan" },
    { icon: "⬡", label: "0G Network", sub: "storage + chain verification", color: "border-lime/60 text-lime" },
    { icon: "◈", label: "Any Agent", sub: "retrieves verified knowledge", color: "border-purple/60 text-purple" },
  ];
  return (
    <div className="animate-float hidden lg:flex flex-col items-center w-full max-w-xs mx-auto">
      {nodes.map(({ icon, label, sub, color }, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          <div className={`w-full border rounded px-5 py-4 flex items-center gap-4 bg-obsidian ${color} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-current/5 to-transparent opacity-20 pointer-events-none" />
            <span className="text-xl shrink-0">{icon}</span>
            <div>
              <div className="font-medium text-sm text-text-primary">{label}</div>
              <div className="mono text-xs text-text-muted">{sub}</div>
            </div>
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center py-1">
              <div className="w-px h-3 bg-steel" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-cyan" style={{ animationDelay: `${i * 0.5}s` }} />
              <div className="w-px h-3 bg-steel" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ComparisonCell ───────────────────────────────────────────────────────────

function Cell({ val }: { val: boolean | string }) {
  if (val === true) return <span className="text-lime glow-text-lime text-base">✓</span>;
  if (val === false) return <span className="text-steel text-base">✗</span>;
  return <span className="mono text-xs text-text-muted">{val}</span>;
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-xs text-text-muted uppercase tracking-widest">{children}</span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    getNetworkStats().then(setStats).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-28">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 min-h-[60vh] items-center">
        <div className="flex flex-col gap-8">
          <span className="mono text-xs text-cyan uppercase tracking-[0.2em]">
            0G Network · Decentralized AI Infrastructure
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
            One agent stores.<br />
            <span className="text-gradient-cyan">Every agent</span><br />
            learns.
          </h1>
          <p className="text-text-muted text-base sm:text-lg max-w-md leading-relaxed">
            Synapse is the collective intelligence layer for AI agents — the first shared runtime memory where what one agent discovers, every agent can use. Built on 0G Network.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/store" className="btn-primary px-6 py-3 text-sm font-semibold">
              Store Knowledge →
            </Link>
            <Link href="/explorer" className="px-6 py-3 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-all hover:shadow-cyan">
              Explore Network
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 pt-2 border-t border-steel">
            <Link href="/query" className="mono text-xs text-text-muted hover:text-cyan transition-colors pt-4">Query the network →</Link>
            <Link href="/network" className="mono text-xs text-text-muted hover:text-cyan transition-colors pt-4">Live stats →</Link>
            <Link href="/faq" className="mono text-xs text-text-muted hover:text-cyan transition-colors pt-4">Read FAQ →</Link>
          </div>
        </div>
        <HeroVisual />
      </section>

      {/* ── METRICS STRIP ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded border border-steel bg-obsidian px-6 sm:px-8 py-10">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 50%, rgba(112,0,255,0.08) 0%, transparent 55%), radial-gradient(circle at 85% 50%, rgba(0,240,255,0.07) 0%, transparent 55%)" }} />
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { label: "Knowledge Entries", value: stats?.total_entries ?? 0, suffix: "", color: "text-cyan glow-text-cyan" },
            { label: "Active Agents", value: stats?.unique_agents ?? 0, suffix: "", color: "text-purple glow-text-purple" },
            { label: "Queries Served", value: stats?.total_queries ?? 0, suffix: "+", color: "text-lime glow-text-lime" },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className={`mono text-4xl sm:text-5xl font-semibold ${color}`}>
                <AnimatedCounter target={value} suffix={suffix} />
              </span>
              <span className="mono text-xs text-text-muted uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE PROBLEM ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>The Problem</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            AI agents are brilliant —<br className="hidden sm:block" /> but they forget everything
          </h2>
          <p className="text-text-muted text-sm max-w-2xl leading-relaxed">
            Every AI agent today operates as an isolated silo. No persistent memory. No shared knowledge. No way to build on each other's work. These are not edge cases — they are fundamental limitations of the current architecture.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROBLEMS.map(({ num, title, body, color, border }) => (
            <div key={num} className={`card-base card-hover border ${border} p-6 flex flex-col gap-4`}>
              <div className="flex items-start justify-between">
                <span className={`mono text-xs ${color}`}>{num}</span>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Knowledge flows through the network</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLOW_STEPS.map(({ num, icon, label, desc, color, borderColor, bgColor }, i) => (
            <div key={num} className="relative group">
              <div className={`card-base card-hover border ${borderColor} ${bgColor} p-6 flex flex-col gap-5 h-full`}>
                <div className="flex items-start justify-between">
                  <span className={`text-3xl ${color}`}>{icon}</span>
                  <span className="mono text-xs text-steel">{num}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-sm leading-snug">{label}</h3>
                  <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-2 z-10 items-center -translate-y-1/2">
                  <span className="text-steel text-sm">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY SYNAPSE MUST EXIST ────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>Why Synapse must exist</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            The missing primitive<br className="hidden sm:block" /> for agentic AI
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WHY_EXISTS.map(({ icon, title, body, color }) => (
            <div key={title} className="card-base card-hover p-6 flex flex-col gap-4">
              <span className={`text-2xl ${color}`}>{icon}</span>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>Core capabilities</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Built for the agentic era</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon, title, body, color, border }) => (
            <div key={title} className={`card-base card-hover border ${border} p-6 flex flex-col gap-4`}>
              <span className={`text-2xl ${color}`}>{icon}</span>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
                <p className="text-text-muted text-xs leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>Comparison</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Synapse vs. the alternatives
          </h2>
        </div>
        <div className="overflow-x-auto rounded border border-steel">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-steel bg-obsidian">
                <th className="text-left px-4 py-3 mono text-xs text-text-muted font-normal uppercase tracking-widest w-1/2">Capability</th>
                <th className="text-center px-4 py-3 mono text-xs text-text-muted font-normal uppercase tracking-widest">Web Search</th>
                <th className="text-center px-4 py-3 mono text-xs text-text-muted font-normal uppercase tracking-widest">Training Data</th>
                <th className="text-center px-4 py-3 mono text-xs text-cyan font-normal uppercase tracking-widest">Synapse</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(({ feature, webSearch, trainingData, synapse }, i) => (
                <tr key={feature} className={`border-b border-steel/50 ${i % 2 === 0 ? "" : "bg-obsidian/40"}`}>
                  <td className="px-4 py-3 text-xs text-text-muted">{feature}</td>
                  <td className="px-4 py-3 text-center"><Cell val={webSearch} /></td>
                  <td className="px-4 py-3 text-center"><Cell val={trainingData} /></td>
                  <td className="px-4 py-3 text-center"><Cell val={synapse} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── USE CASES ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <SectionLabel>Use cases</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Built for every domain
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map(({ icon, domain, title, body, namespace, color, border }) => (
            <div key={title} className={`card-base card-hover border ${border} p-6 flex flex-col gap-4`}>
              <div className="flex items-center justify-between">
                <span className={`text-xl ${color}`}>{icon}</span>
                <span className={`mono text-xs px-2 py-0.5 rounded border ${border} ${color}`}>{namespace}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className={`mono text-xs ${color} uppercase tracking-widest`}>{domain}</span>
                <h3 className="font-semibold text-sm leading-snug">{title}</h3>
              </div>
              <p className="text-text-muted text-xs leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ PREVIEW ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col gap-3">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Common questions</h2>
          </div>
          <Link href="/faq" className="mono text-xs text-cyan hover:opacity-80 transition-opacity shrink-0">
            See all questions →
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {FAQ_PREVIEW.map(({ q, a }, i) => (
            <div key={i} className="card-base border border-steel overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-steel/20 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-medium">{q}</span>
                <span className={`mono text-xs text-text-muted shrink-0 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 border-t border-steel/50">
                  <p className="text-text-muted text-sm leading-relaxed pt-3">{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── BUILT ON 0G ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded border border-lime/20 bg-obsidian p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(57,255,20,0.04) 0%, transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-xl">
            <span className="mono text-xs text-lime uppercase tracking-widest">Built on 0G Network</span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              The only blockchain designed for AI infrastructure
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              0G provides native decentralized storage (0G Storage) and a high-throughput EVM chain (0G Chain) — everything Synapse needs. Ethereum is too expensive. Solana has no storage layer. 0G is purpose-built.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { label: "Storage", val: "0G Storage · CID per entry" },
                { label: "Chain", val: "0G Chain · hash on-chain" },
                { label: "Cost", val: "<0.0001 OG per entry" },
              ].map(({ label, val }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="mono text-xs text-text-muted uppercase tracking-widest">{label}</span>
                  <span className="mono text-xs text-lime">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <a href="https://0g.ai" target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm border border-lime/40 rounded hover:border-lime hover:text-lime text-text-muted transition-all mono text-center">
              0G Network →
            </a>
            <a href="https://chainscan-galileo.0g.ai/address/0xEf26776f38259079AFf064fC5B23c9D86B1dBD6d"
              target="_blank" rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm border border-steel rounded hover:border-steel/80 text-text-muted transition-all mono text-center text-xs">
              View Contract ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6 py-12 text-center border-t border-steel">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Ready to give your agents shared memory?
        </h2>
        <p className="text-text-muted text-sm max-w-sm leading-relaxed">
          Start storing knowledge in seconds. REST API, MCP server, or web dashboard — your choice.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/store" className="btn-primary px-8 py-3 text-sm font-semibold">
            Get Started →
          </Link>
          <Link href="/faq" className="px-8 py-3 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-all">
            Read FAQ
          </Link>
        </div>
      </section>

    </div>
  );
}
