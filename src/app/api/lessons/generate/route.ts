import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateLesson } from "@/lib/anthropic";
import { parseJsonArray, taskToDTO } from "@/lib/mappers";
import type { LessonFocus } from "@/lib/schemas";

const FOCUSES: LessonFocus[] = [
  "applied-skill",
  "algorithms-data-structures",
  "stack-idioms",
  "weak-areas",
];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  // focus: one of the concrete focuses, or "auto" (the model picks). Anything
  // unrecognized falls back to "auto".
  const rawFocus = body.focus as string | undefined;
  const focus: LessonFocus | "auto" = FOCUSES.includes(rawFocus as LessonFocus)
    ? (rawFocus as LessonFocus)
    : "auto";
  const topic =
    typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : undefined;

  const profile = await prisma.profile.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!profile) {
    return NextResponse.json({ error: "Create a profile first." }, { status: 400 });
  }

  try {
    const { lesson, task: generated } = await generateLesson(
      {
        stack: profile.stack,
        level: profile.level,
        goals: profile.goals,
        weakAreas: parseJsonArray(profile.weakAreas),
        language: profile.language,
      },
      focus,
      topic,
    );

    const task = await prisma.task.create({
      data: {
        profileId: profile.id,
        title: generated.title,
        taskType: generated.taskType,
        language: generated.language,
        statement: generated.statement,
        constraints: JSON.stringify(generated.constraints),
        starterCode: generated.starterCode,
        rubric: JSON.stringify(generated.rubric),
        hints: JSON.stringify(generated.hints),
        testable: generated.testable,
        lesson: JSON.stringify(lesson),
      },
    });

    return NextResponse.json({ task: taskToDTO(task) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
