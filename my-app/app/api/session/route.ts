import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { credentialsSchema, endSession, startSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// log in
export async function POST(request: NextRequest) {

  try {
    const validation = credentialsSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // same reply for unknown email and wrong password
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return startSession(NextResponse.json({ id: user.id, email: user.email }), user.id);
  }

  catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }

}

// log out
export async function DELETE() {
  return endSession(NextResponse.json({ success: true }));
}
