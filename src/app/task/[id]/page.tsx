"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import CodeEditor from "@/components/CodeEditor";
import Markdown from "@/components/Markdown";

interface RubricItem { id: string; description: string; weight: number }
interface TaskDTO {
  id: string;
  title: string;
  taskType: string;
  language: string;
  statement: string;
  constraints: string[];
  starterCode: string;
  rubric: RubricItem[];
  hints: string[];
  testable: boolean;
  status: string;
}
interface ReviewIssue { severity: string; description: string }
interface ReviewDTO {
  verdict: "pass" | "needs-work" | "fail";
  scorePercent: number;
  correctnessSummary: string;
  issues: ReviewIssue[];
  idiomaticSummary: string;
  idiomaticSuggestions: string[];
  tradeoffs: string;
  whatToLearnNext: string[];
  weakAreaTags: string[];
  noteTitle: string;
  noteMarkdown: string;
}

const TYPE_LABEL: Record<string, string> = {
  "mini-feature": "Mini-feature",
  "system-design": "System design",
  "debug-refactor": "Debug / refactor",
};

const neutralChip = "mono text-[11.5px] rounded-[6px] px-2 py-[3px]";
const neutralChipStyle = { background: "#221f1d", border: "1px solid #34302c", color: "var(--color-text-2)" };

function verdictStyle(v: string) {
  if (v === "pass") return { color: "#7ad9b8", background: "rgba(89,194,160,0.14)", border: "1px solid rgba(89,194,160,0.4)" };
  if (v === "fail") return { color: "#e89490", background: "rgba(224,116,110,0.14)", border: "1px solid rgba(224,116,110,0.4)" };
  return { color: "#ecc07f", background: "rgba(227,168,87,0.14)", border: "1px solid rgba(227,168,87,0.4)" };
}
const VERDICT_NOTE: Record<string, string> = {
  pass: "Strong solution.",
  "needs-work": "On the right track — address the notes.",
  fail: "Needs a rethink.",
};
function sevAccent(s: string) {
  return s === "blocker" ? "#e0746e" : s === "major" ? "#e3a857" : "#7c6cff";
}
function sevTagStyle(s: string) {
  if (s === "blocker") return { color: "#e89490", background: "rgba(224,116,110,0.14)", border: "1px solid rgba(224,116,110,0.3)" };
  if (s === "major") return { color: "#ecc07f", background: "rgba(227,168,87,0.14)", border: "1px solid rgba(227,168,87,0.3)" };
  return { color: "#a89fb8", background: "rgba(124,108,255,0.12)", border: "1px solid rgba(124,108,255,0.28)" };
}

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [task, setTask] = useState<TaskDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [code, setCode] = useState("");
  const [review, setReview] = useState<ReviewDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tasks/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.task) {
          setTask(d.task);
          setCode(d.submission?.code ?? d.task.starterCode ?? "");
          setReview(d.review ?? null);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      });
  }, [id]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Review failed");
      setReview(data.review);
      setTimeout(
        () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }),
        50,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-[var(--color-text-2)]">Loading…</p>;
  if (notFound || !task)
    return (
      <div
        className="rounded-[12px] px-6 py-10 text-center"
        style={{ border: "1px dashed #3a342d" }}
      >
        <p className="text-[var(--color-text-2)] mb-4">Task not found.</p>
        <Link
          href="/"
          className="inline-block rounded-[10px] bg-[var(--color-accent)] text-white font-medium px-4 py-2"
        >
          Back to Dashboard
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link href="/" className="text-[13.5px] text-[var(--color-text-2)] hover:text-[var(--color-text)]">
        ← Dashboard
      </Link>

      <div className="grid lg:grid-cols-2 gap-7 items-start">
        {/* problem */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={neutralChip} style={neutralChipStyle}>{TYPE_LABEL[task.taskType] ?? task.taskType}</span>
            <span className={neutralChip} style={neutralChipStyle}>{task.language}</span>
            <span
              className={neutralChip}
              style={
                task.testable
                  ? { color: "#6fd6b3", background: "rgba(89,194,160,0.12)", border: "1px solid rgba(89,194,160,0.28)" }
                  : neutralChipStyle
              }
            >
              {task.testable ? "auto-testable" : "review-only"}
            </span>
          </div>
          <h1 className="text-[25px] font-semibold tracking-[-0.02em] leading-tight">{task.title}</h1>

          <Card>
            <Markdown>{task.statement}</Markdown>
          </Card>

          {task.constraints.length > 0 && (
            <Card>
              <Eyebrow>Constraints</Eyebrow>
              <ul className="space-y-2.5 mt-3">
                {task.constraints.map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-[14px]">
                    <span className="mt-[8px] w-[5px] h-[5px] rounded-full flex-none bg-[var(--color-accent)]" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {task.hints.length > 0 && (
            <Card>
              <button
                onClick={() => setShowHints((s) => !s)}
                className="flex items-center gap-2 text-[13.5px] font-medium text-[var(--color-accent)]"
              >
                <span
                  className="inline-block transition-transform"
                  style={{ transform: showHints ? "rotate(180deg)" : "none" }}
                >
                  ⌄
                </span>
                {showHints ? "Hide hints" : `Show hints (${task.hints.length})`}
              </button>
              {showHints && (
                <ul className="mt-3 space-y-2">
                  {task.hints.map((h, i) => (
                    <li key={i} className="flex gap-2.5 text-[13.5px] text-[var(--color-text-2)]">
                      <span className="mono text-[var(--color-muted)]">»</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {/* solution */}
        <div className="space-y-3 lg:sticky lg:top-[84px]">
          <Eyebrow>Your solution</Eyebrow>
          <CodeEditor value={code} onChange={setCode} language={task.language} />
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-[10px] bg-[var(--color-accent)] text-white font-medium py-2.5 flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ boxShadow: "0 4px 18px rgba(124,108,255,0.30)" }}
          >
            {submitting && <span className="spinner" />}
            {submitting ? "Reviewing…" : review ? "Re-submit for review" : "Submit for review"}
          </button>
          {error && <p className="text-[var(--color-neg)] text-sm">{error}</p>}
        </div>
      </div>

      {submitting && !review && <ReviewSkeleton />}
      {review && <ReviewPanel review={review} />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-[13px] p-6"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      {children}
    </div>
  );
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono text-[11px] uppercase tracking-[0.09em] text-[var(--color-muted)]">
      {children}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div style={{ borderTop: "1px solid var(--color-border-soft)" }} className="pt-9 space-y-5">
      <div className="flex items-center gap-5">
        <div className="skeleton w-[104px] h-[104px] !rounded-full" />
        <div className="skeleton h-7 w-40" />
      </div>
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-20 w-full" />
    </div>
  );
}

function ReviewPanel({ review }: { review: ReviewDTO }) {
  const ringColor =
    review.scorePercent >= 80 ? "#59c2a0" : review.scorePercent >= 55 ? "#e3a857" : "#e0746e";
  const deg = Math.round(review.scorePercent * 3.6);

  return (
    <div style={{ borderTop: "1px solid var(--color-border-soft)" }} className="pt-9 space-y-8">
      {/* header */}
      <div className="flex items-center gap-6">
        <div
          className="relative w-[104px] h-[104px] rounded-full flex-none"
          style={{ background: `conic-gradient(${ringColor} ${deg}deg, #2c2823 ${deg}deg)` }}
        >
          <div className="absolute inset-[7px] rounded-full flex flex-col items-center justify-center" style={{ background: "var(--color-bg)" }}>
            <span className="mono text-[30px] font-semibold leading-none">{review.scorePercent}</span>
            <span className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)] mt-1">Score</span>
          </div>
        </div>
        <div className="space-y-2">
          <span
            className="mono text-[13px] font-semibold uppercase tracking-[0.04em] rounded-[8px] px-[14px] py-[6px] inline-block"
            style={verdictStyle(review.verdict)}
          >
            {review.verdict}
          </span>
          <p className="text-[14px] text-[var(--color-text-2)]">{VERDICT_NOTE[review.verdict]}</p>
        </div>
      </div>

      <Section title="Correctness">
        <p className="text-[14.5px]">{review.correctnessSummary}</p>
        {review.issues.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {review.issues.map((iss, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-[10px] p-[14px]"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderLeft: `3px solid ${sevAccent(iss.severity)}`,
                }}
              >
                <span
                  className="mono text-[10.5px] font-semibold uppercase tracking-[0.05em] rounded-[5px] px-[7px] py-[2px] flex-none h-fit mt-[1px]"
                  style={sevTagStyle(iss.severity)}
                >
                  {iss.severity}
                </span>
                <span className="text-[14px]">{iss.description}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Idiomatic quality">
        <p className="text-[14.5px]">{review.idiomaticSummary}</p>
        {review.idiomaticSuggestions.length > 0 && (
          <ul className="mt-3 space-y-2">
            {review.idiomaticSuggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] text-[var(--color-prose)]">
                <span className="mt-[8px] w-[5px] h-[5px] rounded-full flex-none bg-[var(--color-accent)]" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Trade-offs">
        <p className="text-[14.5px]">{review.tradeoffs}</p>
      </Section>

      <Section title="What to learn next">
        <ul className="space-y-2">
          {review.whatToLearnNext.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-[14px]">
              <span className="mono text-[var(--color-accent)]">→</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* saved to notes */}
      <div
        className="rounded-[14px] p-6"
        style={{
          background: "linear-gradient(135deg, rgba(124,108,255,0.10), rgba(124,108,255,0.04))",
          border: "1px solid rgba(124,108,255,0.30)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="mono text-[11px] uppercase tracking-[0.09em] text-[var(--color-accent-soft)]">
            ✓ Saved to your notes
          </div>
          <Link href="/notes" className="text-[13px] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]">
            Open Notes archive →
          </Link>
        </div>
        <div className="rounded-[10px] p-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="text-[16px] font-semibold mb-2">{review.noteTitle}</h3>
          <Markdown>{review.noteMarkdown}</Markdown>
        </div>
        {review.weakAreaTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {review.weakAreaTags.map((t) => (
              <span
                key={t}
                className="mono text-[12px] whitespace-nowrap rounded-[7px] px-2 py-[3px]"
                style={{ background: "rgba(124,108,255,0.10)", border: "1px solid rgba(124,108,255,0.26)", color: "#c9a9f0" }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <div className="flex-1 h-px" style={{ background: "var(--color-border-soft)" }} />
      </div>
      {children}
    </div>
  );
}
