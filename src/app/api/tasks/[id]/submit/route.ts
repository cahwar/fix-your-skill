import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { reviewSubmission } from "@/lib/anthropic";
import { parseJsonArray, reviewToDTO } from "@/lib/mappers";
import type { RubricItem } from "@/lib/schemas";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "");

  const task = await prisma.task.findUnique({
    where: { id },
    include: { profile: true },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  try {
    const result = await reviewSubmission(
      {
        title: task.title,
        taskType: task.taskType,
        language: task.language,
        statement: task.statement,
        constraints: parseJsonArray(task.constraints),
        rubric: parseJsonArray<RubricItem>(task.rubric),
      },
      code,
      task.profile.stack,
      task.profile.language,
    );

    const submission = await prisma.submission.create({
      data: { taskId: task.id, code },
    });

    const review = await prisma.review.create({
      data: {
        submissionId: submission.id,
        verdict: result.verdict,
        scorePercent: result.scorePercent,
        payload: JSON.stringify(result),
      },
    });

    // Save the distilled note to the archive.
    await prisma.note.create({
      data: {
        taskId: task.id,
        title: result.noteTitle,
        content: result.noteMarkdown,
        tags: JSON.stringify(result.weakAreaTags),
      },
    });

    // Adapt the profile: merge new weak-area tags (keep most recent, cap at 12).
    const current = parseJsonArray(task.profile.weakAreas);
    const merged = Array.from(
      new Set([...result.weakAreaTags, ...current]),
    ).slice(0, 12);
    await prisma.profile.update({
      where: { id: task.profileId },
      data: { weakAreas: JSON.stringify(merged) },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "reviewed" },
    });

    return NextResponse.json({ review: reviewToDTO(review) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
