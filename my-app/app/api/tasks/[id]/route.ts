import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod"; // validates the request body

// Second argument Next.js passes to every handler in this folder.
// `params` holds the [id] part of the URL (e.g. /api/tasks/5 -> { id: "5" }) and is a Promise in this Next.js version.
type RouteContext = { params: Promise<{ id: string }> };

// Shape a PATCH body must match. Every field is optional so a client can send only what changed.
// `.nullable()` lets category, dueDate and userId be cleared by sending null.
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  category: z.string().max(100).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(), // ISO 8601 string, converted to a Date before saving
  userId: z.number().nullable().optional(),
});

// Accepts: the route context (see RouteContext above)
// Returns: the task id as an integer, or null if the URL segment isn't a whole number
async function getTaskId( {params}: RouteContext ) {
  const { id } = await params;
  const parsed = Number(id);
  return Number.isInteger(parsed) ? parsed : null;
}

// Shared 400 response for a bad id
const invalidIdResponse = () =>
  NextResponse.json({ error: "Invalid task id" }, { status: 400 });

// PATCH /api/tasks/:id
// Accepts: a JSON body with any fields from updateTaskSchema
// Returns: the updated task (with its user), 400 for a bad id or body, 500 if the update fails
export async function PATCH(request: NextRequest, context: RouteContext) {
  const taskId = await getTaskId(context);
  if (taskId === null) return invalidIdResponse();

  try {
    const validation = updateTaskSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    // dueDate is split out because the database needs a Date, not the ISO string
    const { dueDate, ...rest } = validation.data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        // only touch dueDate if the client sent it; null clears it
        ...(dueDate !== undefined && { dueDate: dueDate && new Date(dueDate) }),
      },
      include: { user: true },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/tasks/:id
// Accepts: nothing in the body, the id comes from the URL
// Returns: { success: true }, 400 for a bad id, 500 if the delete fails
export async function DELETE(request: NextRequest, context: RouteContext) {
  const taskId = await getTaskId(context);
  if (taskId === null) return invalidIdResponse();

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task deletion error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
