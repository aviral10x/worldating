"use client";

import { Coins, X, MapPin, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Define Profile type at top-level so it can be used in props
export type Profile = {
  id: number;
  name: string;
  age: number;
  distanceKm: number;
  bio: string;
  tags: string[];
  photoUrl: string;
};

// Export shared default profiles so other components can sample from them
export const DEFAULT_PROFILES: Profile[] = [
  {
    id: 1,
    name: "Sofia",
    age: 26,
    distanceKm: 2.3,
    bio: "Coffee enthusiast, weekend hiker, and part-time photographer. Looking for good vibes and spontaneous city walks.",
    tags: ["Travel", "Music", "Coffee", "Dancing", "Netflix"],
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Ava",
    age: 24,
    distanceKm: 4.1,
    bio: "Runner, foodie, and museum hopper. Sundays are for farmers markets and film photography.",
    tags: ["Running", "Food", "Art", "Photography", "Jazz"],
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Maya",
    age: 27,
    distanceKm: 1.2,
    bio: "Tech by day, salsa by night. Let's swap playlists and find the best tacos in town.",
    tags: ["Salsa", "Tech", "Tacos", "Podcasts", "Travel"],
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1974&auto=format&fit=crop",
  },
  // Added more demo profiles
  {
    id: 4,
    name: "Luna",
    age: 25,
    distanceKm: 3.4,
    bio: "Yoga mornings, indie concerts nights. Always down for a bookstore date.",
    tags: ["Yoga", "Indie", "Books", "Tea", "Art"],
    photoUrl: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 5,
    name: "Isabella",
    age: 28,
    distanceKm: 5.8,
    bio: "Product designer who sketches in cafes. Let's design our next adventure.",
    tags: ["Design", "Sketching", "Cafés", "Travel", "Pasta"],
    photoUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 6,
    name: "Chloe",
    age: 23,
    distanceKm: 1.9,
    bio: "Pilates, puppies, and polaroids. Looking for laughs and late-night ice cream runs.",
    tags: ["Pilates", "Dogs", "Photography", "Ice Cream", "Comedy"],
    photoUrl: "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 7,
    name: "Ella",
    age: 29,
    distanceKm: 7.2,
    bio: "Marketing by day, baker by weekend. Taste-tester wanted!",
    tags: ["Baking", "Brunch", "Podcasts", "Museums", "Running"],
    photoUrl: "https://images.unsplash.com/photo-1544005316-6e2f8b9839b2?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 8,
    name: "Zoe",
    age: 26,
    distanceKm: 2.7,
    bio: "Climber and camper. Can pitch a tent and a good conversation.",
    tags: ["Climbing", "Camping", "Coffee", "Road Trips", "Stars"],
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 9,
    name: "Aria",
    age: 24,
    distanceKm: 3.1,
    bio: "Piano player, cat whisperer, and matcha addict.",
    tags: ["Piano", "Cats", "Matcha", "Anime", "Lo-fi"],
    photoUrl: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 10,
    name: "Mila",
    age: 27,
    distanceKm: 6.0,
    bio: "Data nerd who loves dancing. Teach me your favorite move?",
    tags: ["Data", "Dance", "Sushi", "Karaoke", "Travel"],
    photoUrl: "https://images.unsplash.com/photo-1524230659092-07f99a75c013?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 11,
    name: "Nora",
    age: 25,
    distanceKm: 1.1,
    bio: "Book club host, rainy day movie buff, and soup connoisseur.",
    tags: ["Books", "Movies", "Cooking", "Hiking", "Tea"],
    photoUrl: "https://images.unsplash.com/photo-1515121060170-8fdd7a1f0f53?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 12,
    name: "Ruby",
    age: 28,
    distanceKm: 4.5,
    bio: "Startup ops, street photographer, sunset chaser.",
    tags: ["Startups", "Street", "Sunsets", "Ramen", "Jazz"],
    photoUrl: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1974&auto=format&fit=crop",
  },
  {
    id: 13,
    name: "Hazel",
    age: 26,
    distanceKm: 2.0,
    bio: "Plant mom with a penchant for picnics.",
    tags: ["Plants", "Picnics", "Photography", "DIY", "Board Games"],
    photoUrl: "https://images.unsplash.com/photo-1544005316-5a398fda5256?q=80&w=1974&auto=format&fit=crop",
  },
];

export const ProfileCard = ({ profiles, onLike }: { profiles?: Profile[]; onLike?: (profile: Profile) => void }) => {
  const demoProfiles: Profile[] = useMemo(() => profiles ?? DEFAULT_PROFILES, [profiles]);

  const [index, setIndex] = useState(0);
  const current = demoProfiles[index % demoProfiles.length];
  // 1 for right (like), -1 for left (skip)
  const [exitDir, setExitDir] = useState<-1 | 1>(-1);

  useEffect(() => {
    // Reset to first when a new profiles list is injected
    setIndex(0);
  }, [profiles]);

  const handleSkip = useCallback(() => {
    setExitDir(-1);
    // Trigger next profile; animation handled by AnimatePresence exit on key change
    setIndex((i) => i + 1);
  }, []);

  const handleLike = useCallback(() => {
    if (onLike) onLike(current);
    setExitDir(1);
    // Advance with a right-swipe animation similar to skip
    setIndex((i) => i + 1);
  }, [onLike, current]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 140 * exitDir, rotate: 2 * exitDir }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="soft-card overflow-hidden"
      >
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full">
          <Image
            src={current.photoUrl}
            alt={`${current.name} profile photo`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="px-2 py-1 text-[12px] rounded-full bg-[var(--muted)] text-[var(--foreground)]/80">New here</span>
          </div>
        </div>
        <div className="p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[var(--foreground)] text-lg sm:text-2xl font-semibold">{current.name}, {current.age}</h3>
              <p className="text-[var(--muted-foreground)] flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-[var(--primary)]" /> {current.distanceKm} km away
              </p>
            </div>
            <button className="p-2 rounded-full border bg-[var(--card)] hover:bg-[var(--muted)] transition-colors" aria-label="More">
              <MoreHorizontal className="h-5 w-5 text-[var(--muted-foreground)]" />
            </button>
          </div>
          <p className="mt-2 sm:mt-3 text-[var(--foreground)]/80 text-sm leading-relaxed">
            {current.bio}
          </p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
            {current.tags.map((t) => (
              <span key={t} className="tag px-3 py-1 text-xs sm:text-sm">#{t}</span>
            ))}
          </div>
          <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleSkip}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border bg-[var(--card)] hover:bg-[var(--secondary)] transition-colors"
            >
              <X className="h-5 w-5 text-[var(--destructive)]" />
              <span className="font-medium">Skip</span>
            </button>
            <button
              onClick={handleLike}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-[var(--primary)] hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Coins className="h-5 w-5" />
              <span className="font-medium">Stake</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};