// Pure XP math + celebration tiers. No React, no DOM — safe to import anywhere.
// Mirrors the spec in "ТЗ — XP и анимации".

export const XP_STORAGE_KEY = "fys_xp";
/** Starting XP for the real product (the prototype seeded 460). */
export const XP_SEED = 0;

/** Cost of moving from level L to L+1. Grows linearly. */
export function needForLevel(level: number): number {
  return 150 + (level - 1) * 120;
}

export interface LevelInfo {
  level: number; // current level
  into: number; // XP earned inside the current level
  need: number; // XP needed to reach the next level
  pct: number; // progress-bar fraction [0..1]
}

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let rem = Math.max(0, Math.floor(totalXp));
  let need = needForLevel(1);
  while (rem >= need) {
    rem -= need;
    level++;
    need = needForLevel(level);
  }
  return {
    level,
    into: rem,
    need,
    pct: Math.max(0, Math.min(1, rem / need)),
  };
}

export type Verdict = "pass" | "needs-work" | "fail";

/** XP gained for a review. Higher score + better verdict → more XP. */
export function computeXp(score: number, verdict: Verdict): number {
  let xp = Math.round(score);
  if (verdict === "pass") xp += 45;
  else if (verdict === "needs-work") xp += 12;
  // verdict === "fail" → no bonus
  return xp;
}

export type TierKey = "epic" | "great" | "good" | "ok";

export interface Tier {
  key: TierKey;
  label: string;
  color: string;
  count: number; // confetti particle count
  palette: string[];
}

const TIERS: Tier[] = [
  {
    key: "epic",
    label: "Outstanding",
    color: "#e8b84b",
    count: 52,
    palette: ["#e8b84b", "#f0d27a", "#9486ff", "#fff4d6", "#e3a857"],
  },
  {
    key: "great",
    label: "Great work",
    color: "#7ad9b8",
    count: 34,
    palette: ["#7ad9b8", "#59c2a0", "#9486ff", "#cdeee2"],
  },
  {
    key: "good",
    label: "Solid progress",
    color: "#9486ff",
    count: 20,
    palette: ["#9486ff", "#b9aaff", "#7c6cff", "#C9A9F0"],
  },
  {
    key: "ok",
    label: "Keep grinding",
    color: "#A89FB8",
    count: 9,
    palette: ["#A89FB8", "#8a8378", "#9486ff"],
  },
];

export function tierForScore(score: number): Tier {
  if (score >= 85) return TIERS[0];
  if (score >= 70) return TIERS[1];
  if (score >= 50) return TIERS[2];
  return TIERS[3];
}
