import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  // bcrypt ignores bytes past 72
  password: z.string().min(8).max(72),
});

const COOKIE = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // a week, in seconds

function sign(value: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

// cookie = "userId.expiresAt.signature"; changing either number breaks the signature
// ponytail: stateless, so logging out can't revoke a copied cookie before it expires; add a Session table if that matters
export function startSession(response: NextResponse, userId: number) {
  const value = `${userId}.${Date.now() + MAX_AGE * 1000}`;
  response.cookies.set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
  return response;
}

export function endSession(response: NextResponse) {
  response.cookies.delete(COOKIE);
  return response;
}

// logged-in user's id, or null
export function getUserId(request: NextRequest) {
  const [userId, expiresAt, signature] = request.cookies.get(COOKIE)?.value.split(".") ?? [];
  if (!signature) return null;

  const expected = Buffer.from(sign(`${userId}.${expiresAt}`));
  const given = Buffer.from(signature);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  if (Number(expiresAt) < Date.now()) return null;

  return Number(userId);
}

export function notLoggedInResponse() {
  return NextResponse.json({ error: "Not logged in" }, { status: 401 });
}
