import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyMessage } from 'viem';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, message, signature, chainId } = body;

    // Validate required fields
    if (!address || !message || !signature || chainId === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: address, message, signature, chainId',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Parse SIWE message to validate components
    const messageLines = message.split('\n');
    let messageAddress = '';
    let messageDomain = '';
    let messageUri = '';
    let messageChainId = '';
    let messageNonce = '';

    for (const line of messageLines) {
      if (line.startsWith('URI: ')) {
        messageUri = line.substring(5);
      } else if (line.startsWith('Chain ID: ')) {
        messageChainId = line.substring(10);
      } else if (line.startsWith('Nonce: ')) {
        messageNonce = line.substring(7);
      } else if (line.includes(' wants you to sign in with your Ethereum account:')) {
        messageDomain = line.split(' wants you to sign in')[0];
      }
    }
    if (messageLines.length > 1) {
      const addressMatch = messageLines[1].match(/0x[a-fA-F0-9]{40}/);
      messageAddress = addressMatch ? addressMatch[0].toLowerCase() : '';
    }

    // Validate message components
    const requestUrl = new URL(request.url);
    const expectedDomain = requestUrl.host;

    if (messageDomain !== expectedDomain) {
      return NextResponse.json({
        error: 'Domain mismatch in SIWE message',
        code: 'DOMAIN_MISMATCH'
      }, { status: 401 });
    }

    if (messageAddress !== normalizedAddress) {
      return NextResponse.json({
        error: 'Address mismatch in SIWE message',
        code: 'ADDRESS_MISMATCH'
      }, { status: 401 });
    }

    if (messageChainId !== chainId.toString()) {
      return NextResponse.json({
        error: 'Chain ID mismatch in SIWE message',
        code: 'CHAIN_ID_MISMATCH'
      }, { status: 401 });
    }

    // Read nonce cookie from the incoming request, but do not hard fail if missing
    const cookieStore = cookies();
    const nonceCookie = cookieStore.get('siwe_nonce');
    if (nonceCookie && messageNonce !== nonceCookie.value) {
      return NextResponse.json({
        error: 'Nonce mismatch in SIWE message',
        code: 'NONCE_MISMATCH'
      }, { status: 401 });
    }

    // Verify signature using viem
    try {
      const isValidSignature = await verifyMessage({
        address: address as `0x${string}`,
        message: message,
        signature: signature as `0x${string}`
      });

      if (!isValidSignature) {
        return NextResponse.json({
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        }, { status: 401 });
      }
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return NextResponse.json({
        error: 'Signature verification failed',
        code: 'SIGNATURE_VERIFICATION_FAILED'
      }, { status: 401 });
    }

    // Upsert user by wallet address
    let user;
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.walletAddress, normalizedAddress))
      .limit(1);

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      const updatedUsers = await db.update(users)
        .set({ updatedAt: Date.now() })
        .where(eq(users.walletAddress, normalizedAddress))
        .returning();
      user = updatedUsers[0];
    } else {
      const shortAddress = `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
      const newUsers = await db.insert(users).values({
        name: shortAddress,
        age: 25,
        location: 'Unknown',
        bio: null,
        avatarUrl: null,
        walletAddress: normalizedAddress,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }).returning();
      user = newUsers[0];
    }

    // Generate session token (32 bytes as base64url)
    const tokenBytes = crypto.randomBytes(32);
    const sessionToken = tokenBytes.toString('base64url');

    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session
    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      createdAt: now,
      expiresAt: expiresAt
    });

    // Prepare response and set cookies
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress
      },
      bearer_token: sessionToken
    });

    // Determine cookie attributes based on protocol
    const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const isSecure = proto === 'https';
    const sameSite: 'lax' | 'none' = isSecure ? 'none' : 'lax';

    // Always clear nonce cookie (if present)
    res.cookies.set('siwe_nonce', '', {
      httpOnly: true,
      maxAge: 0,
      sameSite,
      secure: isSecure,
      path: '/'
    });

    // Set session cookie
    res.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60, // seconds
      sameSite,
      secure: isSecure,
      path: '/'
    });

    return res;

  } catch (error) {
    console.error('POST /api/siwe/verify error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}