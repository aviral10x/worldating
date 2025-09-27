"use client";

import { useMemo, useState, useCallback } from "react";
import { LikesList } from "@/components/LikesList";
import { DEFAULT_PROFILES, Profile, ProfileCard } from "@/components/ProfileCard";

// Demo mapping to enrich Likes names not present in DEFAULT_PROFILES
const LIKE_NAME_TO_IMG: Record<string, string> = {
  Emma: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop",
  James: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1887&auto=format&fit=crop",
  Ava: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop",
  Liam: "https://images.unsplash.com/photo-1547106634-56dcd53ae883?q=80&w=1974&auto=format&fit=crop",
};

export const LikesContent = () => {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const selectedProfile: Profile = useMemo(() => {
    if (!selectedName) return DEFAULT_PROFILES[0];
    const existing = DEFAULT_PROFILES.find((p) => p.name === selectedName);
    if (existing) return existing;
    const base = DEFAULT_PROFILES[0];
    return {
      ...base,
      id: 9999,
      name: selectedName,
      photoUrl: LIKE_NAME_TO_IMG[selectedName] ?? base.photoUrl,
    };
  }, [selectedName]);

  const handleStake = useCallback((p: Profile) => {
    // TODO: Integrate World App pay + backend relayer call to recordPayStake
    // For now, this is the hook where staking flow will start
    console.log("Stake initiated for", p.name);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div className="lg:col-span-4 order-2 lg:order-1">
        <LikesList onSelect={setSelectedName} />
      </div>
      <div className="lg:col-span-8 order-1 lg:order-2">
        <ProfileCard
          profiles={[selectedProfile]}
          onLike={handleStake}
        />
      </div>
    </div>
  );
};

export default LikesContent;