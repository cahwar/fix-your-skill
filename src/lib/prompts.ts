import type { TaskType, LessonFocus } from "./schemas";

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

// --- Guided lessons (Learn → Practice) ---------------------------------------

const LESSON_FOCUS_GUIDANCE: Record<LessonFocus, string> = {
  "applied-skill":
    "Teach a concrete, practical skill the developer applies directly in their stack (e.g. a DataStore retry wrapper, a Flamework lifecycle service, a debounced remote handler). Pick something immediately useful, not abstract.",
  "algorithms-data-structures":
    "Teach a general algorithm or data structure that pays off in this developer's stack (e.g. spatial partitioning, priority queues for AI, ring buffers, graph traversal for pathing). Ground every example in their language/runtime, not generic pseudocode.",
  "stack-idioms":
    "Teach the idioms, conventions and patterns of the developer's specific framework (e.g. Knit service/controller boundaries, Flamework dependency injection & decorators, roblox-ts typing patterns). Emphasize the 'right way' for that framework.",
  "weak-areas":
    "Build the lesson around the developer's tracked weak areas so it directly shores them up. Choose the weak area with the most leverage if several are listed.",
};

export function buildLessonGenerationPrompt(
  profile: ProfileInput,
  focus: LessonFocus | "auto",
  customTopic?: string,
): { system: string; user: string } {
  const weak =
    profile.weakAreas.length > 0
      ? `Tracked weak areas: ${profile.weakAreas.join(", ")}.`
      : "No weak-area history yet.";

  const focusLine =
    focus === "auto"
      ? "FOCUS: auto — choose whichever angle (applied-skill, algorithms-data-structures, stack-idioms, or weak-areas) is most valuable for this developer right now, and set the lesson's `focus` field to the one you chose."
      : `FOCUS: ${focus} — ${LESSON_FOCUS_GUIDANCE[focus]} Set the lesson's \`focus\` field to "${focus}".`;

  const topicLine = customTopic
    ? `The developer explicitly asked to learn: "${customTopic}". Center the lesson on this topic; still classify it under the most fitting \`focus\`.`
    : "Pick a single, specific, well-scoped topic — not a broad survey.";

  const system = [
    "You are an expert mentor who first TEACHES a focused topic, then sets a practice task on it.",
    "The user writes production code with AI daily and wants to keep their hands-on problem-solving sharp, so the lesson must build genuine understanding and the task must require real reasoning — not boilerplate.",
    "Tailor everything tightly to the user's exact stack and its idioms. If the stack is a Roblox framework (Knit, Flamework, etc.), all explanations, code examples, and the task must use that framework's real conventions.",
    "LESSON: teach in ordered stages that build on each other — each section has a clear heading, a markdown explanation, a few memorizable keyPoints, and a short illustrative codeExample (empty string only when a snippet truly doesn't help). Keep it focused and progressive; end with a concise recap.",
    "TASK: produce exactly one practice task that exercises what the lesson just taught — same standards as a standalone task. Set `testable: true` ONLY when the solution is pure logic runnable without the Roblox runtime; framework-coupled or design tasks must be `testable: false`. The task language must match the stack (luau or typescript).",
    "Calibrate difficulty to the user's level. Make the lesson clear and the task's statement and rubric concrete.",
    languageDirective(profile.language),
  ]
    .filter(Boolean)
    .join(" ");

  const user = [
    `Stack: ${profile.stack}`,
    `Level: ${profile.level}`,
    `Goals: ${profile.goals || "(none stated)"}`,
    weak,
    focusLine,
    topicLine,
    "Return the lesson and one derived practice task.",
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
