"use client";

import { useEffect, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

type Props = {
  onSuccess?: (info: { address?: string; username?: string }) => void;
  compact?: boolean;
};

export const WorldAppSignIn = ({ onSuccess, compact = false }: Props) => {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Detect World App / MiniKit
  useEffect(() => {
    const check = () => setInstalled(MiniKit.isInstalled());
    check();
    const t = setInterval(check, 1000);
    return () => clearInterval(t);
  }, []);

  async function handleSignIn() {
    try {
      setLoading(true);
      setMessage("");

      if (!MiniKit.isInstalled()) {
        setMessage(
          "World App (MiniKit) not detected. Open from World App or enable MiniKit."
        );
        return;
      }

      // Prefer nonce from backend; fallback for demo
      const nonce = crypto.randomUUID();

      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: "login-0",
        statement: "Sign in to YourApp",
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      if ((finalPayload as any)?.status === "error") {
        setMessage("Authentication was cancelled or failed.");
        return;
      }

      // TODO: Verify SIWE on your backend
      // const verify = await fetch("/api/complete-siwe", { ... })
      // if (!verify?.isValid) { setMessage("Server verification failed."); return; }

      const address = (finalPayload as any)?.address as string | undefined;
      const username = MiniKit.user?.username as string | undefined;

      // Mark signed-in locally for demo gating
      try {
        localStorage.setItem("world_signed_in", "1");
        if (address) localStorage.setItem("world_address", address);
        if (username) localStorage.setItem("world_username", username);
      } catch {}

      setMessage(`Signed in as ${username || address || "user"}.`);

      // Notify parent to reveal next section (ProfileBuilder)
      onSuccess?.({ address, username });
    } catch (err) {
      console.error(err);
      setMessage("Something went wrong during sign in.");
    } finally {
      setLoading(false);
    }
  }

  const Card = (
    <div className="w-full max-w-[420px] bg-white text-neutral-900 border border-[var(--border)] p-6 shadow-md rounded-xl">
      <h1 className="m-0 text-2xl font-extrabold tracking-wide text-neutral-900">Sign in</h1>
      <p className="mt-2 mb-4 text-neutral-600">Use your World App to sign in.</p>

      <button
        onClick={handleSignIn}
        disabled={loading || installed === false}
        className="w-full h-12 font-extrabold uppercase border-2 border-violet-900 bg-violet-500 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-violet-600 transition-colors rounded-lg"
      >
        {loading ? "Connecting..." : "Sign in with World App"}
      </button>

      <div className="mt-3 text-xs text-neutral-500">
        {installed === false && (
          <div>MiniKit not detected. Open this mini-app inside World App.</div>
        )}
        {message && <div className="mt-2 text-neutral-900">{message}</div>}
      </div>
    </div>
  );

  if (compact) return Card;

  return (
    <main className="min-h-[40dvh] grid place-items-center">
      {Card}
    </main>
  );
};