import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { formatDateIt } from "@/lib/utils";
import { ArrowLeft, FolderTree } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoryArchivePage({
  params,
}: {
  params: { slug: string };
}) {
  const [settings, user, category] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    getSessionUser(),
    prisma.category.findUnique({
      where: { slug: params.slug },
      include: {
        children: true,
        parent: true,
        posts: {
          where: { status: "PUBLISHED", type: "POST" },
          include: { author: true, category: true },
          orderBy: { publishedAt: "desc" },
        },
      },
    }),
  ]);

  if (!category) notFound();

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
            <FolderTree className="h-3.5 w-3.5" /> Categoria Editoriale
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              {category.description}
            </p>
          )}

          {category.children.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Sottocategorie:</span>
              {category.children.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/categoria/${sub.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.posts.map((post) => (
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
      />
    </div>
  );
}

