import type { Task, Review } from "@prisma/client";
import type { RubricItem, ReviewResult } from "./schemas";

export function parseJsonArray<T = string>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export interface TaskDTO {
  id: string;
  title: string;
  taskType: string;
  language: string;
  statement: string;
  constraints: string[];
  starterCode: string;
  rubric: RubricItem[];
  hints: string[];
  testable: boolean;
  status: string;
  createdAt: string;
}

export function taskToDTO(t: Task): TaskDTO {
  return {
    id: t.id,
    title: t.title,
    taskType: t.taskType,
    language: t.language,
    statement: t.statement,
    constraints: parseJsonArray(t.constraints),
    starterCode: t.starterCode,
    rubric: parseJsonArray<RubricItem>(t.rubric),
    hints: parseJsonArray(t.hints),
    testable: t.testable,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  };
}

export interface ReviewDTO extends ReviewResult {
  id: string;
  createdAt: string;
}

export function reviewToDTO(r: Review): ReviewDTO {
  const payload = JSON.parse(r.payload) as ReviewResult;
  return { ...payload, id: r.id, createdAt: r.createdAt.toISOString() };
}
