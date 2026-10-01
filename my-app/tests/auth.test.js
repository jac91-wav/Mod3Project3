/** @jest-environment node */
import { NextResponse } from "next/server";
import { getUserId, startSession } from "@/app/lib/auth";

process.env.SESSION_SECRET = "test-secret";

// a request carrying only the session cookie
function requestWith(token) {
  return { cookies: { get: () => (token ? { value: token } : undefined) } };
}

describe("session cookie", () => {
  it("only trusts an untampered, unexpired cookie", () => {
    const token = startSession(NextResponse.json({}), 7).cookies.get("session").value;
    const [, expiresAt, signature] = token.split(".");

    expect(getUserId(requestWith(token))).toBe(7);
    expect(getUserId(requestWith(undefined))).toBeNull();
    // someone edits the user id to read another account
    expect(getUserId(requestWith(`8.${expiresAt}.${signature}`))).toBeNull();

    jest.spyOn(Date, "now").mockReturnValue(Number(expiresAt) + 1);
    expect(getUserId(requestWith(token))).toBeNull();
  });
});
