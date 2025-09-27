import { db } from '@/db';
import { conversations, likes } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
    // Query to find mutual matches (pairs where both users liked each other)
    const mutualMatches = await db
        .select({
            userOne: likes.likerId,
            userTwo: likes.likedId,
        })
        .from(likes)
        .innerJoin(
            sql`likes AS l2`,
            sql`likes.liked_id = l2.liker_id AND likes.liker_id = l2.liked_id`
        )
        .where(sql`likes.liker_id < likes.liked_id`)
        .limit(5);

    if (mutualMatches.length === 0) {
        console.log('⚠️ No mutual matches found. Please run the likes seeder first.');
        return;
    }

    // Generate timestamps for the last 7 days
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    const sampleConversations = mutualMatches.map((match, index) => {
        // Create conversation timestamps spread across the last week
        const createdAt = sevenDaysAgo + (index * 24 * 60 * 60 * 1000) + Math.floor(Math.random() * 12 * 60 * 60 * 1000);
        const updatedAt = createdAt + Math.floor(Math.random() * 6 * 60 * 60 * 1000);

        return {
            userOneId: Math.min(match.userOne, match.userTwo),
            userTwoId: Math.max(match.userOne, match.userTwo),
            createdAt: createdAt,
            updatedAt: updatedAt,
        };
    });

    await db.insert(conversations).values(sampleConversations);
    
    console.log(`✅ Conversations seeder completed successfully. Created ${sampleConversations.length} conversations from mutual matches.`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});