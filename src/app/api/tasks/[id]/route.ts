import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { taskToDTO, reviewToDTO } from "@/lib/mappers";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      submissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { review: true },
      },
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const latest = task.submissions[0];
  return NextResponse.json({
    task: taskToDTO(task),
    submission: latest ? { code: latest.code } : null,
    review: latest?.review ? reviewToDTO(latest.review) : null,
  });
}
