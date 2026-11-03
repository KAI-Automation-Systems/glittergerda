import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return [""].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-09-24"),
    changeFrequency: path ? "yearly" : "weekly",
    priority: path ? 0.3 : 1,
  }));
}
