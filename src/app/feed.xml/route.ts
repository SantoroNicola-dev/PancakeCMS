import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, posts] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", type: "POST" },
      include: { author: { select: { name: true } }, category: true },
      orderBy: { publishedAt: "desc" },
      take: 25,
    }),
  ]);

  const siteUrl = (settings?.siteUrl || "http://localhost:3000").replace(/\/$/, "");
  const siteName = settings?.siteName || "Il Blog di Sara";
  const siteDesc = settings?.siteDescription || "";

  const itemsXml = posts
    .map((p) => {
      const url = `${siteUrl}/articolo/${p.slug}`;
      return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${(p.publishedAt || p.createdAt).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${p.author.name}]]></dc:creator>
      ${p.category ? `<category><![CDATA[${p.category.name}]]></category>` : ""}
      <description><![CDATA[${p.excerpt || p.seoDescription || ""}]]></description>
    </item>`;
    })
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${siteDesc}]]></description>
    <language>it-IT</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

