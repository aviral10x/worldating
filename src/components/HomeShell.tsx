"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileCard, type Profile } from "@/components/ProfileCard";
import { DailyPicksRefresh } from "@/components/DailyPicksRefresh";

export const HomeShell = () => {
  const [picks, setPicks] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 1; // TODO: replace with session.user.id when auth is wired

  const mapApiToProfile = useCallback((item: any): Profile => {
    const u = item.user;
    return {
      id: u.id,
      name: u.name,
      age: u.age,
      // Placeholder distance until geo is implemented
      distanceKm: Math.round((Math.random() * 6 + 1) * 10) / 10,
      bio: u.bio || "",
      // Tags not yet on API for users; show empty for now
      tags: [],
      photoUrl: u.avatarUrl || "/next.svg",
    };
  }, []);

  const fetchPicks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/daily-picks?userId=${userId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to load daily picks");
      const data = await res.json();
      const mapped: Profile[] = (Array.isArray(data) ? data : []).map(mapApiToProfile);
      setPicks(mapped.slice(0, 3));
    } catch (e: any) {
      setError(e?.message || "Failed to load daily picks");
      setPicks([]);
    } finally {
      setLoading(false);
    }
  }, [mapApiToProfile, userId]);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  const handleAfterRefresh = useCallback(async () => {
    await fetchPicks();
  }, [fetchPicks]);

  return (
    <>
      {loading ? (
        <div className="soft-card p-6 animate-pulse">
          <div className="h-72 sm:h-96 w-full bg-[var(--secondary)] rounded-lg" />
          <div className="mt-4 h-4 w-2/3 bg-[var(--secondary)] rounded" />
          <div className="mt-2 h-4 w-1/2 bg-[var(--secondary)] rounded" />
          <div className="mt-4 h-10 w-full bg-[var(--secondary)] rounded" />
        </div>
      ) : error ? (
        <div className="soft-card p-4 text-[var(--destructive)] text-sm">{error}</div>
      ) : picks && picks.length > 0 ? (
        <ProfileCard profiles={picks} />
      ) : (
        <div className="soft-card p-6 text-sm text-[var(--muted-foreground)]">
          No picks for today yet. Tap Refresh to generate new matches.
        </div>
      )}

      <div className="soft-card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Daily Picks</div>
          <p className="text-sm text-[var(--muted-foreground)]">Handpicked profiles based on your interests</p>
        </div>
        <DailyPicksRefresh userId={userId} onAfterRefresh={handleAfterRefresh} />
      </div>
    </>
  );
};

export default HomeShell;