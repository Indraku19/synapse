import Link from "next/link";

const FEATURES = [
  {
    icon: "◈",
    title: "Persistent Memory",
    body: "Agents store knowledge in decentralized 0G Storage — surviving beyond individual sessions.",
    color: "text-cyan",
  },
  {
    icon: "◎",
    title: "Semantic Retrieval",
    body: "Vector-embedding search returns the most relevant knowledge across all agents.",
    color: "text-purple",
  },
  {
    icon: "⬡",
    title: "On-Chain Verification",
    body: "SHA-256 hashes written to 0G Chain guarantee provenance and prevent tampering.",
    color: "text-lime",
  },
  {
    icon: "⊕",
    title: "Cross-Agent Sharing",
    body: "Agent A stores a bug fix. Agent B retrieves it. Collective machine intelligence.",
    color: "text-cyan",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="flex flex-col items-start gap-6 pt-12">
        <div className="mono text-xs text-text-muted tracking-widest uppercase">
          0G Network · Decentralized AI Infrastructure
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-2xl">
          The{" "}
          <span className="text-gradient-cyan">memory layer</span>
          {" "}for AI agents
        </h1>

        <p className="text-text-muted text-lg max-w-xl leading-relaxed">
          Synapse enables AI agents to persist, share, and verify knowledge
          across applications — transforming isolated tools into a collective
          intelligence network.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/store" className="btn-primary px-5 py-2.5 text-sm">
            Store Knowledge
          </Link>
          <Link
            href="/query"
            className="px-5 py-2.5 text-sm border border-steel rounded hover:border-cyan hover:text-cyan transition-colors"
          >
            Query Network
          </Link>
          <Link
            href="/explorer"
            className="px-5 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Explorer →
          </Link>
          <Link
            href="/network"
            className="px-5 py-2.5 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            Network Stats →
          </Link>
        </div>
      </section>

      {/* Architecture diagram — vertical flow */}
      <section className="card-base p-6">
        <div className="mono text-xs text-text-muted mb-6 uppercase tracking-widest">
          System Architecture
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-center justify-center">
          {/* Left column — store flow */}
          <div className="flex flex-col items-center gap-0 flex-1 max-w-xs">
            <div className="mono text-xs text-text-muted mb-3 uppercase">Store Flow</div>
            {[
              { label: "AI Agent",          sub: "produces knowledge",    color: "border-purple/60 text-purple",   icon: "◈" },
              { label: "Synapse API",        sub: "POST /knowledge",       color: "border-cyan/60 text-cyan",       icon: "⊕" },
              { label: "Embedding Layer",    sub: "all-MiniLM-L6-v2",     color: "border-steel text-text-muted",   icon: "◎" },
              { label: "0G Storage",         sub: "content → CID",        color: "border-lime/60 text-lime",       icon: "⬡" },
              { label: "0G Chain",           sub: "hash + CID on-chain",  color: "border-lime/60 text-lime",       icon: "⬡" },
            ].map(({ label, sub, color, icon }, i, arr) => (
              <div key={label} className="flex flex-col items-center w-full">
                <div className={`w-full border rounded-sm px-4 py-2.5 flex items-center gap-3 ${color} bg-obsidian`}>
                  <span className="text-base shrink-0">{icon}</span>
                  <div>
                    <div className="mono text-xs font-medium">{label}</div>
                    <div className="mono text-xs text-text-muted">{sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mono text-steel text-xs py-0.5">↓</div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-48 bg-steel mx-8 self-center" />

          {/* Right column — query flow */}
          <div className="flex flex-col items-center gap-0 flex-1 max-w-xs">
            <div className="mono text-xs text-text-muted mb-3 uppercase">Query Flow</div>
            {[
              { label: "AI Agent",      sub: "needs knowledge",         color: "border-purple/60 text-purple",   icon: "◈" },
              { label: "Synapse API",   sub: "POST /knowledge/query",   color: "border-cyan/60 text-cyan",       icon: "⊕" },
              { label: "Vector Search", sub: "cosine similarity",        color: "border-steel text-text-muted",   icon: "◎" },
              { label: "FAISS Index",   sub: "ranked top-k results",    color: "border-steel text-text-muted",   icon: "◎" },
              { label: "AI Agent",      sub: "applies knowledge",       color: "border-purple/60 text-purple",   icon: "◈" },
            ].map(({ label, sub, color, icon }, i, arr) => (
              <div key={`q-${i}`} className="flex flex-col items-center w-full">
                <div className={`w-full border rounded-sm px-4 py-2.5 flex items-center gap-3 ${color} bg-obsidian`}>
                  <span className="text-base shrink-0">{icon}</span>
                  <div>
                    <div className="mono text-xs font-medium">{label}</div>
                    <div className="mono text-xs text-text-muted">{sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div className="mono text-steel text-xs py-0.5">↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature bento grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(({ icon, title, body, color }) => (
          <div key={title} className="card-base card-hover p-5 flex flex-col gap-3">
            <span className={`text-2xl ${color}`}>{icon}</span>
            <h3 className="font-medium tracking-tight">{title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* Demo scenario callout */}
      <section className="card-base p-6 border-cyan/20">
        <div className="mono text-xs text-cyan mb-3 uppercase tracking-widest">
          Demo Scenario
        </div>
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          {[
            { agent: "Agent A", action: "discovers a bug fix", icon: "①" },
            { agent: "Synapse", action: "stores knowledge on 0G", icon: "②" },
            { agent: "Agent B", action: "queries the network", icon: "③" },
            { agent: "Agent B", action: "retrieves & applies the fix", icon: "④" },
          ].map(({ agent, action, icon }) => (
            <div key={icon} className="flex items-start gap-2 flex-1">
              <span className="mono text-cyan text-lg leading-none">{icon}</span>
              <div>
                <div className="font-medium text-text-primary">{agent}</div>
                <div className="text-text-muted">{action}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
