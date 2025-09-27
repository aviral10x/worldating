"use client";

import { useEffect, useMemo, useState } from "react";

type Interest = { id: number; name: string };

interface InterestsPickerProps {
  userId?: number; // default to 1 if not provided
}

export const InterestsPicker = ({ userId = 1 }: InterestsPickerProps) => {
  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helpers
  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch all interests
        const res = await fetch("/api/interests", { headers, credentials: "include" });
        if (!res.ok) throw new Error("Failed to load interests");
        const data: Interest[] = await res.json();
        if (!mounted) return;
        setAllInterests(data);

        // Prefill current selections from user profile (if available)
        const ures = await fetch(`/api/users/${userId}`, { headers, credentials: "include" });
        if (ures.ok) {
          const u = await ures.json();
          const ids = (u?.interests || []).map((i: any) => i.id as number);
          setSelected(new Set(ids));
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allInterests;
    return allInterests.filter((i) => i.name.toLowerCase().includes(q));
  }, [allInterests, query]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch("/api/user-interests", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ userId, interestIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save interests");
      }
      setMessage(`Saved ${data?.count ?? selected.size} interests`);
    } catch (e: any) {
      setError(e?.message || "Failed to save interests");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Choose your interests</h1>
        <p className="text-sm text-[var(--muted-foreground)]">This helps us tailor your Daily Picks.</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search interests..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2"
        />
        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">{selected.size} selected</span>
      </div>

      <div className="soft-card p-3 min-h-32">
        {loading ? (
          <div className="text-sm text-[var(--muted-foreground)]">Loading interests...</div>
        ) : error ? (
          <div className="text-sm text-[var(--destructive)]">{error}</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((i) => {
              const active = selected.has(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggle(i.id)}
                  className={`tag px-3 py-1 text-sm ${active ? "border-[var(--ring)] ring-2 ring-[var(--ring)]" : ""}`}
                >
                  {i.name}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-sm text-[var(--muted-foreground)]">No interests found.</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || selected.size === 0}
          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save interests"}
        </button>
        {message && <span className="text-sm text-[var(--foreground)]">{message}</span>}
        {error && <span className="text-sm text-[var(--destructive)]">{error}</span>}
      </div>
    </div>
  );
};