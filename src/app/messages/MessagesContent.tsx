"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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

const userId = 1; // TODO: replace with session.user.id when auth is wired
const VERIFIED_NAMES = new Set(["Aviral", "Emily", "Lia", "Tanya"]);

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

  const headers = useMemo(() => {
    const bearer = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
    const h: HeadersInit = {};
    if (bearer) h["Authorization"] = `Bearer ${bearer}`;
    return h;
  }, []);

  const loadSelf = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, { headers });
      if (!res.ok) return;
      const u = await res.json();
      if (u?.worldAddress) setSelfAddress(u.worldAddress);
    } catch {
      // ignore
    }
  }, [headers]);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvos(true);
      const res = await fetch(`/api/conversations?userId=${userId}`, { headers });
      if (!res.ok) throw new Error("Failed to load conversations");
      const data: Conversation[] = await res.json();
      // Filter to only verified profiles by name to remove demo chats
      const filtered = (data || []).filter((c) => VERIFIED_NAMES.has(c.otherUser.name));
      setConversations(filtered);
      if (filtered.length && !selected) setSelected(filtered[0]);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load conversations");
    } finally {
      setLoadingConvos(false);
    }
  }, [headers, selected]);

  const loadMatches = useCallback(async () => {
    try {
      setLoadingMatches(true);
      const qp = selfAddress ? `address=${encodeURIComponent(selfAddress)}` : `userId=${userId}`;
      const res = await fetch(`/api/matches?${qp}`, { headers });
      if (!res.ok) throw new Error("Failed to load matches");
      const data = await res.json();
      const mapped: Match[] = (Array.isArray(data) ? data : []).map((m: any) => ({
        id: m.id,
        name: m.name,
        avatarUrl: m.avatarUrl ?? m.avatar_url ?? null,
        matchedAt: typeof m.matchedAt === "number" ? m.matchedAt : undefined,
      }));
      // Keep only verified profiles
      setMatches(mapped.filter((m) => VERIFIED_NAMES.has(m.name)));
    } catch (e: any) {
      // soft-fail; just keep matches empty
    } finally {
      setLoadingMatches(false);
    }
  }, [headers, selfAddress]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const loadMessages = useCallback(async (conv: Conversation, markRead = true) => {
    try {
      setLoadingMessages(true);
      const url = `/api/messages?conversationId=${conv.conversationId}&userId=${userId}${markRead ? "&markRead=true" : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to load messages");
      const data: Message[] = await res.json();
      setMessages(data);
      // update unreadCount in local list
      setConversations((prev) => prev.map((c) => c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c));
      scrollToEnd();
    } catch (e: any) {
      toast.error(e?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [headers, scrollToEnd]);

  useEffect(() => {
    loadSelf();
    loadConversations();
    loadMatches();
  }, [loadConversations, loadMatches, loadSelf]);

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

  const otherUserId = selected?.otherUser.id ?? null;

  const handleSend = useCallback(async () => {
    if (!selected || !otherUserId) return;
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
      setMessages((prev) => [...prev, { id: Date.now(), senderId: userId, body, createdAt: Date.now(), readAt: null }]);
      scrollToEnd();
      // Refresh conversations ordering/preview
      loadConversations();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send message");
    }
  }, [headers, input, loadConversations, otherUserId, selected, scrollToEnd]);

  const handleStartChat = useCallback(async (match: Match) => {
    try {
      const body = "Hey! 👋";
      const res = await fetch(`/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ senderId: userId, recipientId: match.id, body }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Failed to start chat");
      }
      // Refresh conversations and select the one with this match
      await loadConversations();
      const newly = (prev => prev)(undefined as any); // no-op to satisfy TS in snippet context
      const conv = (cvs: Conversation[]) => cvs.find(c => c.otherUser.id === match.id);
      const found = conv(conversations);
      if (found) setSelected(found);
      toast.success("Chat started");
    } catch (e: any) {
      toast.error(e?.message || "Unable to start chat");
    }
  }, [headers, conversations, loadConversations]);

  const unmatchedList = useMemo(() => {
    const existingIds = new Set(conversations.map(c => c.otherUser.id));
    return matches.filter(m => !existingIds.has(m.id));
  }, [conversations, matches]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      <div className="lg:col-span-4">
        <div className="soft-card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h4 className="font-semibold">Chats</h4>
            <button
              className="px-2 py-1 text-xs rounded-lg bg-[var(--secondary)] hover:brightness-105"
              onClick={() => { loadConversations(); loadMatches(); }}
              disabled={loadingConvos}
            >
              Refresh
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
                  onClick={() => setSelected(c)}
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
              const mine = m.senderId === userId;
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