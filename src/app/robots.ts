import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/library",
          "/timeline",
          "/panels",
          "/streaming",
          "/title/",
          "/u/",
        ],
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/profile",
          "/messages",
          "/*?*token=",
          "/*?*session=",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/library",
          "/timeline",
          "/panels",
          "/streaming",
          "/title/",
          "/u/",
        ],
        disallow: [
          "/api/",
          "/login",
          "/signup",
          "/profile",
          "/messages",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
