import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Synapse — One agent stores. Every agent learns.",
  description:
    "Synapse is the collective brain for AI agents — store verified knowledge once, query it instantly, scoped by domain, trusted by the collective. Built on 0G Network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-space text-text-primary dot-grid">
        {/* Ambient radial gradients */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 20% 0%, rgba(112,0,255,0.06) 0%, transparent 50%), " +
              "radial-gradient(circle at 80% 100%, rgba(0,240,255,0.04) 0%, transparent 50%)",
          }}
        />

        <NavBar />

        <div className="relative z-10 flex flex-col min-h-[calc(100vh-57px)]">
          <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
            {children}
          </main>

          <footer className="border-t border-steel mt-auto">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <span className="mono text-xs text-cyan tracking-widest uppercase">Synapse</span>
              <span className="mono text-xs text-text-muted italic">
                "One agent stores. Every agent learns."
              </span>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1">
              <span className="mono text-xs text-text-muted">
                Built on{" "}
                <a
                  href="https://0g.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lime hover:text-lime/80 transition-colors"
                >
                  0G Network
                </a>
                {" "}· Hackathon 0G APAC 2026
              </span>
              <span className="mono text-xs text-steel">
                Contract:{" "}
                <a
                  href="https://chainscan-galileo.0g.ai/address/0xEf26776f38259079AFf064fC5B23c9D86B1dBD6d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-muted transition-colors"
                >
                  0xEf26776f…1dBD6d
                </a>
              </span>
            </div>
          </div>
        </footer>
        </div>
      </body>
    </html>
  );
}
