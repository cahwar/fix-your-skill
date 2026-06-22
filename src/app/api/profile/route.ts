import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/mappers";

// Single-user MVP: the "current" profile is the most recently updated one.
export async function GET() {
  const profile = await prisma.profile.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!profile) return NextResponse.json({ profile: null });
  return NextResponse.json({
    profile: {
      id: profile.id,
      stack: profile.stack,
      level: profile.level,
      goals: profile.goals,
      weakAreas: parseJsonArray(profile.weakAreas),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const stack = String(body.stack ?? "").trim();
  const level = String(body.level ?? "middle").trim();
  const goals = String(body.goals ?? "").trim();

  if (!stack) {
    return NextResponse.json({ error: "Stack is required" }, { status: 400 });
  }

  const existing = await prisma.profile.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const profile = existing
    ? await prisma.profile.update({
        where: { id: existing.id },
        data: { stack, level, goals },
      })
    : await prisma.profile.create({
        data: { stack, level, goals },
      });

  return NextResponse.json({
    profile: {
      id: profile.id,
      stack: profile.stack,
      level: profile.level,
      goals: profile.goals,
      weakAreas: parseJsonArray(profile.weakAreas),
    },
  });
}
