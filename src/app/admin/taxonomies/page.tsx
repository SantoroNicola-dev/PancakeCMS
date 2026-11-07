"use client";

import React, { useEffect, useState } from "react";
import {
  FolderTree,
  Lock,
  Plus,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  _count: { posts: number };
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  isInternal: boolean;
  _count: { posts: number };
}

export default function AdminTaxonomiesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catColor, setCatColor] = useState("#c54c3d");
  const [catSeoTitle, setCatSeoTitle] = useState("");

  // Tag Form
  const [tagName, setTagName] = useState("");
  const [tagDesc, setTagDesc] = useState("");
  const [tagColor, setTagColor] = useState("#0f766e");
  const [tagIsInternal, setTagIsInternal] = useState(false);

  const loadData = async () => {
    const res = await fetch("/api/taxonomies");
    const data = await res.json();
    setCategories(data.categories || []);
    setTags(data.tags || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const res = await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "category",
        action: "create",
        name: catName,
        description: catDesc,
        parentId: catParentId || null,
        color: catColor,
        seoTitle: catSeoTitle || null,
      }),
    });
    if (res.ok) {
      setCatName("");
      setCatDesc("");
      setCatParentId("");
      setCatSeoTitle("");
      loadData();
    } else {
      const d = await res.json();
      alert(d.error || "Errore.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Vuoi eliminare questa categoria?")) return;
    await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "category", action: "delete", id }),
    });
    loadData();
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    const res = await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "tag",
        action: "create",
        name: tagName,
        description: tagDesc,
        color: tagIsInternal ? "#e11d48" : tagColor,
        isInternal: tagIsInternal,
      }),
    });
    if (res.ok) {
      setTagName("");
      setTagDesc("");
      loadData();
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!window.confirm("Vuoi eliminare questo tag?")) return;
    await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "tag", action: "delete", id }),
    });
    loadData();
  };

  const publicTags = tags.filter((t) => !t.isInternal);
  const internalTags = tags.filter((t) => t.isInternal);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
          Categorie Gerarchiche &amp; Tag (Pubblici e Interni `#`)
        </h1>
        <p className="text-xs text-slate-500">
          Organizza l&apos;architettura del blog con categorie padre/figlio, tag pubblici per i lettori e tag interni editoriali (`#evidenza`, `#da-revisionare`).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Categories (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          <form
            onSubmit={handleCreateCategory}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
              <FolderTree className="h-5 w-5 text-brand-600" /> Nuova Categoria
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nome Categoria
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="es. Fotografia & Viaggi"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Categoria Padre (Gerarchia)
                </label>
                <select
                  value={catParentId}
                  onChange={(e) => setCatParentId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="">— Categoria Principale (Root) —</option>
                  {categories
                    .filter((c) => !c.parentId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Descrizione Categoria
              </label>
              <textarea
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Meta Title SEO Dedicato (Opzionale)
              </label>
              <input
                type="text"
                value={catSeoTitle}
                onChange={(e) => setCatSeoTitle(e.target.value)}
                placeholder="es. Fotografia e Reportage di Viaggio | Il Blog di Sara"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Crea Categoria
            </button>
          </form>

          {/* Categories List */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Albero Categorie Attive ({categories.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {cat.parent ? (
                        <span className="text-slate-400">
                          {cat.parent.name} ↳{" "}
                        </span>
                      ) : null}
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      /categoria/{cat.slug} • {cat._count.posts} articoli
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Dual Tags System (Public vs Internal #) (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          <form
            onSubmit={handleCreateTag}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
              <TagIcon className="h-5 w-5 text-brand-600" /> Nuovo Tag (Pubblico o Interno `#`)
            </h2>

            <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => setTagIsInternal(false)}
                className={`flex-1 rounded-lg py-2 font-semibold transition ${
                  !tagIsInternal
                    ? "bg-emerald-600 text-white"
                    : "text-slate-500"
                }`}
              >
                Tag Pubblico (Per i lettori)
              </button>
              <button
                type="button"
                onClick={() => setTagIsInternal(true)}
                className={`flex-1 rounded-lg py-2 font-semibold transition ${
                  tagIsInternal ? "bg-rose-600 text-white" : "text-slate-500"
                }`}
              >
                # Tag Interno Editoriale
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nome del Tag
              </label>
              <input
                type="text"
                required
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder={
                  tagIsInternal
                    ? "es. #evidenza, #sponsorizzato, #da-revisionare"
                    : "es. architettura, saggistica, poesia"
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Uso / Descrizione
              </label>
              <input
                type="text"
                value={tagDesc}
                onChange={(e) => setTagDesc(e.target.value)}
                placeholder="Breve nota sull'utilizzo di questo tag..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Salva Tag
            </button>
          </form>

          {/* Internal Tags List */}
          <div className="space-y-3 rounded-2xl border border-rose-200/80 bg-white p-6 shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
              <Lock className="h-3.5 w-3.5" /> Tag Interni Editoriali ({internalTags.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Questi tag non generano pagine pubbliche ma pilotano il layout del tema (es. `#evidenza` per il box Hero) e il flusso di lavoro della redazione.
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {internalTags.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 font-mono font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {t.name}
                    </span>
                    <span className="ml-2 text-slate-400">
                      ({t._count.posts} post)
                    </span>
                    {t.description && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(t.id)}
                    className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Public Tags List */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tag Pubblici ({publicTags.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {publicTags.map((t) => (
                <div
                  key={t.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    #{t.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({t._count.posts})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

