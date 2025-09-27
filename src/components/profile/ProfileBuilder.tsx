"use client";

import { useEffect, useState } from "react";
import { InterestsPicker } from "@/components/InterestsPicker";

interface UserForm {
  name: string;
  age: number | "";
  location: string;
  bio: string;
  avatarUrl: string;
}

export const ProfileBuilder = ({ userId = 1 }: { userId?: number }) => {
  const [form, setForm] = useState<UserForm>({
    name: "",
    age: "",
    location: "",
    bio: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`/api/users/${userId}`, { headers });
        if (!res.ok) throw new Error("Failed to load profile");
        const u = await res.json();
        if (!mounted) return;
        setForm({
          name: u?.name ?? "",
          age: typeof u?.age === "number" ? u.age : "",
          location: u?.location ?? "",
          bio: u?.bio ?? "",
          avatarUrl: u?.avatarUrl ?? "",
        });
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onChange = (key: keyof UserForm, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name: form.name.trim(),
          age: typeof form.age === "string" ? parseInt(form.age) : form.age,
          location: form.location.trim(),
          bio: form.bio.trim(),
          avatarUrl: form.avatarUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save profile");
      setMessage("Profile saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="soft-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your profile</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Tell others about you. These details appear in Dating.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3 animate-pulse">
            <div className="h-10 w-full rounded bg-[var(--secondary)]" />
            <div className="h-10 w-2/3 rounded bg-[var(--secondary)]" />
            <div className="h-10 w-1/2 rounded bg-[var(--secondary)]" />
            <div className="h-24 w-full rounded bg-[var(--secondary)]" />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium">Name</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Age</label>
              <input
                type="number"
                min={18}
                max={99}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                value={form.age}
                onChange={(e) => onChange("age", e.target.value)}
                placeholder="24"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">Location</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                value={form.location}
                onChange={(e) => onChange("location", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="block text-sm font-medium">Bio</label>
              <textarea
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 min-h-28"
                value={form.bio}
                onChange={(e) => onChange("bio", e.target.value)}
                placeholder="Share a short intro about yourself (max 500 chars)"
                maxLength={500}
              />
              <div className="text-xs text-[var(--muted-foreground)]">{form.bio?.length || 0}/500</div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="block text-sm font-medium">Avatar URL</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
                value={form.avatarUrl}
                onChange={(e) => onChange("avatarUrl", e.target.value)}
                placeholder="https://images.example.com/you.jpg"
              />
              <p className="text-xs text-[var(--muted-foreground)]">We recommend a square image. External domains must be allowed in next.config.js or use a local /public asset.</p>
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !form.name || !form.location || !form.age}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
              {message && <span className="text-sm text-[var(--foreground)]">{message}</span>}
              {error && <span className="text-sm text-[var(--destructive)]">{error}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="soft-card p-6">
        <InterestsPicker userId={userId} />
      </div>

      <div className="soft-card p-4 text-sm text-[var(--muted-foreground)]">
        After saving, your profile details and interests will be used to personalize Daily Picks in the Dating section.
      </div>
    </div>
  );
};

export default ProfileBuilder;