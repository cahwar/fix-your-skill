import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Single-user MVP: wipe ALL data (profiles, tasks, submissions, reviews, notes).
// Deleting profiles cascades to tasks → submissions → reviews, but Notes use
// onDelete: SetNull, so they must be cleared explicitly.
export async function POST() {
  await prisma.$transaction([
    prisma.note.deleteMany(),
    prisma.review.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.task.deleteMany(),
    prisma.profile.deleteMany(),
  ]);
  return NextResponse.json({ ok: true });
}
