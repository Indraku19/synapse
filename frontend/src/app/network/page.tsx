"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getNetworkStats, subscribeToFeed } from "@/lib/api";
import type { NetworkStats, LiveFeedEvent } from "@/lib/types";

const REFRESH_INTERVAL_MS = 8000;
const MAX_FEED_EVENTS     = 20;

export default function NetworkPage() {
  const [stats, setStats]     = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
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

  // Live feed WebSocket subscription
  useEffect(() => {
    const unsubscribe = subscribeToFeed(
      (event) => {
        setFeedEvents((prev) => [event, ...prev].slice(0, MAX_FEED_EVENTS));
        // Auto-scroll feed to top
        feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      },
      () => setWsConnected(true),
      () => setWsConnected(false),
    );
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="mono text-xs text-text-muted uppercase tracking-widest">
            GET /knowledge/stats
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Network Dashboard
          </h1>
          <p className="text-text-muted text-sm">
            Live protocol statistics. Refreshes every {REFRESH_INTERVAL_MS / 1000}s.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="status-online mono text-xs text-lime">LIVE</span>
          {lastRefresh && (
            <span className="mono text-xs text-text-muted">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mono text-xs text-red-400 border border-red-900/40 rounded px-3 py-2 bg-red-950/20">
          ERROR: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-base p-4 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <BigStat
              label="Total Entries"
              value={stats.total_entries.toString()}
              sub="knowledge objects"
              color="text-cyan"
            />
            <BigStat
              label="Unique Agents"
              value={stats.unique_agents.toString()}
              sub="contributing agents"
              color="text-purple"
            />
            <BigStat
              label="Total Queries"
              value={stats.total_queries.toString()}
              sub="semantic searches"
              color="text-cyan"
            />
            <BigStat
              label="On-Chain"
              value={stats.on_chain_entries.toString()}
              sub="verified on 0G Chain"
              color={stats.on_chain_entries > 0 ? "text-lime" : "text-text-muted"}
            />
            <BigStat
              label="0G Storage"
              value={stats.stored_in_0g.toString()}
              sub="entries in 0G Storage"
              color={stats.stored_in_0g > 0 ? "text-lime" : "text-text-muted"}
            />
            <BigStat
              label="Network"
              value="ONLINE"
              sub="0G Protocol"
              color="text-lime"
              dot
            />
          </div>

          {/* Last stored entry */}
          {stats.last_knowledge_id && (
            <div className="card-base p-5 flex flex-col gap-3">
              <div className="mono text-xs text-text-muted uppercase tracking-widest">
                Last Stored Entry
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <InfoField label="Knowledge ID" value={stats.last_knowledge_id} mono truncate />
                <InfoField label="Agent"        value={stats.last_agent_id ?? "—"} mono />
                <InfoField
                  label="Timestamp"
                  value={stats.last_timestamp
                    ? new Date(stats.last_timestamp).toLocaleString()
                    : "—"}
                />
              </div>
            </div>
          )}

          {/* Extra stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <BigStat
              label="Useful Votes"
              value={(stats.total_useful_votes ?? 0).toString()}
              sub="trust signals"
              color="text-lime"
            />
            <BigStat
              label="Linked"
              value={(stats.linked_entries ?? 0).toString()}
              sub="entries with refs"
              color="text-cyan"
            />
            <BigStat
              label="Expiring"
              value={(stats.expiring_entries ?? 0).toString()}
              sub="TTL entries"
              color={(stats.expiring_entries ?? 0) > 0 ? "text-yellow-400" : "text-text-muted"}
            />
            <BigStat
              label="Live Clients"
              value={wsConnected ? (stats.ws_connections ?? 1).toString() : "—"}
              sub="WebSocket feed"
              color={wsConnected ? "text-lime" : "text-text-muted"}
              dot={wsConnected}
            />
          </div>

          {/* Architecture flow */}
          <div className="card-base p-6">
            <div className="mono text-xs text-text-muted uppercase tracking-widest mb-5">
              Protocol Flow
            </div>
            <ArchFlow />
          </div>

          {/* Integration status */}
          <div className="card-base p-5">
            <div className="mono text-xs text-text-muted uppercase tracking-widest mb-4">
              Integration Status
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <IntegrationRow
                label="Vector Search (FAISS)"
                status="active"
                detail={`${stats.total_entries} entries indexed`}
              />
              <IntegrationRow
                label="0G Storage"
                status={stats.stored_in_0g > 0 ? "active" : "mock"}
                detail={stats.stored_in_0g > 0 ? `${stats.stored_in_0g} objects` : "mock CIDs"}
              />
              <IntegrationRow
                label="0G Chain"
                status={stats.on_chain_entries > 0 ? "active" : "mock"}
                detail={stats.on_chain_entries > 0 ? `${stats.on_chain_entries} hashes` : "disabled"}
              />
            </div>
          </div>

          {/* Live knowledge feed */}
          <div className="card-base p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="mono text-xs text-text-muted uppercase tracking-widest">
                Live Knowledge Feed
              </div>
              <span
                className={`mono text-xs ${wsConnected ? "text-lime status-online" : "text-text-muted"}`}
              >
                {wsConnected ? "CONNECTED" : "CONNECTING…"}
              </span>
            </div>

            <div
              ref={feedRef}
              className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1"
            >
              {feedEvents.length === 0 ? (
                <div className="mono text-xs text-text-muted text-center py-6">
                  Waiting for incoming knowledge…
                </div>
              ) : (
                feedEvents.map((ev, i) => (
                  <div
                    key={`${ev.knowledge_id}-${i}`}
                    className="flex flex-col gap-1 p-3 border border-steel rounded bg-surface/50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lime text-xs">▶</span>
                        <span className="mono text-xs text-purple">{ev.agent_id}</span>
                        {ev.namespace && (
                          <span className="mono text-xs px-1 py-0 rounded border border-cyan/30 text-cyan bg-cyan/5">
                            {ev.namespace}
                          </span>
                        )}
                      </div>
                      <span className="mono text-xs text-text-muted shrink-0">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-primary leading-relaxed line-clamp-2">
                      {ev.content_preview}
                    </p>
                    <div className="mono text-xs text-steel truncate">
                      {ev.knowledge_id}
                      {ev.on_chain && <span className="ml-2 text-lime">⬡ on-chain</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BigStat({
  label, value, sub, color, dot,
}: {
  label: string; value: string; sub: string; color: string; dot?: boolean;
}) {
  return (
    <div className="card-base p-4 flex flex-col gap-1">
      <span className="mono text-xs text-text-muted uppercase">{label}</span>
      <span className={`mono text-2xl font-semibold ${color} ${dot ? "status-online" : ""}`}>
        {value}
      </span>
      <span className="mono text-xs text-text-muted">{sub}</span>
    </div>
  );
}

function InfoField({
  label, value, mono, truncate,
}: {
  label: string; value: string; mono?: boolean; truncate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="mono text-xs text-text-muted uppercase">{label}</span>
      <span className={`text-sm ${mono ? "mono" : ""} ${truncate ? "truncate" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function IntegrationRow({
  label, status, detail,
}: {
  label: string; status: "active" | "mock" | "disabled"; detail: string;
}) {
  const dot =
    status === "active"   ? "text-lime"
    : status === "mock"   ? "text-cyan"
    : "text-text-muted";
  const badge =
    status === "active"   ? "ACTIVE"
    : status === "mock"   ? "MOCK"
    : "DISABLED";

  return (
    <div className="flex flex-col gap-1 p-3 border border-steel rounded">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`mono text-xs ${dot}`}>{badge}</span>
      </div>
      <span className="mono text-xs text-text-muted">{detail}</span>
    </div>
  );
}

function ArchFlow() {
  const steps = [
    { label: "AI Agents",    color: "border-purple text-purple",   icon: "◈" },
    { label: "Synapse API",  color: "border-cyan text-cyan",       icon: "⊕" },
    { label: "Embeddings",   color: "border-steel text-text-muted",icon: "◎" },
    { label: "0G Storage",   color: "border-lime text-lime",       icon: "⬡" },
    { label: "0G Chain",     color: "border-lime text-lime",       icon: "⬡" },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
      {steps.map(({ label, color, icon }, i) => (
        <div key={label} className="flex sm:flex-col items-center gap-2 flex-1">
          <div className={`card-base card-hover ${color} p-3 w-full text-center flex flex-col items-center gap-1`}>
            <span className="text-lg">{icon}</span>
            <span className="mono text-xs">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <span className="text-steel sm:hidden">↓</span>
          )}
          {i < steps.length - 1 && (
            <span className="text-steel hidden sm:inline text-xs">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
