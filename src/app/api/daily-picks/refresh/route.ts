import { NextRequest, NextResponse } from "next/server";
import { db } from '@/db';
import { users, userInterests, dailyPicks } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Validate user exists
    const [targetUser] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get target user's interests
    const targetUserInterests = await db.select()
      .from(userInterests)
      .where(eq(userInterests.userId, userId));
    
    const targetInterestIds = new Set(targetUserInterests.map(ui => ui.interestId));

    // Get all other users with their interests
    const otherUsers = await db.select()
      .from(users)
      .where(ne(users.id, userId));

    const candidatesWithScores: Array<{userId: number, score: number}> = [];

    // Calculate Jaccard similarity for each candidate
    for (const candidate of otherUsers) {
      const candidateInterests = await db.select()
        .from(userInterests)
        .where(eq(userInterests.userId, candidate.id));
      
      const candidateInterestIds = new Set(candidateInterests.map(ui => ui.interestId));
      
      // Calculate Jaccard similarity
      const intersection = new Set([...targetInterestIds].filter(x => candidateInterestIds.has(x)));
      const union = new Set([...targetInterestIds, ...candidateInterestIds]);
      
      const score = union.size > 0 ? intersection.size / union.size : 0;
      
      candidatesWithScores.push({
        userId: candidate.id,
        score: score
      });
    }

    // Sort by score descending and take top candidates with score > 0
    const topCandidates = candidatesWithScores
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // If we have fewer than 10 candidates with score > 0, fill with random users with score 0
    if (topCandidates.length < 10) {
      const remainingCandidates = candidatesWithScores
        .filter(c => c.score === 0)
        .sort(() => Math.random() - 0.5)
        .slice(0, 10 - topCandidates.length)
        .map(c => ({ ...c, score: 0 }));
      
      topCandidates.push(...remainingCandidates);
    }

    // Delete existing picks for today for this user
    await db.delete(dailyPicks)
      .where(
        and(
          eq(dailyPicks.userId, userId),
          eq(dailyPicks.pickedForDate, today)
        )
      );

    // Insert new picks for today
    if (topCandidates.length > 0) {
      const picksToInsert = topCandidates.map(candidate => ({
        userId: userId,
        pickUserId: candidate.userId,
        score: candidate.score,
        pickedForDate: today,
        createdAt: Date.now()
      }));

      await db.insert(dailyPicks).values(picksToInsert);
    }

    return NextResponse.json({
      success: true,
      count: topCandidates.length
    });

  } catch (error) {
    console.error('POST /api/daily-picks/refresh error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}