import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod"; //validation checking

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  category: z.string().max(100).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  userId: z.number().nullable().optional(),
});

function parseId(id: string) {
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseId(id);
  
  if (taskId === null) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = updateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { dueDate, ...rest } = validation.data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(dueDate !== undefined && {
          dueDate: dueDate === null ? null : new Date(dueDate),
        }),
      },
      include: { user: true },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const taskId = parseId(id);
  if (taskId === null) {
    return NextResponse.json({ error: "Invalid task id" }, { status: 400 });
  }

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
