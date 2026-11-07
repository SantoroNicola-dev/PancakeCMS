import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await prisma.post.findUnique({ where: { slug: params.slug } });
  if (!page) return { title: "Pagina non trovata" };

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt || "",
    robots: {
      index: !page.noIndex,
      follow: !page.noFollow,
    },
  };
}

export default async function StaticPageView({
  params,
}: {
  params: { slug: string };
}) {
  const [settings, user, page] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    getSessionUser(),
    prisma.post.findUnique({
      where: { slug: params.slug },
      include: { author: true },
    }),
  ]);

  if (!page) notFound();

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

      <main className="mx-auto flex-1 w-full max-w-3xl px-4 pt-12 sm:px-6">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <h1 className="font-serif text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
            {page.title}
          </h1>
          {page.excerpt && (
            <p className="mt-3 text-base text-slate-500">{page.excerpt}</p>
          )}
          <div
            className="prose prose-slate dark:prose-invert mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
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

