import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { PostInteractionsAndComments } from "@/components/blog/PostInteractionsAndComments";
import { extractTocAndInjectIds, formatDateIt } from "@/lib/utils";
import { buildArticleJsonLd } from "@/lib/seo-analyzer";
import { ArrowLeft, BookOpen, Calendar, Clock, Edit3, List } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [post, settings] = await Promise.all([
    prisma.post.findUnique({ where: { slug: params.slug } }),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!post) return { title: "Articolo non trovato" };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || "";
  const siteUrl = (settings?.siteUrl || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const canonical = post.canonicalUrl || `${siteUrl}/articolo/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.ogTitle || title,
      description: post.ogDescription || description,
      type: "article",
      url: canonical,
      images:
        post.ogImage || post.coverImage
          ? [post.ogImage || post.coverImage!]
          : undefined,
    },
    robots: {
      index: !post.noIndex,
      follow: !post.noFollow,
    },
  };
}

export default async function SingleArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const [settings, user, post] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    getSessionUser(),
    prisma.post.findUnique({
      where: { slug: params.slug },
      include: {
        author: true,
        category: true,
        tags: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);

  if (!post) notFound();

  const isStaff =
    user &&
    (user.role === "ADMIN" || user.role === "EDITOR" || user.role === "AUTHOR");
  if (post.status !== "PUBLISHED" && !isStaff) {
    notFound();
  }

  const [userLike, userBookmark, relatedPosts] = await Promise.all([
    user
      ? prisma.postLike.findUnique({
          where: { postId_userId: { postId: post.id, userId: user.id } },
        })
      : null,
    user
      ? prisma.bookmark.findUnique({
          where: { postId_userId: { postId: post.id, userId: user.id } },
        })
      : null,
    prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        type: "POST",
        id: { not: post.id },
        ...(post.categoryId ? { categoryId: post.categoryId } : {}),
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const { htmlWithIds, toc } = extractTocAndInjectIds(post.content);
  const publicTags = post.tags.filter((t) => !t.isInternal);

  const siteUrl = (settings?.siteUrl || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  const jsonLd = buildArticleJsonLd({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || "",
    url: `${siteUrl}/articolo/${post.slug}`,
    imageUrl: post.coverImage ? `${siteUrl}${post.coverImage}` : undefined,
    authorName: post.author.name,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    schemaType: post.schemaType,
    siteName: settings?.siteName || "Il Blog di Sara",
  });

  const headerMenu = (() => {
    try {
      return JSON.parse(settings?.headerMenuJson || "[]");
    } catch {
      return [{ label: "Home", href: "/" }];
    }
  })();

  const footerMenu = (() => {
    try {
      return JSON.parse(settings?.footerMenuJson || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar
        siteName={settings?.siteName || "Il Blog di Sara"}
        logoText={settings?.logoText || "Sara."}
        headerMenu={headerMenu}
        currentUser={user}
      />

      <main className="mx-auto flex-1 w-full max-w-4xl px-4 pt-8 sm:px-6">
        {/* Top Bar & Edit Link for Staff */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Torna al magazine
          </Link>

          {isStaff && (
            <Link
              href={`/admin/posts/${post.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 dark:bg-white dark:text-slate-900"
            >
              <Edit3 className="h-3.5 w-3.5" /> Modifica nell&apos;Editor CMS
            </Link>
          )}
        </div>

        {/* Article Header */}
        <article>
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {post.category && (
                <Link
                  href={`/categoria/${post.category.slug}`}
                  className="rounded-full bg-brand-100 px-3 py-1 font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                >
                  {post.category.name}
                </Link>
              )}
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />{" "}
                {formatDateIt(post.publishedAt || post.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5" /> {post.readingTimeMin} min di
                lettura
              </span>
            </div>

            <h1 className="font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl md:text-5xl dark:text-white">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                {post.excerpt}
              </p>
            )}

            {/* Author Byline */}
            <div className="flex items-center gap-3 border-y border-slate-200 py-4 dark:border-slate-800">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-serif text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                {post.author.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {post.author.name}
                </p>
                <p className="text-xs text-slate-500">
                  {post.author.jobTitle || "Autore Redazione"}
                </p>
              </div>
            </div>
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <figure className="my-8 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
              <img
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                className="aspect-video w-full object-cover"
              />
              {post.coverImageAlt && (
                <figcaption className="bg-slate-50 px-4 py-2 text-center text-xs italic text-slate-500 dark:bg-slate-900">
                  {post.coverImageAlt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Automatic Table of Contents (TOC) */}
          {toc.length >= 2 && (
            <nav
              aria-label="Indice dell'articolo"
              className="my-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <List className="h-4 w-4 text-brand-600" /> Indice dei Contenuti
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {toc.map((item) => (
                  <li
                    key={item.id}
                    className={item.level === 3 ? "pl-5 text-xs" : "font-medium"}
                  >
                    <a
                      href={`#${item.id}`}
                      className="text-slate-700 hover:text-brand-600 hover:underline dark:text-slate-300 dark:hover:text-brand-400"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Rich Content */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlWithIds }}
          />

          {/* Public Tags */}
          {publicTags.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Argomenti:
              </span>
              {publicTags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Author Bio Card */}
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 font-serif text-lg font-bold text-white">
              {post.author.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Scritto da {post.author.name}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {post.author.bio ||
                  "Autore e curatore editoriale per Il Blog di Sara."}
              </p>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
            <h3 className="flex items-center gap-2 font-serif text-xl font-bold text-slate-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-brand-600" /> Articoli Correlati
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/articolo/${rp.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900"
                >
                  <h4 className="font-serif text-sm font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                    {rp.title}
                  </h4>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {rp.readingTimeMin} min di lettura
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interactions (Likes, Bookmarks, Share) & Nested Comments */}
        <PostInteractionsAndComments
          postId={post.id}
          postTitle={post.title}
          initialViews={post.viewsCount}
          initialLikesCount={post._count.likes}
          initialLiked={Boolean(userLike)}
          initialBookmarked={Boolean(userBookmark)}
          allowComments={post.allowComments}
          currentUser={user}
        />
      </main>

      <Footer
        siteName={settings?.siteName || "Il Blog di Sara"}
        siteTagline={settings?.siteTagline || ""}
        footerMenu={footerMenu}
      />
    </div>
  );
}

