import { db } from '@/db';
import { interests } from '@/db/schema';

async function main() {
    const commonInterests = [
        { name: 'Travel' },
        { name: 'Music' },
        { name: 'Coffee' },
        { name: 'Dancing' },
        { name: 'Hiking' },
        { name: 'Tech' },
        { name: 'Movies' },
        { name: 'Fitness' },
        { name: 'Art' },
        { name: 'Cooking' },
        { name: 'Books' },
        { name: 'Gaming' },
        { name: 'Yoga' },
        { name: 'Photography' },
        { name: 'Pets' }
    ];

    await db.insert(interests).values(commonInterests);
    
    console.log('✅ Interests seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});