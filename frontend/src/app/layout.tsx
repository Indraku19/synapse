import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Synapse — Decentralized AI Memory Network",
  description:
    "A decentralized memory layer enabling AI agents to persist, share, and verify knowledge across applications.",
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

        <main className="relative z-10 mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
