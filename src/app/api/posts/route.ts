import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canAccessAdmin,
  canManageAllContent,
  getSessionUser,
} from "@/lib/auth";
import { analyzeSeo } from "@/lib/seo-analyzer";
import { calculateReadingTime, slugify } from "@/lib/utils";
import { PostStatus, PostType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as PostStatus | null;
  const type = (searchParams.get("type") as PostType | null) || undefined;
  const categorySlug = searchParams.get("category");
  const tagSlug = searchParams.get("tag");
  const search = searchParams.get("q");
  const adminView = searchParams.get("admin") === "1";

  const user = await getSessionUser();

  // Auto-publish scheduled posts whose scheduledFor timestamp has passed
  await prisma.post.updateMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: new Date() },
    },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const where: Record<string, unknown> = {};

  if (adminView && user && canAccessAdmin(user.role)) {
    if (status) where.status = status;
    if (type) where.type = type;
    // Se è AUTHOR, vede i propri articoli (o tutti in sola lettura, ma filtriamo se richiesto)
    if (searchParams.get("mine") === "1" || user.role === "AUTHOR") {
      where.authorId = user.id;
    }
  } else {
    where.status = "PUBLISHED";
    where.type = type || "POST";
  }

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (tagSlug) {
    where.tags = { some: { slug: tagSlug } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: {
        select: { id: true, name: true, avatarUrl: true, jobTitle: true, role: true },
      },
      category: true,
      tags: true,
      _count: {
        select: { comments: true, likes: true, bookmarks: true, revisions: true },
      },
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Accesso non autorizzato." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      slug: rawSlug,
      excerpt,
      content,
      coverImage,
      coverImageAlt,
      type = "POST",
      status = "DRAFT",
      featured = false,
      allowComments = true,
      scheduledFor,
      categoryId,
      tagIds = [],
      seoTitle,
      seoDescription,
      focusKeyword,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      noIndex = false,
      noFollow = false,
      schemaType = "BlogPosting",
      revisionNote,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        { error: "Il titolo è obbligatorio." },
        { status: 400 }
      );
    }

    let finalSlug = slugify(rawSlug || title);
    if (!finalSlug) finalSlug = `post-${Date.now()}`;

    const existingSlug = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const seoReport = analyzeSeo({
      title: String(title),
      seoTitle,
      slug: finalSlug,
      seoDescription,
      excerpt,
      focusKeyword,
      contentHtml: String(content || ""),
      coverImage,
      coverImageAlt,
    });

    const readingTimeMin = calculateReadingTime(String(content || ""));

    const post = await prisma.post.create({
      data: {
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: String(content || "<p></p>"),
        coverImage: coverImage || null,
        coverImageAlt: coverImageAlt || null,
        type: type === "PAGE" ? "PAGE" : "POST",
        status: status as PostStatus,
        featured: Boolean(featured),
        allowComments: Boolean(allowComments),
        readingTimeMin,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        scheduledFor:
          status === "SCHEDULED" && scheduledFor ? new Date(scheduledFor) : null,
        authorId: user.id,
        categoryId: categoryId || null,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        focusKeyword: focusKeyword || null,
        canonicalUrl: canonicalUrl || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || coverImage || null,
        noIndex: Boolean(noIndex),
        noFollow: Boolean(noFollow),
        schemaType: schemaType || "BlogPosting",
        seoScore: seoReport.overallScore,
        tags:
          Array.isArray(tagIds) && tagIds.length > 0
            ? { connect: tagIds.map((id: string) => ({ id })) }
            : undefined,
      },
      include: {
        author: { select: { id: true, name: true } },
        category: true,
        tags: true,
      },
    });

    await prisma.postRevision.create({
      data: {
        postId: post.id,
        authorId: user.id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        note: revisionNote || "Creazione iniziale",
      },
    });

    return NextResponse.json({ post });
  } catch (err) {
    console.error("Create post error:", err);
    return NextResponse.json(
      { error: "Errore durante il salvataggio del contenuto." },
      { status: 500 }
    );
  }
}

