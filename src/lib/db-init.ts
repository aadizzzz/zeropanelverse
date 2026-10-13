import { sql } from "drizzle-orm";
import { db } from "@/db";
import { directMessages, follows, panels, titleNodes, titles, users } from "@/db/schema";
import { seedPanels, seedTitles } from "@/lib/seed-data";
import { seedNodes, seedOpenPanels } from "@/lib/seed-franchise";
import { hashPassword } from "@/lib/auth";

let seedPromise: Promise<void> | null = null;

const demoUsers = [
  {
    username: "panelnewbie",
    email: "newbie@zeropanelverse.dev",
    displayName: "Rin (Newbie)",
    experienceLevel: "beginner" as const,
    avatarGlyph: "新",
    bio: "Six months into anime. Currently logging everything I watch so other beginners can dodge the confusing stuff.",
  },
  {
    username: "midwatch_mira",
    email: "mira@zeropanelverse.dev",
    displayName: "Mira",
    experienceLevel: "mediocre" as const,
    avatarGlyph: "M",
    bio: "Two hundred titles deep. I care about pacing, adaptation quality and which studio saved money on episode 7.",
  },
  {
    username: "archivist_k",
    email: "k@zeropanelverse.dev",
    displayName: "Archivist K",
    experienceLevel: "elite" as const,
    avatarGlyph: "K",
    bio: "Manga-first since the 90s. I write long-form breakdowns of paneling, causality and authorial intent.",
  },
];

const DEMO_PASSWORD = "zeropanelverse";

/** v1: catalogue, demo users, first batch of panels. */
async function seedBase(): Promise<void> {
  // Always ensure all seedTitles are in the database
  await db.insert(titles).values(seedTitles).onConflictDoNothing();

  const passwordHash = hashPassword(DEMO_PASSWORD);
  await db
    .insert(users)
    .values(demoUsers.map((user) => ({ ...user, passwordHash })))
    .onConflictDoNothing();

  const titleRows = await db.select({ id: titles.id, slug: titles.slug }).from(titles);
  const userRows = await db.select({ id: users.id, username: users.username }).from(users);
  const titleMap = new Map(titleRows.map((row) => [row.slug, row.id]));
  const userMap = new Map(userRows.map((row) => [row.username, row.id]));

  const panelValues = seedPanels
    .map((panel) => {
      const titleId = titleMap.get(panel.titleSlug);
      const userId = userMap.get(panel.username);
      if (!titleId || !userId) return null;
      return {
        titleId,
        userId,
        kind: panel.kind,
        authorLevel: panel.authorLevel,
        rating: panel.rating,
        headline: panel.headline,
        body: panel.body,
        spoilerFree: true,
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  if (panelValues.length > 0) {
    await db.insert(panels).values(panelValues).onConflictDoNothing();
  }
}

/** v2: franchise timeline trees, discussion rooms, spoiler preferences. Runs once. */
async function seedFranchise(): Promise<void> {
  const titleRows = await db.select({ id: titles.id, slug: titles.slug }).from(titles);
  const titleMap = new Map(titleRows.map((row) => [row.slug, row.id]));

  const nodeValues = Object.entries(seedNodes).flatMap(([slug, list]) => {
    const titleId = titleMap.get(slug);
    if (!titleId) return [];
    return list.map((node) => ({ titleId, ...node }));
  });
  if (nodeValues.length > 0) {
    await db.insert(titleNodes).values(nodeValues).onConflictDoNothing();
  }

  // Mediocre + elite takes live on the Open Floor; spoiler-free suggestions stay in the Lounge.
  await db.execute(
    sql`update panels set room = 'open' where author_level <> 'beginner' and kind <> 'suggestion' and room = 'lounge'`,
  );
  await db.execute(
    sql`update users set spoiler_mode = case experience_level when 'elite' then 'full' when 'mediocre' then 'mild' else 'safe' end where email like '%@zeropanelverse.dev'`,
  );

  const userRows = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = new Map(userRows.map((row) => [row.username, row.id]));

  const openValues = seedOpenPanels
    .map((panel) => {
      const titleId = titleMap.get(panel.titleSlug);
      const userId = userMap.get(panel.username);
      if (!titleId || !userId) return null;
      return {
        titleId,
        userId,
        kind: panel.kind,
        room: panel.room,
        spoilerGrade: panel.grade,
        authorLevel: panel.authorLevel,
        rating: panel.rating,
        headline: panel.headline,
        body: panel.body,
        spoilerFree: panel.grade === "none",
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);

  if (openValues.length > 0) {
    await db.insert(panels).values(openValues).onConflictDoNothing();
  }
}

/** v3: social graph (follows) and initial direct messages between demo users. */
async function seedSocial(): Promise<void> {
  const userRows = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = new Map(userRows.map((row) => [row.username, row.id]));

  const newbieId = userMap.get("panelnewbie");
  const miraId = userMap.get("midwatch_mira");
  const archivistId = userMap.get("archivist_k");

  if (!newbieId || !miraId || !archivistId) return;

  // 1. Follows
  const followCount = await db.select({ count: sql<number>`count(*)::int` }).from(follows);
  if ((followCount[0]?.count ?? 0) === 0) {
    await db
      .insert(follows)
      .values([
        { followerId: newbieId, followingId: miraId },
        { followerId: newbieId, followingId: archivistId },
        { followerId: miraId, followingId: newbieId },
        { followerId: miraId, followingId: archivistId },
        { followerId: archivistId, followingId: miraId },
      ])
      .onConflictDoNothing();
  }

  // 2. Direct Messages (Instagram-style chat history)
  const messageCount = await db.select({ count: sql<number>`count(*)::int` }).from(directMessages);
  if ((messageCount[0]?.count ?? 0) === 0) {
    const now = Date.now();
    await db
      .insert(directMessages)
      .values([
        {
          senderId: miraId,
          receiverId: newbieId,
          content: "Hey Rin! Welcome to ZeroPanelVerse. If you're looking for your next show, definitely check out Attack on Titan or Vinland Saga first.",
          titleSlug: "attack-on-titan",
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 3), // 3 hours ago
        },
        {
          senderId: newbieId,
          receiverId: miraId,
          content: "Thanks Mira! Just started AoT episode 1 yesterday, that opening wall breach had me completely speechless haha",
          titleSlug: null,
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          senderId: miraId,
          receiverId: newbieId,
          content: "Right?? Just wait till episode 5! Keep your beginner lens turned on so you dodge the colossal spoiler landmines in the open lounge.",
          titleSlug: null,
          read: false,
          createdAt: new Date(now - 1000 * 60 * 25), // 25 min ago
        },
        {
          senderId: archivistId,
          receiverId: miraId,
          content: "Mira, have you checked the season 4 animation director shifts? The line weight divergence and rotational 3DMG cuts in the Shiganshina raid are worth analyzing.",
          titleSlug: "attack-on-titan",
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 5),
        },
        {
          senderId: miraId,
          receiverId: archivistId,
          content: "Yeah, the CG gear sequences feel noticeably heavier, but the facial framing and charcoal hatching in the trench scene was exceptional.",
          titleSlug: null,
          read: true,
          createdAt: new Date(now - 1000 * 60 * 60 * 4),
        },
        {
          senderId: archivistId,
          receiverId: newbieId,
          content: "Welcome to the archive, Rin. Whenever you finish a title and want to look at the manga paneling techniques or authorial intent, feel free to drop a message.",
          titleSlug: null,
          read: false,
          createdAt: new Date(now - 1000 * 60 * 45), // 45 min ago
        },
      ])
      .onConflictDoNothing();
  }
}

async function runSeed(): Promise<void> {
  await seedBase();
  await seedFranchise();
  await seedSocial();
}

export function ensureSeeded(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve();
  }
  if (!seedPromise) {
    seedPromise = runSeed().catch((error) => {
      console.warn("Background seed notice:", error?.message || error);
      seedPromise = null;
    });
  }
  return seedPromise;
}
