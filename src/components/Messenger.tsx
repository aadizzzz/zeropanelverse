"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/auth";

type PartnerInfo = {
  id: number;
  username: string;
  displayName: string;
  experienceLevel: "beginner" | "mediocre" | "elite";
  avatarGlyph: string;
};

type MessageItem = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  titleSlug: string | null;
  read: boolean;
  createdAt: string;
  titleCard?: {
    name: string;
    accent: string;
    format: string;
  } | null;
};

type ConversationSummary = {
  partner: PartnerInfo;
  lastMessage: string;
  lastMessageAt: string;
  isOutgoing: boolean;
  unreadCount: number;
};

type QuickTitle = {
  slug: string;
  name: string;
  format: string;
  accent: string;
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
  const [activePartner, setActivePartner] = useState<PartnerInfo | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedTitleSlug, setSelectedTitleSlug] = useState<string>("");
  const [showTitlePicker, setShowTitlePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // Fetch inbox conversations
  // Fetch messages with active partner
  const fetchMessages = useCallback(async (partnerId: number, isSilent = false) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?with=${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setMessages(data.messages || []);
          if (data.partner) {
            setActivePartner(data.partner);
          }
          if (!isSilent) {
            setTimeout(() => scrollToBottom(false), 50);
          }
        }
      }
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  }, []);

  const refreshInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setConversations(data.conversations || []);
          setAllUsers(data.allUsers || []);

          // If targetUsername was passed in query, find partner
          if (targetUsername) {
            const found = (data.allUsers as PartnerInfo[]).find(
              (u) => u.username.toLowerCase() === targetUsername.toLowerCase(),
            );
            if (found) {
              setActivePartner(found);
              void fetchMessages(found.id, false);
            }
          }
        }
      }
    } catch {
      // ignore network errors on poll
    }
  }, [targetUsername, fetchMessages]);

  // Select a conversation partner
  const selectPartner = (partner: PartnerInfo) => {
    setActivePartner(partner);
    setSearchQuery("");
    void fetchMessages(partner.id, false);
  };

  // Initial load
  useEffect(() => {
    let ignore = false;

    async function loadInbox() {
      try {
        const res = await fetch("/api/messages");
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && data.ok) {
          setConversations(data.conversations || []);
          setAllUsers(data.allUsers || []);

          if (targetUsername) {
            const found = (data.allUsers as PartnerInfo[]).find(
              (u) => u.username.toLowerCase() === targetUsername.toLowerCase(),
            );
            if (found) {
              setActivePartner(found);
              void fetchMessages(found.id, false);
            }
          }
        }
      } catch {
        // ignore network error
      }
    }

    void loadInbox();

    return () => {
      ignore = true;
    };
  }, [targetUsername, fetchMessages]);

  // Polling for live chat updates every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      void refreshInbox();
      if (activePartner) {
        void fetchMessages(activePartner.id, true);
      }
    }, 3500);

    return () => {
      clearInterval(timer);
    };
  }, [activePartner, refreshInbox, fetchMessages]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activePartner) return;
    if (!inputText.trim() && !selectedTitleSlug) return;

    const content = inputText.trim();
    const titleSlug = selectedTitleSlug || undefined;

    // Optimistic UI update
    const tempId = Date.now();
    const optimisticMsg: MessageItem = {
      id: tempId,
      senderId: currentUser.id,
      receiverId: activePartner.id,
      content,
      titleSlug: titleSlug || null,
      read: false,
      createdAt: new Date().toISOString(),
      titleCard: titleSlug
        ? availableTitles.find((t) => t.slug === titleSlug) ?? null
        : null,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSelectedTitleSlug("");
    setShowTitlePicker(false);
    setSending(true);

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
          // Replace temp id with real id
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: data.message.id } : m)),
          );
        }
      }
      refreshInbox();
    } catch {
      // keep message in view
    } finally {
      setSending(false);
    }
  };

  // Filtered users for search or conversation list
  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Container simulating Instagram Direct Web Interface */}
      <div className="panel grain grid h-[780px] overflow-hidden rounded-xl border border-line bg-ink/90 shadow-2xl backdrop-blur-xl md:grid-cols-[340px_1fr]">
        {/* ================= LEFT SIDEBAR (Inbox & Threads) ================= */}
        <aside className="flex h-full flex-col border-b border-line md:border-b-0 md:border-r">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
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
          <div className="border-b border-line px-4 py-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panelist or username..."
                className="w-full rounded-lg border border-line bg-black/40 px-3.5 py-2 pl-9 text-xs text-paper placeholder:text-mute focus:border-paper focus:outline-none"
              />
              <svg
                className="absolute left-3 top-2.5 h-3.5 w-3.5 text-mute"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Thread List / Search Results */}
          <div className="flex-1 overflow-y-auto divide-y divide-line/40">
            {searchQuery.trim() ? (
              <div>
                <div className="mono bg-white/[0.02] px-4 py-2 text-[9px] uppercase tracking-wider text-mute">
                  Search Results ({filteredUsers.length})
                </div>
                {filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-dim">No panelists found.</div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectPartner(u)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
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
                      Pick a panelist below or search to send your first message!
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
                        className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors ${
                          isSelected
                            ? "bg-paper/10 border-l-2 border-paper"
                            : "hover:bg-white/5"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="display grid h-11 w-11 place-items-center rounded-full border border-line bg-black/60 text-sm font-bold text-paper">
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
                                c.unreadCount > 0
                                  ? "font-medium text-paper"
                                  : "text-dim"
                              }`}
                            >
                              {c.isOutgoing ? (
                                <span className="text-mute">You: </span>
                              ) : null}
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
                  <div className="mono mb-2 px-2 text-[9px] uppercase tracking-wider text-mute">
                    Archive Panelists
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
                          <span className="text-[11px] text-paper">{u.displayName}</span>
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

        {/* ================= RIGHT PANE (Instagram Chat Window) ================= */}
        <main className="flex h-full flex-col bg-black/20">
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/u/${activePartner.username}`}
                    className="display grid h-10 w-10 place-items-center rounded-full border border-line bg-ink text-sm font-bold text-paper transition-transform hover:scale-105"
                  >
                    {activePartner.avatarGlyph}
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${activePartner.username}`}
                        className="text-sm font-semibold text-paper hover:underline"
                      >
                        {activePartner.displayName}
                      </Link>
                      <span
                        className={`mono rounded px-1.5 py-0.5 text-[8px] uppercase ${LEVEL_COLORS[activePartner.experienceLevel] || ""}`}
                      >
                        {activePartner.experienceLevel}
                      </span>
                    </div>
                    <span className="mono block text-[10px] text-mute">
                      @{activePartner.username} · Active in archive
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/u/${activePartner.username}`}
                    className="mono rounded border border-line px-3 py-1.5 text-[10px] text-dim transition-colors hover:border-paper hover:text-paper"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                {/* Intro Card */}
                <div className="my-4 flex flex-col items-center justify-center text-center">
                  <div className="display grid h-16 w-16 place-items-center rounded-full border border-line bg-black/60 text-2xl text-paper">
                    {activePartner.avatarGlyph}
                  </div>
                  <h4 className="display mt-2 text-base text-paper">
                    {activePartner.displayName}
                  </h4>
                  <p className="mono text-[10px] text-mute">@{activePartner.username}</p>
                  <p className="mt-1 max-w-xs text-xs text-dim">
                    Direct communication for anime recommendations, panel debates, and spoiler-free advice.
                  </p>
                  <div className="mt-3 h-px w-20 bg-line" />
                </div>

                {loadingMessages ? (
                  <div className="flex justify-center p-8 text-xs text-mute">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-xs text-mute">
                    Say hello to @{activePartner.username}! Start discussing your favorite titles.
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
                          className={`flex max-w-[80%] sm:max-w-[70%] items-end gap-2 ${
                            isMine ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {!isMine && !isSequential && (
                            <span className="display grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-ink text-[10px] font-bold text-paper">
                              {activePartner.avatarGlyph}
                            </span>
                          )}
                          {!isMine && isSequential && <div className="w-7 shrink-0" />}

                          {/* Message Bubble (Instagram Style) */}
                          <div
                            className={`group relative px-4 py-2.5 text-[13px] leading-relaxed transition-all ${
                              isMine
                                ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-neutral-200 to-white text-black shadow-md font-normal"
                                : "rounded-2xl rounded-bl-sm border border-line bg-[#161616] text-[#e0e0e0] shadow-sm"
                            }`}
                          >
                            {/* Message text */}
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* Embedded Anime Recommendation Card if attached */}
                            {msg.titleCard && (
                              <div className="mt-2.5 overflow-hidden rounded-lg border border-line/60 bg-black/40 p-2.5">
                                <div className="mono text-[8px] uppercase tracking-wider text-mute">
                                  Recommended Anime
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <div>
                                    <span className="display block text-xs font-bold text-paper">
                                      {msg.titleCard.name}
                                    </span>
                                    <span className="mono text-[9px] text-mute uppercase">
                                      {msg.titleCard.format}
                                    </span>
                                  </div>
                                  <Link
                                    href={`/title/${msg.titleSlug}`}
                                    className="mono rounded border border-line bg-paper/10 px-2 py-1 text-[9px] text-paper hover:bg-paper hover:text-ink"
                                  >
                                    View Title →
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Timestamp on hover */}
                            <span
                              className={`mono mt-1 block text-[8px] opacity-60 ${
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

              {/* Quick Title Selector Dropdown (Share Title in Chat) */}
              {showTitlePicker && (
                <div className="border-t border-line bg-black/90 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="mono text-[9px] uppercase tracking-wider text-paper">
                      Attach Anime Recommendation:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTitlePicker(false)}
                      className="mono text-[9px] text-mute hover:text-paper"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {availableTitles.map((t) => (
                      <button
                        key={t.slug}
                        type="button"
                        onClick={() => {
                          setSelectedTitleSlug(t.slug);
                          setShowTitlePicker(false);
                        }}
                        className={`mono rounded border px-2 py-1 text-[9px] transition-colors ${
                          selectedTitleSlug === t.slug
                            ? "border-paper bg-paper text-ink"
                            : "border-line text-dim hover:border-paper hover:text-paper"
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Title Badge */}
              {selectedTitleSlug && (
                <div className="flex items-center justify-between border-t border-line bg-paper/5 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[9px] text-mute">Recommending:</span>
                    <span className="display text-xs text-paper">
                      {availableTitles.find((t) => t.slug === selectedTitleSlug)?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTitleSlug("")}
                    className="mono text-[9px] text-mute hover:text-red-400"
                  >
                    Remove ✕
                  </button>
                </div>
              )}

              {/* Input Bar (Instagram Style) */}
              <div className="border-t border-line bg-black/60 p-3 sm:p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {/* Share Anime Recommendation Button */}
                  <button
                    type="button"
                    onClick={() => setShowTitlePicker((prev) => !prev)}
                    title="Share an Anime"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white/5 text-base transition-colors hover:border-paper hover:bg-white/10"
                  >
                    📺
                  </button>

                  {/* Message Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Message @${activePartner.username}...`}
                      className="w-full rounded-full border border-line bg-black/40 px-5 py-2.5 text-xs text-paper placeholder:text-mute focus:border-paper focus:outline-none"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={sending || (!inputText.trim() && !selectedTitleSlug)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform hover:scale-105 disabled:opacity-40"
                  >
                    <svg className="h-4 w-4 fill-current rotate-90" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No Conversation Selected */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="display grid h-24 w-24 place-items-center rounded-full border border-line/60 bg-black/40 text-4xl shadow-inner">
                ✈️
              </div>
              <h3 className="display mt-5 text-2xl text-paper">Your Messages</h3>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-dim">
                Send direct anime recommendations, argue panel composition, or discuss adaptations with other community members.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {allUsers.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectPartner(u)}
                    className="mono rounded-full border border-line px-4 py-2 text-[10px] text-paper transition-colors hover:border-paper hover:bg-white/5"
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
