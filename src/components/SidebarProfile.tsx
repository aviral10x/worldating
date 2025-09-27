"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";

export const SidebarProfile = () => {
  return (
    <div className="soft-card p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=1887&auto=format&fit=crop"
            alt="You"
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="font-semibold">Alex Johnson</div>
          <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" /> San Francisco, CA
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-[var(--muted)]">
          <div className="text-lg font-semibold">128</div>
          <div className="text-xs text-[var(--muted-foreground)]">Friends</div>
        </div>
        <div className="p-2 rounded-lg bg-[var(--muted)]">
          <div className="text-lg font-semibold">342</div>
          <div className="text-xs text-[var(--muted-foreground)]">Likes</div>
        </div>
        <div className="p-2 rounded-lg bg-[var(--muted)]">
          <div className="text-lg font-semibold">64</div>
          <div className="text-xs text-[var(--muted-foreground)]">Matches</div>
        </div>
      </div>
    </div>
  );
};