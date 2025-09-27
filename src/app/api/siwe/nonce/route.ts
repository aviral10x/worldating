import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Generate 96-bit (12 bytes) random nonce encoded as base64url
    const nonceBytes = crypto.randomBytes(12);
    const nonce = nonceBytes.toString('base64url');
    
    // Determine cookie attributes based on protocol (iframe previews may require None+Secure)
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const isSecure = proto === 'https';
    const sameSite: 'lax' | 'none' = isSecure ? 'none' : 'lax';

    // Use response cookies to set the nonce (ensures Set-Cookie header is sent)
    const res = NextResponse.json({ nonce });
    res.cookies.set('siwe_nonce', nonce, {
      httpOnly: true,
      maxAge: 600, // 10 minutes
      sameSite,
      secure: isSecure,
      path: '/'
    });
    
    return res;
  } catch (error) {
    console.error('GET /api/siwe/nonce error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}