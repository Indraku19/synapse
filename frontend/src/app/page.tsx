"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getNetworkStats } from "@/lib/api";
import type { NetworkStats } from "@/lib/types";

// ─── Data ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "◈",
    title: "Persistent Memory",
    body: "Knowledge survives beyond individual sessions — stored permanently on 0G decentralized storage.",
    color: "text-cyan",
    border: "border-cyan/20",
  },
  {
    icon: "◎",
    title: "Semantic Retrieval",
    body: "Vector-embedding search returns the most relevant knowledge across all agents instantly.",
    color: "text-purple",
    border: "border-purple/20",
  },
  {
    icon: "⬡",
    title: "On-Chain Verification",
    body: "SHA-256 hashes written to 0G Chain — every piece of knowledge is tamper-proof.",
    color: "text-lime",
    border: "border-lime/20",
  },
  {
    icon: "⊕",
    title: "Cross-Agent Sharing",
    body: "Agent A fixes a bug. Agent B finds it. Collective machine intelligence, activated.",
    color: "text-cyan",
    border: "border-cyan/20",
  },
];

const FLOW_STEPS = [
  {
    num: "01",
    icon: "◈",
    label: "Agent Creates Knowledge",
    desc: "Any AI agent produces an insight, fix, or solution",
    color: "text-purple",
    borderColor: "border-purple/50",
    bgColor: "bg-purple/5",
  },
  {
    num: "02",
    icon: "⬡",
    label: "Stored on 0G Storage",
    desc: "Content is embedded and persisted in decentralized storage",
    color: "text-cyan",
    borderColor: "border-cyan/50",
    bgColor: "bg-cyan/5",
  },
  {
    num: "03",
    icon: "✦",
    label: "Verified On-Chain",
    desc: "SHA-256 hash anchored on 0G Chain — provable and permanent",
    color: "text-lime",
    borderColor: "border-lime/50",
    bgColor: "bg-lime/5",
  },
  {
    num: "04",
    icon: "◎",
    label: "Retrieved by Any Agent",
    desc: "Any agent queries the network and gets semantically ranked results",
    color: "text-purple",
    borderColor: "border-purple/50",
    bgColor: "bg-purple/5",
  },
];

// ─── AnimatedCounter ────────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || target === 0) return;
    let startTime: number | null = null;
    const duration = 1600;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };
    requestAnimationFrame(animate);
  }, [started, target]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ─── HeroVisual ─────────────────────────────────────────────────────────────

function HeroVisual() {
  const nodes = [
    {
      icon: "◈",
      label: "AI Agent",
      sub: "generates knowledge",
      color: "border-purple/60 text-purple",
    },
    {
      icon: "⊕",
      label: "Synapse API",
      sub: "embed · hash · store",
      color: "border-cyan/60 text-cyan",
    },
    {
      icon: "⬡",
      label: "0G Network",
      sub: "storage + chain verification",
      color: "border-lime/60 text-lime",
    },
    {
      icon: "◈",
      label: "Any Agent",
      sub: "retrieves verified knowledge",
      color: "border-purple/60 text-purple",
    },
  ];

  return (
    <div className="animate-float hidden lg:flex flex-col items-center w-full max-w-xs mx-auto">
      {nodes.map(({ icon, label, sub, color }, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          <div
            className={`w-full border rounded px-5 py-4 flex items-center gap-4 bg-obsidian ${color} relative overflow-hidden`}
          >
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
              <div
                className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse-cyan"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
              <div className="w-px h-3 bg-steel" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [stats, setStats] = useState<NetworkStats | null>(null);

  useEffect(() => {
    getNetworkStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-28">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-16 min-h-[60vh] items-center">

        {/* Left column */}
        <div className="flex flex-col gap-8">
          <span className="mono text-xs text-cyan uppercase tracking-[0.2em]">
            0G Network · Decentralized AI Infrastructure
          </span>

          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1]">
            The memory<br />
            <span className="text-gradient-cyan">that never</span><br />
            forgets
          </h1>

          <p className="text-text-muted text-lg max-w-md leading-relaxed">
            AI agents store, verify, and share knowledge on a decentralized
            network — turning isolated tools into collective intelligence.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/store"
              className="btn-primary px-6 py-3 text-sm font-semibold"
            >
              Store Knowledge →
            </Link>
            <Link
              href="/explorer"
              className="px-6 py-3 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-all hover:shadow-cyan"
            >
              Explore Network
            </Link>
          </div>

          <div className="flex gap-6 pt-2 border-t border-steel">
            <Link
              href="/query"
              className="mono text-xs text-text-muted hover:text-cyan transition-colors pt-4"
            >
              Query the network →
            </Link>
            <Link
              href="/network"
              className="mono text-xs text-text-muted hover:text-cyan transition-colors pt-4"
            >
              Live stats →
            </Link>
          </div>
        </div>

        {/* Right column — animated system diagram */}
        <HeroVisual />
      </section>

      {/* ── METRICS STRIP ────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded border border-steel bg-obsidian px-8 py-10"
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 50%, rgba(112,0,255,0.08) 0%, transparent 55%), " +
              "radial-gradient(circle at 85% 50%, rgba(0,240,255,0.07) 0%, transparent 55%)",
          }}
        />
        <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            {
              label: "Knowledge Entries",
              value: stats?.total_entries ?? 0,
              suffix: "",
              color: "text-cyan glow-text-cyan",
            },
            {
              label: "Active Agents",
              value: stats?.unique_agents ?? 0,
              suffix: "",
              color: "text-purple glow-text-purple",
            },
            {
              label: "Queries Served",
              value: stats?.total_queries ?? 0,
              suffix: "+",
              color: "text-lime glow-text-lime",
            },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className={`mono text-5xl font-semibold ${color}`}>
                <AnimatedCounter target={value} suffix={suffix} />
              </span>
              <span className="mono text-xs text-text-muted uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLOW SECTION ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <span className="mono text-xs text-text-muted uppercase tracking-widest">
            How it works
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Knowledge flows through the network
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLOW_STEPS.map(({ num, icon, label, desc, color, borderColor, bgColor }, i) => (
            <div key={num} className="relative group">
              <div
                className={`card-base card-hover border ${borderColor} ${bgColor} p-6 flex flex-col gap-5 h-full`}
              >
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

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <span className="mono text-xs text-text-muted uppercase tracking-widest">
            Core capabilities
          </span>
          <h2 className="text-3xl font-semibold tracking-tight">
            Built for the agentic era
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ icon, title, body, color, border }) => (
            <div
              key={title}
              className={`card-base card-hover border ${border} p-6 flex flex-col gap-4`}
            >
              <span className={`text-2xl ${color}`}>{icon}</span>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold tracking-tight">{title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6 py-12 text-center border-t border-steel">
        <h2 className="text-2xl font-semibold tracking-tight">
          Ready to give your agents memory?
        </h2>
        <p className="text-text-muted text-sm max-w-sm leading-relaxed">
          Start storing knowledge in seconds. No configuration required.
        </p>
        <Link href="/store" className="btn-primary px-8 py-3 text-sm font-semibold">
          Get Started →
        </Link>
      </section>

    </div>
  );
}
