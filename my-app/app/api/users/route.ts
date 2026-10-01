import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { credentialsSchema, startSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// sign up, and stay logged in
export async function POST(request: NextRequest) {

  try {
    const validation = credentialsSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.create({
      data: { email, passwordHash: await bcrypt.hash(password, 10) },
    });

    return startSession(NextResponse.json({ id: user.id, email: user.email }, { status: 201 }), user.id);
  }

  catch (error) {
    // P2002 = unique constraint, so the email is taken
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }

}
