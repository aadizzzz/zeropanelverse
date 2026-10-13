import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
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

  // If a specific conversation partner is requested
  if (partnerIdParam) {
    const partnerId = parseInt(partnerIdParam, 10);
    if (isNaN(partnerId)) {
      return NextResponse.json({ ok: false, error: "Invalid partner ID" }, { status: 400 });
    }

    // Mark unread messages from this partner as read
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

    // Fetch conversation messages
    const msgs = await db
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

    // If any messages reference an anime title, fetch title details for rich card preview
    const slugs = Array.from(
      new Set(msgs.map((m) => m.titleSlug).filter((s): s is string => Boolean(s))),
    );
    let titleMap: Record<
      string,
      {
        slug: string;
        name: string;
        accent: string;
        accentSoft: string;
        format: string;
        glyph: string;
        texture: string;
        year: number;
        rating: number;
      }
    > = {};
    if (slugs.length > 0) {
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
    }

    const partnerRow = await db
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

    return NextResponse.json({
      ok: true,
      partner: partnerRow[0] ?? null,
      messages: msgs.map((m) => ({
        ...m,
        titleCard: m.titleSlug ? titleMap[m.titleSlug] : null,
      })),
    });
  }

  // Otherwise, return full inbox conversations list
  // Fetch all messages where current user is sender or receiver
  const allUserMessages = await db
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
  let partnerUsers: {
    id: number;
    username: string;
    displayName: string;
    experienceLevel: string;
    avatarGlyph: string;
  }[] = [];

  if (partnerIds.length > 0) {
    partnerUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        experienceLevel: users.experienceLevel,
        avatarGlyph: users.avatarGlyph,
      })
      .from(users);
  }

  const allRegisteredUsers = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      experienceLevel: users.experienceLevel,
      avatarGlyph: users.avatarGlyph,
    })
    .from(users)
    .where(sql`${users.id} <> ${user.id}`)
    .limit(20);

  const userMap = new Map(allRegisteredUsers.map((u) => [u.id, u]));

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
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId, content, titleSlug } = body;

    if (!receiverId || typeof receiverId !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid receiver ID" }, { status: 400 });
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
    return NextResponse.json({ ok: false, error: "Failed to send message" }, { status: 500 });
  }
}
