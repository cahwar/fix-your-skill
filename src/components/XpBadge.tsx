"use client";

import { useEffect, useRef } from "react";
import { useXp } from "@/components/XpProvider";
import XpBar from "@/components/XpBar";

// Compact, always-on XP indicator for the navbar. Pulses on each accrual.
export default function XpBadge() {
  const { totalXp, info, pulseToken } = useXp();
  const ref = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    // Skip the pulse on mount / hydration — only fire on real accruals.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    // Restart the animation even if it's already applied.
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "xpPulse 0.6s ease 0.2s";
  }, [pulseToken]);

  return (
    <div
      ref={ref}
      className="hidden sm:flex items-center gap-2.5"
      title={`${totalXp} XP · Level ${info.level} · ${info.need - info.into} to next`}
    >
      <span
        className="mono flex items-center justify-center text-[11px] font-bold text-white"
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: "linear-gradient(135deg,#8d7eff,#6a59e0)",
          boxShadow: "0 2px 8px rgba(124,108,255,0.3)",
        }}
      >
        {info.level}
      </span>
      <div className="flex flex-col gap-[3px]">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="mono text-[12px] font-semibold text-[var(--color-text)]">
            Lv {info.level}
          </span>
          <span className="mono text-[10px] text-[var(--color-muted)]">
            {info.into}/{info.need}
          </span>
        </div>
        <XpBar pct={info.pct} width={104} height={5} />
      </div>
    </div>
  );
}
