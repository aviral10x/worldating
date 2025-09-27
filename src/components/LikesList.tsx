"use client";

// remove next/image to allow data URLs and local uploads without config
import { useEffect, useState } from "react";

type Item = { id: number; name: string; img: string; time?: string };

export const LikesList = ({ onSelect }: { onSelect?: (id: number) => void }) => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const headers: HeadersInit = {};
        if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
        const userId = 1; // TODO: replace with session.user.id when auth is wired
        const res = await fetch(`/api/likes?userId=${userId}&limit=50`, { headers });
        const data = await res.json();
        if (!mounted) return;
        const mapped: Item[] = (data || []).map((u: any) => {
          const raw = u.avatarUrl || u.avatar_url || "";
          const img = /pravatar\.cc|i\.pravatar\.cc/.test(raw) ? "/vercel.svg" : raw || "/vercel.svg";
          const likedAt = typeof u.likedAt === "number" ? new Date(u.likedAt) : null;
          return {
            id: u.id,
            name: u.name,
            img,
            time: likedAt ? likedAt.toLocaleDateString() : "",
          } as Item;
        });
        setItems(mapped);
      } catch (_) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="soft-card">
      <div className="p-4 border-b border-[var(--border)]">
        <h4 className="font-semibold">Likes & Matches</h4>
      </div>
      <ul className="p-2">
        {items.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--secondary)] cursor-pointer"
            onClick={() => onSelect?.(p.id)}
          >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden">
              <img src={p.img} alt={p.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/vercel.svg"; }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                {p.time ? (
                  <span className="text-xs text-[var(--muted-foreground)]">{p.time}</span>
                ) : null}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">staked to you</p>
            </div>
            <button
              className="px-3 py-1 text-xs rounded-lg bg-[var(--primary)] text-white hover:brightness-105"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p.id);
              }}
            >
              View
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="p-3 text-sm text-[var(--muted-foreground)]">No stakes yet.</li>
        )}
      </ul>
    </div>
  );
};