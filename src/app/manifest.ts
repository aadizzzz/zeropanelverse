import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZeroPanelVerse — Anime & Manga Platform",
    short_name: "ZeroPanelVerse",
    description:
      "A perspective-driven anime, manga, and manhwa platform featuring audience lenses, franchise chronology trees, and community panels.",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c0c",
    theme_color: "#0c0c0c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
    ],
  };
}
