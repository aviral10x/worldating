import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, interests, userInterests, likes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const userId = parseInt(id);

    // Get user data
    const user = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's interests
    const userInterestsData = await db.select({
      id: interests.id,
      name: interests.name
    })
    .from(userInterests)
    .innerJoin(interests, eq(userInterests.interestId, interests.id))
    .where(eq(userInterests.userId, userId));

    // Count likes received by this user
    const likesCount = await db.select()
      .from(likes)
      .where(eq(likes.likedId, userId));

    const userData = {
      id: user[0].id,
      name: user[0].name,
      age: user[0].age,
      location: user[0].location,
      bio: user[0].bio,
      avatarUrl: user[0].avatarUrl,
      createdAt: user[0].createdAt,
      updatedAt: user[0].updatedAt,
      interests: userInterestsData,
      likesReceived: likesCount.length
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}