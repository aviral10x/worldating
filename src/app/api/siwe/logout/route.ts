import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session_token');

    if (sessionCookie) {
      // Delete session from DB
      await db.delete(sessions).where(eq(sessions.token, sessionCookie.value));
    }

    // Build response and clear cookies using response cookies API
    const res = NextResponse.json({ success: true });

    // Determine cookie attributes based on protocol (for local http vs https/preview)
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const isSecure = proto === 'https';
    const sameSite: 'lax' | 'none' = isSecure ? 'none' : 'lax';

    // Clear session cookie
    res.cookies.set('session_token', '', {
      httpOnly: true,
      maxAge: 0,
      sameSite,
      secure: isSecure,
      path: '/',
    });

    // Also clear any pending nonce just in case
    res.cookies.set('siwe_nonce', '', {
      httpOnly: true,
      maxAge: 0,
      sameSite,
      secure: isSecure,
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('POST /api/siwe/logout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}