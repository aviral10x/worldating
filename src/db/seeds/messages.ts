import { db } from '@/db';
import { messages, conversations } from '@/db/schema';

async function main() {
    // First, get all existing conversations
    const existingConversations = await db.select().from(conversations);
    
    if (existingConversations.length === 0) {
        console.log('⚠️ No conversations found. Please run conversations seeder first.');
        return;
    }

    const messageTemplates = [
        "Hey! How's your day going?",
        "Hi there! Pretty good, just finished work. How about you?",
        "Same here! Love your photos btw. That hiking one looks amazing!",
        "Thanks! That was from my trip to Yosemite last month. Do you like hiking too?",
        "Yes! I go almost every weekend. We should go together sometime",
        "That sounds awesome! I'd love to",
        "What's your favorite hiking spot around here?",
        "I really like the trails up in the mountains. Great views!",
        "Nice! I've been meaning to check those out",
        "We should definitely plan something soon",
        "How was your weekend?",
        "Really good! Went to that new coffee shop downtown",
        "Oh I've heard great things about that place!",
        "Yeah the atmosphere is really cozy. Perfect for reading",
        "I love a good coffee shop. Maybe we could check it out together?",
        "That would be great! When are you free this week?",
        "How about Friday evening?",
        "Perfect! Looking forward to it",
        "What kind of music are you into?",
        "I love indie rock and some electronic stuff. You?",
        "Similar taste! Have you heard the new album from...",
        "Not yet, but I'll definitely check it out",
        "You should! I think you'd really like it",
        "Thanks for the recommendation!",
        "Hope you're having a good week",
        "Thanks! You too. Work has been pretty busy",
        "I hear you. What do you do again?",
        "I'm in marketing. It's interesting but can be hectic",
        "That sounds really cool actually",
        "Yeah, I enjoy the creative side of it"
    ];

    const allMessages = [];

    for (const conversation of existingConversations) {
        const messageCount = Math.floor(Math.random() * 6) + 3; // 3-8 messages
        const conversationStartTime = conversation.createdAt;
        const participants = [conversation.userOneId, conversation.userTwoId];
        
        for (let i = 0; i < messageCount; i++) {
            const senderId = participants[i % 2]; // Alternate between participants
            const messageTime = conversationStartTime + (i * 3600000) + Math.floor(Math.random() * 1800000); // Add 1-2.5 hours between messages
            const isRead = Math.random() < 0.7; // 70% chance of being read
            const readTime = isRead ? messageTime + Math.floor(Math.random() * 3600000) : null; // Read within 1 hour if read
            
            const message = {
                conversationId: conversation.id,
                senderId: senderId,
                body: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
                createdAt: messageTime,
                readAt: readTime
            };
            
            allMessages.push(message);
        }
    }

    await db.insert(messages).values(allMessages);
    
    console.log(`✅ Messages seeder completed successfully. Created ${allMessages.length} messages for ${existingConversations.length} conversations.`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});