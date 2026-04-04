"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_LINKS = [
  { href: "/",         label: "Home" },
  { href: "/store",    label: "Store" },
  { href: "/query",    label: "Query" },
  { href: "/explorer", label: "Explorer" },
  { href: "/network",  label: "Network" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-steel"
      style={{ background: "rgba(5,5,5,0.8)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="mono text-lg font-medium tracking-tight text-cyan group-hover:opacity-80 transition-opacity">
            SYN://APSE
          </span>
          <span className="hidden sm:inline mono text-xs text-text-muted">
            v0.1.0-mvp
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "px-3 py-1.5 rounded text-sm transition-colors",
                  active
                    ? "text-cyan bg-cyan/5 border border-steel"
                    : "text-text-muted hover:text-text-primary hover:bg-steel/40"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="hidden md:flex items-center gap-2 mono text-xs text-text-muted">
          <span className="status-online">NETWORK ONLINE</span>
        </div>
      </div>
    </header>
  );
}
