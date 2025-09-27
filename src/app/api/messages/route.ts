import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, likes, conversations, messages } from '@/db/schema';
import { eq, and, or, asc, isNull, ne } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { senderId, recipientId, body } = await request.json();

    // Validate senderId
    if (!senderId || typeof senderId !== 'number') {
      return NextResponse.json({
        error: 'Valid sender ID is required',
        code: 'INVALID_SENDER_ID'
      }, { status: 400 });
    }

    // Validate recipientId
    if (!recipientId || typeof recipientId !== 'number') {
      return NextResponse.json({
        error: 'Valid recipient ID is required',
        code: 'INVALID_RECIPIENT_ID'
      }, { status: 400 });
    }

    // Validate senderId != recipientId
    if (senderId === recipientId) {
      return NextResponse.json({
        error: 'Sender and recipient cannot be the same user',
        code: 'SAME_USER'
      }, { status: 400 });
    }

    // Validate body
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({
        error: 'Message body is required',
        code: 'MISSING_BODY'
      }, { status: 400 });
    }

    if (body.trim().length > 1000) {
      return NextResponse.json({
        error: 'Message body cannot exceed 1000 characters',
        code: 'BODY_TOO_LONG'
      }, { status: 400 });
    }

    // Validate sender exists
    const senderExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    if (senderExists.length === 0) {
      return NextResponse.json({
        error: 'Sender not found',
        code: 'SENDER_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate recipient exists
    const recipientExists = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1);

    if (recipientExists.length === 0) {
      return NextResponse.json({
        error: 'Recipient not found',
        code: 'RECIPIENT_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate mutual match exists
    const senderLikesRecipient = await db.select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.likerId, senderId), eq(likes.likedId, recipientId)))
      .limit(1);

    const recipientLikesSender = await db.select({ id: likes.id })
      .from(likes)
      .where(and(eq(likes.likerId, recipientId), eq(likes.likedId, senderId)))
      .limit(1);

    if (senderLikesRecipient.length === 0 || recipientLikesSender.length === 0) {
      return NextResponse.json({
        error: 'Mutual match required to send messages',
        code: 'NOT_MUTUAL_MATCH'
      }, { status: 403 });
    }

    // Determine userOneId (smaller) and userTwoId (larger)
    const userOneId = Math.min(senderId, recipientId);
    const userTwoId = Math.max(senderId, recipientId);
    const now = Date.now();

    // Upsert conversation
    let conversationId: number;
    
    const existingConversation = await db.select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.userOneId, userOneId), eq(conversations.userTwoId, userTwoId)))
      .limit(1);

    if (existingConversation.length > 0) {
      // Update existing conversation
      conversationId = existingConversation[0].id;
      await db.update(conversations)
        .set({ updatedAt: now })
        .where(eq(conversations.id, conversationId));
    } else {
      // Create new conversation
      const newConversation = await db.insert(conversations)
        .values({
          userOneId,
          userTwoId,
          createdAt: now,
          updatedAt: now
        })
        .returning({ id: conversations.id });
      conversationId = newConversation[0].id;
    }

    // Insert message
    const newMessage = await db.insert(messages)
      .values({
        conversationId,
        senderId: senderId,
        body: body.trim(),
        createdAt: now
      })
      .returning({ id: messages.id });

    return NextResponse.json({
      success: true,
      conversationId,
      messageId: newMessage[0].id
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationIdParam = url.searchParams.get('conversationId');
    const userIdParam = url.searchParams.get('userId');
    const markRead = url.searchParams.get('markRead') === 'true';

    console.log('GET /api/messages - params:', { conversationIdParam, userIdParam, markRead });

    // Validate conversationId
    if (!conversationIdParam || isNaN(parseInt(conversationIdParam))) {
      return NextResponse.json({
        error: 'Valid conversation ID is required',
        code: 'INVALID_CONVERSATION_ID'
      }, { status: 400 });
    }

    // Validate userId
    if (!userIdParam || isNaN(parseInt(userIdParam))) {
      return NextResponse.json({
        error: 'Valid user ID is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    const conversationId = parseInt(conversationIdParam);
    const userId = parseInt(userIdParam);

    // Check if conversation exists and user is a participant
    const conversation = await db.select({
      id: conversations.id,
      userOneId: conversations.userOneId,
      userTwoId: conversations.userTwoId
    })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({
        error: 'Conversation not found',
        code: 'CONVERSATION_NOT_FOUND'
      }, { status: 404 });
    }

    const { userOneId, userTwoId } = conversation[0];
    
    // Validate user is a participant
    if (userId !== userOneId && userId !== userTwoId) {
      return NextResponse.json({
        error: 'User is not a participant of this conversation',
        code: 'NOT_CONVERSATION_PARTICIPANT'
      }, { status: 403 });
    }

    // Mark messages as read if requested
    if (markRead) {
      await db.update(messages)
        .set({ readAt: Date.now() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            ne(messages.senderId, userId),
            isNull(messages.readAt)
          )
        );
    }

    // Get messages
    const conversationMessages = await db.select({
      id: messages.id,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
      readAt: messages.readAt
    })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(conversationMessages);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}