import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailyPicks, users } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

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

    const today = new Date().toISOString().split('T')[0];

    const picks = await db
      .select({
        id: dailyPicks.id,
        score: dailyPicks.score,
        pickedForDate: dailyPicks.pickedForDate,
        user: {
          id: users.id,
          name: users.name,
          age: users.age,
          location: users.location,
          bio: users.bio,
          avatarUrl: users.avatarUrl
        }
      })
      .from(dailyPicks)
      .innerJoin(users, eq(dailyPicks.pickUserId, users.id))
      .where(
        and(
          eq(dailyPicks.userId, parseInt(userId)),
          eq(dailyPicks.pickedForDate, today)
        )
      )
      .orderBy(desc(dailyPicks.score));

    return NextResponse.json(picks);
  } catch (error) {
    console.error('GET /api/daily-picks error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}