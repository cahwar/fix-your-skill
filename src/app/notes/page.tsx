"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

interface Note {
  id: string;
  taskId: string | null;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [activeQ, setActiveQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query: string) {
    setLoading(true);
    const res = await fetch(`/api/notes?q=${encodeURIComponent(query)}`);
    const d = await res.json();
    setNotes(d.notes ?? []);
    setActiveQ(query);
    setLoading(false);
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Notes</h1>
          <p className="text-[var(--color-text-2)] text-[14px] mt-1.5">
            Distilled lessons from your reviews.
          </p>
        </div>
        <div className="relative w-[260px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-[14px]">
            ⌕
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes & tags…"
            className="w-full rounded-[10px] pl-8 pr-3 py-[10px] text-[14px] outline-none"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-input-border)" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,108,255,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-input-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--color-text-2)]">Loading…</p>
      ) : notes.length === 0 ? (
        <div
          className="rounded-[12px] px-6 py-10 text-center text-[13.5px] text-[var(--color-text-2)]"
          style={{ border: "1px dashed #3a342d" }}
        >
          {activeQ
            ? `No notes match “${activeQ}”.`
            : "No notes yet — submit a task for review and a note is created automatically."}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <article
              key={n.id}
              className="rounded-[13px] p-6"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="text-[16px] font-semibold">{n.title}</h2>
                <span className="mono text-[11.5px] text-[var(--color-muted)] flex-none">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Markdown>{n.content}</Markdown>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="mono text-[12px] whitespace-nowrap rounded-[7px] px-2 py-[3px]"
                      style={{ background: "rgba(124,108,255,0.10)", border: "1px solid rgba(124,108,255,0.26)", color: "#c9a9f0" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {n.taskId && (
                  <Link
                    href={`/task/${n.taskId}`}
                    className="text-[13px] text-[var(--color-accent)] hover:text-[var(--color-accent-hi)]"
                  >
                    View task →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
