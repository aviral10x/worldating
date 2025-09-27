import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, likes, conversations, messages } from '@/db/schema';
import { eq, and, or, asc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { senderId, recipientId, body } = await request.json();

    // Validate senderId
    if (!senderId || isNaN(parseInt(senderId))) {
      return NextResponse.json({ 
        error: "Valid sender ID is required",
        code: "INVALID_SENDER_ID" 
      }, { status: 400 });
    }

    // Validate recipientId
    if (!recipientId || isNaN(parseInt(recipientId))) {
      return NextResponse.json({ 
        error: "Valid recipient ID is required",
        code: "INVALID_RECIPIENT_ID" 
      }, { status: 400 });
    }

    // Validate senderId != recipientId
    if (parseInt(senderId) === parseInt(recipientId)) {
      return NextResponse.json({ 
        error: "Sender and recipient cannot be the same user",
        code: "SAME_USER" 
      }, { status: 400 });
    }

    // Validate body
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({ 
        error: "Message body is required",
        code: "MISSING_BODY" 
      }, { status: 400 });
    }

    if (body.length > 1000) {
      return NextResponse.json({ 
        error: "Message body cannot exceed 1000 characters",
        code: "BODY_TOO_LONG" 
      }, { status: 400 });
    }

    const senderIdInt = parseInt(senderId);
    const recipientIdInt = parseInt(recipientId);

    // Validate sender exists
    const sender = await db.select()
      .from(users)
      .where(eq(users.id, senderIdInt))
      .limit(1);

    if (sender.length === 0) {
      return NextResponse.json({ 
        error: "Sender not found",
        code: "SENDER_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate recipient exists
    const recipient = await db.select()
      .from(users)
      .where(eq(users.id, recipientIdInt))
      .limit(1);

    if (recipient.length === 0) {
      return NextResponse.json({ 
        error: "Recipient not found",
        code: "RECIPIENT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate mutual match exists
    const senderLikesRecipient = await db.select()
      .from(likes)
      .where(and(
        eq(likes.likerId, senderIdInt),
        eq(likes.likedId, recipientIdInt)
      ))
      .limit(1);

    const recipientLikesSender = await db.select()
      .from(likes)
      .where(and(
        eq(likes.likerId, recipientIdInt),
        eq(likes.likedId, senderIdInt)
      ))
      .limit(1);

    if (senderLikesRecipient.length === 0 || recipientLikesSender.length === 0) {
      return NextResponse.json({ 
        error: "No mutual match found between users",
        code: "NOT_MUTUAL_MATCH" 
      }, { status: 403 });
    }

    // Sort IDs for conversation (userOneId should be smaller)
    const userOneId = Math.min(senderIdInt, recipientIdInt);
    const userTwoId = Math.max(senderIdInt, recipientIdInt);
    const now = Date.now();

    // Upsert conversation
    let conversationId: number;
    
    // Check if conversation already exists
    const existingConversation = await db.select()
      .from(conversations)
      .where(and(
        eq(conversations.userOneId, userOneId),
        eq(conversations.userTwoId, userTwoId)
      ))
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
        .returning();
      conversationId = newConversation[0].id;
    }

    // Insert message
    const newMessage = await db.insert(messages)
      .values({
        conversationId,
        senderId: senderIdInt,
        body: body.trim(),
        createdAt: now
      })
      .returning();

    return NextResponse.json({
      success: true,
      conversationId,
      messageId: newMessage[0].id
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');
    const markRead = searchParams.get('markRead') === 'true';

    // Validate conversationId
    if (!conversationId || isNaN(parseInt(conversationId))) {
      return NextResponse.json({ 
        error: "Valid conversation ID is required",
        code: "INVALID_CONVERSATION_ID" 
      }, { status: 400 });
    }

    // Validate userId
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const conversationIdInt = parseInt(conversationId);
    const userIdInt = parseInt(userId);

    // Validate conversation exists
    const conversation = await db.select()
      .from(conversations)
      .where(eq(conversations.id, conversationIdInt))
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ 
        error: "Conversation not found",
        code: "CONVERSATION_NOT_FOUND" 
      }, { status: 404 });
    }

    // Validate user is a participant
    const conv = conversation[0];
    if (conv.userOneId !== userIdInt && conv.userTwoId !== userIdInt) {
      return NextResponse.json({ 
        error: "User is not a participant in this conversation",
        code: "NOT_CONVERSATION_PARTICIPANT" 
      }, { status: 403 });
    }

    // Mark messages as read if requested
    if (markRead) {
      const now = Date.now();
      await db.update(messages)
        .set({ readAt: now })
        .where(and(
          eq(messages.conversationId, conversationIdInt),
          eq(messages.readAt, null),
          // Only mark messages from other user as read
          eq(messages.senderId, conv.userOneId === userIdInt ? conv.userTwoId : conv.userOneId)
        ));
    }

    // Get messages ordered by createdAt ASC
    const messageList = await db.select({
      id: messages.id,
      senderId: messages.senderId,
      body: messages.body,
      createdAt: messages.createdAt,
      readAt: messages.readAt
    })
      .from(messages)
      .where(eq(messages.conversationId, conversationIdInt))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json(messageList, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}