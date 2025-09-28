import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyPicks, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

    // Validate user exists
    const userExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    const picks = await db
      .select({
        score: dailyPicks.score,
        user: {
          id: users.id,
          name: users.name,
          age: users.age,
          location: users.location,
          bio: users.bio,
          avatarUrl: users.avatarUrl,
          worldAddress: users.worldAddress,
          worldUsername: users.worldUsername,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }
      })
      .from(dailyPicks)
      .innerJoin(users, eq(dailyPicks.pickUserId, users.id))
      .where(
        and(
          eq(dailyPicks.userId, userIdInt),
          eq(dailyPicks.pickedForDate, today)
        )
      )
      .orderBy(desc(dailyPicks.score), desc(dailyPicks.createdAt));

    return NextResponse.json(picks);
  } catch (error) {
    console.error('GET /api/daily-picks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}