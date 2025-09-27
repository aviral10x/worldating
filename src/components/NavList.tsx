"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Users, MessageSquare, Activity, User, Settings, ChevronRight, Sparkles } from "lucide-react";

const items = [
  { label: "Dating", href: "/", icon: Compass },
  { label: "Users", href: "/users", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Onboarding", href: "/onboarding", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export const NavList = () => {
  const pathname = usePathname();
  return (
    <nav className="soft-card p-2">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`${active ? "bg-[var(--secondary)] text-[var(--foreground)]" : "hover:bg-[var(--secondary)]"} w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors`}
              >
                <span className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};