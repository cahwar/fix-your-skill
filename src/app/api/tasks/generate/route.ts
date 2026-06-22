import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateTask } from "@/lib/anthropic";
import { parseJsonArray, taskToDTO } from "@/lib/mappers";
import type { TaskType } from "@/lib/schemas";

const TASK_TYPES: TaskType[] = ["mini-feature", "system-design", "debug-refactor"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  let taskType = body.taskType as TaskType | undefined;
  if (!taskType || !TASK_TYPES.includes(taskType)) {
    // Default rotation: pick based on count so the user gets variety.
    const count = await prisma.task.count();
    taskType = TASK_TYPES[count % TASK_TYPES.length];
  }

  const profile = await prisma.profile.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Create a profile first." },
      { status: 400 },
    );
  }

  try {
    const generated = await generateTask(
      {
        stack: profile.stack,
        level: profile.level,
        goals: profile.goals,
        weakAreas: parseJsonArray(profile.weakAreas),
      },
      taskType,
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
      },
    });

    return NextResponse.json({ task: taskToDTO(task) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
