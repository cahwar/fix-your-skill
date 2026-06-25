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

// ---- Guided lessons (Learn → Practice) ----
// A lesson is an optional layer on top of a Task: the model teaches a topic in
// staged sections, then the task practices it. The `focus` is the angle the
// lesson takes; `auto` is a request-only mode (the model classifies into one of
// the concrete focuses), so it never appears on a stored/returned Lesson.
export type LessonFocus =
  | "applied-skill"
  | "algorithms-data-structures"
  | "stack-idioms"
  | "weak-areas";

export interface LessonSection {
  heading: string;
  body: string; // markdown explanation for this stage
  keyPoints: string[]; // memorizable takeaways
  codeExample: string; // illustrative snippet ("" when none)
}

export interface Lesson {
  topic: string; // the concrete topic the model taught
  focus: LessonFocus; // which angle the lesson took
  overview: string; // one-paragraph "why this matters" intro
  sections: LessonSection[]; // ordered learning stages
  recap: string[]; // summary bullets shown before the task
}

// The model returns the lesson AND a practice task derived from it in one call.
export interface GeneratedLesson {
  lesson: Lesson;
  task: GeneratedTask;
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

// Combined lesson + practice-task schema. Reuses the task shape verbatim and
// wraps it with the staged lesson. Follows structured-output rules: every object
// sets additionalProperties:false and lists all props in required (so codeExample
// is required and may be an empty string), and no min/max/length constraints.
export const lessonJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    lesson: {
      type: "object",
      additionalProperties: false,
      properties: {
        topic: {
          type: "string",
          description: "The concrete, specific topic this lesson teaches",
        },
        focus: {
          type: "string",
          enum: [
            "applied-skill",
            "algorithms-data-structures",
            "stack-idioms",
            "weak-areas",
          ],
          description: "Which angle the lesson takes",
        },
        overview: {
          type: "string",
          description: "One-paragraph intro: what this is and why it matters for the stack",
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              heading: { type: "string" },
              body: {
                type: "string",
                description: "Markdown explanation for this learning stage",
              },
              keyPoints: {
                type: "array",
                items: { type: "string" },
                description: "Short memorizable takeaways for this stage",
              },
              codeExample: {
                type: "string",
                description:
                  "Illustrative code snippet for this stage in the target language; empty string if none",
              },
            },
            required: ["heading", "body", "keyPoints", "codeExample"],
          },
          description: "Ordered learning stages, building up the topic step by step",
        },
        recap: {
          type: "array",
          items: { type: "string" },
          description: "Summary bullets shown right before the practice task",
        },
      },
      required: ["topic", "focus", "overview", "sections", "recap"],
    },
    task: taskJsonSchema,
  },
  required: ["lesson", "task"],
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
