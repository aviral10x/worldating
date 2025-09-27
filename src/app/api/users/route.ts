import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, desc, asc, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    
    let query = db.select({
      id: users.id,
      name: users.name,
      age: users.age,
      location: users.location,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      worldAddress: users.worldAddress,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);
    
    if (search) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.location, `%${search}%`)
        )
      );
    }
    
    const results = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    
    const { name, age, location, bio, avatarUrl, worldAddress, worldUsername } = requestBody;
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ 
        error: 'Name is required and must be a string',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }
    
    if (age === undefined || age === null) {
      return NextResponse.json({ 
        error: 'Age is required',
        code: 'MISSING_AGE'
      }, { status: 400 });
    }
    
    if (typeof age !== 'number' || age < 18 || age > 99 || !Number.isInteger(age)) {
      return NextResponse.json({ 
        error: 'Age must be an integer between 18 and 99',
        code: 'INVALID_AGE'
      }, { status: 400 });
    }
    
    if (!location || typeof location !== 'string') {
      return NextResponse.json({ 
        error: 'Location is required and must be a string',
        code: 'MISSING_LOCATION'
      }, { status: 400 });
    }
    
    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return NextResponse.json({ 
        error: 'Bio must be a string',
        code: 'INVALID_BIO'
      }, { status: 400 });
    }
    
    if (bio && bio.length > 500) {
      return NextResponse.json({ 
        error: 'Bio must be 500 characters or less',
        code: 'BIO_TOO_LONG'
      }, { status: 400 });
    }
    
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
      return NextResponse.json({ 
        error: 'Avatar URL must be a string',
        code: 'INVALID_AVATAR_URL'
      }, { status: 400 });
    }
    
    // Allow data URLs (data:image/*), root-relative uploads (/uploads/...), or full http(s) URLs
    if (avatarUrl && avatarUrl.trim() && !isValidAvatarUrl(avatarUrl)) {
      return NextResponse.json({ 
        error: 'Avatar URL must be a valid image URL, data URL, or /uploads path',
        code: 'INVALID_URL_FORMAT'
      }, { status: 400 });
    }

    // Validate worldAddress and worldUsername
    if (worldAddress !== undefined && worldAddress !== null && typeof worldAddress !== 'string') {
      return NextResponse.json({ 
        error: 'World address must be a string',
        code: 'INVALID_WORLD_ADDRESS'
      }, { status: 400 });
    }

    if (worldUsername !== undefined && worldUsername !== null && typeof worldUsername !== 'string') {
      return NextResponse.json({ 
        error: 'World username must be a string',
        code: 'INVALID_WORLD_USERNAME'
      }, { status: 400 });
    }

    let normalizedWorldAddress = null;
    if (worldAddress && worldAddress.trim()) {
      normalizedWorldAddress = worldAddress.trim().toLowerCase();
      
      // Check if worldAddress is already taken
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.worldAddress, normalizedWorldAddress))
        .limit(1);
      
      if (existingUser.length > 0) {
        return NextResponse.json({ 
          error: 'World address is already taken',
          code: 'WORLD_ADDRESS_TAKEN'
        }, { status: 409 });
      }
    }
    
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const trimmedBio = bio ? bio.trim() : null;
    const trimmedAvatarUrl = avatarUrl ? avatarUrl.trim() : null;
    const trimmedWorldUsername = worldUsername ? worldUsername.trim() : null;
    
    const createdAt = Date.now();
    const updatedAt = createdAt;
    
    const newUser = await db.insert(users).values({
      name: trimmedName,
      age: age,
      location: trimmedLocation,
      bio: trimmedBio,
      avatarUrl: trimmedAvatarUrl || null,
      worldAddress: normalizedWorldAddress,
      worldUsername: trimmedWorldUsername,
      createdAt: createdAt,
      updatedAt: updatedAt
    }).returning();
    
    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }
    
    const requestBody = await request.json();
    const { name, age, location, bio, avatarUrl, worldAddress, worldUsername } = requestBody;
    
    const updates: any = {};
    
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ 
          error: 'Name must be a non-empty string',
          code: 'INVALID_NAME'
        }, { status: 400 });
      }
      updates.name = name.trim();
    }
    
    if (age !== undefined) {
      if (typeof age !== 'number' || age < 18 || age > 99 || !Number.isInteger(age)) {
        return NextResponse.json({ 
          error: 'Age must be an integer between 18 and 99',
          code: 'INVALID_AGE'
        }, { status: 400 });
      }
      updates.age = age;
    }
    
    if (location !== undefined) {
      if (typeof location !== 'string' || !location.trim()) {
        return NextResponse.json({ 
          error: 'Location must be a non-empty string',
          code: 'INVALID_LOCATION'
        }, { status: 400 });
      }
      updates.location = location.trim();
    }
    
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== 'string') {
        return NextResponse.json({ 
          error: 'Bio must be a string',
          code: 'INVALID_BIO'
        }, { status: 400 });
      }
      if (bio && bio.length > 500) {
        return NextResponse.json({ 
          error: 'Bio must be 500 characters or less',
          code: 'BIO_TOO_LONG'
        }, { status: 400 });
      }
      updates.bio = bio.trim();
    }
    
    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && typeof avatarUrl !== 'string') {
        return NextResponse.json({ 
          error: 'Avatar URL must be a string or null',
          code: 'INVALID_AVATAR_URL'
        }, { status: 400 });
      }
      if (avatarUrl && avatarUrl.trim() && !isValidAvatarUrl(avatarUrl)) {
        return NextResponse.json({ 
          error: 'Avatar URL must be a valid image URL, data URL, or /uploads path',
          code: 'INVALID_URL_FORMAT'
        }, { status: 400 });
      }
      updates.avatarUrl = avatarUrl ? avatarUrl.trim() : null;
    }

    // Handle worldUsername updates
    if (worldUsername !== undefined) {
      if (worldUsername !== null && typeof worldUsername !== 'string') {
        return NextResponse.json({ 
          error: 'World username must be a string or null',
          code: 'INVALID_WORLD_USERNAME'
        }, { status: 400 });
      }
      updates.worldUsername = worldUsername ? worldUsername.trim() : null;
    }

    // Handle worldAddress updates with complex business logic
    if (worldAddress !== undefined) {
      if (worldAddress !== null && typeof worldAddress !== 'string') {
        return NextResponse.json({ 
          error: 'World address must be a string or null',
          code: 'INVALID_WORLD_ADDRESS'
        }, { status: 400 });
      }

      // Get current user to check existing worldAddress
      const currentUser = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json({ 
          error: 'User not found' 
        }, { status: 404 });
      }

      const existingWorldAddress = currentUser[0].worldAddress;

      if (worldAddress === null) {
        // Disallow clearing worldAddress if it's currently not null
        if (existingWorldAddress !== null) {
          return NextResponse.json({ 
            error: 'World address cannot be cleared once set',
            code: 'WORLD_ADDRESS_IMMUTABLE'
          }, { status: 400 });
        }
        updates.worldAddress = null;
      } else {
        const normalizedWorldAddress = worldAddress.trim().toLowerCase();
        
        // If user already has a worldAddress and trying to change to different one
        if (existingWorldAddress !== null && existingWorldAddress !== normalizedWorldAddress) {
          return NextResponse.json({ 
            error: 'World address cannot be changed once set',
            code: 'WORLD_ADDRESS_IMMUTABLE'
          }, { status: 400 });
        }

        // If setting for first time or same address, check uniqueness
        if (existingWorldAddress === null || existingWorldAddress === normalizedWorldAddress) {
          const existingUser = await db.select()
            .from(users)
            .where(and(
              eq(users.worldAddress, normalizedWorldAddress),
              eq(users.id, parseInt(id))
            ))
            .limit(1);

          // Check if another user has this address
          if (existingWorldAddress === null) {
            const otherUser = await db.select()
              .from(users)
              .where(eq(users.worldAddress, normalizedWorldAddress))
              .limit(1);

            if (otherUser.length > 0) {
              return NextResponse.json({ 
                error: 'World address is already taken',
                code: 'WORLD_ADDRESS_TAKEN'
              }, { status: 409 });
            }
          }

          updates.worldAddress = normalizedWorldAddress;
        }
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        code: 'NO_UPDATES'
      }, { status: 400 });
    }
    
    updates.updatedAt = Date.now();
    
    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }
    
    const deleted = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();
    
    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully',
      deleted: deleted[0]
    });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidAvatarUrl(value: string): boolean {
  const v = value.trim();
  // Allow data URLs for images
  if (v.startsWith('data:image/')) return true;
  // Allow root-relative uploads path
  if (v.startsWith('/uploads/')) return true;
  // Allow http(s) URLs
  return isValidUrl(v);
}