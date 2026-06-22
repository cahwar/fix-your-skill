import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const notes = await prisma.note.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { content: { contains: q } },
            { tags: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      taskId: n.taskId,
      title: n.title,
      content: n.content,
      tags: (() => {
        try {
          return JSON.parse(n.tags) as string[];
        } catch {
          return [];
        }
      })(),
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
