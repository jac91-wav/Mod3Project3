import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  userId: z.number().optional(),
});

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: { user: true },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        category: validation.data.category || null,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null,
        userId: validation.data.userId || null,
      },
      include: { user: true },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
