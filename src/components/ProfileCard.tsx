"use client";

import { Coins, X, MapPin, MoreHorizontal } from "lucide-react";
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

export const ProfileCard = ({ profiles, onLike }: { profiles?: Profile[]; onLike?: (profile: Profile) => void }) => {
  const demoProfiles: Profile[] = useMemo(() => profiles ?? [], [profiles]);

  const [index, setIndex] = useState(0);
  const current = demoProfiles.length > 0 ? demoProfiles[index % demoProfiles.length] : undefined;
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
    if (current && onLike) onLike(current);
    setExitDir(1);
    // Advance with a right-swipe animation similar to skip
    setIndex((i) => i + 1);
  }, [onLike, current]);

  if (!current) {
    return (
      <div className="soft-card p-6 text-sm text-[var(--muted-foreground)]">
        No profiles available yet. Ask users to create their profiles.
      </div>
    );
  }

  // Use custom variants so each exiting card keeps its own direction snapshot
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: (dir: -1 | 1) => ({ opacity: 0, x: 140 * dir, rotate: 2 * dir }),
  } as const;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${current.id}-${index}`}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        custom={exitDir}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="soft-card overflow-hidden"
      >
        <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full">
          {/* Use native img to support data URLs and local /uploads without domain config */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.photoUrl}
            alt={`${current.name} profile photo`}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/vercel.svg";
            }}
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
                <MapPin className="h-4 w-4 text-[var(--primary)]" />
                {/* distance may not be available; show location instead if provided via tags[0] hack not ideal; consumers should map location into tags or extend Profile */}
                {/* For now, hide distance value if zero */}
                {current.distanceKm > 0 ? `${current.distanceKm} km away` : ""}
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