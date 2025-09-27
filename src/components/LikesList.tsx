"use client";

import Image from "next/image";

const likes = [
  { name: "Emma", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop", time: "5m" },
  { name: "James", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1887&auto=format&fit=crop", time: "22m" },
  { name: "Ava", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop", time: "1d" },
  { name: "Liam", img: "https://images.unsplash.com/photo-1547106634-56dcd53ae883?q=80&w=1974&auto=format&fit=crop", time: "2d" },
];

export const LikesList = ({ onSelect }: { onSelect?: (name: string) => void }) => {
  return (
    <div className="soft-card">
      <div className="p-4 border-b border-[var(--border)]">
        <h4 className="font-semibold">Likes & Matches</h4>
      </div>
      <ul className="p-2">
        {likes.map((p) => (
          <li
            key={p.name}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--secondary)] cursor-pointer"
            onClick={() => onSelect?.(p.name)}
          >
            <div className="relative h-10 w-10 rounded-xl overflow-hidden">
              <Image src={p.img} alt={p.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-[var(--muted-foreground)]">{p.time}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">staked on you</p>
            </div>
            <button
              className="px-3 py-1 text-xs rounded-lg bg-[var(--primary)] text-white hover:brightness-105"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(p.name);
              }}
            >
              Stake back
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};