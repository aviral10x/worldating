import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session_token");

    // Fallback to Authorization: Bearer <token>
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.split(" ")[1] : null;

    const token = sessionCookie?.value || bearerToken || null;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const now = Date.now();

    const rows = await db
      .select({
        sessionId: sessions.id,
        sessionExpiresAt: sessions.expiresAt,
        userId: users.id,
        walletAddress: users.walletAddress,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    const s = rows[0];

    if (s.sessionExpiresAt <= now) {
      await db.delete(sessions).where(eq(sessions.id, s.sessionId));
      return NextResponse.json({ user: null });
    }

    // Prepare response
    const res = NextResponse.json({
      user: { id: s.userId, walletAddress: s.walletAddress },
    });

    // If authenticated via bearer (no cookie), set cookie to persist session
    if (!sessionCookie && bearerToken) {
      const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "");
      const isSecure = proto === "https";
      const sameSite: "lax" | "none" = isSecure ? "none" : "lax";
      res.cookies.set("session_token", bearerToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        sameSite,
        secure: isSecure,
        path: "/",
      });
    }

    return res;
  } catch (error) {
    console.error("GET /api/session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}