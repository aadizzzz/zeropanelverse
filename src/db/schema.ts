import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export type ExperienceLevel = "beginner" | "mediocre" | "elite";
export type TitleFormat = "anime" | "manga" | "manhwa";
export type PanelKind = "review" | "view" | "suggestion";
/** How much spoiler content a reader has chosen to see. */
export type SpoilerMode = "safe" | "mild" | "full";
/** How spoilery a single note / post is. */
export type SpoilerGrade = "none" | "mild" | "heavy";
/** lounge = spoiler-safe beginner room, open = no-boundaries room for mediocre + elite */
export type PanelRoom = "lounge" | "open";
export type NodeKind =
  | "source"
  | "season"
  | "movie"
  | "ova"
  | "special"
  | "arc"
  | "spinoff"
  | "remake";
export type NodePriority = "essential" | "recommended" | "optional" | "skip";

export type TierInfo = {
  difficulty: number; // 1..5
  spoilerLevel: "none" | "mild" | "heavy";
  summary: string;
  whyItClicks: string;
  startHere: string;
  prerequisites: string[];
  deepDive: string;
};

export type TitleTiers = {
  beginner: TierInfo;
  mediocre: TierInfo;
  elite: TierInfo;
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 64 }).notNull(),
  bio: text("bio").default("").notNull(),
  experienceLevel: varchar("experience_level", { length: 16 })
    .$type<ExperienceLevel>()
    .default("beginner")
    .notNull(),
  spoilerMode: varchar("spoiler_mode", { length: 8 })
    .$type<SpoilerMode>()
    .default("safe")
    .notNull(),
  avatarGlyph: varchar("avatar_glyph", { length: 4 }).default("Z").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 96 }).primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  altName: varchar("alt_name", { length: 200 }).default("").notNull(),
  format: varchar("format", { length: 12 }).$type<TitleFormat>().notNull(),
  tagline: varchar("tagline", { length: 240 }).default("").notNull(),
  synopsis: text("synopsis").notNull(),
  genres: jsonb("genres").$type<string[]>().default([]).notNull(),
  themes: jsonb("themes").$type<string[]>().default([]).notNull(),
  year: integer("year").notNull(),
  status: varchar("status", { length: 40 }).default("Finished").notNull(),
  episodes: integer("episodes").default(0).notNull(),
  chapters: integer("chapters").default(0).notNull(),
  studio: varchar("studio", { length: 120 }).default("").notNull(),
  origin: varchar("origin", { length: 40 }).default("Japan").notNull(),
  ageRating: varchar("age_rating", { length: 16 }).default("13+").notNull(),
  rating: real("rating").default(0).notNull(),
  popularity: integer("popularity").default(0).notNull(),
  accent: varchar("accent", { length: 9 }).default("#ffffff").notNull(),
  accentSoft: varchar("accent_soft", { length: 9 }).default("#8a8a8a").notNull(),
  mood: varchar("mood", { length: 60 }).default("Monochrome").notNull(),
  texture: varchar("texture", { length: 24 }).default("halftone").notNull(),
  glyph: varchar("glyph", { length: 4 }).default("Z").notNull(),
  tiers: jsonb("tiers").$type<TitleTiers>().notNull(),
  streamingPlanned: boolean("streaming_planned").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Franchise tree: every season / film / OVA / arc / source work of a title,
 * linked parent -> child, with release order, in-universe order, rating and power.
 */
export const titleNodes = pgTable(
  "title_nodes",
  {
    id: serial("id").primaryKey(),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    nodeKey: varchar("node_key", { length: 60 }).notNull(),
    parentKey: varchar("parent_key", { length: 60 }),
    label: varchar("label", { length: 160 }).notNull(),
    kind: varchar("kind", { length: 16 }).$type<NodeKind>().notNull(),
    year: integer("year").notNull(),
    releaseOrder: integer("release_order").default(0).notNull(),
    chronoOrder: integer("chrono_order").default(0).notNull(),
    units: integer("units").default(0).notNull(),
    unit: varchar("unit", { length: 12 }).default("eps").notNull(),
    rating: real("rating").default(0).notNull(),
    /** 0 = not applicable, otherwise 1..100 relative to that franchise's own ceiling */
    powerLevel: integer("power_level").default(0).notNull(),
    priority: varchar("priority", { length: 12 }).$type<NodePriority>().default("optional").notNull(),
    canon: boolean("canon").default(true).notNull(),
    creator: varchar("creator", { length: 120 }).default("").notNull(),
    blurb: text("blurb").notNull(),
    mildNote: text("mild_note").default("").notNull(),
    heavyNote: text("heavy_note").default("").notNull(),
    powerNote: text("power_note").default("").notNull(),
  },
  (table) => [unique("title_nodes_unique").on(table.titleId, table.nodeKey)],
);

export const panels = pgTable(
  "panels",
  {
    id: serial("id").primaryKey(),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 12 }).$type<PanelKind>().default("review").notNull(),
    room: varchar("room", { length: 8 }).$type<PanelRoom>().default("lounge").notNull(),
    spoilerGrade: varchar("spoiler_grade", { length: 8 })
      .$type<SpoilerGrade>()
      .default("none")
      .notNull(),
    authorLevel: varchar("author_level", { length: 16 })
      .$type<ExperienceLevel>()
      .default("beginner")
      .notNull(),
    rating: real("rating").default(0).notNull(),
    headline: varchar("headline", { length: 160 }).notNull(),
    body: text("body").notNull(),
    spoilerFree: boolean("spoiler_free").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("panels_author_headline_unique").on(table.userId, table.headline)],
);

export const panelVotes = pgTable(
  "panel_votes",
  {
    id: serial("id").primaryKey(),
    panelId: integer("panel_id")
      .notNull()
      .references(() => panels.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("panel_votes_unique").on(table.panelId, table.userId)],
);

export const watchlist = pgTable(
  "watchlist",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    titleId: integer("title_id")
      .notNull()
      .references(() => titles.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 24 }).default("planned").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique("watchlist_unique").on(table.userId, table.titleId)],
);

export const streamWaitlist = pgTable("stream_waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  region: varchar("region", { length: 60 }).default("Global").notNull(),
  interest: varchar("interest", { length: 24 }).default("anime").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type TitleRow = typeof titles.$inferSelect;
export type PanelRow = typeof panels.$inferSelect;
export type TitleNodeRow = typeof titleNodes.$inferSelect;
