"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/hooks/useSession";
import { InterestsPicker } from "@/components/InterestsPicker";
import { useAccount } from "wagmi";

export const InterestsPickerWithSession = () => {
  const { user, isLoading, signIn, refetch } = useSession();
  const { isConnected, address } = useAccount();
  const [signing, setSigning] = useState(false);
  const attemptedAutoSignIn = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    // First, try to refetch in case a valid cookie/bearer already exists
    if (isConnected && !user && !attemptedAutoSignIn.current && !signing) {
      (async () => {
        await refetch();
        // If still no user after refetch, attempt SIWE sign-in once
        if (!user && !attemptedAutoSignIn.current) {
          attemptedAutoSignIn.current = true;
          setSigning(true);
          try { await signIn(); } finally { setSigning(false); }
        }
      })();
    }
  }, [isConnected, user, isLoading, signIn, refetch, signing]);

  if (isLoading) {
    return (
      <div className="text-sm text-[var(--muted-foreground)]">Loading your session…</div>
    );
  }

  // Show prompt when there is no session user yet (regardless of id value)
  if (!user) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--muted)] p-4 text-sm text-[var(--accent-foreground)] flex items-center justify-between gap-3">
        <span>
          {isConnected
            ? `Wallet ${address?.slice(0, 6)}…${address?.slice(-4)} connected. Please sign in to continue.`
            : "Please connect your wallet and sign in to select interests."}
        </span>
        {isConnected && (
          <button
            type="button"
            onClick={async () => {
              setSigning(true);
              try { await signIn(); await refetch(); } finally { setSigning(false); }
            }}
            disabled={signing}
            className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-60"
          >
            {signing ? "Signing…" : "Sign in"}
          </button>
        )}
      </div>
    );
  }

  return <InterestsPicker userId={user.id} />;
};

export default InterestsPickerWithSession;