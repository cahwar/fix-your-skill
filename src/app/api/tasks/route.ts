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
      createdAt: true,
    },
  });
  return NextResponse.json({
    tasks: tasks.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
}
