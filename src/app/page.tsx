"use client";

import { Heart, X, Users, MessageSquare, Activity, User, Settings, Compass, MapPin, ChevronRight, MoreHorizontal, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function ProfileCard() {
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
}

export default function Home() {
  return (
    <div className="min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--primary)]" />
            <span className="font-semibold text-lg">LavenDate</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="#" className="hover:text-[var(--primary)]">Support</Link>
            <Link href="#" className="hover:text-[var(--primary)]">FAQ</Link>
          </nav>
          <button className="sm:hidden p-2 rounded-xl border">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Left Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-16 self-start">
          {/* Profile Summary */}
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
                <div className="text-sm text-[var(--muted-foreground)] flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[var(--primary)]"/> San Francisco, CA</div>
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

          {/* Navigation */}
          <nav className="soft-card p-2">
            <ul className="space-y-1">
              {[
                { label: "Dating", icon: Compass, active: true },
                { label: "Users", icon: Users },
                { label: "Messages", icon: MessageSquare },
                { label: "Activity", icon: Activity },
                { label: "Profile", icon: User },
                { label: "Settings", icon: Settings },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    className={`${item.active ? "bg-[var(--secondary)] text-[var(--foreground)]" : "hover:bg-[var(--secondary)]"} w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${item.active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Center Content */}
        <section className="space-y-6">
          <ProfileCard />
          <div className="soft-card p-4 flex items-center justify-between">
            <div>
              <div className="font-semibold">Daily Picks</div>
              <p className="text-sm text-[var(--muted-foreground)]">Handpicked profiles based on your interests</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white">Refresh</button>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-16 self-start">
          {/* Messages */}
          <div className="soft-card">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h4 className="font-semibold">Messages</h4>
              <div className="inline-flex rounded-lg overflow-hidden border">
                <button className="px-3 py-1 text-sm bg-[var(--secondary)]">Chats</button>
                <button className="px-3 py-1 text-sm text-[var(--muted-foreground)]">Requests</button>
              </div>
            </div>
            <ul className="p-2">
              {[
                { name: "Mia", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop", time: "2m" },
                { name: "Olivia", img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1974&auto=format&fit=crop", time: "1h" },
                { name: "Noah", img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=2069&auto=format&fit=crop", time: "3h" },
              ].map((c) => (
                <li key={c.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--secondary)] cursor-pointer">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden">
                    <Image src={c.img} alt={c.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{c.time}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">Tap to continue the chat…</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Likes & Matches */}
          <div className="soft-card">
            <div className="p-4 border-b border-[var(--border)]">
              <h4 className="font-semibold">Likes & Matches</h4>
            </div>
            <ul className="p-2">
              {[
                { name: "Emma", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1887&auto=format&fit=crop", time: "5m" },
                { name: "James", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1887&auto=format&fit=crop", time: "22m" },
                { name: "Ava", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1974&auto=format&fit=crop", time: "1d" },
                { name: "Liam", img: "https://images.unsplash.com/photo-1547106634-56dcd53ae883?q=80&w=1974&auto=format&fit=crop", time: "2d" },
              ].map((p) => (
                <li key={p.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--secondary)] cursor-pointer">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden">
                    <Image src={p.img} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{p.time}</span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">liked your profile</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden sticky bottom-0 z-40 bg-[var(--card)] border-t border-[var(--border)]">
        <ul className="grid grid-cols-5 text-sm">
          {[
            { label: "Dating", icon: Compass },
            { label: "Users", icon: Users },
            { label: "Like", icon: Heart },
            { label: "Messages", icon: MessageSquare },
            { label: "Profile", icon: User },
          ].map((i) => (
            <li key={i.label} className="flex flex-col items-center py-2">
              <i.icon className="h-5 w-5 text-[var(--primary)]" />
              <span className="text-[10px] mt-1">{i.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}