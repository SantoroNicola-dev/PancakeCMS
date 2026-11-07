import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { formatDateIt } from "@/lib/utils";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock,
  Eye,
  FilePlus2,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Palette,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    user,
    settings,
    posts,
    comments,
    usersCount,
    readersCount,
    mediaCount,
    subscribersCount,
  ] = await Promise.all([
    getSessionUser(),
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.post.findMany({
      include: {
        author: { select: { name: true } },
        category: true,
        tags: true,
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.comment.findMany({
      take: 6,
      include: {
        user: { select: { name: true, role: true } },
        post: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "READER" } }),
    prisma.media.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
  ]);

  const publishedPosts = posts.filter(
    (p) => p.status === "PUBLISHED" && p.type === "POST"
  );
  const scheduledPosts = posts.filter((p) => p.status === "SCHEDULED");
  const totalViews = posts.reduce((acc, p) => acc + p.viewsCount, 0);
  const avgSeoScore =
    posts.length > 0
      ? Math.round(
          posts.reduce((acc, p) => acc + p.seoScore, 0) / posts.length
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600">
            <Sparkles className="h-3.5 w-3.5" /> Studio Editoriale &amp; Analytics
          </span>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Ciao, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-500">
            Panoramica in tempo reale dei contenuti, SEO, Google Analytics 4 e community lettori.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin/appearance"
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300"
            >
              <Palette className="h-4 w-4 text-brand-600" /> Aspetto, Tema &amp; Design 360°
            </Link>
          )}
          <Link
            href="/admin/media"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <ImageIcon className="h-4 w-4 text-brand-600" /> Libreria Media ({mediaCount})
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <FilePlus2 className="h-4 w-4" /> Nuovo Articolo WYSIWYG
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Letture Totali Articoli
            </span>
            <Eye className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {totalViews.toLocaleString("it-IT")}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600">
            GA4 Tag:{" "}
            {settings?.enableGa4 && settings?.gaMeasurementId
              ? `Attivo (${settings.gaMeasurementId})`
              : "Solo statistiche interne"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Articoli &amp; Pagine
            </span>
            <FileText className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {posts.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {publishedPosts.length} pubblicati • {scheduledPosts.length} programmati
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Salute Media SEO
            </span>
            <BarChart3 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-emerald-600">
            {avgSeoScore}/100
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Sitemap.xml, JSON-LD e OpenGraph attivi
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Community &amp; Newsletter
            </span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <p className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white">
            {usersCount} utenti
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {readersCount} lettori registrati • {subscribersCount} iscritti newsletter
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Recent & Top Articles (7 cols) */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              Contenuti Recenti &amp; Punteggio SEO
            </h2>
            <Link
              href="/admin/posts"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Vedi tutti →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {posts.slice(0, 6).map((post) => {
              const internalTags = post.tags.filter((t) => t.isInternal);
              return (
                <div
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="truncate text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white"
                      >
                        {post.title}
                      </Link>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          post.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : post.status === "SCHEDULED"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {post.status}
                      </span>
                      {internalTags.map((it) => (
                        <span
                          key={it.id}
                          className="rounded-full bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          {it.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {post.author.name} • {post.category?.name || "Pagina"} •{" "}
                      {post.viewsCount} letture • {post._count.comments} commenti
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        post.seoScore >= 75
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : post.seoScore >= 45
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-rose-500/15 text-rose-700"
                      }`}
                      title="Punteggio SEO"
                    >
                      SEO {post.seoScore}
                    </span>
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                    >
                      Modifica
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scheduled Calendar + Recent Comments + GA4 Status (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Google Analytics & GDPR Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Activity className="h-4 w-4 text-brand-600" /> Stato Google Analytics 4 &amp; Tag
              </h3>
              <Link
                href="/admin/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                Configura <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs dark:bg-slate-950">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Misurazione GA4:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {settings?.gaMeasurementId || "Non impostato"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Banner Cookie GDPR v2:</span>
                <span className="font-semibold text-emerald-600">
                  {settings?.enableCookieBanner ? "Attivo" : "Disattivato"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Eventi Automatici:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  Scroll 75%, Like, Share, Newsletter
                </span>
              </div>
            </div>
          </div>

          {/* Calendario Uscite Programmate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="h-4 w-4 text-amber-500" /> Calendario Articoli Programmati
            </h3>
            {scheduledPosts.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">
                Nessun articolo in coda di pubblicazione automatica.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {scheduledPosts.map((sp) => (
                  <Link
                    key={sp.id}
                    href={`/admin/posts/${sp.id}`}
                    className="block rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">
                      {sp.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">
                      Uscita prevista: {formatDateIt(sp.scheduledFor, true)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Ultimi Commenti Lettori */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <MessageSquare className="h-4 w-4 text-brand-600" /> Ultimi Commenti
              </h3>
              <Link
                href="/admin/comments"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Modera →
              </Link>
            </div>
            <div className="mt-3 space-y-2.5">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.user.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateIt(c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-slate-600 dark:text-slate-400">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

