"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Profile {
  stack: string;
  level: string;
  goals: string;
  weakAreas: string[];
}
interface TaskRow {
  id: string;
  title: string;
  taskType: string;
  language: string;
  status: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  "mini-feature": "Mini-feature",
  "system-design": "System design",
  "debug-refactor": "Debug / refactor",
};

const accentChip =
  "mono text-[12px] whitespace-nowrap rounded-[7px] px-2 py-[3px]";
const accentChipStyle = {
  background: "rgba(124,108,255,0.10)",
  border: "1px solid rgba(124,108,255,0.26)",
  color: "#c9a9f0",
};

const GEN_CARDS = [
  { key: "mini-feature", title: "Mini-feature", desc: "implement a small realistic feature", shape: "square", accent: false },
  { key: "system-design", title: "System design", desc: "architecture & trade-offs", shape: "circle", accent: false },
  { key: "debug-refactor", title: "Debug / refactor", desc: "fix broken or messy code", shape: "diamond", accent: false },
  { key: "auto", title: "Surprise me", desc: "auto-picks a type for you", shape: "spark", accent: true },
] as const;

function Glyph({ shape }: { shape: string }) {
  if (shape === "square")
    return <span className="w-[22px] h-[22px] rounded-[6px]" style={{ border: "2px solid #8a8378" }} />;
  if (shape === "circle")
    return <span className="w-[22px] h-[22px] rounded-full" style={{ border: "2px solid #8a8378" }} />;
  if (shape === "diamond")
    return (
      <span
        className="w-[17px] h-[17px] rounded-[4px]"
        style={{ border: "2px solid #8a8378", transform: "rotate(45deg)" }}
      />
    );
  return (
    <span
      className="w-[17px] h-[17px] rounded-[4px]"
      style={{
        background: "linear-gradient(135deg,#9486ff,#6a59e0)",
        transform: "rotate(45deg)",
        boxShadow: "0 2px 10px rgba(124,108,255,0.4)",
      }}
    />
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [mock, setMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [p, t, s] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/status").then((r) => r.json()),
    ]);
    setProfile(p.profile);
    setTasks(t.tasks ?? []);
    setMock(Boolean(s.mock));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function generate(taskType: string) {
    setError(null);
    setGenerating(taskType);
    try {
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskType === "auto" ? {} : { taskType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/task/${data.task.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setGenerating(null);
    }
  }

  if (loading) return <p className="text-[var(--color-text-2)]">Loading…</p>;

  if (!profile) {
    return (
      <div className="max-w-xl">
        <h1 className="text-[25px] font-semibold tracking-[-0.02em] mb-2">Welcome</h1>
        <p className="text-[var(--color-text-2)] mb-6">
          Set up your training profile first — tasks are generated against your stack.
        </p>
        <Link
          href="/profile"
          className="inline-block rounded-[10px] bg-[var(--color-accent)] text-white font-medium px-5 py-2.5"
          style={{ boxShadow: "0 4px 18px rgba(124,108,255,0.30)" }}
        >
          Create profile
        </Link>
      </div>
    );
  }

  const busy = generating !== null;

  return (
    <div className="space-y-9">
      {mock && !bannerDismissed && (
        <div
          className="flex items-center gap-3 rounded-[10px] px-[15px] py-[13px] text-[13.5px]"
          style={{
            background: "rgba(227,168,87,0.08)",
            border: "1px solid rgba(227,168,87,0.26)",
            color: "#e3a857",
          }}
        >
          <span
            className="flex-none w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold"
            style={{ background: "rgba(227,168,87,0.18)" }}
          >
            i
          </span>
          <span className="text-[var(--color-prose)]">
            <strong style={{ color: "#e3a857" }}>Mock mode</strong> — no API key set. Tasks and
            reviews are sample data.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-text)] text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* profile summary */}
      <section
        className="rounded-[14px] p-6"
        style={{ background: "var(--color-raised)", border: "1px solid var(--color-border-2)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="mono text-[11px] uppercase tracking-[0.09em] text-[var(--color-muted)]">
            Your training profile
          </div>
          <Link href="/profile" className="text-[13px] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]">
            Edit →
          </Link>
        </div>
        <div className="mono text-[27px] font-semibold text-[var(--color-text)] leading-tight">
          {profile.stack}
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span
            className="inline-flex items-center gap-2 rounded-[7px] px-2.5 py-1 text-[13px] capitalize"
            style={{ background: "#2a2621", border: "1px solid #38332c" }}
          >
            <span className="w-[6px] h-[6px] rounded-full bg-[var(--color-accent)]" />
            {profile.level}
          </span>
          {profile.goals && (
            <span className="text-[13.5px] text-[var(--color-text-2)]">{profile.goals}</span>
          )}
        </div>
        <div className="mono text-[11px] uppercase tracking-[0.09em] text-[var(--color-muted)] mt-5 mb-2">
          Weak areas
        </div>
        {profile.weakAreas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.weakAreas.map((w) => (
              <span key={w} className={accentChip} style={accentChipStyle}>
                {w}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13.5px] italic text-[var(--color-text-2)]">
            None tracked yet — they&apos;ll appear as you get reviews.
          </p>
        )}
      </section>

      {/* generate */}
      <section>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="text-[18px] font-semibold">Generate a new task</h2>
          <span className="text-[13px] text-[var(--color-text-2)]">scoped to your stack</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[13px]">
          {GEN_CARDS.map((c) => {
            const loadingThis = generating === c.key;
            return (
              <button
                key={c.key}
                onClick={() => generate(c.key)}
                disabled={busy}
                className="text-left rounded-[13px] p-[17px] transition-transform duration-150 enabled:hover:-translate-y-[2px]"
                style={{
                  opacity: busy && !loadingThis ? 0.5 : 1,
                  cursor: busy ? "default" : "pointer",
                  background: c.accent
                    ? "linear-gradient(160deg,rgba(124,108,255,0.14),rgba(124,108,255,0.05))"
                    : "var(--color-raised)",
                  border: c.accent
                    ? "1px solid rgba(124,108,255,0.40)"
                    : "1px solid var(--color-border-2)",
                }}
              >
                <div className="h-[22px] flex items-center">
                  {loadingThis ? <span className="spinner text-[var(--color-accent)]" /> : <Glyph shape={c.shape} />}
                </div>
                <div className={`mt-3 text-[14.5px] font-semibold ${c.accent ? "text-[var(--color-accent-hi)]" : ""}`}>
                  {c.title}
                </div>
                <div className="mt-1 text-[12px] text-[var(--color-text-2)]">{c.desc}</div>
              </button>
            );
          })}
        </div>
        {error && <p className="text-[var(--color-neg)] text-sm mt-3">{error}</p>}
      </section>

      {/* recent tasks */}
      <section>
        <h2 className="text-[18px] font-semibold mb-3">Recent tasks</h2>
        {tasks.length === 0 ? (
          <div
            className="rounded-[12px] px-5 py-8 text-center text-[13.5px] text-[var(--color-text-2)]"
            style={{ border: "1px dashed #3a342d" }}
          >
            No tasks yet — pick a type above to generate your first task.
          </div>
        ) : (
          <div className="rounded-[12px] overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            {tasks.map((t, i) => (
              <Link
                key={t.id}
                href={`/task/${t.id}`}
                className="flex items-center justify-between px-[18px] py-[14px] hover:bg-[#262320] transition-colors"
                style={i > 0 ? { borderTop: "1px solid var(--color-border-soft)" } : undefined}
              >
                <div className="min-w-0">
                  <div className="text-[14.5px] font-medium truncate">{t.title}</div>
                  <div className="mono text-[12px] text-[var(--color-muted)] mt-0.5">
                    {TYPE_LABEL[t.taskType] ?? t.taskType}  ·  {t.language}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const reviewed = status === "reviewed";
  return (
    <span
      className="mono text-[11px] font-semibold uppercase tracking-[0.04em] rounded-[6px] px-2 py-1 flex-none"
      style={
        reviewed
          ? { color: "#6fd6b3", background: "rgba(89,194,160,0.12)", border: "1px solid rgba(89,194,160,0.28)" }
          : { color: "#9b958a", background: "#26231e", border: "1px solid #38332c" }
      }
    >
      {status}
    </span>
  );
}
