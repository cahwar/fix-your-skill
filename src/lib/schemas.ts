// Shared types + JSON Schemas used for Claude structured outputs (output_config.format).
// JSON Schema constraints: every object sets additionalProperties:false and lists all
// properties in `required`; no min/max/length constraints (unsupported by structured outputs).

export type TaskType = "mini-feature" | "system-design" | "debug-refactor";
export type Language = "luau" | "typescript";

export interface RubricItem {
  id: string;
  description: string;
  weight: number; // 1..5 relative importance
}

export interface GeneratedTask {
  title: string;
  taskType: TaskType;
  language: Language;
  statement: string; // markdown
  constraints: string[];
  starterCode: string;
  rubric: RubricItem[];
  hints: string[];
  testable: boolean;
}

export interface ReviewIssue {
  severity: "blocker" | "major" | "minor";
  description: string;
}

export interface ReviewResult {
  verdict: "pass" | "needs-work" | "fail";
  scorePercent: number; // 0..100
  correctnessSummary: string;
  issues: ReviewIssue[];
  idiomaticSummary: string;
  idiomaticSuggestions: string[];
  tradeoffs: string;
  whatToLearnNext: string[];
  weakAreaTags: string[]; // short kebab-case tags to feed back into the profile
  noteTitle: string;
  noteMarkdown: string; // ready-to-archive conspect
}

// ---- JSON Schemas ----

export const taskJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Short, specific task title" },
    taskType: {
      type: "string",
      enum: ["mini-feature", "system-design", "debug-refactor"],
    },
    language: { type: "string", enum: ["luau", "typescript"] },
    statement: {
      type: "string",
      description: "Full task statement in markdown. Clear, unambiguous.",
    },
    constraints: {
      type: "array",
      items: { type: "string" },
      description: "Explicit constraints / requirements the solution must satisfy",
    },
    starterCode: {
      type: "string",
      description:
        "Starter skeleton in the target language (may be empty for system-design tasks)",
    },
    rubric: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          description: { type: "string" },
          weight: { type: "integer" },
        },
        required: ["id", "description", "weight"],
      },
    },
    hints: { type: "array", items: { type: "string" } },
    testable: {
      type: "boolean",
      description:
        "True only if the solution is pure logic runnable without the Roblox runtime",
    },
  },
  required: [
    "title",
    "taskType",
    "language",
    "statement",
    "constraints",
    "starterCode",
    "rubric",
    "hints",
    "testable",
  ],
} as const;

export const reviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["pass", "needs-work", "fail"] },
    scorePercent: { type: "integer" },
    correctnessSummary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          severity: { type: "string", enum: ["blocker", "major", "minor"] },
          description: { type: "string" },
        },
        required: ["severity", "description"],
      },
    },
    idiomaticSummary: {
      type: "string",
      description: "How idiomatic the solution is for the specific framework/stack",
    },
    idiomaticSuggestions: { type: "array", items: { type: "string" } },
    tradeoffs: { type: "string" },
    whatToLearnNext: { type: "array", items: { type: "string" } },
    weakAreaTags: {
      type: "array",
      items: { type: "string" },
      description: "Short kebab-case weak-area tags, e.g. error-handling, di-lifecycle",
    },
    noteTitle: { type: "string" },
    noteMarkdown: {
      type: "string",
      description: "A concise, memorizable study note in markdown distilled from this review",
    },
  },
  required: [
    "verdict",
    "scorePercent",
    "correctnessSummary",
    "issues",
    "idiomaticSummary",
    "idiomaticSuggestions",
    "tradeoffs",
    "whatToLearnNext",
    "weakAreaTags",
    "noteTitle",
    "noteMarkdown",
  ],
} as const;
