"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/profile";
  const registered = search.get("registered") === "true";
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.push(redirect);
    }
  }, [session, isPending, router, redirect]);

  useEffect(() => {
    if (registered) {
      toast.success("Account created! Please sign in.");
    }
  }, [registered]);

  const [form, setForm] = useState({ email: "", password: "", rememberMe: true });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe,
      callbackURL: redirect,
    });

    if (error?.code) {
      toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
      setSubmitting(false);
      return;
    }

    // Token is stored by auth-client; redirect to protected route
    router.push(redirect);
  };

  return (
    <div className="min-h-[60svh] flex items-center justify-center">
      <div className="soft-card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="off"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                id="remember"
                checked={form.rememberMe}
                onCheckedChange={(v) => setForm((f) => ({ ...f, rememberMe: Boolean(v) }))}
              />
              <span>Remember me</span>
            </label>
            <a href="/register" className="text-sm text-[var(--primary)] hover:underline">Create account</a>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}