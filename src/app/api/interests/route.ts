import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { interests } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const allInterests = await db
      .select()
      .from(interests)
      .orderBy(asc(interests.name));

    return NextResponse.json(allInterests);
  } catch (error) {
    console.error('GET interests error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        error: "Name is required and must be a string",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json({ 
        error: "Name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    try {
      const newInterest = await db
        .insert(interests)
        .values({
          name: trimmedName
        })
        .returning();

      return NextResponse.json(newInterest[0], { status: 201 });
    } catch (dbError: any) {
      if (dbError.message?.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ 
          error: "An interest with this name already exists",
          code: "DUPLICATE_NAME" 
        }, { status: 400 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('POST interests error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}