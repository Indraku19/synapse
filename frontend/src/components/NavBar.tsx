"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clsx } from "clsx";

const NAV_LINKS = [
  { href: "/",         label: "Home" },
  { href: "/faq",      label: "FAQ" },
  { href: "/store",    label: "Store" },
  { href: "/query",    label: "Query" },
  { href: "/explorer", label: "Explorer" },
  { href: "/network",  label: "Network" },
];

export function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-steel"
      style={{ background: "rgba(5,5,5,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <span className="mono text-lg font-medium tracking-tight text-cyan group-hover:opacity-80 transition-opacity">
            SYN://APSE
          </span>
          <span className="hidden sm:inline mono text-xs text-text-muted">v0.1.0-mvp</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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

        {/* Desktop status */}
        <div className="hidden md:flex items-center gap-2 mono text-xs text-text-muted">
          <span className="status-online">NETWORK ONLINE</span>
        </div>

        {/* Mobile: status + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          <span className="status-online mono text-xs text-text-muted">ONLINE</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 p-1.5 hover:opacity-70 transition-opacity"
            aria-label="Toggle menu"
          >
            <span className={clsx("block w-5 h-px bg-text-primary transition-all duration-200", menuOpen && "rotate-45 translate-y-[7px]")} />
            <span className={clsx("block w-5 h-px bg-text-primary transition-all duration-200", menuOpen && "opacity-0")} />
            <span className={clsx("block w-5 h-px bg-text-primary transition-all duration-200", menuOpen && "-rotate-45 -translate-y-[7px]")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-steel" style={{ background: "rgba(5,5,5,0.97)" }}>
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={clsx(
                    "px-3 py-2.5 rounded text-sm transition-colors",
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
        </div>
      )}
    </header>
  );
}
