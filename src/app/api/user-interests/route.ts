import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, interests, userInterests } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, interestIds } = body;

    // Validate input data
    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ 
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    if (!interestIds || !Array.isArray(interestIds) || interestIds.length === 0) {
      return NextResponse.json({ 
        error: 'Valid interestIds array is required',
        code: 'INVALID_INTEREST_IDS'
      }, { status: 400 });
    }

    // Validate that all interestIds are numbers
    if (!interestIds.every(id => typeof id === 'number')) {
      return NextResponse.json({ 
        error: 'All interestIds must be numbers',
        code: 'INVALID_INTEREST_ID_FORMAT'
      }, { status: 400 });
    }

    // Check if user exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    // Check if all interests exist
    const existingInterests = await db.select()
      .from(interests)
      .where(inArray(interests.id, interestIds));

    if (existingInterests.length !== interestIds.length) {
      return NextResponse.json({ 
        error: 'One or more interests not found',
        code: 'INTERESTS_NOT_FOUND'
      }, { status: 404 });
    }

    // Start transaction to ensure atomic operations
    await db.transaction(async (tx) => {
      // Delete existing user interests for this user
      await tx.delete(userInterests)
        .where(eq(userInterests.userId, userId));

      // Insert new user interests
      if (interestIds.length > 0) {
        await tx.insert(userInterests)
          .values(
            interestIds.map(interestId => ({
              userId,
              interestId
            }))
          );
      }
    });

    return NextResponse.json({
      success: true,
      count: interestIds.length
    }, { status: 200 });

  } catch (error) {
    console.error('POST user interests error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}