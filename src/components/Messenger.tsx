"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

export type PartnerInfo = {
  id: number;
  username: string;
  displayName: string;
  experienceLevel: "beginner" | "mediocre" | "elite";
  avatarGlyph: string;
};

export type QuickTitle = {
  slug: string;
  name: string;
  format: string;
  accent: string;
  accentSoft?: string;
  glyph?: string;
  texture?: string;
  year?: number;
  rating?: number;
};

export type MessageItem = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  titleSlug: string | null;
  read: boolean;
  createdAt: string;
  titleCard?: QuickTitle | null;
};

export type ConversationSummary = {
  partner: PartnerInfo;
  lastMessage: string;
  lastMessageAt: string;
  isOutgoing: boolean;
  unreadCount: number;
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  mediocre: "border-sky-500/40 text-sky-400 bg-sky-500/10",
  elite: "border-amber-500/40 text-amber-400 bg-amber-500/10",
};

export function Messenger({
  currentUser,
  initialWithUsername,
  availableTitles,
}: {
  currentUser: SessionUser;
  initialWithUsername?: string;
  availableTitles: QuickTitle[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUsername = searchParams.get("with") || initialWithUsername || null;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [allUsers, setAllUsers] = useState<PartnerInfo[]>([]);
  const [serverSearchResults, setServerSearchResults] = useState<PartnerInfo[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activePartner, setActivePartner] = useState<PartnerInfo | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedTitleSlug, setSelectedTitleSlug] = useState<string>("");
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [titlePickerSearch, setTitlePickerSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePartnerRef = useRef<PartnerInfo | null>(activePartner);

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Fetch messages with active partner (silent polling vs manual load)
  const fetchMessages = useCallback(
    async (partnerIdOrUsername: number | string, isSilent = false) => {
      if (!isSilent) setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?with=${encodeURIComponent(String(partnerIdOrUsername))}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok) {
          const newMsgs: MessageItem[] = data.messages || [];

          setMessages((prev) => {
            if (
              prev.length === newMsgs.length &&
              prev.every((m, idx) => m.id === newMsgs[idx]?.id)
            ) {
              return prev;
            }

            if (newMsgs.length > prev.length) {
              setTimeout(() => scrollToBottom(true), 60);
            }
            return newMsgs;
          });

          if (data.partner) {
            setActivePartner((prev) => (prev?.id === data.partner.id ? prev : data.partner));
            setAllUsers((prev) => {
              const exists = prev.some((u) => u.id === data.partner.id);
              return exists ? prev : [data.partner, ...prev];
            });
          }

          if (!isSilent) {
            setTimeout(() => scrollToBottom(false), 50);
          }
        }
      } catch {
        // silent error suppression
      } finally {
        if (!isSilent) setLoadingMessages(false);
      }
    },
    [scrollToBottom],
  );

  // Refresh inbox summary list without touching messages feed
  const refreshInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setConversations(data.conversations || []);
        if (Array.isArray(data.allUsers) && data.allUsers.length > 0) {
          setAllUsers((prev) => {
            const map = new Map<number, PartnerInfo>();
            for (const u of data.allUsers) map.set(u.id, u);
            for (const u of prev) map.set(u.id, u);
            return Array.from(map.values());
          });
        }
      }
    } catch {
      // silent
    }
  }, []);

  // Initial load & handle ?with= URL param
  useEffect(() => {
    let ignore = false;
    async function loadInitial() {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data.ok) {
          setConversations(data.conversations || []);
          setAllUsers(data.allUsers || []);

          if (targetUsername) {
            // First check if user is already in initial allUsers
            const found = (data.allUsers as PartnerInfo[])?.find(
              (u) => u.username.toLowerCase() === targetUsername.toLowerCase(),
            );
            if (found) {
              setActivePartner(found);
              void fetchMessages(found.id, false);
            } else {
              // Direct server lookup by username
              void fetchMessages(targetUsername, false);
            }
          }
        }
      } catch {
        // ignore
      }
    }
    void loadInitial();
    return () => {
      ignore = true;
    };
  }, [targetUsername, fetchMessages]);

  // Respond whenever URL ?with= changes (e.g. user selected someone from search modal)
  useEffect(() => {
    if (!targetUsername) return;
    if (activePartnerRef.current?.username?.toLowerCase() === targetUsername.toLowerCase()) {
      return;
    }
    const found = allUsers.find(
      (u) => u.username.toLowerCase() === targetUsername.toLowerCase(),
    );
    if (found) {
      setActivePartner(found);
      void fetchMessages(found.id, false);
    } else {
      void fetchMessages(targetUsername, false);
    }
  }, [targetUsername, allUsers, fetchMessages]);

  // Dynamic server search when typing in Messenger search box
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setServerSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/messages?search=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ok && Array.isArray(data.users)) {
            setServerSearchResults(data.users);
          }
        }
      } catch {
        // silent
      } finally {
        setIsSearchingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Silent polling every 4s: refreshes inbox and active conversation without flashing
  useEffect(() => {
    const timer = setInterval(() => {
      void refreshInbox();
      if (activePartnerRef.current) {
        void fetchMessages(activePartnerRef.current.id, true);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [refreshInbox, fetchMessages]);

  // Select a conversation partner
  const selectPartner = (partner: PartnerInfo) => {
    setActivePartner(partner);
    setSearchQuery("");
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === partner.id);
      return exists ? prev : [partner, ...prev];
    });
    router.replace(`/messages?with=${partner.username}`, { scroll: false });
    void fetchMessages(partner.id, false);
  };

  // Back to inbox on mobile
  const handleBackToInbox = () => {
    setActivePartner(null);
    router.replace("/messages", { scroll: false });
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePartner) return;
    if (!inputText.trim() && !selectedTitleSlug) return;

    const content = inputText.trim();
    const titleSlug = selectedTitleSlug || undefined;

    // Optimistic UI update
    const tempId = Date.now();
    const matchedTitle = titleSlug ? availableTitles.find((t) => t.slug === titleSlug) ?? null : null;
    const optimisticMsg: MessageItem = {
      id: tempId,
      senderId: currentUser.id,
      receiverId: activePartner.id,
      content,
      titleSlug: titleSlug || null,
      read: false,
      createdAt: new Date().toISOString(),
      titleCard: matchedTitle,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSelectedTitleSlug("");
    setShowTitlePicker(false);
    setSending(true);
    setTimeout(() => scrollToBottom(true), 40);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activePartner.id,
          content,
          titleSlug,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: data.message.id } : m)),
          );
        }
      }
      void refreshInbox();
    } catch {
      // keep message in view
    } finally {
      setSending(false);
    }
  };

  // Combined live users for search in left sidebar
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const map = new Map<number, PartnerInfo>();
    // First from in-memory allUsers
    for (const u of allUsers) {
      if (
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q)
      ) {
        map.set(u.id, u);
      }
    }
    // Then from server search results
    for (const u of serverSearchResults) {
      map.set(u.id, u);
    }
    // Never show self in search results
    map.delete(currentUser.id);
    return Array.from(map.values());
  }, [searchQuery, allUsers, serverSearchResults, currentUser.id]);

  // Filtered titles for title recommendation picker
  const filteredAvailableTitles = titlePickerSearch.trim()
    ? availableTitles.filter((t) =>
        t.name.toLowerCase().includes(titlePickerSearch.toLowerCase()),
      )
    : availableTitles;

  const isChatOpenOnMobile = activePartner !== null;

  return (
    <div className="mx-auto max-w-6xl px-2 py-4 sm:px-6 sm:py-8">
      {/* Container simulating Instagram Direct Web Interface */}
      <div className="panel grain overflow-hidden rounded-xl border border-line bg-ink/90 shadow-2xl backdrop-blur-xl h-[calc(100dvh-130px)] min-h-[520px] max-h-[820px] flex md:grid md:grid-cols-[320px_1fr]">
        {/* ================= LEFT SIDEBAR (Inbox & Threads) ================= */}
        {/* Hidden on mobile when chat is open */}
        <aside
          className={`h-full flex-col border-b border-line md:border-b-0 md:border-r w-full md:w-[320px] shrink-0 ${
            isChatOpenOnMobile ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="display grid h-8 w-8 place-items-center bg-paper text-xs font-bold text-ink">
                {currentUser.avatarGlyph}
              </span>
              <div>
                <span className="display block text-sm font-semibold tracking-tight text-paper">
                  {currentUser.displayName}
                </span>
                <span className="mono block text-[9px] text-mute">@{currentUser.username}</span>
              </div>
            </div>
            <div className="mono flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/5 px-2.5 py-1 text-[9px] text-paper">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <span>Direct</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="border-b border-line px-3.5 py-2.5">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panelist or username..."
                className="w-full rounded-lg border border-line bg-black/40 px-3 py-1.5 pl-8 text-xs text-paper placeholder:text-mute focus:border-paper focus:outline-none"
              />
              <span className="absolute left-2.5 top-2 text-xs text-mute">🔍</span>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-[10px] text-mute hover:text-paper"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          {/* Thread List / Search Results */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/40">
            {searchQuery.trim() ? (
              <div>
                <div className="mono bg-white/[0.02] px-4 py-2 text-[9px] uppercase tracking-wider text-mute flex items-center justify-between">
                  <span>Search Results ({filteredUsers.length})</span>
                  {isSearchingUsers ? (
                    <span className="animate-pulse text-amber-400 text-[8.5px]">searching...</span>
                  ) : null}
                </div>
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-dim">
                    <p>{isSearchingUsers ? "Searching for panelists..." : `No panelists matched "${searchQuery}".`}</p>
                    <div className="mt-3">
                      <Link
                        href={`/library?q=${encodeURIComponent(searchQuery)}&tab=users`}
                        className="mono text-[10px] text-paper underline hover:text-white"
                      >
                        Search all panelists in Library →
                      </Link>
                    </div>
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectPartner(u)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 group"
                    >
                      <div className="display grid h-10 w-10 shrink-0 place-items-center border border-line bg-black/50 text-sm text-paper">
                        {u.avatarGlyph}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium text-paper">
                            {u.displayName}
                          </span>
                          <span
                            className={`mono rounded px-1.5 py-0.2 text-[8px] uppercase ${LEVEL_COLORS[u.experienceLevel] || ""}`}
                          >
                            {u.experienceLevel}
                          </span>
                        </div>
                        <span className="mono block text-[10px] text-mute">@{u.username}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div>
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-3xl">💬</span>
                    <p className="mt-3 text-xs text-dim">No conversations yet.</p>
                    <p className="mt-1 text-[11px] text-mute">
                      Pick a panelist below to start chatting!
                    </p>
                  </div>
                ) : (
                  conversations.map((c) => {
                    const isSelected = activePartner?.id === c.partner.id;
                    const timeAgo = formatTimeAgo(c.lastMessageAt);
                    return (
                      <button
                        key={c.partner.id}
                        type="button"
                        onClick={() => selectPartner(c.partner)}
                        className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                          isSelected
                            ? "bg-paper/10 border-l-2 border-paper"
                            : "hover:bg-white/5"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="display grid h-10 w-10 place-items-center rounded-full border border-line bg-black/60 text-xs font-bold text-paper">
                            {c.partner.avatarGlyph}
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`truncate text-xs font-semibold ${
                                c.unreadCount > 0 ? "text-paper" : "text-paper/90"
                              }`}
                            >
                              {c.partner.displayName}
                            </span>
                            <span className="mono text-[9px] text-mute">{timeAgo}</span>
                          </div>

                          <div className="mt-0.5 flex items-center justify-between gap-1">
                            <p
                              className={`truncate text-[11px] ${
                                c.unreadCount > 0 ? "font-medium text-paper" : "text-dim"
                              }`}
                            >
                              {c.isOutgoing ? <span className="text-mute">You: </span> : null}
                              {c.lastMessage}
                            </p>
                            {c.unreadCount > 0 && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}

                {/* Suggestions / Discover Panelists Section */}
                <div className="border-t border-line bg-black/20 p-3">
                  <div className="mono mb-2 px-1 text-[9px] uppercase tracking-wider text-mute">
                    Community Panelists
                  </div>
                  <div className="space-y-1">
                    {allUsers.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectPartner(u)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="display grid h-6 w-6 place-items-center rounded-full border border-line bg-black text-[10px] text-paper">
                            {u.avatarGlyph}
                          </span>
                          <span className="text-[11px] text-paper truncate max-w-[150px]">
                            {u.displayName}
                          </span>
                        </div>
                        <span
                          className={`mono text-[8px] uppercase ${LEVEL_COLORS[u.experienceLevel] || ""}`}
                        >
                          {u.experienceLevel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ================= RIGHT PANE (Chat Window) ================= */}
        {/* Visible when activePartner is selected, or always on tablet/desktop */}
        <main
          className={`h-full flex-col bg-black/20 flex-1 min-w-0 ${
            !isChatOpenOnMobile ? "hidden md:flex" : "flex"
          }`}
        >
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-line px-3 py-2.5 sm:px-5 sm:py-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button to return to Inbox */}
                  <button
                    type="button"
                    onClick={handleBackToInbox}
                    className="flex items-center gap-1 rounded border border-line bg-white/5 px-2 py-1 text-xs text-paper hover:bg-white/10 md:hidden"
                    title="Back to inbox"
                  >
                    <span>←</span>
                    <span className="mono text-[9px]">Inbox</span>
                  </button>

                  <Link
                    href={`/u/${activePartner.username}`}
                    className="display grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-xs sm:text-sm font-bold text-paper"
                  >
                    {activePartner.avatarGlyph}
                  </Link>
                  <div className="min-w-0 truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <Link
                        href={`/u/${activePartner.username}`}
                        className="text-xs sm:text-sm font-semibold text-paper hover:underline truncate"
                      >
                        {activePartner.displayName}
                      </Link>
                      <span
                        className={`mono rounded px-1.5 py-0.2 text-[7.5px] sm:text-[8px] uppercase ${LEVEL_COLORS[activePartner.experienceLevel] || ""}`}
                      >
                        {activePartner.experienceLevel}
                      </span>
                    </div>
                    <span className="mono block text-[9px] text-mute truncate">
                      @{activePartner.username}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/u/${activePartner.username}`}
                    className="mono rounded border border-line px-2.5 py-1 text-[9px] text-dim transition-colors hover:border-paper hover:text-paper"
                  >
                    Profile →
                  </Link>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
                {/* Intro Card (compact on mobile) */}
                <div className="my-2 flex flex-col items-center justify-center text-center sm:my-4">
                  <div className="display grid h-10 w-10 sm:h-14 sm:w-14 place-items-center rounded-full border border-line bg-black/60 text-lg sm:text-2xl text-paper">
                    {activePartner.avatarGlyph}
                  </div>
                  <h4 className="display mt-1 text-sm sm:text-base text-paper">
                    {activePartner.displayName}
                  </h4>
                  <p className="mono text-[9px] sm:text-[10px] text-mute">@{activePartner.username}</p>
                  <p className="mt-1 hidden max-w-xs text-xs text-dim sm:block">
                    Direct discussions, anime recommendations, and spoiler-safe advice.
                  </p>
                  <div className="mt-2 h-px w-16 bg-line" />
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center p-6 text-xs text-mute">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-6 text-center text-xs text-mute">
                    Say hello to @{activePartner.username}! Start discussing anime and manga titles.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = msg.senderId === currentUser.id;
                    const prevMsg = messages[index - 1];
                    const isSequential = prevMsg && prevMsg.senderId === msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`flex max-w-[88%] sm:max-w-[75%] items-end gap-1.5 sm:gap-2 ${
                            isMine ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {!isMine && !isSequential && (
                            <span className="display grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-full border border-line bg-ink text-[9px] sm:text-[10px] font-bold text-paper">
                              {activePartner.avatarGlyph}
                            </span>
                          )}
                          {!isMine && isSequential && <div className="w-6 sm:w-7 shrink-0" />}

                          {/* Message Bubble */}
                          <div
                            className={`group relative px-3.5 py-2 sm:px-4 sm:py-2.5 text-[12.5px] sm:text-[13px] leading-relaxed transition-all ${
                              isMine
                                ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-neutral-200 to-white text-black shadow-md font-normal"
                                : "rounded-2xl rounded-bl-sm border border-line bg-[#161616] text-[#e0e0e0] shadow-sm"
                            }`}
                          >
                            {/* Message text */}
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* ================= EMBEDDED ANIME POSTER CARD ================= */}
                            {msg.titleCard && (
                              <div className="mt-2.5 overflow-hidden rounded-lg border border-line/80 bg-black/70 shadow-md">
                                <div className="flex items-stretch gap-2.5 p-2 sm:p-2.5">
                                  {/* Poster Art Visual */}
                                  <Link
                                    href={`/title/${msg.titleSlug}`}
                                    className="relative flex w-14 sm:w-16 shrink-0 flex-col justify-between overflow-hidden rounded border border-line/80 bg-ink-raise p-1.5 aspect-[3/4]"
                                    style={{
                                      borderColor: msg.titleCard.accent || "var(--color-line)",
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30 select-none">
                                      <span
                                        className="display text-2xl sm:text-3xl font-bold"
                                        style={{ color: msg.titleCard.accent || "#fff" }}
                                      >
                                        {msg.titleCard.glyph || "零"}
                                      </span>
                                    </div>
                                    <div className="relative flex justify-between items-center text-[7px] mono text-mute">
                                      <span className="uppercase">{msg.titleCard.format}</span>
                                      {msg.titleCard.year ? <span>{msg.titleCard.year}</span> : null}
                                    </div>
                                    <div className="relative mt-auto">
                                      <span
                                        className="display line-clamp-1 text-[8.5px] font-bold text-paper"
                                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                                      >
                                        {msg.titleCard.name}
                                      </span>
                                    </div>
                                  </Link>

                                  {/* Poster Info & Link */}
                                  <div className="flex flex-1 flex-col justify-between py-0.5 min-w-0">
                                    <div>
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="mono text-[7.5px] sm:text-[8px] uppercase tracking-wider text-mute">
                                          {msg.titleCard.format} recommendation
                                        </span>
                                        {msg.titleCard.rating ? (
                                          <span
                                            className="mono text-[8.5px] font-bold"
                                            style={{ color: msg.titleCard.accent || "#fbbf24" }}
                                          >
                                            ★ {msg.titleCard.rating.toFixed(1)}
                                          </span>
                                        ) : null}
                                      </div>
                                      <Link
                                        href={`/title/${msg.titleSlug}`}
                                        className="display block mt-1 text-xs sm:text-sm font-bold text-paper hover:underline truncate"
                                      >
                                        {msg.titleCard.name}
                                      </Link>
                                    </div>

                                    <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-line/60 pt-1">
                                      <Link
                                        href={`/title/${msg.titleSlug}`}
                                        className="mono inline-flex items-center gap-1 text-[8.5px] sm:text-[9px] text-paper hover:underline"
                                      >
                                        <span>View Title Guide</span>
                                        <span>→</span>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Timestamp */}
                            <span
                              className={`mono mt-1 block text-[7.5px] sm:text-[8px] opacity-60 ${
                                isMine ? "text-right text-black/80" : "text-left text-mute"
                              }`}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Title Selector Dropdown with Posters */}
              {showTitlePicker && (
                <div className="border-t border-line bg-ink/95 p-3 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mono text-[9px] uppercase tracking-wider text-paper">
                      Select Anime to Recommend:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTitlePicker(false)}
                      className="mono text-[9px] text-mute hover:text-paper"
                    >
                      Close ✕
                    </button>
                  </div>

                  <input
                    type="text"
                    value={titlePickerSearch}
                    onChange={(e) => setTitlePickerSearch(e.target.value)}
                    placeholder="Filter anime titles..."
                    className="mb-2 w-full rounded border border-line bg-black/60 px-2.5 py-1 text-xs text-paper placeholder:text-mute focus:outline-none"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                    {filteredAvailableTitles.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => {
                          setSelectedTitleSlug(t.slug);
                          setShowTitlePicker(false);
                          setTitlePickerSearch("");
                        }}
                        className={`flex items-center gap-2 rounded border p-1.5 text-left transition-colors ${
                          selectedTitleSlug === t.slug
                            ? "border-paper bg-paper text-ink"
                            : "border-line bg-white/[0.02] text-dim hover:border-paper hover:text-paper"
                        }`}
                      >
                        <span
                          className="display grid h-6 w-6 shrink-0 place-items-center rounded border text-[10px] font-bold"
                          style={{ borderColor: t.accent, color: t.accent }}
                        >
                          {t.glyph || t.name.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1 truncate">
                          <span className="block text-xs font-semibold truncate">{t.name}</span>
                          <span className="mono block text-[8px] text-mute uppercase">
                            {t.format} {t.year ? `· ${t.year}` : ""}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Title Badge */}
              {selectedTitleSlug && (
                <div className="flex items-center justify-between border-t border-line bg-paper/5 px-3 py-1.5 sm:px-4 sm:py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="mono text-[8.5px] text-mute shrink-0">Recommending:</span>
                    <span className="display text-xs text-paper truncate">
                      {availableTitles.find((t) => t.slug === selectedTitleSlug)?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTitleSlug("")}
                    className="mono text-[9px] text-mute hover:text-red-400 shrink-0 ml-2"
                  >
                    Remove ✕
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <div className="border-t border-line bg-black/60 p-2.5 sm:p-3.5">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Share Anime Recommendation Button with Poster icon */}
                  <button
                    type="button"
                    onClick={() => setShowTitlePicker((prev) => !prev)}
                    title="Recommend Anime with Poster"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-sm sm:text-base transition-colors hover:border-paper hover:bg-white/10"
                  >
                    🎬
                  </button>

                  {/* Message Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message @${activePartner.username}...`}
                      className="w-full rounded-full border border-line bg-black/40 px-4 py-2 sm:px-5 sm:py-2.5 text-xs text-paper placeholder:text-mute focus:border-paper focus:outline-none"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sending || (!inputText.trim() && !selectedTitleSlug)}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform hover:scale-105 disabled:opacity-40"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current rotate-90" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No Conversation Selected */
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="display grid h-20 w-20 place-items-center rounded-full border border-line/60 bg-black/40 text-3xl shadow-inner">
                ✈️
              </div>
              <h3 className="display mt-4 text-xl sm:text-2xl text-paper">Your Messages</h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-dim">
                Directly share anime recommendations with posters, debate panels, and chat with community members.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {allUsers.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPartner(u)}
                    className="mono rounded-full border border-line px-3.5 py-1.5 text-[9.5px] text-paper transition-colors hover:border-paper hover:bg-white/5"
                  >
                    Chat with @{u.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
