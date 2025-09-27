"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { WorldAppSignIn } from "@/components/profile/WorldAppSignIn";

// Lazy-load ProfileBuilder only after sign-in to keep initial bundle small
const LazyProfileBuilder = dynamic(
  () => import("@/components/profile/ProfileBuilder").then(m => m.ProfileBuilder ?? m.default),
  { ssr: false, loading: () => (
    <div className="soft-card p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-1/3 rounded bg-[var(--secondary)]" />
        <div className="h-10 w-full rounded bg-[var(--secondary)]" />
        <div className="h-10 w-2/3 rounded bg-[var(--secondary)]" />
        <div className="h-24 w-full rounded bg-[var(--secondary)]" />
      </div>
    </div>
  ) }
);

export const ProfileGate = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<{ address?: string; username?: string } | null>(null);

  useEffect(() => {
    try {
      const flag = localStorage.getItem("world_signed_in");
      const address = localStorage.getItem("world_address") || undefined;
      const username = localStorage.getItem("world_username") || undefined;
      setSignedIn(flag === "1");
      setUserInfo({ address, username });
    } catch {
      setSignedIn(false);
    }
  }, []);

  const handleSuccess = (info?: { address?: string; username?: string }) => {
    setSignedIn(true);
    if (info) setUserInfo(info);
  };

  // While determining state
  if (signedIn === null) {
    return (
      <div className="min-h-[40dvh] grid place-items-center">
        <div className="soft-card p-6">Checking sign-in…</div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-xl">
        <WorldAppSignIn compact onSuccess={handleSuccess} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Optionally show who signed in via World */}
      { (userInfo?.username || userInfo?.address) && (
        <div className="soft-card p-4 text-sm text-[var(--muted-foreground)]">
          Signed in as <span className="font-medium text-[var(--foreground)]">{userInfo.username || userInfo.address}</span>
        </div>
      ) }
      <LazyProfileBuilder />
    </div>
  );
};

export default ProfileGate;