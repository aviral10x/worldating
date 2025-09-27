"use client";

import Image from "next/image";

const chats = [
  { name: "Mia", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop", time: "2m" },
  { name: "Olivia", img: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1974&auto=format&fit=crop", time: "1h" },
  { name: "Noah", img: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=2069&auto=format&fit=crop", time: "3h" },
];

export const MessagesList = () => {
  return (
    <div className="soft-card">
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <h4 className="font-semibold">Messages</h4>
        <div className="inline-flex rounded-lg overflow-hidden border">
          <button className="px-3 py-1 text-sm bg-[var(--secondary)]">Chats</button>
          <button className="px-3 py-1 text-sm text-[var(--muted-foreground)]">Requests</button>
        </div>
      </div>
      <ul className="p-2">
        {chats.map((c) => (
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
  );
};