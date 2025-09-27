"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type PickUser = {
  id: number;
  name?: string;
  age?: number;
  avatar_url?: string | null;
  bio?: string | null;
};

// This type is flexible to handle either direct user objects or pick rows with nested user
type DailyPickItem = {
  id?: number;
  pick_user_id?: number;
  user?: PickUser | null;
  score?: number | null;
} & Partial<PickUser>;

export const DailyPicksList = ({ userId, take = 4, refreshKey = 0 }: { userId: number; take?: number; refreshKey?: number }) => {
  const [data, setData] = useState<DailyPickItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch(`/api/daily-picks?userId=${encodeURIComponent(userId)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch daily picks");
        const json = (await res.json()) as DailyPickItem[];
        if (!cancelled) setData(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!cancelled) setError("Could not load picks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const items = useMemo(() => (data || []).slice(0, take), [data, take]);

  if (loading) {
    return (
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(take)].map((_, i) => (
          <div key={i} className="soft-card p-4 animate-pulse">
            <div className="h-28 w-full bg-[var(--secondary)] rounded-lg" />
            <div className="mt-3 h-4 w-2/3 bg-[var(--secondary)] rounded" />
            <div className="mt-2 h-3 w-1/2 bg-[var(--secondary)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="mt-3 text-[var(--destructive)] text-sm">{error}</div>;
  }

  if (!items.length) {
    return <div className="mt-3 text-sm text-[var(--muted-foreground)]">No picks yet. Try refreshing.</div>;
  }

  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it, idx) => {
        const u: PickUser | undefined = it.user || (it.id || it.name ? (it as PickUser) : undefined);
        const name = u?.name || "Unknown";
        const age = u?.age ? `, ${u.age}` : "";
        const bio = u?.bio || "";
        const avatar = u?.avatar_url || "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=800&auto=format&fit=crop";
        return (
          <div key={(it.id ?? it.pick_user_id ?? idx).toString()} className="soft-card overflow-hidden">
            <div className="relative h-32 w-full">
              <Image src={avatar} alt={name} fill className="object-cover" />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{name}{age}</div>
                {typeof it.score === "number" && (
                  <span className="text-xs text-[var(--muted-foreground)]">Score: {Math.round(it.score * 100) / 100}</span>
                )}
              </div>
              {bio ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">{bio}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};