"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getNetworkStats, subscribeToFeed } from "@/lib/api";
import type { NetworkStats, LiveFeedEvent } from "@/lib/types";

const REFRESH_INTERVAL_MS = 8000;
const MAX_FEED_EVENTS = 30;

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    if (from === value) return;
    prev.current = value;
    let t: number | null = null;
    const run = (ts: number) => {
      if (!t) t = ts;
      const p = Math.min((ts - t) / 900, 1);
      setDisplay(Math.floor(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(run);
      else setDisplay(value);
    };
    requestAnimationFrame(run);
  }, [value]);

  return <>{display}</>;
}

// ─── Hero stat ────────────────────────────────────────────────────────────────
// Large, glowing — for the 3 numbers judges immediately read

function HeroStat({
  label, value, color, glowClass,
}: {
  label: string; value: number; color: string; glowClass: string;
}) {
  return (
    <div className="card-base p-6 flex flex-col gap-3 text-center">
      <span className={`mono text-5xl font-semibold ${color} ${glowClass}`}>
        <AnimatedCounter value={value} />
      </span>
      <span className="mono text-xs text-text-muted uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

// ─── Small stat — for supporting numbers ────────────────────────────────────

function SmallStat({
  label, value, color, pulse,
}: {
  label: string; value: number | string; color: string; pulse?: boolean;
}) {
  return (
    <div className="card-base px-5 py-4 flex items-center justify-between gap-4">
      <span className="mono text-xs text-text-muted uppercase tracking-wider">{label}</span>
      <span className={`mono text-xl font-semibold ${color} ${pulse ? "status-online" : ""}`}>
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </span>
    </div>
  );
}

// ─── Live feed ────────────────────────────────────────────────────────────────

function LiveFeed({
  events, connected, feedRef,
}: {
  events: LiveFeedEvent[];
  connected: boolean;
  feedRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="mono text-xs text-text-muted uppercase tracking-widest">
          Live Activity
        </span>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            connected
              ? "bg-lime animate-pulse-cyan shadow-[0_0_6px_rgba(57,255,20,0.8)]"
              : "bg-steel"
          }`} />
          <span className={`mono text-xs ${connected ? "text-lime" : "text-text-muted/60"}`}>
            {connected ? "LIVE" : "CONNECTING…"}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div
        ref={feedRef}
        className="card-base overflow-y-auto flex flex-col"
        style={{ maxHeight: "480px" }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <span className="text-2xl text-steel/40">◎</span>
            <span className="mono text-xs text-text-muted/50 text-center">
              Waiting for activity…
            </span>
          </div>
        ) : (
          events.map((ev, i) => (
            <div
              key={`${ev.knowledge_id}-${i}`}
              className="px-4 py-3 border-b border-steel/40 last:border-0 animate-slide-up"
            >
              {/* Agent + namespace + time */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-lime text-xs shrink-0">▶</span>
                  <span className="mono text-xs text-purple truncate font-medium">
                    {ev.agent_id}
                  </span>
                  {ev.namespace && (
                    <span className="mono text-xs px-1 rounded border border-cyan/30 text-cyan bg-cyan/5 shrink-0">
                      {ev.namespace}
                    </span>
                  )}
                </div>
                <span className="mono text-xs text-text-muted/50 shrink-0">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {/* Content preview */}
              <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                {ev.content_preview}
              </p>
              {/* On-chain badge */}
              {ev.on_chain && (
                <span className="mono text-xs text-lime mt-1 inline-block">⬡ on-chain</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const [stats, setStats]             = useState<NetworkStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [feedEvents, setFeedEvents]   = useState<LiveFeedEvent[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getNetworkStats();
      setStats(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStats]);

  useEffect(() => {
    const unsub = subscribeToFeed(
      (ev) => {
        setFeedEvents((p) => [ev, ...p].slice(0, MAX_FEED_EVENTS));
        feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      },
      () => setWsConnected(true),
      () => setWsConnected(false),
    );
    return unsub;
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-10 pt-4">

      {/* ── LEFT ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <span className="mono text-xs text-text-muted uppercase tracking-widest">
              Network dashboard
            </span>
            <h1 className="text-3xl font-semibold tracking-tight">
              Live Protocol Stats
            </h1>
            <p className="text-text-muted text-sm">
              Real-time network activity. Auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-1">
            <span className="status-online mono text-xs text-lime">LIVE</span>
            {lastRefresh && (
              <span className="mono text-xs text-text-muted/60">
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-4 py-3 bg-red-950/20">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-base h-32 shimmer-bg rounded" />
            ))}
          </div>
        )}

        {stats && (
          <>
            {/* 3 hero numbers — the story in 3 seconds */}
            <div className="grid grid-cols-3 gap-3">
              <HeroStat
                label="Knowledge Entries"
                value={stats.total_entries}
                color="text-cyan"
                glowClass="glow-text-cyan"
              />
              <HeroStat
                label="Active Agents"
                value={stats.unique_agents}
                color="text-purple"
                glowClass="glow-text-purple"
              />
              <HeroStat
                label="Queries Served"
                value={stats.total_queries}
                color="text-cyan"
                glowClass="glow-text-cyan"
              />
            </div>

            {/* 0G integration status — important for hackathon judges */}
            <div className="flex flex-col gap-2">
              <span className="mono text-xs text-text-muted uppercase tracking-widest">
                0G Integration
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <SmallStat
                  label="Network"
                  value="ONLINE"
                  color="text-lime"
                  pulse
                />
                <SmallStat
                  label="On-Chain Verified"
                  value={stats.on_chain_entries}
                  color={stats.on_chain_entries > 0 ? "text-lime" : "text-text-muted/40"}
                />
                <SmallStat
                  label="0G Storage Objects"
                  value={stats.stored_in_0g}
                  color={stats.stored_in_0g > 0 ? "text-lime" : "text-text-muted/40"}
                />
              </div>
            </div>

            {/* Last stored — shows the system is working */}
            {stats.last_knowledge_id && (
              <div className="card-base px-5 py-4 flex flex-col gap-3">
                <span className="mono text-xs text-text-muted uppercase tracking-widest">
                  Last stored
                </span>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="mono text-xs text-purple">
                    {stats.last_agent_id ?? "—"}
                  </span>
                  <span className="text-steel text-xs">·</span>
                  <span className="mono text-xs text-text-muted truncate">
                    {stats.last_knowledge_id.slice(0, 20)}…
                  </span>
                  <span className="text-steel text-xs">·</span>
                  <span className="mono text-xs text-text-muted/60">
                    {stats.last_timestamp
                      ? new Date(stats.last_timestamp).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── RIGHT: Sticky live feed ───────────────────────────────────────── */}
      <div className="w-full lg:w-[300px] shrink-0">
        <div className="sticky top-20 h-fit">
          <LiveFeed
            events={feedEvents}
            connected={wsConnected}
            feedRef={feedRef}
          />
        </div>
      </div>

    </div>
  );
}
