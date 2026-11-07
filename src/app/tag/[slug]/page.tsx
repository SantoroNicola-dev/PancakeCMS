import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { formatDateIt } from "@/lib/utils";
import { ArrowLeft, Tag as TagIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TagArchivePage({
  params,
}: {
  params: { slug: string };
}) {
  const [settings, user, tag] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    getSessionUser(),
    prisma.tag.findUnique({
      where: { slug: params.slug },
      include: {
        posts: {
          where: { status: "PUBLISHED", type: "POST" },
          include: { author: true, category: true },
          orderBy: { publishedAt: "desc" },
        },
      },
    }),
  ]);

  if (!tag || tag.isInternal) notFound();

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
      <Navbar
        siteName={settings?.siteName || "Il Blog di Sara"}
        logoText={settings?.logoText || "Sara."}
        headerMenu={headerMenu}
        currentUser={user}
        settings={settings}
      />

      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Tutti gli articoli
        </Link>

        <header className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
            <TagIcon className="h-3.5 w-3.5" /> Argomento / Tag
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            #{tag.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {tag.posts.length} articoli associati a questo argomento
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tag.posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                {post.coverImage && (
                  <Link
                    href={`/articolo/${post.slug}`}
                    className="block aspect-video w-full overflow-hidden"
                  >
                    <img
                      src={post.coverImage}
                      alt={post.coverImageAlt || post.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </Link>
                )}
                <div className="p-5">
                  <Link href={`/articolo/${post.slug}`}>
                    <h2 className="font-serif text-lg font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                      {post.title}
                    </h2>
                  </Link>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-slate-400">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-slate-800">
                {post.author.name} • {formatDateIt(post.publishedAt)}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Footer
        siteName={settings?.siteName || "Il Blog di Sara"}
        siteTagline={settings?.siteTagline || ""}
        footerMenu={footerMenu}
        settings={settings}
      />
    </div>
  );
}

