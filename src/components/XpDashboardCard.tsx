"use client";

import { useXp } from "@/components/XpProvider";
import XpBar from "@/components/XpBar";

// Expanded XP block for the dashboard.
export default function XpDashboardCard() {
  const { totalXp, info } = useXp();

  return (
    <section
      data-reveal
      className="rounded-[14px] p-6"
      style={{ background: "var(--color-raised)", border: "1px solid var(--color-border-2)" }}
    >
      <div className="flex items-center gap-4">
        <span
          className="mono flex-none flex items-center justify-center text-[16px] font-bold text-white"
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "9px",
            background: "linear-gradient(135deg,#8d7eff,#6a59e0)",
            boxShadow: "0 3px 12px rgba(124,108,255,0.35)",
          }}
        >
          {info.level}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-semibold text-[var(--color-text)]">
              Level {info.level}
            </span>
            <span className="mono text-[12px] text-[var(--color-text-2)]">
              {totalXp} XP total
            </span>
          </div>
          <div className="mt-2">
            <XpBar pct={info.pct} height={8} />
          </div>
          <div className="mono text-[11px] text-[var(--color-muted)] mt-1.5">
            {info.need - info.into} XP to Lv {info.level + 1}
          </div>
        </div>
      </div>
    </section>
  );
}
