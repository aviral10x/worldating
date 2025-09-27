import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { likes, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId parameter is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const userIdInt = parseInt(userId);

    // Find mutual matches using a join query
    const matches = await db
      .select({
        id: users.id,
        name: users.name,
        age: users.age,
        location: users.location,
        bio: users.bio,
        avatarUrl: users.avatarUrl,
        matchedAt: sql`MIN(${likes.createdAt}, match_likes.created_at)`.as('matchedAt')
      })
      .from(likes)
      .innerJoin(
        sql`likes AS match_likes ON ${likes.likedId} = match_likes.liker_id AND ${likes.likerId} = match_likes.liked_id`,
      )
      .innerJoin(users, eq(users.id, likes.likedId))
      .where(eq(likes.likerId, userIdInt))
      .groupBy(users.id);

    return NextResponse.json(matches);
  } catch (error) {
    console.error('GET /api/matches error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}