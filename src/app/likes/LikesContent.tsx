"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { LikesList } from "@/components/LikesList";
import { Profile, ProfileCard } from "@/components/ProfileCard";
import { toast } from "sonner";
import { MiniKit, Tokens, PayCommandInput, tokenToDecimals } from "@worldcoin/minikit-js";

// Destination address for MiniKit pay (no smart contract/escrow)
const DEST = process.env.NEXT_PUBLIC_MINIKIT_DEST as string | undefined;

export const LikesContent = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Load real users and map to ProfileCard shape
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const headers: HeadersInit = {};
        if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
        const res = await fetch(`/api/users?limit=50`, { headers });
        const list = await res.json();
        if (!mounted) return;
        const mapped: Profile[] = (list || []).map((u: any) => ({
          id: u.id,
          name: u.name,
          age: typeof u.age === "number" ? u.age : 0,
          distanceKm: 0,
          bio: u.bio || "",
          tags: [],
          photoUrl: (() => {
            const src = u.avatarUrl || u.avatar_url || "";
            return /pravatar\.cc|i\.pravatar\.cc/.test(src) ? "/vercel.svg" : src || "/vercel.svg";
          })(),
        }));
        setProfiles(mapped);
        if (mapped.length && selectedUserId == null) setSelectedUserId(mapped[0].id);
      } catch (e) {
        // noop
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [selectedUserId]);

  const selectedProfile: Profile[] = useMemo(() => {
    if (!selectedUserId) return profiles.slice(0, 1);
    const found = profiles.find((p) => p.id === selectedUserId);
    return found ? [found] : profiles.slice(0, 1);
  }, [profiles, selectedUserId]);

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

      // 1) Create a reference for this payment
      const initRes = await fetch("/api/initiate-payment", { method: "POST" });
      if (!initRes.ok) throw new Error("Failed to initiate payment");
      const { id: reference } = await initRes.json();

      // 2) Build MiniKit pay payload for 0.01 WLD
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

      // 3) Confirm via Developer Portal API
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

      // 4) Record the like so your profile shows on their Likes tab
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
          likerId = Number.isFinite(lsId) && lsId > 0 ? lsId : null;
        }

        if (likerId) {
          const likeRes = await fetch("/api/likes", {
            method: "POST",
            headers,
            body: JSON.stringify({ likerId, likedId: p.id }),
          });
          // Best-effort; even if already liked, API returns 200
          if (!likeRes.ok) {
            // Soft warning, but do not fail the flow as payment already succeeded
            // We avoid toast.error here to prevent noisy UX
            // console.warn('Failed to record like');
          }
        }
      } catch (_) {
        // Swallow errors to avoid blocking UX after a successful payment confirmation
      }

      toast.success("Payment confirmed ✅");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to complete payment");
    }
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div className="lg:col-span-4 order-2 lg:order-1">
        <LikesList onSelect={setSelectedUserId} />
      </div>
      <div className="lg:col-span-8 order-1 lg:order-2">
        <ProfileCard
          profiles={selectedProfile}
          onLike={handleStake}
        />
      </div>
    </div>
  );
};

export default LikesContent;