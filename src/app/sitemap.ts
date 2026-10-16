import type { MetadataRoute } from "next";
import { db } from "@/db";
import { titles, users } from "@/db/schema";
import { seedTitles } from "@/lib/seed-data";
import { SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static high-priority pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/timeline`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/panels`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/streaming`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // High-intent filter landings for Google queries (e.g. "beginner anime guide", "manga archive")
  const categoryRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/library?format=anime`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library?format=manga`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library?format=manhwa`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library?level=beginner`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library?level=mediocre`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library?level=elite`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic anime/manga/manhwa title pages
  let titleRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbTitles = await db
      .select({ slug: titles.slug, updatedAt: titles.createdAt })
      .from(titles);

    if (dbTitles.length > 0) {
      titleRoutes = dbTitles.map((t) => ({
        url: `${SITE_URL}/title/${t.slug}`,
        lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));
    } else {
      titleRoutes = seedTitles.map((t) => ({
        url: `${SITE_URL}/title/${t.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }));
    }
  } catch {
    titleRoutes = seedTitles.map((t) => ({
      url: `${SITE_URL}/title/${t.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  }

  // Public curator / reviewer profile pages
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const dbUsers = await db
      .select({ username: users.username, createdAt: users.createdAt })
      .from(users);

    profileRoutes = dbUsers.map((u) => ({
      url: `${SITE_URL}/u/${u.username}`,
      lastModified: u.createdAt ? new Date(u.createdAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    // Default demo curators fallback
    profileRoutes = ["panelnewbie", "midwatch_mira", "archivist_k"].map((uname) => ({
      url: `${SITE_URL}/u/${uname}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...titleRoutes, ...profileRoutes];
}
