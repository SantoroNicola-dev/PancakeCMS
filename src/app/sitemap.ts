import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });
  const baseUrl = (settings?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  const [posts, categories] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", noIndex: false },
      select: { slug: true, type: true, updatedAt: true },
    }),
    prisma.category.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  for (const post of posts) {
    const path = post.type === "PAGE" ? `/pagina/${post.slug}` : `/articolo/${post.slug}`;
    entries.push({
      url: `${baseUrl}${path}`,
      lastModified: post.updatedAt,
      changeFrequency: post.type === "PAGE" ? "monthly" : "weekly",
      priority: post.type === "PAGE" ? 0.7 : 0.9,
    });
  }

  for (const cat of categories) {
    entries.push({
      url: `${baseUrl}/categoria/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}

