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

export const ProfileBuilder = ({ userId: userIdProp }: { userId?: number }) => {
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
  const [userId, setUserId] = useState<number | null>(userIdProp ?? null);
  const [worldMeta, setWorldMeta] = useState<{ address?: string; username?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Read World App linkage from localStorage
        const address = typeof window !== "undefined" ? localStorage.getItem("world_address") || undefined : undefined;
        const username = typeof window !== "undefined" ? localStorage.getItem("world_username") || undefined : undefined;
        if (mounted) setWorldMeta({ address, username });

        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Prefer loading by explicit userId prop if provided
        if (userIdProp) {
          const res = await fetch(`/api/users/${userIdProp}`, { headers });
          if (!res.ok) throw new Error("Failed to load profile");
          const u = await res.json();
          if (!mounted) return;
          setUserId(u?.id ?? userIdProp);
          setForm({
            name: u?.name ?? "",
            age: typeof u?.age === "number" ? u.age : "",
            location: u?.location ?? "",
            bio: u?.bio ?? "",
            avatarUrl: u?.avatarUrl ?? "",
          });
          return;
        }

        // Otherwise, try loading by World ID address if available
        if (address) {
          const res = await fetch(`/api/users/by-world?address=${encodeURIComponent(address)}`, { headers });
          if (res.status === 404) {
            // No user yet for this World ID – leave form empty
            if (!mounted) return;
            setUserId(null);
          } else if (!res.ok) {
            throw new Error("Failed to load profile");
          } else {
            const u = await res.json();
            if (!mounted) return;
            setUserId(u?.id ?? null);
            setForm({
              name: u?.name ?? "",
              age: typeof u?.age === "number" ? u.age : "",
              location: u?.location ?? "",
              bio: u?.bio ?? "",
              avatarUrl: u?.avatarUrl ?? "",
            });
          }
        } else {
          // No world linkage yet, keep empty form
          if (!mounted) return;
          setUserId(null);
        }
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
  }, [userIdProp]);

  const onChange = (key: keyof UserForm, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadError(null);
      const fd = new FormData();
      fd.append("file", file);
      const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const headers: HeadersInit = {};
      if (bearer) headers["Authorization"] = `Bearer ${bearer}`;
      const res = await fetch("/api/upload", { method: "POST", headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      if (data?.url) {
        setForm((f) => ({ ...f, avatarUrl: data.url }));
      }
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        name: form.name.trim(),
        age: typeof form.age === "string" ? parseInt(form.age) : form.age,
        location: form.location.trim(),
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        // Attach World linkage so backend can bind it
        worldAddress: worldMeta?.address || null,
        worldUsername: worldMeta?.username || null,
      };

      let res: Response;
      if (userId) {
        res = await fetch(`/api/users?id=${userId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/users`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save profile");

      // If created for the first time, store the returned id for future updates
      if (!userId && data?.id) setUserId(data.id);

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
                placeholder="https://images.example.com/you.jpg or /uploads/your-photo.jpg"
              />
              <div className="flex items-center gap-3">
                <label className="text-xs text-[var(--muted-foreground)]">or upload:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                  }}
                  className="text-sm"
                />
                {uploading && <span className="text-xs text-[var(--muted-foreground)]">Uploading...</span>}
                {uploadError && <span className="text-xs text-[var(--destructive)]">{uploadError}</span>}
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">Local uploads are saved under /uploads. External domains must be allowed in next.config.js for optimized images.</p>
            </div>

            {/* Save actions */}
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !form.name || !form.location || !form.age}
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {saving ? "Saving..." : userId ? "Save changes" : "Create profile"}
              </button>
              {message && <span className="text-sm text-[var(--foreground)]">{message}</span>}
              {error && <span className="text-sm text-[var(--destructive)]">{error}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Interests */}
      <div className="soft-card p-6">
        {userId ? (
          <InterestsPicker userId={userId} />
        ) : (
          <div className="text-sm text-[var(--muted-foreground)]">
            Create and save your profile first to pick interests.
          </div>
        )}
      </div>

      {/* Saved Profile Preview */}
      <div className="soft-card p-6">
        <h2 className="text-lg font-semibold mb-4">Your saved profile preview</h2>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--secondary)] overflow-hidden flex-shrink-0">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-xs text-[var(--muted-foreground)]">No image</div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-base font-medium">{form.name || "—"} {form.age ? <span className="text-[var(--muted-foreground)]">· {form.age}</span> : null}</div>
            <div className="text-sm text-[var(--muted-foreground)]">{form.location || "—"}</div>
            {worldMeta?.address && (
              <div className="text-xs text-[var(--muted-foreground)]">World ID: <span className="font-mono">{worldMeta.address}</span></div>
            )}
            {worldMeta?.username && (
              <div className="text-xs text-[var(--muted-foreground)]">World Username: <span className="font-mono">{worldMeta.username}</span></div>
            )}
            {form.bio && <p className="text-sm pt-2 max-w-prose">{form.bio}</p>}
          </div>
        </div>
      </div>

      <div className="soft-card p-4 text-sm text-[var(--muted-foreground)]">
        After saving, your profile details and interests will be used to personalize Daily Picks in the Dating section.
      </div>
    </div>
  );
};

export default ProfileBuilder;