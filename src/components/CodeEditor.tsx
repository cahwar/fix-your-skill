"use client";

import Editor, { type BeforeMount } from "@monaco-editor/react";

const THEME = "fys-dark";

export default function CodeEditor({
  value,
  onChange,
  language,
}: {
  value: string;
  onChange: (v: string) => void;
  language: string;
}) {
  // Monaco has no Luau grammar; map it to Lua for decent highlighting.
  const monacoLang = language === "luau" ? "lua" : "typescript";
  const fileName = `solution.${language === "luau" ? "luau" : "ts"}`;

  const beforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(THEME, {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#121117",
        "editorGutter.background": "#15140f",
        "editorLineNumber.foreground": "#5a554d",
        "editorLineNumber.activeForeground": "#a89fb8",
        "editor.lineHighlightBackground": "#1a1820",
        "editor.selectionBackground": "#33305a",
        "editorCursor.foreground": "#9486ff",
      },
    });
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid #2b2823",
        background: "var(--color-code)",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
      }}
    >
      {/* header bar */}
      <div
        className="flex items-center gap-3 px-[14px] py-[11px]"
        style={{ background: "#1a1816", borderBottom: "1px solid #26231e" }}
      >
        <div className="flex items-center gap-[6px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[11px] h-[11px] rounded-full"
              style={{ background: "#3a3530" }}
            />
          ))}
        </div>
        <span className="mono text-[12px]" style={{ color: "#7a746a" }}>
          {fileName}
        </span>
        <span className="mono text-[12px] ml-auto" style={{ color: "#5f5a52" }}>
          {language}
        </span>
      </div>
      <Editor
        height="460px"
        theme={THEME}
        beforeMount={beforeMount}
        language={monacoLang}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          fontSize: 13,
          lineHeight: 21,
          fontFamily:
            "var(--font-jbmono), 'JetBrains Mono', ui-monospace, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
