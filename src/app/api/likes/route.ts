import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, likes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate userId parameter
    if (!userIdParam || isNaN(parseInt(userIdParam))) {
      return NextResponse.json({ 
        error: 'Valid userId parameter is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    const userId = parseInt(userIdParam);
    
    // Parse and validate limit (default 50, max 100)
    let limit = 50;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json({ 
          error: 'Limit must be a positive integer',
          code: 'INVALID_LIMIT'
        }, { status: 400 });
      }
      limit = Math.min(parsedLimit, 100);
    }

    // Parse and validate offset (default 0)
    let offset = 0;
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json({ 
          error: 'Offset must be a non-negative integer',
          code: 'INVALID_OFFSET'
        }, { status: 400 });
      }
      offset = parsedOffset;
    }

    // Check if the target user exists
    const [targetUser] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Get users who liked the target user
    const likersResult = await db
      .select({
        id: users.id,
        name: users.name,
        age: users.age,
        location: users.location,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        likedAt: likes.createdAt
      })
      .from(likes)
      .innerJoin(users, eq(likes.likerId, users.id))
      .where(eq(likes.likedId, userId))
      .orderBy(desc(likes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(likersResult);

  } catch (error) {
    console.error('GET likes error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { likerId, likedId } = body;

    // Validate input
    if (!likerId || typeof likerId !== 'number') {
      return NextResponse.json({ 
        error: 'Valid likerId is required',
        code: 'INVALID_LIKER_ID'
      }, { status: 400 });
    }

    if (!likedId || typeof likedId !== 'number') {
      return NextResponse.json({ 
        error: 'Valid likedId is required',
        code: 'INVALID_LIKED_ID'
      }, { status: 400 });
    }

    // Prevent self-liking
    if (likerId === likedId) {
      return NextResponse.json({ 
        error: 'Self-liking is not allowed',
        code: 'SELF_LIKE_NOT_ALLOWED'
      }, { status: 400 });
    }

    // Validate user IDs exist
    const [liker] = await db.select()
      .from(users)
      .where(eq(users.id, likerId))
      .limit(1);

    if (!liker) {
      return NextResponse.json({ 
        error: 'Liker user not found',
        code: 'LIKER_NOT_FOUND'
      }, { status: 404 });
    }

    const [likedUser] = await db.select()
      .from(users)
      .where(eq(users.id, likedId))
      .limit(1);

    if (!likedUser) {
      return NextResponse.json({ 
        error: 'Liked user not found',
        code: 'LIKED_USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Insert like record (idempotent due to unique constraint)
    const likeRecord = await db.insert(likes)
      .values({
        likerId,
        likedId,
        createdAt: Date.now()
      })
      .returning();

    // Check if reciprocal like exists
    const [reciprocalLike] = await db.select()
      .from(likes)
      .where(
        and(
          eq(likes.likerId, likedId),
          eq(likes.likedId, likerId)
        )
      )
      .limit(1);

    const isMatch = !!reciprocalLike;

    return NextResponse.json({
      success: true,
      match: isMatch
    }, { status: 201 });

  } catch (error) {
    console.error('POST likes error:', error);
    
    // Handle unique constraint violation (like already exists)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      // Get the existing like to check for match
      const body = await request.json();
      const { likerId, likedId } = body;

      try {
        const [reciprocalLike] = await db.select()
          .from(likes)
          .where(
            and(
              eq(likes.likerId, likedId),
              eq(likes.likedId, likerId)
            )
          )
          .limit(1);

        const isMatch = !!reciprocalLike;

        return NextResponse.json({
          success: true,
          match: isMatch
        }, { status: 201 });
      } catch (matchError) {
        console.error('Check match error:', matchError);
        return NextResponse.json({ 
          error: 'Internal server error while checking match',
          code: 'MATCH_CHECK_ERROR'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}