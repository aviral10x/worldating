"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { LikesList } from "@/components/LikesList";
import { Profile, ProfileCard } from "@/components/ProfileCard";
import { toast } from "sonner";

export const LikesContent = () => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
          photoUrl: u.avatarUrl || "/vercel.svg",
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

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleStake = useCallback(async (p: Profile) => {
    try {
      toast.dismiss();
      const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

      toast.loading("Preparing stake...");
      const initRes = await fetch("/api/stake/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({
          targetProfile: { id: p.id, name: p.name },
        }),
      });

      const init = await initRes.json();
      if (!initRes.ok) {
        throw new Error(init?.error || "Failed to initiate stake");
      }

      const { escrowAddress, stakeAmountWei, wldTokenAddress, ref } = init as {
        escrowAddress: string;
        stakeAmountWei: string;
        wldTokenAddress: string | null;
        ref: string;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mini: any = (globalThis as any).MiniKit;
      if (!mini?.commands?.pay) {
        toast.error("World App not available. Open inside World App to stake.");
        return;
      }

      toast.dismiss();
      toast.message("Confirm payment in World App", {
        description: `Staking to ${p.name}...`,
      });

      const payRes = await mini.commands.pay({
        to: escrowAddress,
        tokens: [
          {
            address: wldTokenAddress ?? "native",
            amount: stakeAmountWei,
          },
        ],
        reference: ref,
      });

      if (!payRes || payRes.status === "failed") {
        toast.error("Payment failed or cancelled");
        return;
      }

      toast.success("Stake submitted. Waiting for confirmation...");

      let checks = 0;
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          checks++;
          const res = await fetch("/api/stake/status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
            },
            body: JSON.stringify({ ref }),
          });
          const data = await res.json();
          if (data?.status === "matched") {
            toast.success("Matched! Chat unlocked.");
            stopPolling();
          } else if (data?.status === "confirmed") {
            toast.success("Stake confirmed. Waiting for them to stake back.");
          }
          if (checks > 30) {
            stopPolling();
            toast.message("Still pending", { description: "We'll keep this running in the background." });
          }
        } catch {
          // ignore single poll errors
        }
      }, 2000);
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || "Failed to stake");
    }
  }, [stopPolling]);

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