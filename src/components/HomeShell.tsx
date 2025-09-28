"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
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
  const allowedNames = useMemo(() => new Set(["aviral", "emily", "lia", "tanya", "vaibhavi"]), []);
  const lastFetchAtRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  // Custom image overrides for specific names
  const getCustomPhoto = useCallback((name: string, fallback: string) => {
    const n = (name || "")
      .toLowerCase()
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-z]/g, "");
    const overrides: Record<string, string> = {
      emily:
        "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2025-09-28-04.24.15-1759013680826.jpg",
      tanya:
        "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/2025-09-28-04.24.29-1759013686197.jpg",
    };
    return overrides[n] || fallback;
  }, []);

  const getSelfWorldAddress = useCallback(() => {
    if (typeof window === "undefined") return "";
    const addr = localStorage.getItem("world_address") || "";
    return addr.toLowerCase();
  }, []);

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
      photoUrl: getCustomPhoto(u.name, u.avatarUrl || "/next.svg"),
    };
  }, [getCustomPhoto]);

  // Map raw user (from /api/users) to Profile
  const mapUserToProfile = useCallback((u: any): Profile => {
    return {
      id: u.id,
      name: u.name,
      age: u.age,
      distanceKm: Math.round((Math.random() * 6 + 1) * 10) / 10,
      bio: u.bio || "",
      tags: [],
      photoUrl: getCustomPhoto(u.name, u.avatarUrl || "/next.svg"),
    };
  }, [getCustomPhoto]);

  const uniqueAndAllowed = useCallback((profiles: Profile[]) => {
    // keep only allowed names and remove duplicates by name (case-insensitive, first-name only, strip emojis/punctuation)
    const normalize = (name: string) =>
      (name || "")
        .toLowerCase()
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z]/g, "");

    const seen = new Set<string>();
    const filtered: Profile[] = [];
    for (const p of profiles) {
      const n = normalize(p.name);
      if (!allowedNames.has(n)) continue;
      if (seen.has(n)) continue;
      seen.add(n);
      filtered.push(p);
    }
    return filtered;
  }, [allowedNames]);

  // Ensure Emily and Vaibhavi appear first within the limited picks
  const pickTop = useCallback((profiles: Profile[], limit = 3) => {
    const normalize = (name: string) =>
      (name || "")
        .toLowerCase()
        .trim()
        .split(/\s+/)[0]
        .replace(/[^a-z]/g, "");
    const score = (p: Profile) => {
      const n = normalize(p.name);
      if (n === "emily" || n === "vaibhavi") return 2;
      return 1;
    };
    return [...profiles].sort((a, b) => score(b) - score(a)).slice(0, limit);
  }, []);

  const fetchVerifiedProfiles = useCallback(async (): Promise<Profile[]> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const res = await fetch(`/api/users?limit=20`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const selfAddr = getSelfWorldAddress();
    const verified = (Array.isArray(data) ? data : [])
      // Exclude current user by world address, fallback to id
      .filter((u: any) => {
        const w = (u.worldAddress || "").toLowerCase();
        if (selfAddr && w === selfAddr) return false;
        if (!selfAddr && u.id === userId) return false;
        return true;
      });
    return uniqueAndAllowed(verified.map(mapUserToProfile));
  }, [mapUserToProfile, uniqueAndAllowed, getSelfWorldAddress]);

  const fetchPicks = useCallback(async (force = false) => {
    // Throttle repeat fetches within 15s and prevent concurrent runs
    const now = Date.now();
    if (inFlightRef.current) return;
    if (!force && now - lastFetchAtRef.current < 15000 && picks && picks.length > 0) return;

    inFlightRef.current = true;
    const shouldShowSkeleton = !picks || picks.length === 0;
    try {
      if (shouldShowSkeleton) setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/daily-picks?userId=${userId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "force-cache",
      });
      if (!res.ok) throw new Error("Failed to load daily picks");
      const data = await res.json();
      const selfAddr = getSelfWorldAddress();
      const filteredRaw = (Array.isArray(data) ? data : []).filter((item: any) => {
        const u = item?.user || {};
        const w = (u.worldAddress || "").toLowerCase();
        if (selfAddr && w === selfAddr) return false;
        if (!selfAddr && u.id === userId) return false;
        return true;
      });
      const mappedRaw: Profile[] = filteredRaw.map(mapApiToProfile);
      const mapped = uniqueAndAllowed(mappedRaw);

      if (mapped.length === 0) {
        // Fallback to verified profiles (users with worldAddress)
        const fallback = await fetchVerifiedProfiles();
        setPicks(prev => (prev && prev.length > 0 ? prev : pickTop(fallback)));
      } else {
        setPicks(pickTop(mapped));
      }
      lastFetchAtRef.current = Date.now();
    } catch (e: any) {
      setError(e?.message || "Failed to load daily picks");
      // Try verified fallback even if daily picks failed
      try {
        const fallback = await fetchVerifiedProfiles();
        setPicks(prev => (prev && prev.length > 0 ? prev : pickTop(fallback)));
      } catch {
        setPicks(prev => prev ?? []);
      }
    } finally {
      inFlightRef.current = false;
      if (shouldShowSkeleton) setLoading(false);
    }
  }, [mapApiToProfile, userId, fetchVerifiedProfiles, uniqueAndAllowed, getSelfWorldAddress, picks]);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  const handleAfterRefresh = useCallback(async () => {
    await fetchPicks(true);
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

      try {
        const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const worldAddrRaw = typeof window !== "undefined" ? localStorage.getItem("world_address") : null;
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

        let likerId: number | null = null;
        const worldAddress = worldAddrRaw ? worldAddrRaw.toLowerCase() : null;
        if (worldAddress) {
          const meRes = await fetch(`/api/users/by-world?address=${encodeURIComponent(worldAddress)}`, { headers });
          if (meRes.ok) {
            const meJson = await meRes.json();
            likerId = meJson?.id ?? meJson?.user?.id ?? null;
          }
        }
        if (!likerId) {
          const lsId = typeof window !== "undefined" ? Number(localStorage.getItem("user_id")) : NaN;
          likerId = Number.isFinite(lsId) && lsId > 0 ? lsId : userId;
        }

        const likeRes = await fetch("/api/likes", {
          method: "POST",
          headers,
          body: JSON.stringify({ likerId, likedId: p.id }),
        });
        if (!likeRes.ok) {
          // Soft warning only; payment already succeeded
        }
      } catch (_) {
        // Swallow errors so UX continues after payment confirmation
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