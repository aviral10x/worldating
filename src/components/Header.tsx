"use client";

import Link from "next/link";
import { Search, Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useSession } from "@/lib/hooks/useSession";

export const Header = () => {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { isConnected } = useAccount();
  const { user, isLoading, signIn, signOut } = useSession();

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = (stored as "light" | "dark" | null) ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    const root = document.documentElement;
    root.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur border-b border-[var(--border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[var(--primary)]" />
          <span className="font-semibold text-lg">LavenDate</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="/support" className={`${pathname === "/support" ? "text-[var(--primary)]" : ""} hover:text-[var(--primary)]`}>Support</Link>
          <Link href="/faq" className={`${pathname === "/faq" ? "text-[var(--primary)]" : ""} hover:text-[var(--primary)]`}>FAQ</Link>
        </nav>
        <div className="flex items-center gap-2">
          {/* Wallet connect button - show on all screen sizes */}
          <div>
            <ConnectButton chainStatus="icon" showBalance={false} accountStatus={{ smallScreen: "avatar", largeScreen: "full" }} />
          </div>
          {/* Auth action: show Sign in when wallet connected but no session; show Logout when session exists */}
          {!isLoading && (
            user ? (
              <button
                type="button"
                onClick={signOut}
                className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] hover:border-[var(--ring)] text-sm"
              >
                Logout
              </button>
            ) : (
              isConnected && (
                <button
                  type="button"
                  onClick={signIn}
                  className="px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] hover:border-[var(--ring)] text-sm"
                >
                  Sign in
                </button>
              )
            )
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] hover:border-[var(--ring)] transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
          <Link href="/search" className="sm:hidden p-2 rounded-xl border" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};