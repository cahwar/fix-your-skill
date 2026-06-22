"use client";

// Animated XP progress-bar track + fill (spec 1.9). `pct` is [0..1].
export default function XpBar({
  pct,
  width,
  height = 5,
}: {
  pct: number;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width: width ? `${width}px` : "100%",
        height: `${height}px`,
        background: "#15140f",
        borderRadius: `${height}px`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(1, pct)) * 100}%`,
          height: "100%",
          borderRadius: `${height}px`,
          background: "linear-gradient(90deg,#7c6cff,#9486ff 55%,#b9aaff)",
          backgroundSize: "220% 100%",
          animation: "barShine 2.6s linear infinite",
          transition: "width 0.8s cubic-bezier(.22,.61,.36,1)",
        }}
      />
    </div>
  );
}
