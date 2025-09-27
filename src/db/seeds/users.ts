import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            name: 'John',
            age: 28,
            location: 'NYC',
            bio: 'Coffee enthusiast and software engineer. Love hiking and trying new restaurants. Looking for someone who enjoys deep conversations and spontaneous adventures.',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Sarah',
            age: 25,
            location: 'SF',
            bio: 'Yoga instructor and travel blogger. Passionate about sustainability and mental health advocate. Here to meet genuine people who love to explore.',
            avatarUrl: 'https://i.pravatar.cc/150?img=2',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Mike',
            age: 32,
            location: 'LA',
            bio: 'Creative director at a startup. Love surfing, photography, and live music. Seeking someone ambitious but knows how to enjoy life.',
            avatarUrl: 'https://i.pravatar.cc/150?img=3',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Emily',
            age: 24,
            location: 'Austin',
            bio: 'Grad student studying environmental science. Big fan of farmers markets and indie concerts. Looking for meaningful connections, not just hookups.',
            avatarUrl: 'https://i.pravatar.cc/150?img=4',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'David',
            age: 30,
            location: 'Seattle',
            bio: 'Tech professional and homebrew enthusiast. Love rainy days, good books, and deep conversations about life. Hoping to find my partner in crime.',
            avatarUrl: 'https://i.pravatar.cc/150?img=5',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Jessica',
            age: 27,
            location: 'NYC',
            bio: 'Marketing manager with a passion for food. You\'ll find me exploring new neighborhoods or trying out restaurants. Looking for someone who appreciates good food and bad puns.',
            avatarUrl: 'https://i.pravatar.cc/150?img=6',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Alex',
            age: 26,
            location: 'SF',
            bio: 'Fitness coach and part-time DJ. Love morning workouts and late-night tacos. Bring your best dad jokes and a sense of adventure.',
            avatarUrl: 'https://i.pravatar.cc/150?img=7',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Ashley',
            age: 29,
            location: 'LA',
            bio: 'Fashion blogger and dog mom. Always planning my next beach trip or wine tasting. Looking for someone who can keep up with my energy and appreciates a good sunset.',
            avatarUrl: 'https://i.pravatar.cc/150?img=8',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Chris',
            age: 35,
            location: 'Austin',
            bio: 'Musician and tech entrepreneur. Love vinyl records and craft beer. Here to find someone who gets my weird schedule and passion for creativity.',
            avatarUrl: 'https://i.pravatar.cc/150?img=9',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Amanda',
            age: 31,
            location: 'Seattle',
            bio: 'Elementary teacher and amateur baker. Love hiking Mount Rainier and cozy coffee shops. Seeking someone family-oriented who appreciates Sunday morning pancakes.',
            avatarUrl: 'https://i.pravatar.cc/150?img=10',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Ryan',
            age: 23,
            location: 'NYC',
            bio: 'Recent grad working in finance. Love street food and rooftop bars. New to the city and looking for someone to show me around or explore together.',
            avatarUrl: 'https://i.pravatar.cc/150?img=11',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Lauren',
            age: 33,
            location: 'SF',
            bio: 'Product designer and sustainability advocate. Love weekend getaways and finding hidden gems in the city. Looking for someone who values intentionality over drama.',
            avatarUrl: 'https://i.pravatar.cc/150?img=12',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Jake',
            age: 38,
            location: 'LA',
            bio: 'Chef at a popular restaurant. When not in the kitchen, I\'m trying new cuisines or watching indie films. Looking for someone who appreciates good food and isn\'t afraid to try weird dishes.',
            avatarUrl: 'https://i.pravatar.cc/150?img=13',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Megan',
            age: 22,
            location: 'Austin',
            bio: 'College senior studying business. Love live music and good vibes. Looking for someone who can dance badly with me at concerts and appreciates late-night taco runs.',
            avatarUrl: 'https://i.pravatar.cc/150?img=14',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            name: 'Tyler',
            age: 36,
            location: 'Seattle',
            bio: 'Data scientist and amateur photographer. Love stormy days, good coffee, and deep conversations about space. Hoping to find someone who appreciates intellectual connection.',
            avatarUrl: 'https://i.pravatar.cc/150?img=15',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});