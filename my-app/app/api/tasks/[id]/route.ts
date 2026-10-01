import { NextRequest, NextResponse } from "next/server";
import { getUserId, notLoggedInResponse } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

// /api/tasks/5 -> params resolves to { id: "5" }
type RouteContext = { params: Promise<{ id: string }> };

// optional = may be omitted, nullable = null clears it
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  category: z.string().max(100).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

async function getTaskId({ params }: RouteContext) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed)) return null;
  return parsed;
}

function invalidIdResponse() {
  return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getUserId(request);
  if (!userId) return notLoggedInResponse();
  const taskId = await getTaskId(context);
  if (taskId === null) return invalidIdResponse();

  try {
    const body = await request.json();

    // safeParse returns a result instead of throwing
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { dueDate, ...rest } = validation.data;

    // undefined = unchanged, null = clear, string = Date
    const dueDateUpdate = dueDate ? new Date(dueDate) : dueDate;

    // someone else's task counts as not found
    const updatedTask = await prisma.task.update({
      where: { id: taskId, userId },
      data: {
        ...rest,
        dueDate: dueDateUpdate,
      },
    });

    return NextResponse.json(updatedTask);
  }

  catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }

}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = getUserId(request);
  if (!userId) return notLoggedInResponse();
  const taskId = await getTaskId(context);
  if (taskId === null) return invalidIdResponse();

  try {
    await prisma.task.delete({ where: { id: taskId, userId } });
    return NextResponse.json({ success: true });
  }

  catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }

}
