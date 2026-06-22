"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LEVELS = ["junior", "middle", "senior"];
const STACK_PRESETS = [
  "roblox + flamework + roblox-ts",
  "roblox + knit + luau",
  "roblox + luau (vanilla)",
];

const inputBase =
  "w-full rounded-[10px] px-[14px] py-[12px] outline-none transition-shadow";
const inputStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-input-border)",
};

export default function ProfilePage() {
  const router = useRouter();
  const [stack, setStack] = useState("");
  const [level, setLevel] = useState("middle");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stackError, setStackError] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setStack(d.profile.stack);
          setLevel(d.profile.level);
          setGoals(d.profile.goals);
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    if (!stack.trim()) {
      setStackError(true);
      return;
    }
    setStackError(false);
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stack, level, goals }),
    });
    setSaving(false);
    if (!res.ok) return;
    setSaved(true);
    setTimeout(() => router.push("/"), 650);
  }

  if (loading) return <p className="text-[var(--color-text-2)]">Loading…</p>;

  return (
    <div className="max-w-[600px] space-y-7">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Profile</h1>
        <p className="text-[var(--color-text-2)] text-[14px] mt-1.5">
          Tune what the gym trains. Tasks are generated against this.
        </p>
      </div>

      {/* stack */}
      <div className="space-y-2.5">
        <label className="text-[13px] font-medium block">Stack</label>
        <input
          value={stack}
          onChange={(e) => setStack(e.target.value)}
          placeholder="e.g. roblox + knit + luau"
          className={`${inputBase} mono text-[14px] focus:[box-shadow:0_0_0_3px_rgba(124,108,255,0.15)]`}
          style={{
            ...inputStyle,
            borderColor: stackError ? "var(--color-neg)" : "var(--color-input-border)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = stackError
              ? "var(--color-neg)"
              : "var(--color-input-border)")
          }
        />
        {stackError && (
          <p className="text-[13px] text-[var(--color-neg)]">Stack is required.</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {STACK_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setStack(p)}
              className="mono text-[12px] rounded-[7px] px-2.5 py-1.5 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
              style={{ background: "#221f1d", border: "1px solid #34302c", color: "var(--color-text-2)" }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* level */}
      <div className="space-y-2.5">
        <label className="text-[13px] font-medium block">Level</label>
        <div
          className="inline-flex p-[3px] rounded-[9px]"
          style={{ background: "var(--color-raised)", border: "1px solid #34302c" }}
        >
          {LEVELS.map((l) => {
            const active = level === l;
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="text-[13.5px] capitalize rounded-[7px] px-[18px] py-[7px] transition-colors"
                style={
                  active
                    ? { background: "var(--color-accent)", color: "#fff" }
                    : { color: "#a89fb8" }
                }
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* goals */}
      <div className="space-y-2.5">
        <label className="text-[13px] font-medium block">
          Goals <span className="text-[var(--color-text-2)] font-normal">(optional)</span>
        </label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="e.g. get sharper at designing networking / replication systems"
          rows={3}
          className={`${inputBase} text-[14px] resize-y`}
          style={inputStyle}
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

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-[10px] bg-[var(--color-accent)] text-white font-medium px-5 py-2.5 disabled:opacity-60"
          style={{ boxShadow: "0 4px 18px rgba(124,108,255,0.30)" }}
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="text-[var(--color-pos)] text-[14px]">✓ Saved</span>}
      </div>
    </div>
  );
}
