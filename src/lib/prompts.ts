import type { TaskType } from "./schemas";

export interface ProfileInput {
  stack: string;
  level: string;
  goals: string;
  weakAreas: string[];
  language?: string;
}

/**
 * Languages the AI-generated content (tasks/reviews/notes) can be written in.
 * Keys are the codes stored on the profile; values are the English names handed
 * to the model. "en" is the default and produces no extra instruction.
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  uk: "Ukrainian",
  es: "Spanish",
  pt: "Portuguese",
  de: "German",
  fr: "French",
  zh: "Chinese (Simplified)",
  ja: "Japanese",
};

/**
 * Instruction appended to a system prompt so the model writes prose in the
 * chosen language while leaving code, identifiers and tool/framework names in
 * their original form. Returns null for English (the default — no-op).
 */
export function languageDirective(language: string | undefined): string | null {
  if (!language || language === "en") return null;
  const name = SUPPORTED_LANGUAGES[language] ?? language;
  return [
    `IMPORTANT — OUTPUT LANGUAGE: Write all natural-language prose for the user in ${name}.`,
    "This covers the task statement, constraints, hints, rubric descriptions, every review summary, suggestion, trade-off, what-to-learn-next item, the note title and the note markdown body.",
    "KEEP IN THEIR ORIGINAL FORM — never translate: all code and code blocks; identifiers and variable/function/type names; API, library, framework and tool names (e.g. Flamework, Knit, roblox-ts, Luau, RunService, Promise); and established technical terms developers normally keep in English.",
    `Write naturally as a fluent engineer would in ${name} — do not translate word-for-word, and never alter the code itself.`,
    "Any machine-readable identifiers or tags (e.g. kebab-case weakAreaTags, rubric ids) MUST stay in English.",
  ].join(" ");
}

const TASK_TYPE_GUIDANCE: Record<TaskType, string> = {
  "mini-feature":
    "A small, realistic feature to implement from scratch in the given stack (e.g. a rate limiter, a cooldown system, a data-store wrapper, a signal/event aggregator). Provide a meaningful starter skeleton.",
  "system-design":
    "An architecture/design problem for the given stack: the user describes components, data flow, and trade-offs in prose. No automated tests — starterCode may be empty. The rubric should grade design reasoning.",
  "debug-refactor":
    "Provide intentionally broken or messy code in starterCode that the user must fix or refactor. The bug/smell must be real and discoverable by reading the code.",
};

export function buildTaskGenerationPrompt(
  profile: ProfileInput,
  taskType: TaskType,
): { system: string; user: string } {
  const weak =
    profile.weakAreas.length > 0
      ? `The user has shown weakness in these areas — bias the task to exercise at least one of them: ${profile.weakAreas.join(", ")}.`
      : "No weak-area history yet.";

  const system = [
    "You are an expert technical interviewer and mentor who designs practice problems that sharpen a developer's PROBLEM-SOLVING ability.",
    "The user uses AI to write production code daily and wants to keep solving problems by hand, so tasks must require genuine reasoning — not boilerplate.",
    "Tailor every task tightly to the user's exact stack and its idioms. If the stack is a Roblox framework (Knit, Flamework, etc.), the task and starter code must use that framework's real conventions.",
    "Set `testable: true` ONLY when the solution is pure logic that could run without the Roblox runtime (no Instances, services, or framework DI). Framework-coupled or design tasks must be `testable: false`.",
    "Keep difficulty calibrated to the user's level. Make the statement unambiguous and the rubric concrete.",
    languageDirective(profile.language),
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Stack: ${profile.stack}`,
    `Level: ${profile.level}`,
    `Goals: ${profile.goals || "(none stated)"}`,
    weak,
    `Task type to generate: ${taskType} — ${TASK_TYPE_GUIDANCE[taskType]}`,
    "Generate exactly one task. The language field must match the stack (luau or typescript).",
  ].join("\n");

  return { system, user };
}

export function buildReviewPrompt(
  task: {
    title: string;
    taskType: string;
    language: string;
    statement: string;
    constraints: string[];
    rubric: { id: string; description: string; weight: number }[];
  },
  code: string,
  stack: string,
  language?: string,
): { system: string; user: string } {
  const system = [
    "You are a senior code reviewer and teacher for the user's exact stack.",
    "Review the submitted solution against the task and rubric. Be rigorous but constructive.",
    "Judge: (1) correctness — does it actually solve the problem and satisfy the constraints; (2) idiomatic quality FOR THE SPECIFIC FRAMEWORK/STACK; (3) trade-offs the user should understand.",
    "Then produce `whatToLearnNext` (concrete next steps) and a distilled `noteMarkdown` the user can save and memorize — it should capture the durable lesson, not just restate the task.",
    "`weakAreaTags` must be short kebab-case tags identifying what the user struggled with, used to adapt future tasks.",
    "Score 0-100 honestly. verdict: pass (>=80 and no blockers), needs-work (40-79 or has majors), fail (<40 or has blockers).",
    languageDirective(language),
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Stack: ${stack}`,
    `Task title: ${task.title}`,
    `Task type: ${task.taskType}`,
    `Language: ${task.language}`,
    `--- STATEMENT ---\n${task.statement}`,
    `--- CONSTRAINTS ---\n${task.constraints.map((c) => `- ${c}`).join("\n")}`,
    `--- RUBRIC ---\n${task.rubric
      .map((r) => `- (${r.weight}) ${r.description}`)
      .join("\n")}`,
    `--- USER SOLUTION ---\n${code || "(empty)"}`,
  ].join("\n\n");

  return { system, user };
}
