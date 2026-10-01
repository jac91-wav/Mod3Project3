import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/app/lib/auth";

// logged-out page visits go to /login; API routes check the session themselves
export function proxy(request: NextRequest) {
  if (getUserId(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico).*)"],
};
