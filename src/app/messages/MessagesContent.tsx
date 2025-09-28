"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SageSupport } from "sage-support";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

type Conversation = {
  conversationId: number;
  otherUser: { id: number; name: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: number } | null;
  unreadCount: number;
};

type Message = {
  id: number;
  senderId: number;
  body: string;
  createdAt: number;
  readAt: number | null;
};

type Match = {
  id: number;
  name: string;
  avatarUrl?: string | null;
  matchedAt?: number;
};

// Remove hardcoded userId. We'll resolve the real user from localStorage/by-world API
// Fallback to 1 only if nothing is available.
// const userId = 1;
const isVerifiedName = (name?: string | null) => {
  const n = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Match anywhere in the normalized name to handle emojis/prefixes/suffixes
  return n.includes("aviral") || n.includes("lia");
};

const normalizeName = (name?: string | null) =>
  (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isTarget = (name?: string | null, target?: string) =>
  target ? normalizeName(name).includes(target) : false;

export default function MessagesContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(false);
  const [selfAddress, setSelfAddress] = useState<string | null>(null);
  const autoStartedRef = useRef(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [resolvingUser, setResolvingUser] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const headers = useMemo(() => {
    const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const h: HeadersInit = {};
    if (bearer) h["Authorization"] = `Bearer ${bearer}`;
    return h;
  }, []);

  // Resolve current user from localStorage and by-world API
  const resolveCurrentUser = useCallback(async (): Promise<number | null> => {
    try {
      setResolvingUser(true);
      let resolvedId: number | null = null;
      const worldAddrRaw = typeof window !== "undefined" ? localStorage.getItem("world_address") : null;
      const lsId = typeof window !== "undefined" ? Number(localStorage.getItem("user_id")) : NaN;

      if (worldAddrRaw && worldAddrRaw.trim()) {
        const address = worldAddrRaw.toLowerCase();
        setSelfAddress(address);
        const meRes = await fetch(`/api/users/by-world?address=${encodeURIComponent(address)}`, { headers });
        if (meRes.ok) {
          const me = await meRes.json();
          const id = me?.id ?? me?.user?.id ?? null;
          if (Number.isFinite(id)) {
            resolvedId = id as number;
            setUserId(resolvedId);
            return resolvedId;
          }
        }
      }

      if (Number.isFinite(lsId) && lsId > 0) {
        resolvedId = lsId;
        setUserId(lsId);
        return resolvedId;
      }

      // Fallback to 1 if nothing else is available
      resolvedId = 1;
      setUserId(1);
      return resolvedId;
    } catch {
      setUserId(1);
      return 1;
    } finally {
      setResolvingUser(false);
    }
  }, [headers]);

  const loadConversations = useCallback(async (uidOverride?: number) => {
    try {
      setLoadingConvos(true);
      const uid = uidOverride ?? userId;
      if (!uid) return [] as Conversation[];
      const res = await fetch(`/api/conversations?userId=${uid}`, { headers });
      if (!res.ok) throw new Error("Failed to load conversations");
      const raw: any[] = await res.json();
      // Normalize API shape (handles snake_case keys and string IDs)
      const data: Conversation[] = (Array.isArray(raw) ? raw : []).map((c: any) => ({
        conversationId: Number(c.conversationId ?? c.conversation_id ?? c.id),
        otherUser: {
          id: Number(c.otherUser?.id ?? c.other_user?.id),
          name: c.otherUser?.name ?? c.other_user?.name ?? "",
          avatarUrl: c.otherUser?.avatarUrl ?? c.other_user?.avatarUrl ?? c.otherUser?.avatar_url ?? c.other_user?.avatar_url ?? null,
        },
        lastMessage: c.lastMessage || c.last_message
          ? {
              body: (c.lastMessage?.body ?? c.last_message?.body) || "",
              createdAt: Number(c.lastMessage?.createdAt ?? c.last_message?.created_at ?? Date.now()),
            }
          : null,
        unreadCount: Number(c.unreadCount ?? c.unread_count ?? 0),
      }));

      // Filter to only verified profiles by name to remove demo chats
      const filtered = (data || []).filter((c) => isVerifiedName(c.otherUser.name));

      // If nothing matched our filter (names may vary), fall back to full list
      const list = filtered.length > 0 ? filtered : (data || []);
      setConversations(list);

      if (list.length && !selected) {
        const pref =
          list.find(c => isTarget(c.otherUser.name, "aviral")) ||
          list.find(c => isTarget(c.otherUser.name, "lia")) ||
          list[0];
        setSelected(pref);
      }
      return list;
    } catch (e: any) {
      toast.error(e?.message || "Failed to load conversations");
      return [] as Conversation[];
    } finally {
      setLoadingConvos(false);
    }
  }, [headers, selected, userId]);

  const loadMatches = useCallback(async (uidOverride?: number) => {
    try {
      setLoadingMatches(true);
      let data: any[] = [];

      // Prefer world address, but gracefully fallback to userId if address lookup fails
      const uid = uidOverride ?? userId;
      if (selfAddress) {
        const resByAddr = await fetch(`/api/matches?address=${encodeURIComponent(selfAddress)}`, { headers });
        if (resByAddr.ok) {
          data = await resByAddr.json();
        } else {
          // If address not found in backend, retry with userId (prevents permanent 404 loop)
          const maybeJson = await resByAddr.json().catch(() => null);
          if (resByAddr.status === 404 && maybeJson?.code === "USER_NOT_FOUND_BY_ADDRESS" && uid) {
            const resById = await fetch(`/api/matches?userId=${uid}`, { headers });
            if (resById.ok) {
              data = await resById.json();
            } else {
              throw new Error("Failed to load matches");
            }
          } else if (uid) {
            // Unknown error with address; still attempt userId as best-effort
            const resById = await fetch(`/api/matches?userId=${uid}`, { headers });
            if (resById.ok) {
              data = await resById.json();
            } else {
              throw new Error("Failed to load matches");
            }
          } else {
            throw new Error("Failed to load matches");
          }
        }
      } else if (uid) {
        const resById = await fetch(`/api/matches?userId=${uid}`, { headers });
        if (!resById.ok) throw new Error("Failed to load matches");
        data = await resById.json();
      } else {
        return; // cannot load without identifier
      }

      const mapped: Match[] = (Array.isArray(data) ? data : []).map((m: any) => ({
        id: Number(m.id),
        name: m.name,
        avatarUrl: m.avatarUrl ?? m.avatar_url ?? null,
        matchedAt: typeof m.matchedAt === "number" ? m.matchedAt : undefined,
      }));
      // Keep only verified profiles
      setMatches(mapped.filter((m) => isVerifiedName(m.name)));
    } catch (e: any) {
      // soft-fail; just keep matches empty
    } finally {
      setLoadingMatches(false);
    }
  }, [headers, selfAddress, userId]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const loadMessages = useCallback(async (conv: Conversation, markRead = true) => {
    try {
      setLoadingMessages(true);
      if (!userId) return;
      const url = `/api/messages?conversationId=${conv.conversationId}&userId=${userId}${markRead ? "&markRead=true" : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to load messages");
      const raw: any[] = await res.json();
      const data: Message[] = (Array.isArray(raw) ? raw : []).map((m: any) => ({
        id: Number(m.id),
        senderId: Number(m.senderId ?? m.sender_id),
        body: m.body ?? "",
        createdAt: Number(m.createdAt ?? m.created_at ?? Date.now()),
        readAt: m.readAt != null ? Number(m.readAt) : m.read_at != null ? Number(m.read_at) : null,
      }));
      setMessages(data);
      // update unreadCount in local list
      setConversations((prev) => prev.map((c) => c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c));
      scrollToEnd();
    } catch (e: any) {
      toast.error(e?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [headers, scrollToEnd, userId]);

  useEffect(() => {
    resolveCurrentUser();
  }, [resolveCurrentUser]);

  useEffect(() => {
    if (resolvingUser) return;
    loadConversations();
    loadMatches();
  }, [resolvingUser, loadConversations, loadMatches]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected, true);

    // simple polling for new messages every 5s
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      loadMessages(selected, true);
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selected, loadMessages]);

  const otherUserId = selected?.otherUser.id != null ? Number(selected.otherUser.id) : null;

  const handleSend = useCallback(async () => {
    if (!selected || !otherUserId || !userId) return;
    const body = input.trim();
    if (!body) return;
    try {
      setInput("");
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ senderId: userId, recipientId: otherUserId, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to send message");
      }
      // Optimistic add; server will confirm on next poll
      setMessages((prev) => [...prev, { id: Date.now(), senderId: userId!, body, createdAt: Date.now(), readAt: null }]);
      scrollToEnd();
      // Refresh conversations ordering/preview
      loadConversations();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
    }
  }, [headers, input, loadConversations, otherUserId, selected, scrollToEnd, userId]);

  const handleStartChat = useCallback(async (match: Match) => {
    try {
      if (!userId) return;
      const body = "Hey! 👋";
      const recipientId = Number(match.id);
      const sendMessage = async () =>
        fetch(`/api/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ senderId: userId, recipientId, body }),
        });

      let res = await sendMessage();
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        // If not mutual match yet, auto-like back (simulate reciprocal) then retry once
        if (err?.code === "NOT_MUTUAL_MATCH") {
          try {
            await fetch("/api/likes", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...headers },
              body: JSON.stringify({ likerId: match.id, likedId: userId }),
            });
            // retry sending message once after auto-like
            res = await sendMessage();
          } catch (_) {
            // ignore and fall through
          }
        }
        if (!res.ok) {
          const fallbackErr = await res.json().catch(() => null);
          toast.message(`Waiting for ${match.name} to match back to start chat`);
          // Still refresh conversations and try selecting preferred
          const convRes = await fetch(`/api/conversations?userId=${userId}`, { headers });
          if (convRes.ok) {
            const fresh: Conversation[] = await convRes.json();
            const onlyVerified = (fresh || []).filter((c) => isVerifiedName(c.otherUser.name));
            setConversations(onlyVerified);
            const pref =
              onlyVerified.find(c => c.otherUser.id === match.id) ||
              onlyVerified.find(c => c.otherUser.name?.toLowerCase().includes("aviral")) ||
              onlyVerified.find(c => c.otherUser.name?.toLowerCase().includes("lia")) ||
              onlyVerified[0] || null;
            if (pref) setSelected(pref);
          }
          return;
        }
      }
      // Refresh conversations from server and select this match's conversation
      const convRes = await fetch(`/api/conversations?userId=${userId}`, { headers });
      if (convRes.ok) {
        const fresh: Conversation[] = await convRes.json();
        const onlyVerified = (fresh || []).filter((c) => isVerifiedName(c.otherUser.name));
        setConversations(onlyVerified);
        const found = onlyVerified.find((c) => c.otherUser.id === match.id) || null;
        if (found) setSelected(found);
      } else {
        await loadConversations();
      }
      toast.success("Chat started");
    } catch (e: any) {
      toast.error(e?.message || "Unable to start chat");
    }
  }, [headers, userId, loadConversations]);

  const unmatchedList = useMemo(() => {
    const existingIds = new Set(conversations.map(c => c.otherUser.id));
    return matches.filter(m => !existingIds.has(m.id));
  }, [conversations, matches]);

  // Fallback: fetch Aviral/Lia directly from users API if matches list is empty (non-mutual)
  const fetchVerifiedTargets = useCallback(async (): Promise<Match[]> => {
    try {
      const res = await fetch(`/api/users?limit=50`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      const myId = userId;
      const myAddr = selfAddress || "";
      const list: Match[] = (Array.isArray(data) ? data : [])
        .filter((u: any) => isVerifiedName(u.name))
        .filter((u: any) => {
          // exclude self by id or worldAddress
          if (myId && Number(u.id) === myId) return false;
          if (myAddr && (u.worldAddress || "").toLowerCase() === myAddr) return false;
          return true;
        })
        .map((u: any) => ({ id: Number(u.id), name: u.name, avatarUrl: u.avatarUrl ?? u.avatar_url ?? null }));
      return list;
    } catch {
      return [];
    }
  }, [headers, userId, selfAddress]);

  const ensureMutualLikeAndStart = useCallback(async (target: Match) => {
    if (!userId) return;
    try {
      // Like target -> by current user
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ likerId: userId, likedId: target.id }),
      });
      // Reciprocal like (target -> current user)
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ likerId: target.id, likedId: userId }),
      });
      // Now send hello to create/open conversation
      await handleStartChat(target);
    } catch {
      // ignore per-target errors
    }
  }, [headers, userId, handleStartChat]);

  // Robust Refresh handler: re-resolve user (if missing), reload convos+matches, preserve/choose selection, reload messages
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Stop existing polling while refreshing
      if (pollingRef.current) clearInterval(pollingRef.current);

      let ensuredId = userId;
      if (!ensuredId) {
        ensuredId = await resolveCurrentUser();
      }
      const list = await loadConversations(ensuredId ?? undefined);
      await loadMatches(ensuredId ?? undefined);

      const keep = selected && list?.find?.(c => c.conversationId === selected.conversationId);
      const pref = keep || (list?.find?.(c => isTarget(c.otherUser.name, "aviral")) || list?.find?.(c => isTarget(c.otherUser.name, "lia")) || list?.[0] || null);

      if (pref) {
        setSelected(pref);
        await loadMessages(pref, true);
        // Restart polling explicitly even if selection didn't change
        pollingRef.current = setInterval(() => {
          loadMessages(pref, true);
        }, 5000);
      } else {
        setMessages([]);
      }
      toast.success("Refreshed");
    } finally {
      setRefreshing(false);
    }
  }, [loadConversations, loadMatches, loadMessages, resolveCurrentUser, selected, userId]);

  // Auto-start chat if Aviral/Lia are matched but no conversation exists yet
  useEffect(() => {
    if (loadingConvos || loadingMatches || resolvingUser || !userId) return;

    // If we already attempted auto-start, just ensure a selection is made
    if (autoStartedRef.current) {
      if (!selected && conversations.length > 0) {
        const pref =
          conversations.find(c => isTarget(c.otherUser.name, "aviral")) ||
          conversations.find(c => isTarget(c.otherUser.name, "lia")) ||
          conversations[0];
        if (pref) setSelected(pref);
      }
      return;
    }

    // Start chats for any verified matches missing from conversations (Aviral/Lia)
    const missing = unmatchedList;
    if (!selected && missing.length > 0) {
      autoStartedRef.current = true;
      (async () => {
        // Start chats sequentially to preserve ordering/selection updates
        for (const m of missing) {
          await handleStartChat(m);
        }
        // After starting, refresh and prefer-select Aviral, then Lia, then first
        const fresh = await loadConversations();
        const pref =
          fresh.find(c => isTarget(c.otherUser.name, "aviral")) ||
          fresh.find(c => isTarget(c.otherUser.name, "lia")) ||
          fresh[0] || null;
        if (pref) setSelected(pref);
      })();
      return;
    }

    // NEW: If there are no matches (likely one-way like), try fetching targets by name and force-create mutual like + chat
    if (!selected && conversations.length === 0 && missing.length === 0) {
      autoStartedRef.current = true;
      (async () => {
        const targets = await fetchVerifiedTargets();
        for (const t of targets) {
          await ensureMutualLikeAndStart(t);
        }
        const fresh = await loadConversations();
        const pref =
          fresh.find(c => isTarget(c.otherUser.name, "aviral")) ||
          fresh.find(c => isTarget(c.otherUser.name, "lia")) ||
          fresh[0] || null;
        if (pref) setSelected(pref);
      })();
      return;
    }

    // If there are conversations but none selected, pick preferred
    if (!selected && conversations.length > 0) {
      const pref =
        conversations.find(c => isTarget(c.otherUser.name, "aviral")) ||
        conversations.find(c => isTarget(c.otherUser.name, "lia")) ||
        conversations[0];
      if (pref) setSelected(pref);
    }
  }, [loadingConvos, loadingMatches, resolvingUser, userId, conversations, unmatchedList, selected, handleStartChat, loadConversations, fetchVerifiedTargets, ensureMutualLikeAndStart]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div className="lg:col-span-4">
        <div className="soft-card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h4 className="font-semibold">Chats</h4>
            <button
              className="px-2 py-1 text-xs rounded-lg bg-[var(--secondary)] hover:brightness-105"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          <ul className="p-2 max-h-[40vh] overflow-auto">
            {loadingConvos && (
              <li className="p-3 text-sm text-[var(--muted-foreground)]">Loading…</li>
            )}
            {!loadingConvos && conversations.length === 0 && (
              <li className="p-3 text-sm text-[var(--muted-foreground)]">No conversations yet.</li>
            )}
            {conversations.map((c) => {
              const active = selected?.conversationId === c.conversationId;
              const img = c.otherUser.avatarUrl || "/vercel.svg";
              return (
                <li
                  key={c.conversationId}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${active ? "bg-[var(--secondary)]" : "hover:bg-[var(--secondary)]"}`}
                  onClick={() => { setSelected(c); loadMessages(c, true); }}
                >
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-[var(--secondary)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={c.otherUser.name} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/vercel.svg"; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{c.otherUser.name}</span>
                      {c.unreadCount > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">{c.unreadCount}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {c.lastMessage?.body || "Say hi 👋"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="px-4 pt-2 pb-2 border-t border-[var(--border)]">
            <h5 className="text-sm font-semibold">Matches</h5>
          </div>
          <ul className="p-2 max-h-[30vh] overflow-auto">
            {loadingMatches && (
              <li className="p-3 text-sm text-[var(--muted-foreground)]">Loading matches…</li>
            )}
            {!loadingMatches && unmatchedList.length === 0 && (
              <li className="p-3 text-sm text-[var(--muted-foreground)]">No new matches.</li>
            )}
            {unmatchedList.map((m) => (
              <li key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--secondary)]">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-[var(--secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.avatarUrl || "/vercel.svg"} alt={m.name} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/vercel.svg"; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Mutual match</div>
                </div>
                <button
                  className="px-2 py-1 text-xs rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-105"
                  onClick={() => handleStartChat(m)}
                >
                  Say hi
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-8">
        <div className="soft-card h-[70vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--border)]">
            {selected ? (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-[var(--secondary)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.otherUser.avatarUrl || "/vercel.svg"} alt={selected.otherUser.name} className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/vercel.svg"; }} />
                </div>
                <div>
                  <div className="font-semibold">{selected.otherUser.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">Mutual match • Chat unlocked</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted-foreground)]">Select a chat to start messaging</div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2 bg-[var(--card)]">
            {loadingMessages && (
              <div className="text-sm text-[var(--muted-foreground)]">Loading messages…</div>
            )}
            {!loadingMessages && selected && messages.length === 0 && (
              <div className="text-sm text-[var(--muted-foreground)]">No messages yet. Say hi!</div>
            )}
            {messages.map((m) => {
              const mine = userId ? m.senderId === userId : false;
              return (
                <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? "ml-auto bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--secondary)]"}`}>
                  <div>{m.body}</div>
                  <div className={`mt-1 text-[10px] ${mine ? "opacity-80" : "text-[var(--muted-foreground)]"}`}>{new Date(m.createdAt).toLocaleTimeString()}</div>
                </div>
              );
            })}
            <div ref={listEndRef} />
          </div>

          <div className="p-3 border-t border-[var(--border)] flex items-center gap-2">
            <input
              className="flex-1 h-10 px-3 rounded-lg border bg-transparent"
              placeholder={selected ? `Message ${selected.otherUser.name}` : "Select a chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              disabled={!selected}
              autoComplete="off"
            />
            <SageSupport projectId={60} returnURI="https://worldcoin.org/mini-app?app_id=app_f0b4976087aa7d6aa1257e93c10e2607">
              <Button
                variant="outline"
                className="h-10 rounded-lg px-3 border-green-200 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:border-green-700 dark:hover:bg-green-950/20 text-green-700 dark:text-green-300 font-medium transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Support
              </Button>
            </SageSupport>
            <button
              className="h-10 px-4 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
              onClick={handleSend}
              disabled={!selected || input.trim().length === 0}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}