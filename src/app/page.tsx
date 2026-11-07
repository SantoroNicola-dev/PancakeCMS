import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { formatDateIt } from "@/lib/utils";
import {
  ArrowRight,
  Clock,
  Eye,
  Flame,
  Heart,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, user, posts, categories, publicTags] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    getSessionUser(),
    prisma.post.findMany({
      where: { status: "PUBLISHED", type: "POST" },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, jobTitle: true },
        },
        category: true,
        tags: true,
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.tag.findMany({
      where: { isInternal: false },
      orderBy: { name: "asc" },
    }),
  ]);

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

  // Individua l'articolo Hero principale (con tag interno #evidenza oppure featured: true)
  const heroPost =
    posts.find((p) =>
      p.tags.some((t) => t.isInternal && t.name === "#evidenza")
    ) ||
    posts.find((p) => p.featured) ||
    posts[0];

  const remainingPosts = posts.filter((p) => p.id !== heroPost?.id);
  const mostReadPosts = [...posts]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        siteName={settings?.siteName || "Il Blog di Sara"}
        logoText={settings?.logoText || "Sara."}
        headerMenu={headerMenu}
        currentUser={user}
      />

      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-8 sm:px-6">
        {/* Editorial Masthead */}
        <section className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                <Sparkles className="h-3.5 w-3.5" /> Magazine Indipendente
              </span>
              <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {settings?.siteName || "Il Blog di Sara"}
              </h1>
            </div>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
              {settings?.siteTagline ||
                "Storie, riflessioni, design e cultura digitale raccontati con cura editoriale."}
            </p>
          </div>

          {/* Category Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
            >
              Tutti gli articoli ({posts.length})
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Hero Featured Article */}
        {heroPost && (
          <section className="mb-14">
            <div className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
              <Link
                href={`/articolo/${heroPost.slug}`}
                className="relative aspect-video overflow-hidden bg-slate-100 lg:col-span-7 lg:aspect-auto dark:bg-slate-800"
              >
                {heroPost.coverImage ? (
                  <img
                    src={heroPost.coverImage}
                    alt={heroPost.coverImageAlt || heroPost.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : null}
                <span className="absolute left-4 top-4 rounded-full bg-brand-600/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow">
                  In Primo Piano
                </span>
              </Link>

              <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {heroPost.category && (
                      <Link
                        href={`/categoria/${heroPost.category.slug}`}
                        className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400"
                      >
                        {heroPost.category.name}
                      </Link>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> {heroPost.readingTimeMin}{" "}
                      min di lettura
                    </span>
                  </div>

                  <Link href={`/articolo/${heroPost.slug}`}>
                    <h2 className="font-serif text-2xl font-bold leading-snug text-slate-900 transition group-hover:text-brand-600 sm:text-3xl dark:text-white">
                      {heroPost.title}
                    </h2>
                  </Link>

                  {heroPost.excerpt && (
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {heroPost.excerpt}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {heroPost.author.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateIt(heroPost.publishedAt)}
                    </p>
                  </div>

                  <Link
                    href={`/articolo/${heroPost.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Leggi l&apos;editoriale <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Grid + Editorial Sidebar */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left: Articles Feed (8 cols) */}
          <div className="space-y-6 lg:col-span-8">
            <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Ultimi Articoli Pubblicati
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {remainingPosts.map((post) => (
                <article
                  key={post.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <Link
                      href={`/articolo/${post.slug}`}
                      className="block aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                    >
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : null}
                    </Link>

                    <div className="p-5">
                      <div className="flex items-center justify-between text-xs">
                        {post.category ? (
                          <Link
                            href={`/categoria/${post.category.slug}`}
                            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                          >
                            {post.category.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">Articolo</span>
                        )}
                        <span className="text-slate-400">
                          {post.readingTimeMin} min
                        </span>
                      </div>

                      <Link href={`/articolo/${post.slug}`}>
                        <h3 className="mt-2 line-clamp-2 font-serif text-lg font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white">
                          {post.title}
                        </h3>
                      </Link>

                      {post.excerpt && (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800">
                    <span>
                      {post.author.name} • {formatDateIt(post.publishedAt)}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {post._count.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />{" "}
                        {post._count.comments}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Right Sidebar (4 cols) */}
          <aside className="space-y-8 lg:col-span-4">
            {/* Most Read */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                <Flame className="h-4 w-4 text-brand-600" /> Articoli più letti
              </h3>
              <div className="mt-4 space-y-4">
                {mostReadPosts.map((p, idx) => (
                  <Link
                    key={p.id}
                    href={`/articolo/${p.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <span className="font-serif text-2xl font-bold text-slate-300 group-hover:text-brand-600 dark:text-slate-700">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 dark:text-slate-200">
                        {p.title}
                      </h4>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye className="h-3 w-3" /> {p.viewsCount} letture •{" "}
                        {p.readingTimeMin} min
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Public Tags Cloud */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                Esplora per Argomento
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {publicTags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer
        siteName={settings?.siteName || "Il Blog di Sara"}
        siteTagline={settings?.siteTagline || ""}
        footerMenu={footerMenu}
      />
    </div>
  );
}

