import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { LensBar } from "@/components/LensBar";
import { getCurrentUser } from "@/lib/auth";
import { getLens } from "@/lib/lens";
import {
  SITE_URL,
  SITE_NAME,
  SITE_TITLE_TEMPLATE,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  PRIMARY_KEYWORDS,
  GOOGLE_SITE_VERIFICATION,
  generateSiteSchema,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: SITE_TITLE_TEMPLATE,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: PRIMARY_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "ZeroPanelVerse Curators", url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "entertainment",
  classification: "Anime, Manga and Manhwa Guides & Community",
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: "@zeropanelverse",
    site: "@zeropanelverse",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.svg",
    shortcut: "/favicon.ico",
  },
  verification: GOOGLE_SITE_VERIFICATION
    ? {
        google: GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const lens = await getLens(user);
  const siteSchema = generateSiteSchema();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-ink text-paper antialiased">
        <Nav user={user} />
        <LensBar lens={lens} signedIn={Boolean(user)} />
        <main className="min-h-[70vh]">{children}</main>
        <footer className="mt-20 border-t border-line">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
            <div>
              <span className="display text-lg text-paper">
                ZeroPanel<span className="text-mute">Verse</span>
              </span>
              <p className="mt-3 max-w-xs text-[12.5px] leading-relaxed text-mute">
                A black-and-white archive built in panels. Every title carries its own cinematic
                accent, and every audience level gets its own reading of the work.
              </p>
            </div>
            <div>
              <h4 className="mono mb-3 text-[9px] text-mute">Archive</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-dim">
                <li>
                  <Link href="/timeline" className="hover:text-paper">
                    Timeline tree
                  </Link>
                </li>
                <li>
                  <Link href="/library?format=anime" className="hover:text-paper">
                    Anime
                  </Link>
                </li>
                <li>
                  <Link href="/library?format=manga" className="hover:text-paper">
                    Manga
                  </Link>
                </li>
                <li>
                  <Link href="/library?format=manhwa" className="hover:text-paper">
                    Manhwa
                  </Link>
                </li>
                <li>
                  <Link href="/panels" className="hover:text-paper">
                    Community panels
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mono mb-3 text-[9px] text-mute">Audience</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-dim">
                <li>
                  <Link href="/library?level=beginner" className="hover:text-paper">
                    Beginner track
                  </Link>
                </li>
                <li>
                  <Link href="/library?level=mediocre" className="hover:text-paper">
                    Mediocre track
                  </Link>
                </li>
                <li>
                  <Link href="/library?level=elite" className="hover:text-paper">
                    Elite track
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mono mb-3 text-[9px] text-mute">Coming soon</h4>
              <ul className="flex flex-col gap-2 text-[13px] text-dim">
                <li>
                  <Link href="/streaming" className="hover:text-paper">
                    ZeroPanelVerse Stream
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-paper">
                    Create an account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-paper">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="mono mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-[9px] text-mute sm:px-6">
              <span>© {new Date().getFullYear()} ZeroPanelVerse — panels, not pages</span>
              <span>Streaming planned · launch build v0.9</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
