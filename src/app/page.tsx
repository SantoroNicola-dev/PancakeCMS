import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { formatDateIt } from "@/lib/utils";
import {
  getButtonRadiusClass,
  getCardStyleClasses,
  getContainerWidthClass,
  getImageAspectClass,
} from "@/lib/theme";
import {
  ArrowRight,
  Clock,
  Eye,
  Flame,
  Heart,
  MessageSquare,
  Sparkles,
  User as UserIcon,
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

  const s = settings || ({} as Record<string, any>);
  const containerClass = getContainerWidthClass(s.containerWidth);
  const cardClasses = getCardStyleClasses(s.cardStyle);
  const imageAspectClass = getImageAspectClass(s.cardImageRatio);
  const btnRadius = getButtonRadiusClass(s.buttonStyle);

  const heroLayout = s.heroLayout || "magazine";
  const postsGridLayout = s.postsGridLayout || "grid-2";
  const sidebarPosition = s.sidebarPosition || "right";
  const postsLimit = Number(s.postsPerPage) || 9;

  const showMasthead = s.showMasthead ?? true;
  const mastheadBadge = s.mastheadBadge ?? "Magazine Indipendente";
  const showCategoryBar = s.showCategoryBar ?? true;

  const showMostReadWidget = s.showMostReadWidget ?? true;
  const showTagsWidget = s.showTagsWidget ?? true;
  const showAuthorWidget = s.showAuthorWidget ?? true;

  const showCardExcerpt = s.showCardExcerpt ?? true;
  const showCardAuthor = s.showCardAuthor ?? true;
  const showCardDate = s.showCardDate ?? true;
  const showCardCategory = s.showCardCategory ?? true;
  const showCardStats = s.showCardStats ?? true;

  const headerMenu = (() => {
    try {
      return JSON.parse(s.headerMenuJson || "[]");
    } catch {
      return [{ label: "Home", href: "/" }];
    }
  })();

  const footerMenu = (() => {
    try {
      return JSON.parse(s.footerMenuJson || "[]");
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

  const secondHeroPost =
    heroLayout === "dual"
      ? posts.find((p) => p.id !== heroPost?.id)
      : undefined;

  const excludedHeroIds = new Set<string>();
  if (heroLayout !== "none" && heroPost) {
    excludedHeroIds.add(heroPost.id);
    if (heroLayout === "dual" && secondHeroPost) {
      excludedHeroIds.add(secondHeroPost.id);
    }
  }

  const remainingPosts = posts
    .filter((p) => !excludedHeroIds.has(p.id))
    .slice(0, postsLimit);

  const mostReadPosts = [...posts]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 4);

  const hasSidebar =
    sidebarPosition !== "none" &&
    (showAuthorWidget || showMostReadWidget || showTagsWidget);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        siteName={s.siteName || "Il Blog di Sara"}
        logoText={s.logoText || "Sara."}
        headerMenu={headerMenu}
        currentUser={user}
        settings={s}
      />

        <main className={`mx-auto flex-1 w-full ${containerClass} px-4 pt-8 sm:px-6`}>
          {/* Editorial Masthead */}
            {(showMasthead || showCategoryBar) && (
              <section className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-800">
                {showMasthead && (
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                    <div>
                      {mastheadBadge && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                          <Sparkles className="h-3.5 w-3.5" /> {mastheadBadge}
                        </span>
                      )}
                      <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        {s.siteName || "Il Blog di Sara"}
                      </h1>
                    </div>
                    <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
                      {s.siteTagline ||
                        "Storie, riflessioni, design e cultura digitale raccontati con cura editoriale."}
                    </p>
                  </div>
                )}

            {/* Category Pills */}
            {showCategoryBar && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className={`${btnRadius} bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900`}
                >
                  Tutti gli articoli ({posts.length})
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categoria/${cat.slug}`}
                    className={`${btnRadius} border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

            {/* HERO SECTION (Multiple Layout Modes) */ }
        {heroLayout !== "none" && heroPost && (
            <section className="mb-14">
                    { heroLayout === "spotlight" ? (
              <div className="cms-hero-card group relative min-h-[420px] overflow-hidden border border-slate-200 bg-slate-950 shadow-lg dark:border-slate-800">
                {heroPost.coverImage && (
                  <img
                    src={heroPost.coverImage}
                    alt={heroPost.coverImageAlt || heroPost.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-55 transition duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-6 sm:p-10 lg:max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                    <span className={`${btnRadius} bg-brand-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white`}>
                      In Primo Piano
                    </span>
                    {heroPost.category && (
                      <Link
                        href={`/categoria/${heroPost.category.slug}`}
                        className="font-bold uppercase tracking-wider text-brand-300 hover:underline"
                      >
                        {heroPost.category.name}
                      </Link>
                    )}
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {heroPost.readingTimeMin} min
                    </span>
                  </div>
                  <Link href={`/articolo/${heroPost.slug}`} className="mt-3">
                    <h2 className="font-serif text-3xl font-bold leading-tight text-white transition group-hover:text-brand-200 sm:text-4xl lg:text-5xl">
                      {heroPost.title}
                    </h2>
                  </Link>
                  {heroPost.excerpt && (
                    <p className="mt-3 line-clamp-2 text-sm text-slate-200 sm:text-base">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <div className="mt-6 flex items-center gap-4 text-xs text-slate-300">
                    <span className="font-semibold text-white">
                      {heroPost.author.name}
                    </span>
                    <span>•</span>
                    <span>{formatDateIt(heroPost.publishedAt)}</span>
                  </div>
                </div>
              </div>
            ) : heroLayout === "minimal" ? (
              <div className="cms-hero-card border border-slate-200 p-8 text-center shadow-sm sm:p-12 dark:border-slate-800">
                <div className="mx-auto max-w-3xl space-y-4">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className={`${btnRadius} bg-brand-100 px-3 py-1 font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300`}>
                      Editoriale in Evidenza
                    </span>
                    {heroPost.category && (
                      <Link
                        href={`/categoria/${heroPost.category.slug}`}
                        className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400"
                      >
                        {heroPost.category.name}
                      </Link>
                    )}
                  </div>
                  <Link href={`/articolo/${heroPost.slug}`}>
                    <h2 className="font-serif text-3xl font-bold leading-tight text-slate-900 hover:text-brand-600 sm:text-4xl lg:text-5xl dark:text-white">
                      {heroPost.title}
                    </h2>
                  </Link>
                  {heroPost.excerpt && (
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <div className="pt-2">
                    <Link
                      href={`/articolo/${heroPost.slug}`}
                      className={`inline-flex items-center gap-2 ${btnRadius} bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700`}
                    >
                      Leggi l&apos;articolo completo <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : heroLayout === "dual" ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {[heroPost, secondHeroPost].filter(Boolean).map((hp, i) =>
                  hp ? (
                    <div
                      key={hp.id}
                      className="cms-hero-card group flex flex-col justify-between overflow-hidden border border-slate-200 shadow-sm transition hover:shadow-md dark:border-slate-800"
                    >
                      <div>
                        <Link
                          href={`/articolo/${hp.slug}`}
                          className="relative block aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
                        >
                          {hp.coverImage && (
                            <img
                              src={hp.coverImage}
                              alt={hp.coverImageAlt || hp.title}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          )}
                          <span className={`absolute left-4 top-4 ${btnRadius} bg-brand-600/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow`}>
                            {i === 0 ? "In Primo Piano" : "Scelta Redazione"}
                          </span>
                        </Link>
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs">
                            {hp.category && (
                              <Link
                                href={`/categoria/${hp.category.slug}`}
                                className="font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400"
                              >
                                {hp.category.name}
                              </Link>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                              {hp.readingTimeMin} min di lettura
                            </span>
                          </div>
                          <Link href={`/articolo/${hp.slug}`}>
                            <h2 className="mt-2 font-serif text-2xl font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                              {hp.title}
                            </h2>
                          </Link>
                          {hp.excerpt && (
                            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                              {hp.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-xs text-slate-500 dark:border-slate-800">
                        <span>
                          {hp.author.name} • {formatDateIt(hp.publishedAt)}
                        </span>
                        <Link
                          href={`/articolo/${hp.slug}`}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          Leggi →
                        </Link>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              /* Default: "magazine" 7+5 split */
              <div className="cms-hero-card group grid grid-cols-1 overflow-hidden border border-slate-200 shadow-sm transition hover:shadow-md lg:grid-cols-12 dark:border-slate-800">
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
                  <span className={`absolute left-4 top-4 ${btnRadius} bg-brand-600/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow`}>
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
            )}
          </section>
        )}

        {/* Main Content Grid + Optional Editorial Sidebar */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Articles Feed */}
          <div
            className={`space-y-6 ${
              !hasSidebar
                ? "lg:col-span-12"
                : sidebarPosition === "left"
                ? "lg:order-2 lg:col-span-8"
                : "lg:col-span-8"
            }`}
          >
            <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Ultimi Articoli Pubblicati
            </h2>

            <div
              className={
                postsGridLayout === "list"
                  ? "space-y-5"
                  : postsGridLayout === "grid-3"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-6 sm:grid-cols-2"
              }
            >
              {remainingPosts.map((post, index) => {
                const isWideMix =
                  postsGridLayout === "magazine-mix" && index % 3 === 0;

                if (postsGridLayout === "list") {
                  return (
                    <article
                      key={post.id}
                      className={`group grid grid-cols-1 overflow-hidden sm:grid-cols-12 ${cardClasses}`}
                    >
                      {post.coverImage && (
                        <Link
                          href={`/articolo/${post.slug}`}
                          className="block aspect-video overflow-hidden bg-slate-100 sm:col-span-5 sm:aspect-auto dark:bg-slate-800"
                        >
                          <img
                            src={post.coverImage}
                            alt={post.coverImageAlt || post.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </Link>
                      )}
                      <div
                        className={`flex flex-col justify-between p-5 ${
                          post.coverImage ? "sm:col-span-7" : "sm:col-span-12"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            {showCardCategory && post.category ? (
                              <Link
                                href={`/categoria/${post.category.slug}`}
                                className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                              >
                                {post.category.name}
                              </Link>
                            ) : (
                              <span />
                            )}
                            <span className="text-slate-400">
                              {post.readingTimeMin} min
                            </span>
                          </div>
                          <Link href={`/articolo/${post.slug}`}>
                            <h3 className="mt-1.5 font-serif text-xl font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white">
                              {post.title}
                            </h3>
                          </Link>
                          {showCardExcerpt && post.excerpt && (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        {(showCardAuthor || showCardDate || showCardStats) && (
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
                            <span>
                              {showCardAuthor ? post.author.name : ""}
                              {showCardAuthor && showCardDate ? " • " : ""}
                              {showCardDate
                                ? formatDateIt(post.publishedAt)
                                : ""}
                            </span>
                            {showCardStats && (
                              <div className="flex items-center gap-2.5">
                                <span className="inline-flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {post._count.likes}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />{" "}
                                  {post._count.comments}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={post.id}
                    className={`group flex flex-col justify-between overflow-hidden ${cardClasses} ${
                      isWideMix ? "sm:col-span-2" : ""
                    }`}
                  >
                    <div>
                      <Link
                        href={`/articolo/${post.slug}`}
                        className={`block ${
                          isWideMix ? "aspect-[21/9]" : imageAspectClass
                        } w-full overflow-hidden bg-slate-100 dark:bg-slate-800`}
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
                          {showCardCategory ? (
                            post.category ? (
                              <Link
                                href={`/categoria/${post.category.slug}`}
                                className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                              >
                                {post.category.name}
                              </Link>
                            ) : (
                              <span className="text-slate-400">Articolo</span>
                            )
                          ) : (
                            <span />
                          )}
                          <span className="text-slate-400">
                            {post.readingTimeMin} min
                          </span>
                        </div>

                        <Link href={`/articolo/${post.slug}`}>
                          <h3
                            className={`mt-2 line-clamp-2 font-serif font-bold text-slate-900 transition group-hover:text-brand-600 dark:text-white ${
                              isWideMix ? "text-2xl" : "text-lg"
                            }`}
                          >
                            {post.title}
                          </h3>
                        </Link>

                        {showCardExcerpt && post.excerpt && (
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </div>

                    {(showCardAuthor || showCardDate || showCardStats) && (
                      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800">
                        <span>
                          {showCardAuthor ? post.author.name : ""}
                          {showCardAuthor && showCardDate ? " • " : ""}
                          {showCardDate ? formatDateIt(post.publishedAt) : ""}
                        </span>
                        {showCardStats && (
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {post._count.likes}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />{" "}
                              {post._count.comments}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          {/* Editorial Sidebar */}
          {hasSidebar && (
            <aside
              className={`space-y-8 lg:col-span-4 ${
                sidebarPosition === "left" ? "lg:order-1" : ""
              }`}
            >
              {/* Author / Magazine Bio Widget */}
              {showAuthorWidget && (
                <div className={`p-6 ${cardClasses}`}>
                  <div className="flex items-center gap-3.5">
                    {s.authorWidgetImage ? (
                      <img
                        src={s.authorWidgetImage}
                        alt={s.authorWidgetTitle || "Autore"}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-500/30"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 font-serif text-lg font-bold text-white">
                        {(s.logoText || s.siteName || "S").slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                        {s.authorWidgetTitle || "Chi scrive qui"}
                      </h3>
                      <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                        {s.siteName || "Il Blog di Sara"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {s.authorWidgetBio ||
                      "Uno spazio indipendente dedicato a scrittura digitale, cultura visiva e slow living."}
                  </p>
                  <Link
                    href="/pagina/chi-sono"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Scopri il manifesto <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              {/* Most Read */}
              {showMostReadWidget && (
                <div className={`p-6 ${cardClasses}`}>
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
              )}

              {/* Public Tags Cloud */}
              {showTagsWidget && (
                <div className={`p-6 ${cardClasses}`}>
                  <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                    Esplora per Argomento
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {publicTags.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tag/${tag.slug}`}
                        className={`${btnRadius} border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300`}
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>

      <Footer
        siteName={s.siteName || "Il Blog di Sara"}
        siteTagline={s.siteTagline || ""}
        footerMenu={footerMenu}
        settings={s}
      />
    </div>
  );
}
