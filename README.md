# ZeroPanelverse — Anime & Manga Platform

A perspective-driven anime, manga, and manhwa platform built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, **Drizzle ORM**, and **PostgreSQL**.

ZeroPanelverse adapts its guides, ratings, and discussion rooms to reader experience levels (**Beginner**, **Mediocre**, and **Elite**), complete with spoiler controls and interactive franchise chronology trees.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20+ or v22+
- **PostgreSQL**: A running instance (local PostgreSQL service, Docker container, or cloud provider like Neon / Supabase)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory (based on `.env.example`):

```bash
# Example for local PostgreSQL:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/app_db"
```

> **Note**: Replace `YOUR_PASSWORD` with your PostgreSQL user password and ensure the database exists (e.g., `CREATE DATABASE app_db;`).

### 4. Push Database Schema
Push the schema to your PostgreSQL database:

```bash
npm run db:push
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

The database seeds automatically on first launch (`src/lib/db-init.ts`) with sample titles, franchise timeline nodes, discussion panels, and three pre-configured accounts:

| Username | Role / Level | Password | Description |
| :--- | :--- | :--- | :--- |
| `panelnewbie` | Beginner | `zeropanelverse` | Safe entry routes, spoiler-free Lounge |
| `midwatch_mira` | Mediocre | `zeropanelverse` | Pacing, adaptation notes, Open Floor |
| `archivist_k` | Elite | `zeropanelverse` | Deep breakdowns, panel analysis, full spoilers |

---

## 🛠️ Available Scripts

- **`npm run dev`**: Starts the development server with Next.js Turbopack at [http://localhost:3000](http://localhost:3000)
- **`npm run build`**: Compiles and creates an optimized production build
- **`npm run start`**: Runs the production server
- **`npm run lint`**: Runs ESLint checks
- **`npm run typecheck`**: Validates TypeScript types without emitting files (`tsc --noEmit`)
- **`npm run db:push`**: Pushes Drizzle ORM schema directly to PostgreSQL
- **`npm run db:generate`**: Generates migration files based on schema changes
- **`npm run db:studio`**: Opens Drizzle Studio (web database management UI)

---

## 📂 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router (pages & API routes)
│   │   ├── api/             # Health check & titles API endpoints
│   │   ├── library/         # Catalog filtered by experience level
│   │   ├── timeline/        # Franchise chronology & release trees
│   │   ├── panels/          # Community discussion rooms (Lounge / Open Floor)
│   │   ├── title/[slug]/    # Detailed title pages & tier breakdowns
│   │   └── u/[username]/    # User profiles & watchlist
│   ├── components/          # Reusable UI components & navigation
│   ├── db/
│   │   ├── index.ts         # PostgreSQL pool & Drizzle ORM instance
│   │   └── schema.ts        # Database schema definitions
│   └── lib/
│       ├── actions.ts       # Server actions (auth, panels, watchlist)
│       ├── auth.ts          # Session management & password hashing
│       ├── db-init.ts       # Automatic database seeding
│       └── seed-data.ts     # Curated initial anime/manga dataset
├── drizzle.config.ts        # Drizzle Kit configuration (reads DATABASE_URL)
└── package.json
```

---

## 🔍 SEO & Google Search Console Listing

ZeroPanelVerse includes a complete production SEO architecture designed for Google Search indexing and rich snippets:

1. **Dynamic Sitemap (`/sitemap.xml`)**:
   - Automatically crawls and serves all static routes, audience filter landing pages (`/library?level=...`), all individual anime/manga title entries (`/title/[slug]`), and curator profiles (`/u/[username]`).

2. **Crawler Directives (`/robots.txt`)**:
   - Explicitly configured for `Googlebot` and general web crawlers. Whitelists public catalogs while keeping auth/api routes private.

3. **Schema.org Structured Data (JSON-LD)**:
   - **`WebSite` with `SearchAction`**: Enables the Google Sitelinks Searchbox directly in SERP results.
   - **`Organization`**: Brand knowledge panel data.
   - **`TVSeries` / `Book` / `Movie`**: Rating stars, episode counts, creators, release years for individual titles.
   - **`BreadcrumbList`**: Full breadcrumb trail shown in search results.
   - **`ProfilePage` / `Person`**: Curator and reviewer profiles.

4. **Dynamic OpenGraph & Social Cards (`/opengraph-image`)**:
   - Generates high-contrast 1200x630 social preview banners for Google Discover, Twitter, Discord, and messaging apps.

### How to Get Listed on Google in 4 Steps:
1. **Set your domain**: In `.env.local`, set `NEXT_PUBLIC_SITE_URL="https://yourdomain.com"`.
2. **Open [Google Search Console](https://search.google.com/search-console)**: Add your domain property (`https://yourdomain.com`).
3. **Verify ownership**: Select "HTML tag", copy the content string, and add it to `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-code"` in `.env.local` (or deploy to Vercel/production).
4. **Submit Sitemap**: In Google Search Console, go to **Sitemaps** on the left menu, enter `sitemap.xml`, and click **Submit**. Googlebot will crawl and index your pages.

