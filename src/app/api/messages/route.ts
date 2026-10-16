import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { directMessages, titles, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerIdParam = searchParams.get("with");
  const searchQuery = (searchParams.get("search") || searchParams.get("q") || "").trim();

  try {
    // -------------------------------------------------------------
    // Case 1: Specific conversation partner requested (?with=...)
    // -------------------------------------------------------------
    if (partnerIdParam) {
      let partnerId = parseInt(partnerIdParam, 10);
      let partnerRow: any = null;

      if (isNaN(partnerId)) {
        // Look up partner by username (case-insensitive)
        const cleanUsername = (
          partnerIdParam.startsWith("@") ? partnerIdParam.slice(1) : partnerIdParam
        ).toLowerCase();

        const found = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            experienceLevel: users.experienceLevel,
            avatarGlyph: users.avatarGlyph,
          })
          .from(users)
          .where(eq(users.username, cleanUsername))
          .limit(1);

        if (!found[0]) {
          // Check static demo users fallback if not yet in DB
          const demoMap: Record<string, any> = {
            panelnewbie: {
              id: 1,
              username: "panelnewbie",
              displayName: "Rin (Newbie)",
              experienceLevel: "beginner",
              avatarGlyph: "新",
            },
            midwatch_mira: {
              id: 2,
              username: "midwatch_mira",
              displayName: "Mira",
              experienceLevel: "mediocre",
              avatarGlyph: "M",
            },
            archivist_k: {
              id: 3,
              username: "archivist_k",
              displayName: "Archivist K",
              experienceLevel: "elite",
              avatarGlyph: "K",
            },
          };
          partnerRow = demoMap[cleanUsername] ?? null;
          if (!partnerRow) {
            return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
          }
          partnerId = partnerRow.id;
        } else {
          partnerRow = found[0];
          partnerId = partnerRow.id;
        }
      } else {
        const found = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            experienceLevel: users.experienceLevel,
            avatarGlyph: users.avatarGlyph,
          })
          .from(users)
          .where(eq(users.id, partnerId))
          .limit(1);
        partnerRow = found[0] ?? null;
      }

      if (!partnerRow) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
      }

      // Mark unread messages from this partner as read
      try {
        await db
          .update(directMessages)
          .set({ read: true })
          .where(
            and(
              eq(directMessages.senderId, partnerId),
              eq(directMessages.receiverId, user.id),
              eq(directMessages.read, false),
            ),
          );
      } catch {
        // Non-blocking
      }

      // Fetch conversation messages
      let msgs: any[] = [];
      try {
        msgs = await db
          .select({
            id: directMessages.id,
            senderId: directMessages.senderId,
            receiverId: directMessages.receiverId,
            content: directMessages.content,
            titleSlug: directMessages.titleSlug,
            read: directMessages.read,
            createdAt: directMessages.createdAt,
          })
          .from(directMessages)
          .where(
            or(
              and(eq(directMessages.senderId, user.id), eq(directMessages.receiverId, partnerId)),
              and(eq(directMessages.senderId, partnerId), eq(directMessages.receiverId, user.id)),
            ),
          )
          .orderBy(directMessages.createdAt);
      } catch {
        msgs = [];
      }

      // If any messages reference an anime title, fetch title details for rich card preview
      const slugs = Array.from(
        new Set(msgs.map((m) => m.titleSlug).filter((s): s is string => Boolean(s))),
      );
      let titleMap: Record<string, any> = {};
      if (slugs.length > 0) {
        try {
          const titleRows = await db
            .select({
              slug: titles.slug,
              name: titles.name,
              accent: titles.accent,
              accentSoft: titles.accentSoft,
              format: titles.format,
              glyph: titles.glyph,
              texture: titles.texture,
              year: titles.year,
              rating: titles.rating,
            })
            .from(titles);
          titleMap = Object.fromEntries(titleRows.map((t) => [t.slug, t]));
        } catch {}
      }

      return NextResponse.json({
        ok: true,
        partner: partnerRow,
        messages: msgs.map((m) => ({
          ...m,
          titleCard: m.titleSlug ? titleMap[m.titleSlug] : null,
        })),
      });
    }

    // -------------------------------------------------------------
    // Case 2: Live user search in Messenger sidebar (?search=...)
    // -------------------------------------------------------------
    if (searchQuery) {
      const cleanQ = searchQuery.startsWith("@") ? searchQuery.slice(1) : searchQuery;
      const like = `%${searchQuery}%`;
      const cleanLike = `%${cleanQ}%`;

      const matchedUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          experienceLevel: users.experienceLevel,
          avatarGlyph: users.avatarGlyph,
        })
        .from(users)
        .where(
          and(
            sql`${users.id} <> ${user.id}`,
            or(
              ilike(users.username, cleanLike),
              ilike(users.displayName, like),
              ilike(users.bio, like),
            ),
          ),
        )
        .orderBy(asc(users.username))
        .limit(30);

      return NextResponse.json({
        ok: true,
        users: matchedUsers,
        allUsers: matchedUsers,
      });
    }

    // -------------------------------------------------------------
    // Case 3: Default inbox & available conversation partners
    // -------------------------------------------------------------
    let allUserMessages: any[] = [];
    try {
      allUserMessages = await db
        .select({
          id: directMessages.id,
          senderId: directMessages.senderId,
          receiverId: directMessages.receiverId,
          content: directMessages.content,
          read: directMessages.read,
          createdAt: directMessages.createdAt,
        })
        .from(directMessages)
        .where(or(eq(directMessages.senderId, user.id), eq(directMessages.receiverId, user.id)))
        .orderBy(desc(directMessages.createdAt));
    } catch {
      allUserMessages = [];
    }

    // Determine all conversation partners
    const partnerLastMsgMap = new Map<number, typeof allUserMessages[0]>();
    const unreadCountMap = new Map<number, number>();

    for (const msg of allUserMessages) {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      if (!partnerLastMsgMap.has(partnerId)) {
        partnerLastMsgMap.set(partnerId, msg);
      }
      if (msg.receiverId === user.id && !msg.read) {
        unreadCountMap.set(partnerId, (unreadCountMap.get(partnerId) ?? 0) + 1);
      }
    }

    const partnerIds = Array.from(partnerLastMsgMap.keys());
    let partnerUsers: any[] = [];
    if (partnerIds.length > 0) {
      try {
        partnerUsers = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            experienceLevel: users.experienceLevel,
            avatarGlyph: users.avatarGlyph,
          })
          .from(users);
      } catch {}
    }

    // Load registered users (up to 100)
    let allRegisteredUsers: any[] = [];
    try {
      allRegisteredUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          experienceLevel: users.experienceLevel,
          avatarGlyph: users.avatarGlyph,
        })
        .from(users)
        .where(sql`${users.id} <> ${user.id}`)
        .orderBy(asc(users.displayName))
        .limit(100);
    } catch {
      allRegisteredUsers = [];
    }

    // Populate userMap with BOTH registered users and any prior conversation partners
    const userMap = new Map<number, any>();
    for (const u of allRegisteredUsers) userMap.set(u.id, u);
    for (const u of partnerUsers) userMap.set(u.id, u);

    const conversations = partnerIds
      .map((pId) => {
        const partner = userMap.get(pId);
        const lastMsg = partnerLastMsgMap.get(pId);
        if (!partner || !lastMsg) return null;
        return {
          partner,
          lastMessage: lastMsg.content,
          lastMessageAt: lastMsg.createdAt,
          isOutgoing: lastMsg.senderId === user.id,
          unreadCount: unreadCountMap.get(pId) ?? 0,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const totalUnread = Array.from(unreadCountMap.values()).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      ok: true,
      totalUnread,
      conversations,
      allUsers: allRegisteredUsers,
    });
  } catch (err: any) {
    console.error("GET /api/messages error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to load messages" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    let { receiverId, receiverUsername, content, titleSlug } = body;

    // Support either receiverId (number) or receiverUsername (string)
    if ((!receiverId || typeof receiverId !== "number") && receiverUsername) {
      const cleanUsername = String(receiverUsername)
        .replace(/^@/, "")
        .toLowerCase();
      const userRow = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, cleanUsername))
        .limit(1);

      if (userRow[0]) {
        receiverId = userRow[0].id;
      }
    }

    if (!receiverId || typeof receiverId !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid receiver" }, { status: 400 });
    }

    if ((!content || !content.trim()) && !titleSlug) {
      return NextResponse.json({ ok: false, error: "Message cannot be empty" }, { status: 400 });
    }

    const inserted = await db
      .insert(directMessages)
      .values({
        senderId: user.id,
        receiverId,
        content: (content || "").trim(),
        titleSlug: titleSlug || null,
        read: false,
      })
      .returning();

    return NextResponse.json({ ok: true, message: inserted[0] });
  } catch (err) {
    console.error("POST /api/messages error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send message" }, { status: 500 });
  }
}
