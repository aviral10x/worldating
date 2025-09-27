import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, interests, userInterests, likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    // Validate address parameter
    if (!address) {
      return NextResponse.json({ 
        error: "Address parameter is required",
        code: "MISSING_ADDRESS" 
      }, { status: 400 });
    }

    if (typeof address !== 'string') {
      return NextResponse.json({ 
        error: "Address must be a string",
        code: "INVALID_ADDRESS_TYPE" 
      }, { status: 400 });
    }

    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();

    // Find user by worldAddress
    const userResult = await db.select()
      .from(users)
      .where(eq(users.worldAddress, normalizedAddress))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const user = userResult[0];

    // Get user's interests
    const userInterestsResult = await db.select({
      id: interests.id,
      name: interests.name
    })
      .from(userInterests)
      .innerJoin(interests, eq(userInterests.interestId, interests.id))
      .where(eq(userInterests.userId, user.id));

    // Get likes received count
    const likesReceivedResult = await db.select({
      count: sql<number>`count(*)`
    })
      .from(likes)
      .where(eq(likes.likedId, user.id));

    const likesReceived = likesReceivedResult[0]?.count || 0;

    // Return user data with interests and likesReceived count
    return NextResponse.json({
      ...user,
      interests: userInterestsResult,
      likesReceived
    });

  } catch (error) {
    console.error('GET /api/users/by-world error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}