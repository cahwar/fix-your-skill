import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      taskType: true,
      language: true,
      status: true,
      lesson: true,
      createdAt: true,
    },
  });
  return NextResponse.json({
    tasks: tasks.map(({ lesson, ...t }) => ({
      ...t,
      hasLesson: Boolean(lesson),
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
