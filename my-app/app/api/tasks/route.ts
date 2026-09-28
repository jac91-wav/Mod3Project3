import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

export async function GET() {
  try {
    const tasks = await prisma.task.findMany();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // safeParse returns a result instead of throwing
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { title, description, category, dueDate, tags } = validation.data;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        // empty -> NULL
        category: category || null,
        // ISO string -> Date
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags ?? [],
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
