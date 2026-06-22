"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/notes", label: "Notes" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-border-soft)]"
      style={{ background: "rgba(26,24,23,0.82)", backdropFilter: "blur(14px)" }}
    >
      <nav className="mx-auto max-w-[1080px] h-[60px] px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-[9px]">
          <span
            className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg,#8d7eff,#6a59e0)",
              boxShadow: "0 2px 10px rgba(124,108,255,0.35)",
            }}
          >
            <span className="w-2 h-2 rounded-[2px] bg-white/90" />
          </span>
          <span className="mono text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-text)]">
            fix<span className="text-[var(--color-accent)]">·</span>your
            <span className="text-[var(--color-accent)]">·</span>skills
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="text-[13.5px] rounded-lg px-[13px] py-[7px] transition-colors"
                style={
                  active
                    ? { background: "#2a2621", color: "var(--color-text)" }
                    : { color: "var(--color-text-2)" }
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
