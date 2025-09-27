import { db } from '@/db';
import { likes, users } from '@/db/schema';
import { asc } from 'drizzle-orm';

async function main() {
    // Query users to get real integer IDs
    const allUsers = await db
        .select({ id: users.id })
        .from(users)
        .orderBy(asc(users.id));

    if (allUsers.length < 2) {
        console.log('⚠️ Need at least 2 users to create likes. Skipping likes seeder.');
        return;
    }

    const userIds = allUsers.map(u => u.id);
    const likesToInsert: Array<{ likerId: number; likedId: number; createdAt: number }> = [];
    const dedupe = new Set<string>();

    // Each user likes the next 2 users (wrap around)
    for (let i = 0; i < userIds.length; i++) {
        const likerId = userIds[i];
        for (let j = 1; j <= 2; j++) {
            const likedId = userIds[(i + j) % userIds.length];
            if (likerId === likedId) continue;
            const key = `${likerId}-${likedId}`;
            if (dedupe.has(key)) continue;
            dedupe.add(key);
            likesToInsert.push({
                likerId,
                likedId,
                createdAt: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
            });
        }
    }

    // 30% chance to add reciprocal like for realism
    const mutuals: Array<{ likerId: number; likedId: number; createdAt: number }> = [];
    for (const l of likesToInsert) {
        if (Math.random() < 0.3) {
            const rKey = `${l.likedId}-${l.likerId}`;
            if (!dedupe.has(rKey)) {
                dedupe.add(rKey);
                mutuals.push({
                    likerId: l.likedId,
                    likedId: l.likerId,
                    createdAt: Date.now() - Math.floor(Math.random() * 6 * 24 * 60 * 60 * 1000),
                });
            }
        }
    }

    const all = [...likesToInsert, ...mutuals];
    if (all.length === 0) {
        console.log('⚠️ No likes to insert');
        return;
    }

    await db.insert(likes).values(all);
    console.log(`✅ Likes seeder completed successfully - Created ${all.length} likes (${likesToInsert.length} initial + ${mutuals.length} mutual)`);
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});