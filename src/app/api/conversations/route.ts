import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { conversations, users, messages } from '@/db/schema';
import { eq, or, and, desc, count, sql, isNull, ne } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Validate userId parameter
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId parameter is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const userIdInt = parseInt(userId);

    // First, get all conversations where user is a participant
    const userConversations = await db
      .select({
        conversationId: conversations.id,
        userOneId: conversations.userOneId,
        userTwoId: conversations.userTwoId,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.userOneId, userIdInt),
          eq(conversations.userTwoId, userIdInt)
        )
      )
      .orderBy(desc(conversations.updatedAt));

    if (userConversations.length === 0) {
      return NextResponse.json([]);
    }

    // Build the response with other user info, last message, and unread count
    const conversationData = await Promise.all(
      userConversations.map(async (conversation) => {
        // Determine the other user's ID
        const otherUserId = conversation.userOneId === userIdInt 
          ? conversation.userTwoId 
          : conversation.userOneId;

        // Get other user's profile info
        const otherUserResult = await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        if (otherUserResult.length === 0) {
          return null; // Skip this conversation if other user not found
        }

        const otherUser = otherUserResult[0];

        // Get the last message for this conversation
        const lastMessageResult = await db
          .select({
            body: messages.body,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, conversation.conversationId))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const lastMessage = lastMessageResult.length > 0 ? lastMessageResult[0] : null;

        // Calculate unread count (messages where readAt is null and senderId != userId)
        const unreadCountResult = await db
          .select({ count: count() })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversation.conversationId),
              isNull(messages.readAt),
              ne(messages.senderId, userIdInt)
            )
          );

        const unreadCount = unreadCountResult[0]?.count || 0;

        return {
          conversationId: conversation.conversationId,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            avatarUrl: otherUser.avatarUrl,
          },
          lastMessage: lastMessage ? {
            body: lastMessage.body,
            createdAt: lastMessage.createdAt,
          } : null,
          unreadCount,
        };
      })
    );

    // Filter out any null conversations and return
    const validConversations = conversationData.filter(conv => conv !== null);

    return NextResponse.json(validConversations);

  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}