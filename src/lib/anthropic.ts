import Anthropic from "@anthropic-ai/sdk";
import {
  taskJsonSchema,
  reviewJsonSchema,
  type GeneratedTask,
  type ReviewResult,
  type TaskType,
} from "./schemas";
import {
  buildTaskGenerationPrompt,
  buildReviewPrompt,
  type ProfileInput,
} from "./prompts";

const MODEL = "claude-opus-4-8";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Call Claude with a forced JSON-schema output and parse the first text block.
 */
async function structuredCall<T>(args: {
  system: string;
  user: string;
  schema: object;
  maxTokens?: number;
}): Promise<T> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: args.maxTokens ?? 8000,
    system: args.system,
    messages: [{ role: "user", content: args.user }],
    // Structured outputs: constrain the response to our JSON schema.
    output_config: { format: { type: "json_schema", schema: args.schema } },
  } as Anthropic.MessageCreateParamsNonStreaming);

  if (response.stop_reason === "refusal") {
    throw new Error("The model refused this request.");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content returned from the model.");
  }
  return JSON.parse(textBlock.text) as T;
}

export async function generateTask(
  profile: ProfileInput,
  taskType: TaskType,
): Promise<GeneratedTask> {
  if (!hasApiKey()) return mockTask(profile, taskType);
  const { system, user } = buildTaskGenerationPrompt(profile, taskType);
  return structuredCall<GeneratedTask>({ system, user, schema: taskJsonSchema });
}

export async function reviewSubmission(
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
): Promise<ReviewResult> {
  if (!hasApiKey()) return mockReview(task, code);
  const { system, user } = buildReviewPrompt(task, code, stack);
  return structuredCall<ReviewResult>({
    system,
    user,
    schema: reviewJsonSchema,
  });
}

// ---- MOCK MODE (no API key) -------------------------------------------------

function mockTask(profile: ProfileInput, taskType: TaskType): GeneratedTask {
  const isLuau = /luau|knit/i.test(profile.stack);
  const language = isLuau ? "luau" : "typescript";
  return {
    title: "[MOCK] Implement a debounced cooldown manager",
    taskType,
    language,
    statement:
      "## [MOCK MODE]\nNo `ANTHROPIC_API_KEY` is set, so this is a sample task.\n\n" +
      `Build a **cooldown manager** for the \`${profile.stack}\` stack. It should let callers ` +
      "check whether an action is on cooldown for a given key, start a cooldown of N seconds, " +
      "and query the remaining time. Pure logic only.",
    constraints: [
      "No external dependencies",
      "O(1) check and start",
      "Handle the same key being started repeatedly",
    ],
    starterCode: isLuau
      ? "local CooldownManager = {}\nCooldownManager.__index = CooldownManager\n\nfunction CooldownManager.new()\n\t-- TODO\nend\n\nreturn CooldownManager"
      : "export class CooldownManager {\n  // TODO: implement isOnCooldown / start / remaining\n}",
    rubric: [
      { id: "correct", description: "Correctly tracks cooldowns per key", weight: 5 },
      { id: "edge", description: "Handles restart and expiry edge cases", weight: 3 },
      { id: "clarity", description: "Readable, idiomatic for the stack", weight: 2 },
    ],
    hints: ["Store the timestamp when a cooldown ends, not when it starts."],
    testable: true,
  };
}

function mockReview(
  task: { title: string },
  code: string,
): ReviewResult {
  const empty = code.trim().length === 0;
  return {
    verdict: empty ? "fail" : "needs-work",
    scorePercent: empty ? 0 : 65,
    correctnessSummary: empty
      ? "[MOCK] No solution submitted."
      : "[MOCK] This is a sample review (no ANTHROPIC_API_KEY set). The core idea is on the right track.",
    issues: empty
      ? [{ severity: "blocker", description: "Empty submission." }]
      : [{ severity: "minor", description: "Consider the expiry edge case more carefully." }],
    idiomaticSummary: "[MOCK] Set ANTHROPIC_API_KEY in .env to get a real, stack-aware review.",
    idiomaticSuggestions: ["Add a real Anthropic key to enable framework-specific feedback."],
    tradeoffs: "[MOCK] Trade-off analysis appears here with a real key.",
    whatToLearnNext: ["Set up your API key", "Re-run this task to see real review output"],
    weakAreaTags: ["edge-cases"],
    noteTitle: `Note: ${task.title}`,
    noteMarkdown:
      "## [MOCK] Sample note\n\nWith a real API key, this note distills the durable lesson from your review so you can archive and memorize it.",
  };
}
