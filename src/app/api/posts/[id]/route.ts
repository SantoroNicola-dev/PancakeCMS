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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true, jobTitle: true, bio: true },
      },
      category: true,
      tags: true,
      revisions: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      },
      _count: {
        select: { comments: true, likes: true, bookmarks: true },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Articolo non trovato." }, { status: 404 });
  }

  return NextResponse.json({ post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Contenuto non trovato." }, { status: 404 });
  }

  if (existing.authorId !== user.id && !canManageAllContent(user.role)) {
    return NextResponse.json(
      { error: "Puoi modificare solo gli articoli di cui sei autore." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Ripristino da una revisione storica
    if (body.restoreRevisionId) {
      const rev = await prisma.postRevision.findUnique({
        where: { id: String(body.restoreRevisionId) },
      });
      if (!rev || rev.postId !== existing.id) {
        return NextResponse.json(
          { error: "Revisione non trovata." },
          { status: 404 }
        );
      }

      const restored = await prisma.post.update({
        where: { id: existing.id },
        data: {
          title: rev.title,
          excerpt: rev.excerpt,
          content: rev.content,
          readingTimeMin: calculateReadingTime(rev.content),
        },
        include: {
          category: true,
          tags: true,
          revisions: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
            take: 15,
          },
        },
      });

      return NextResponse.json({ post: restored });
    }

    const {
      title = existing.title,
      slug: rawSlug = existing.slug,
      excerpt = existing.excerpt,
      content = existing.content,
      coverImage = existing.coverImage,
      coverImageAlt = existing.coverImageAlt,
      type = existing.type,
      status = existing.status,
      featured = existing.featured,
      allowComments = existing.allowComments,
      scheduledFor = existing.scheduledFor,
      categoryId = existing.categoryId,
      tagIds,
      seoTitle = existing.seoTitle,
      seoDescription = existing.seoDescription,
      focusKeyword = existing.focusKeyword,
      canonicalUrl = existing.canonicalUrl,
      ogTitle = existing.ogTitle,
      ogDescription = existing.ogDescription,
      ogImage = existing.ogImage,
      noIndex = existing.noIndex,
      noFollow = existing.noFollow,
      schemaType = existing.schemaType,
      revisionNote,
    } = body;

    let finalSlug = slugify(rawSlug || title) || existing.slug;
    if (finalSlug !== existing.slug) {
      const duplicate = await prisma.post.findFirst({
        where: { slug: finalSlug, id: { not: existing.id } },
      });
      if (duplicate) {
        finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }
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

    const wasPublished = existing.status === "PUBLISHED";
    const nowPublished = status === "PUBLISHED";

    const updated = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : null,
        content: String(content || ""),
        coverImage: coverImage || null,
        coverImageAlt: coverImageAlt || null,
        type: type as PostType,
        status: status as PostStatus,
        featured: Boolean(featured),
        allowComments: Boolean(allowComments),
        readingTimeMin,
        publishedAt:
          !wasPublished && nowPublished
            ? new Date()
            : existing.publishedAt || (nowPublished ? new Date() : null),
        scheduledFor:
          status === "SCHEDULED" && scheduledFor ? new Date(scheduledFor) : null,
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
        ...(Array.isArray(tagIds)
          ? {
              tags: {
                set: tagIds.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        category: true,
        tags: true,
        revisions: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 15,
        },
      },
    });

    // Se lo slug è cambiato su un post pubblicato, creiamo automaticamente un Redirect 301!
    if (wasPublished && finalSlug !== existing.slug) {
      const oldPath =
        existing.type === "PAGE"
          ? `/pagina/${existing.slug}`
          : `/articolo/${existing.slug}`;
      const newPath =
        updated.type === "PAGE"
          ? `/pagina/${updated.slug}`
          : `/articolo/${updated.slug}`;
      await prisma.redirect.upsert({
        where: { sourcePath: oldPath },
        update: { destinationPath: newPath, statusCode: 301, isActive: true },
        create: { sourcePath: oldPath, destinationPath: newPath, statusCode: 301 },
      });
    }

    // Salva nuova revisione se il contenuto o il titolo sono cambiati
    if (content !== existing.content || title !== existing.title || revisionNote) {
      await prisma.postRevision.create({
        data: {
          postId: existing.id,
          authorId: user.id,
          title: updated.title,
          excerpt: updated.excerpt,
          content: updated.content,
          note: revisionNote || "Aggiornamento contenuto",
        },
      });
    }

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.error("Update post error:", err);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dell'articolo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Articolo non trovato." }, { status: 404 });
  }

  if (existing.authorId !== user.id && !canManageAllContent(user.role)) {
    return NextResponse.json(
      { error: "Non hai i permessi per eliminare questo contenuto." },
      { status: 403 }
    );
  }

  await prisma.post.delete({ where: { id: existing.id } });
  return NextResponse.json({ success: true });
}

