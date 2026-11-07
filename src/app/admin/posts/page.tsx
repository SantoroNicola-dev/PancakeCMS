"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Eye,
  FilePlus2,
  Filter,
  Lock,
  Search,
  Trash2,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  type: "POST" | "PAGE";
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  seoScore: number;
  viewsCount: number;
  publishedAt: string | null;
  scheduledFor: string | null;
  updatedAt: string;
  author: { id: string; name: string };
  category: { id: string; name: string } | null;
  tags: { id: string; name: string; slug: string; isInternal: boolean }[];
  _count: { comments: number; likes: number; revisions: number };
}

export default function AdminPostsListPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [internalTagFilter, setInternalTagFilter] = useState("ALL");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/posts?admin=1");
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Vuoi eliminare definitivamente "${title}"?`)) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } else {
      const d = await res.json();
      alert(d.error || "Errore durante l'eliminazione.");
    }
  };

  const allInternalTags = Array.from(
    new Map(
      posts
        .flatMap((p) => p.tags.filter((t) => t.isInternal))
        .map((t) => [t.slug, t])
    ).values()
  );

  const filtered = posts.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && p.type !== typeFilter) return false;
    if (
      internalTagFilter !== "ALL" &&
      !p.tags.some((t) => t.slug === internalTagFilter)
    ) {
      return false;
    }
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.slug.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Articoli del Blog &amp; Pagine Statiche
          </h1>
          <p className="text-xs text-slate-500">
            Gestisci articoli, pagine, bozze programmate, punteggi SEO e tag editoriali interni (`#`).
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/posts/new?type=PAGE"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            + Nuova Pagina Statica
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            <FilePlus2 className="h-4 w-4" /> Nuovo Articolo
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per titolo o slug URL..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
        >
          <option value="ALL">Tutti i tipi (Articoli + Pagine)</option>
          <option value="POST">Solo Articoli Blog</option>
          <option value="PAGE">Solo Pagine Statiche</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
        >
          <option value="ALL">Tutti gli stati</option>
          <option value="PUBLISHED">Pubblicati</option>
          <option value="DRAFT">Bozze</option>
          <option value="SCHEDULED">Programmati</option>
          <option value="ARCHIVED">Archiviati</option>
        </select>

        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-rose-600" />
          <select
            value={internalTagFilter}
            onChange={(e) => setInternalTagFilter(e.target.value)}
            className="rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
          >
            <option value="ALL">Filtra per Tag Interno (#)</option>
            {allInternalTags.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950">
              <tr>
                <th className="px-5 py-3.5">Titolo &amp; Tag</th>
                <th className="px-4 py-3.5">Tipo / Categoria</th>
                <th className="px-4 py-3.5">Stato</th>
                <th className="px-4 py-3.5">SEO Score</th>
                <th className="px-4 py-3.5">Metriche</th>
                <th className="px-5 py-3.5 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Caricamento contenuti...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nessun contenuto corrisponde ai filtri selezionati.
                  </td>
                </tr>
              ) : (
                filtered.map((post) => {
                  const publicUrl =
                    post.type === "PAGE"
                      ? `/pagina/${post.slug}`
                      : `/articolo/${post.slug}`;

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="font-serif text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white"
                        >
                          {post.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {publicUrl}
                          </span>
                          {post.tags.map((t) => (
                            <span
                              key={t.id}
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                t.isInternal
                                  ? "bg-rose-100 font-mono text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {post.type === "PAGE"
                            ? "Pagina Statica"
                            : post.category?.name || "Senza categoria"}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Autore: {post.author.name}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            post.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : post.status === "SCHEDULED"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {post.status}
                        </span>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {post.status === "SCHEDULED"
                            ? formatDateIt(post.scheduledFor, true)
                            : formatDateIt(post.publishedAt || post.updatedAt)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                            post.seoScore >= 75
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : post.seoScore >= 45
                              ? "bg-amber-500/15 text-amber-700"
                              : "bg-rose-500/15 text-rose-700"
                          }`}
                        >
                          {post.seoScore} / 100
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {post.viewsCount} visite
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {post._count.comments} comm. • {post._count.revisions} rev.
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={publicUrl}
                            target="_blank"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 dark:border-slate-700"
                            title="Apri anteprima"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/admin/posts/${post.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Editor
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(post.id, post.title)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700"
                            title="Elimina"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

