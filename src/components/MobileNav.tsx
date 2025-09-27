"use client";

import Link from "next/link";
import { Compass, Users, Heart, MessageSquare, User } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { label: "Dating", href: "/", icon: Compass },
  { label: "Users", href: "/users", icon: Users },
  { label: "Like", href: "/likes", icon: Heart },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
] as const;

export const MobileNav = () => {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden sticky bottom-0 z-40 bg-[var(--card)] border-t border-[var(--border)]">
      <ul className="grid grid-cols-5 text-sm">
        {items.map((i) => {
          const active = pathname === i.href;
          const Icon = i.icon;
          return (
            <li key={i.label} className="flex flex-col items-center py-2">
              <Link href={i.href} className="flex flex-col items-center" aria-current={active ? "page" : undefined}>
                <Icon className={`h-5 w-5 ${active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                <span className={`text-[10px] mt-1 ${active ? "text-[var(--primary)] font-medium" : "text-[var(--muted-foreground)]"}`}>{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};