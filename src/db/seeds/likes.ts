import { db } from '@/db';
import { likes } from '@/db/schema';

async function main() {
    const sampleLikes = [
        // User 1 likes various users with some mutual likes
        { likerId: 1, likedId: 2, createdAt: new Date('2024-01-15T10:30:00').getTime() },
        { likerId: 1, likedId: 3, createdAt: new Date('2024-01-15T14:20:00').getTime() },
        { likerId: 1, likedId: 7, createdAt: new Date('2024-01-16T09:15:00').getTime() },
        
        // User 2 - mutual like with user 1
        { likerId: 2, likedId: 1, createdAt: new Date('2024-01-15T11:45:00').getTime() },
        { likerId: 2, likedId: 4, createdAt: new Date('2024-01-15T16:30:00').getTime() },
        { likerId: 2, likedId: 8, createdAt: new Date('2024-01-16T10:20:00').getTime() },
        
        // User 3 likes user 1 back (mutual)
        { likerId: 3, likedId: 1, createdAt: new Date('2024-01-15T15:10:00').getTime() },
        { likerId: 3, likedId: 5, createdAt: new Date('2024-01-16T08:45:00').getTime() },
        { likerId: 3, likedId: 9, createdAt: new Date('2024-01-16T12:30:00').getTime() },
        
        // User 4 - selective likes
        { likerId: 4, likedId: 2, createdAt: new Date('2024-01-15T17:00:00').getTime() },
        { likerId: 4, likedId: 6, createdAt: new Date('2024-01-16T11:15:00').getTime() },
        
        // User 5 - likes user 3 back (mutual)
        { likerId: 5, likedId: 3, createdAt: new Date('2024-01-16T09:30:00').getTime() },
        { likerId: 5, likedId: 10, createdAt: new Date('2024-01-16T13:45:00').getTime() },
        
        // User 6 - moderate activity
        { likerId: 6, likedId: 4, createdAt: new Date('2024-01-16T10:00:00').getTime() },
        { likerId: 6, likedId: 7, createdAt: new Date('2024-01-16T14:20:00').getTime() },
        { likerId: 6, likedId: 11, createdAt: new Date('2024-01-17T09:15:00').getTime() },
        
        // User 7 - likes user 1 and 6 back (mutuals)
        { likerId: 7, likedId: 1, createdAt: new Date('2024-01-16T11:30:00').getTime() },
        { likerId: 7, likedId: 6, createdAt: new Date('2024-01-16T15:45:00').getTime() },
        
        // User 8 - likes user 2 back (mutual)
        { likerId: 8, likedId: 2, createdAt: new Date('2024-01-16T11:50:00').getTime() },
        { likerId: 8, likedId: 12, createdAt: new Date('2024-01-17T10:30:00').getTime() },
        
        // User 9 - likes user 3 back (mutual)
        { likerId: 9, likedId: 3, createdAt: new Date('2024-01-16T13:15:00').getTime() },
        { likerId: 9, likedId: 13, createdAt: new Date('2024-01-17T11:45:00').getTime() },
        
        // User 10 - selective
        { likerId: 10, likedId: 5, createdAt: new Date('2024-01-16T14:00:00').getTime() },
        { likerId: 10, likedId: 14, createdAt: new Date('2024-01-17T12:20:00').getTime() },
        
        // User 11 - likes user 6 back (mutual)
        { likerId: 11, likedId: 6, createdAt: new Date('2024-01-17T08:30:00').getTime() },
        { likerId: 11, likedId: 15, createdAt: new Date('2024-01-17T13:15:00').getTime() },
        
        // User 12 - moderate activity
        { likerId: 12, likedId: 8, createdAt: new Date('2024-01-17T09:45:00').getTime() },
        { likerId: 12, likedId: 13, createdAt: new Date('2024-01-17T14:30:00').getTime() },
        
        // User 13 - likes user 9 and 12 back (mutuals)
        { likerId: 13, likedId: 9, createdAt: new Date('2024-01-17T10:15:00').getTime() },
        { likerId: 13, likedId: 12, createdAt: new Date('2024-01-17T15:00:00').getTime() },
        
        // User 14 - selective
        { likerId: 14, likedId: 10, createdAt: new Date('2024-01-17T11:30:00').getTime() },
        { likerId: 14, likedId: 15, createdAt: new Date('2024-01-17T16:15:00').getTime() },
        
        // User 15 - likes user 11 and 14 back (mutuals)
        { likerId: 15, likedId: 11, createdAt: new Date('2024-01-17T12:45:00').getTime() },
        { likerId: 15, likedId: 14, createdAt: new Date('2024-01-17T17:30:00').getTime() },
    ];

    await db.insert(likes).values(sampleLikes);
    
    console.log('✅ Likes seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});