import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod"; // validates the request body

// Shape a POST body must match. title and description are required; the rest are optional.
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(), // ISO 8601 string, converted to a Date before saving
  userId: z.number().optional(),
});

// GET /api/tasks
// Accepts: nothing
// Returns: every task (each with its user), or 500 if the database call fails
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({ include: { user: true } });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks
// Accepts: a JSON body matching createTaskSchema
// Returns: the new task (201), 400 if the body is invalid, or 500 if saving fails
export async function POST(request: NextRequest) {
  try {
    const validation = createTaskSchema.safeParse(await request.json());
    
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { title, description, category, dueDate, userId } = validation.data;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        // optional fields become null (empty in the database) when missing or empty
        category: category || null,
        dueDate: dueDate ? new Date(dueDate) : null, // the database needs a Date, not the ISO string
        userId: userId || null,
      },
      include: { user: true },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
