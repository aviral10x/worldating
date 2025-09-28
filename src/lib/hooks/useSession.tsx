"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import { useSignMessage } from "wagmi";

export type SessionUser = {
  id: number;
  walletAddress: string | null;
} | null;

interface SessionContextValue {
  user: SessionUser;
  isLoading: boolean;
  refetch: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined
);

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<SessionUser>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      // Include bearer token if present to allow session without cookie
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token")
          : null;
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const res = await fetch("/api/session", {
        credentials: "include",
        headers,
        cache: "no-store",
      });
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load session on mount
    refetch();
  }, [refetch]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address || !chainId) {
      // The wallet connect modal will be triggered from UI via RainbowKit
      return;
    }

    const signWithNonce = async () => {
      // 1) Get nonce
      const nonceRes = await fetch("/api/siwe/nonce", {
        credentials: "include",
      });
      const { nonce } = await nonceRes.json();

      // 2) Build SIWE message (EIP-4361)
      const domain = window.location.hostname; // avoid port in SIWE domain
      const origin = window.location.origin;
      const issuedAt = new Date().toISOString();

      const message = `${domain} wants you to sign in with your Ethereum account:\n${address}\n\nSign in to WorlDate.\n\nURI: ${origin}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}`;

      // 3) Sign message
      const signature = await signMessageAsync({ message });

      // 4) Verify on server
      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address, message, signature, chainId }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes
          .json()
          .catch(async () => ({ raw: await verifyRes.text() }));
        const code = err?.code;
        const messageText = err?.error || err?.raw || "Failed to verify SIWE";
        throw Object.assign(new Error(messageText), { code });
      }

      const verified = await verifyRes.json();
      if (verified?.bearer_token) {
        try {
          localStorage.setItem("bearer_token", verified.bearer_token);
        } catch {}
      }
      // Optimistically set user to update UI immediately
      if (verified?.user?.id) {
        setUser({
          id: verified.user.id,
          walletAddress: verified.user.walletAddress ?? null,
        });
      }
    };

    // Try once, and if we hit a nonce-related error, retry once with a fresh nonce
    try {
      try {
        await signWithNonce();
      } catch (e: any) {
        if (e?.code === "MISSING_NONCE" || e?.code === "NONCE_MISMATCH") {
          await signWithNonce();
        } else {
          throw e;
        }
      }

      await refetch();
    } catch (e) {
      // Swallow errors to avoid unhandledrejection runtime errors; surface via console for now
      console.error("SIWE signIn failed:", e);
    }
  }, [isConnected, address, chainId, signMessageAsync, refetch]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/siwe/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      try {
        localStorage.removeItem("bearer_token");
      } catch {}
      setUser(null);
      // optionally disconnect wallet to avoid confusion
      try {
        disconnect();
      } catch {}
    }
  }, [disconnect]);

  const value = useMemo(
    () => ({ user, isLoading, refetch, signIn, signOut }),
    [user, isLoading, refetch, signIn, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
};
