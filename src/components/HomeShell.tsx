"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProfileCard, type Profile } from "@/components/ProfileCard";
import { DailyPicksRefresh } from "@/components/DailyPicksRefresh";
import { toast } from "sonner";
import { MiniKit, Tokens, tokenToDecimals, type PayCommandInput } from "@worldcoin/minikit-js";

const DEST = process.env.NEXT_PUBLIC_MINIKIT_DEST as string | undefined;

export const HomeShell = () => {
  const [picks, setPicks] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const userId = 1; // TODO: replace with session.user.id when auth is wired

  const mapApiToProfile = useCallback((item: any): Profile => {
    const u = item.user;
    return {
      id: u.id,
      name: u.name,
      age: u.age,
      // Placeholder distance until geo is implemented
      distanceKm: Math.round((Math.random() * 6 + 1) * 10) / 10,
      bio: u.bio || "",
      // Tags not yet on API for users; show empty for now
      tags: [],
      photoUrl: u.avatarUrl || "/next.svg",
    };
  }, []);

  // Map raw user (from /api/users) to Profile
  const mapUserToProfile = useCallback((u: any): Profile => {
    return {
      id: u.id,
      name: u.name,
      age: u.age,
      distanceKm: Math.round((Math.random() * 6 + 1) * 10) / 10,
      bio: u.bio || "",
      tags: [],
      photoUrl: u.avatarUrl || "/next.svg",
    };
  }, []);

  const fetchVerifiedProfiles = useCallback(async (): Promise<Profile[]> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const res = await fetch(`/api/users?limit=20`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const verified = (Array.isArray(data) ? data : []).filter((u: any) => !!u.worldAddress);
    return verified.map(mapUserToProfile);
  }, [mapUserToProfile]);

  const fetchPicks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/daily-picks?userId=${userId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to load daily picks");
      const data = await res.json();
      const mapped: Profile[] = (Array.isArray(data) ? data : []).map(mapApiToProfile);

      if (mapped.length === 0) {
        // Fallback to verified profiles (users with worldAddress)
        const fallback = await fetchVerifiedProfiles();
        setPicks(fallback.slice(0, 3));
      } else {
        setPicks(mapped.slice(0, 3));
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load daily picks");
      // Try verified fallback even if daily picks failed
      try {
        const fallback = await fetchVerifiedProfiles();
        setPicks(fallback.slice(0, 3));
      } catch {
        setPicks([]);
      }
    } finally {
      setLoading(false);
    }
  }, [mapApiToProfile, userId, fetchVerifiedProfiles]);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  const handleAfterRefresh = useCallback(async () => {
    await fetchPicks();
  }, [fetchPicks]);

  const handleStake = useCallback(async (p: Profile) => {
    try {
      toast.dismiss();
      if (!MiniKit.isInstalled()) {
        toast.error("World App not available. Open inside World App to continue.");
        return;
      }
      if (!DEST) {
        toast.error("Destination address not configured.");
        return;
      }

      toast.loading("Preparing payment...");

      const initRes = await fetch("/api/initiate-payment", { method: "POST" });
      if (!initRes.ok) throw new Error("Failed to initiate payment");
      const { id: reference } = await initRes.json();

      const payPayload: PayCommandInput = {
        reference,
        to: DEST,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(0.01, Tokens.WLD).toString(),
          },
        ],
        description: `Stake to ${p.name}: 0.01 WLD`,
      };

      toast.dismiss();
      const { finalPayload } = await MiniKit.commandsAsync.pay(payPayload);
      if (!finalPayload || finalPayload.status === "error") {
        toast.error("Payment failed or cancelled");
        return;
      }

      const confirm = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: finalPayload }),
      });
      const confirmJson = await confirm.json();
      if (!confirm.ok || !confirmJson?.success) {
        toast.error("Payment not confirmed yet");
        return;
      }

      // Record the like in our DB
      const likeRes = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ likerId: userId, likedId: p.id }),
      });
      if (!likeRes.ok) {
        // Not fatal for payment, but inform user
        toast.message("Payment confirmed, but failed to record like");
      }

      toast.success("Stake confirmed ✅");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to complete stake");
    }
  }, [userId]);

  return (
    <>
      {loading ? (
        <div className="soft-card p-6 animate-pulse">
          <div className="h-72 sm:h-96 w-full bg-[var(--secondary)] rounded-lg" />
          <div className="mt-4 h-4 w-2/3 bg-[var(--secondary)] rounded" />
          <div className="mt-2 h-4 w-1/2 bg-[var(--secondary)] rounded" />
          <div className="mt-4 h-10 w-full bg-[var(--secondary)] rounded" />
        </div>
      ) : error ? (
        <div className="soft-card p-4 text-[var(--destructive)] text-sm">{error}</div>
      ) : picks && picks.length > 0 ? (
        <ProfileCard profiles={picks} onLike={handleStake} />
      ) : (
        <div className="soft-card p-6 text-sm text-[var(--muted-foreground)]">
          No picks for today yet. Showing verified profiles for now, but none are available.
        </div>
      )}

      <div className="soft-card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Daily Picks</div>
          <p className="text-sm text-[var(--muted-foreground)]">Handpicked profiles based on your interests</p>
        </div>
        <DailyPicksRefresh userId={userId} onAfterRefresh={handleAfterRefresh} />
      </div>
    </>
  );
};

export default HomeShell;