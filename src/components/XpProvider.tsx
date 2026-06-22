"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  computeXp,
  levelInfo,
  tierForScore,
  XP_SEED,
  XP_STORAGE_KEY,
  type LevelInfo,
  type Tier,
  type Verdict,
} from "@/lib/xp";

interface XpContextValue {
  totalXp: number;
  info: LevelInfo;
  /** Increments on every accrual — header badge watches this to re-pulse. */
  pulseToken: number;
  /** Award XP for a review; shows the celebration toast. Returns gained XP. */
  award: (score: number, verdict: Verdict) => number;
}

const XpContext = createContext<XpContextValue | null>(null);

export function useXp(): XpContextValue {
  const ctx = useContext(XpContext);
  if (!ctx) throw new Error("useXp must be used within <XpProvider>");
  return ctx;
}

interface Confetto {
  id: number;
  left: number;
  size: number;
  height: number;
  dur: number;
  delay: number;
  dx: string;
  rot: string;
  round: boolean;
  color: string;
}

interface ToastState {
  gain: number;
  tier: Tier;
  leveledUp: boolean;
  afterLevel: number;
  confetti: Confetto[];
  closing: boolean;
}

function makeConfetti(tier: Tier): Confetto[] {
  const out: Confetto[] = [];
  for (let i = 0; i < tier.count; i++) {
    const size = 6 + Math.random() * 7;
    const round = Math.random() > 0.55;
    out.push({
      id: i,
      left: Math.random() * 100,
      size,
      height: round ? size : size * 0.42,
      dur: 1.6 + Math.random() * 1.4,
      delay: Math.random() * 0.5,
      dx: Math.random() * 200 - 100 + "px",
      rot: 480 + Math.random() * 540 + "deg",
      round,
      color: tier.palette[i % tier.palette.length],
    });
  }
  return out;
}

export default function XpProvider({ children }: { children: React.ReactNode }) {
  const [totalXp, setTotalXp] = useState<number>(XP_SEED);
  const [pulseToken, setPulseToken] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(XP_STORAGE_KEY);
      if (raw !== null) {
        const n = parseInt(raw, 10);
        if (Number.isFinite(n)) setTotalXp(n);
      }
    } catch {
      /* localStorage unavailable — stay on seed */
    }
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, []);

  const award = useCallback(
    (score: number, verdict: Verdict) => {
      const gain = computeXp(score, verdict);
      const tier = tierForScore(score);

      let leveledUp = false;
      let afterLevel = 1;
      setTotalXp((prev) => {
        const before = levelInfo(prev);
        const next = prev + gain;
        const after = levelInfo(next);
        leveledUp = after.level > before.level;
        afterLevel = after.level;
        try {
          window.localStorage.setItem(XP_STORAGE_KEY, String(next));
        } catch {
          /* ignore persistence errors */
        }
        return next;
      });

      // Reset any in-flight toast timers before showing a fresh one.
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);

      setToast({
        gain,
        tier,
        leveledUp,
        afterLevel,
        confetti: makeConfetti(tier),
        closing: false,
      });
      setPulseToken((t) => t + 1);

      closeTimer.current = setTimeout(
        () => setToast((t) => (t ? { ...t, closing: true } : t)),
        2700,
      );
      removeTimer.current = setTimeout(() => setToast(null), 3150);

      return gain;
    },
    [],
  );

  const info = levelInfo(totalXp);

  return (
    <XpContext.Provider value={{ totalXp, info, pulseToken, award }}>
      {children}
      {toast && <XpToast toast={toast} />}
    </XpContext.Provider>
  );
}

function XpToast({ toast }: { toast: ToastState }) {
  const { tier, gain, leveledUp, afterLevel, confetti, closing } = toast;
  const epic = tier.key === "epic";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {confetti.map((c) => (
        <span
          key={c.id}
          style={
            {
              position: "absolute",
              top: "-30px",
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.height}px`,
              background: c.color,
              borderRadius: c.round ? "50%" : "1.5px",
              "--dx": c.dx,
              "--rot": c.rot,
              animation: `confettiDrop ${c.dur}s cubic-bezier(.25,.6,.5,1) ${c.delay}s forwards`,
            } as React.CSSProperties
          }
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "88px",
          left: "50%",
          transform: "translate(-50%,0)",
          minWidth: "230px",
          textAlign: "center",
          opacity: 1,
          background: "rgba(28,25,22,0.96)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${tier.color}55`,
          borderRadius: "16px",
          padding: "20px 30px 22px",
          boxShadow: epic
            ? `0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 40px ${tier.color}40`
            : "0 18px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
          animation: closing
            ? "toastOut 0.4s ease forwards"
            : "toastIn 0.5s cubic-bezier(.18,.7,.4,1.2) both",
        }}
      >
        <div
          style={{
            color: tier.color,
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          {leveledUp ? "Level up" : tier.label}
        </div>

        <div
          className="mono"
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "6px",
            marginTop: "8px",
            animation: "numUp 0.5s 0.1s both",
          }}
        >
          <span style={{ fontSize: "46px", fontWeight: 700, color: tier.color, lineHeight: 1 }}>
            +{gain}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "var(--color-text-2)",
            }}
          >
            XP
          </span>
        </div>

        {leveledUp && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              fontSize: "13px",
              color: "var(--color-text)",
              animation: "numUp 0.5s 0.25s both",
            }}
          >
            Level up — you&apos;re Lv {afterLevel} now
          </div>
        )}
      </div>
    </div>
  );
}
