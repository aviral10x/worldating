"use client";

import { Heart, X, MapPin, MoreHorizontal } from "lucide-react";
import Image from "next/image";

export const ProfileCard = () => {
  return (
    <div className="soft-card overflow-hidden">
      <div className="relative aspect-[4/5] w-full">
        <Image
          src="https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1974&auto=format&fit=crop"
          alt="Profile photo"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="px-2 py-1 text-[12px] rounded-full bg-[var(--muted)] text-[var(--foreground)]/80">New here</span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[var(--foreground)] text-xl sm:text-2xl font-semibold">Sofia, 26</h3>
            <p className="text-[var(--muted-foreground)] flex items-center gap-1 text-sm"><MapPin className="h-4 w-4 text-[var(--primary)]" /> 2.3 km away</p>
          </div>
          <button className="p-2 rounded-full border bg-[var(--card)] hover:bg-[var(--muted)] transition-colors" aria-label="More">
            <MoreHorizontal className="h-5 w-5 text-[var(--muted-foreground)]" />
          </button>
        </div>
        <p className="mt-3 text-[var(--foreground)]/80 text-sm leading-relaxed">
          Coffee enthusiast, weekend hiker, and part-time photographer. Looking for good vibes and spontaneous city walks.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Travel","Music","Coffee","Dancing","Netflix"].map((t)=> (
            <span key={t} className="tag px-3 py-1 text-sm">#{t}</span>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl border bg-[var(--card)] hover:bg-[var(--secondary)] transition-all">
            <X className="h-5 w-5 text-[var(--destructive)]" />
            <span className="font-medium">Skip</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 rounded-xl text-white bg-[var(--primary)] hover:brightness-105 transition-all">
            <Heart className="h-5 w-5" fill="currentColor" />
            <span className="font-medium">Like</span>
          </button>
        </div>
      </div>
    </div>
  );
};