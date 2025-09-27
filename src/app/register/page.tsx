"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // no-op; keep hook for potential future effects
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);

    const { error } = await authClient.signUp.email({
      email: form.email,
      name: form.name,
      password: form.password,
    });

    if (error?.code) {
      const map: Record<string, string> = {
        USER_ALREADY_EXISTS: "Email already registered",
      };
      toast.error(map[error.code] || "Registration failed");
      setSubmitting(false);
      return;
    }

    toast.success("Account created! Please sign in.");
    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-[60svh] flex items-center justify-center">
      <div className="soft-card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">Join LavenDate in seconds</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Alex Johnson"
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="off"
              required
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-xs text-center text-[var(--muted-foreground)]">
            Already have an account? <a href="/login" className="text-[var(--primary)] hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}