"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";

export const DailyPicksRefresh = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useSession();

  const handleClick = async () => {
    if (loading) return;

    const userId = user?.id;
    if (!userId) {
      toast.error("Please connect wallet and sign in to refresh daily picks.");
      return;
    }

    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/daily-picks/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });

      const data: { success?: boolean; count?: number; message?: string } | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to refresh. Please try again.");
      }

      toast.success(data?.message || `Daily picks refreshed${typeof data.count === "number" ? `: ${data.count} picks` : ""}`);
    } catch (err) {
      toast.error("Failed to refresh. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      aria-busy={loading}
      aria-live="polite"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </>
      )}
    </button>
  );
};