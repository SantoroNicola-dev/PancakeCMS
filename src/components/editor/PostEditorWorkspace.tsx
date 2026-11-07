"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Eye,
  FolderTree,
  History,
  Image as ImageIcon,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { SeoFormState, SeoSuitePanel } from "./SeoSuitePanel";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { formatDateIt, slugify } from "@/lib/utils";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface TagOption {
  id: string;
  name: string;
  slug: string;
  color: string;
  isInternal: boolean;
}

interface RevisionItem {
  id: string;
  title: string;
  note: string | null;
  createdAt: string;
  author: { id: string; name: string };
}

interface InitialPostData {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  type?: "POST" | "PAGE";
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  featured?: boolean;
  allowComments?: boolean;
  scheduledFor?: string | null;
  categoryId?: string | null;
  tags?: TagOption[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
  schemaType?: string;
  revisions?: RevisionItem[];
}

export function PostEditorWorkspace({
  initialPost,
  defaultType = "POST",
}: {
  initialPost?: InitialPostData;
  defaultType?: "POST" | "PAGE";
}) {
  const router = useRouter();
  const isEditing = Boolean(initialPost?.id);

  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [content, setContent] = useState(
    initialPost?.content ||
      "<p>Inizia a scrivere qui il tuo articolo...</p><h2>Primo sottotitolo di approfondimento</h2><p>Sviluppa i concetti principali con chiarezza.</p>"
  );
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [coverImageAlt, setCoverImageAlt] = useState(
    initialPost?.coverImageAlt || ""
  );
  const [type, setType] = useState<"POST" | "PAGE">(
    initialPost?.type || defaultType
  );
  const [status, setStatus] = useState<
    "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED"
  >(initialPost?.status || "DRAFT");
  const [featured, setFeatured] = useState(Boolean(initialPost?.featured));
  const [allowComments, setAllowComments] = useState(
    initialPost?.allowComments ?? true
  );
  const [scheduledFor, setScheduledFor] = useState(
    initialPost?.scheduledFor
      ? new Date(initialPost.scheduledFor).toISOString().slice(0, 16)
      : ""
  );
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId || "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialPost?.tags?.map((t) => t.id) || []
  );
  const [revisionNote, setRevisionNote] = useState("");
  const [revisions, setRevisions] = useState<RevisionItem[]>(
    initialPost?.revisions || []
  );

  const [seo, setSeo] = useState<SeoFormState>({
    seoTitle: initialPost?.seoTitle || "",
    seoDescription: initialPost?.seoDescription || "",
    focusKeyword: initialPost?.focusKeyword || "",
    canonicalUrl: initialPost?.canonicalUrl || "",
    ogTitle: initialPost?.ogTitle || "",
    ogDescription: initialPost?.ogDescription || "",
    ogImage: initialPost?.ogImage || "",
    noIndex: Boolean(initialPost?.noIndex),
    noFollow: Boolean(initialPost?.noFollow),
    schemaType:
      initialPost?.schemaType ||
      (defaultType === "PAGE" ? "WebPage" : "BlogPosting"),
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagInternal, setNewTagInternal] = useState(false);

  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    fetch("/api/taxonomies")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories || []);
        setTags(d.tags || []);
      });
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleQuickCreateTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch("/api/taxonomies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "tag",
        action: "create",
        name: newTagName.trim(),
        isInternal: newTagInternal,
      }),
    });
    const data = await res.json();
    if (res.ok && data.tag) {
      setTags((prev) =>
        prev.some((t) => t.id === data.tag.id) ? prev : [...prev, data.tag]
      );
      setSelectedTagIds((prev) =>
        prev.includes(data.tag.id) ? prev : [...prev, data.tag.id]
      );
      setNewTagName("");
    }
  };

  const handleSave = async (overrideStatus?: typeof status) => {
    if (!title.trim()) {
      alert("Inserisci un titolo prima di salvare.");
      return;
    }
    setSaving(true);
    setSavedNotice("");
    const targetStatus = overrideStatus || status;

    try {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        coverImageAlt,
        type,
        status: targetStatus,
        featured,
        allowComments,
        scheduledFor:
          targetStatus === "SCHEDULED" && scheduledFor ? scheduledFor : null,
        categoryId: categoryId || null,
        tagIds: selectedTagIds,
        ...seo,
        revisionNote: revisionNote || undefined,
      };

      const url = isEditing ? `/api/posts/${initialPost!.id}` : "/api/posts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Errore durante il salvataggio.");
        return;
      }

      setStatus(targetStatus);
      setRevisionNote("");
      if (data.post?.revisions) {
        setRevisions(data.post.revisions);
      }
      setSavedNotice("Salvato con successo!");
      setTimeout(() => setSavedNotice(""), 3500);

      if (!isEditing && data.post?.id) {
        router.push(`/admin/posts/${data.post.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = async (revId: string) => {
    if (!initialPost?.id) return;
    if (
      !window.confirm(
        "Vuoi ripristinare il testo e il titolo di questa versione precedente?"
      )
    ) {
      return;
    }

    const res = await fetch(`/api/posts/${initialPost.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restoreRevisionId: revId }),
    });
    const data = await res.json();
    if (res.ok && data.post) {
      setTitle(data.post.title);
      setExcerpt(data.post.excerpt || "");
      setContent(data.post.content);
      setSavedNotice("Versione precedente ripristinata!");
    }
  };

  const handleDelete = async () => {
    if (!initialPost?.id) return;
    if (
      !window.confirm(
        "Sei sicuro di voler eliminare definitivamente questo contenuto?"
      )
    ) {
      return;
    }
    const res = await fetch(`/api/posts/${initialPost.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.push("/admin/posts");
    }
  };

  const publicTags = tags.filter((t) => !t.isInternal);
  const internalTags = tags.filter((t) => t.isInternal);
  const publicUrl =
    type === "PAGE" ? `/pagina/${slug}` : `/articolo/${slug}`;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Tutti i Contenuti
          </Link>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {type === "PAGE" ? "Pagina Statica" : "Articolo Blog"}
          </span>
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> {savedNotice}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {slug && status === "PUBLISHED" && (
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Vedi pagina live
            </Link>
          )}

          <button
            type="button"
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Save className="h-3.5 w-3.5" /> Salva Bozza
          </button>

          <button
            type="button"
            onClick={() =>
              handleSave(status === "SCHEDULED" ? "SCHEDULED" : "PUBLISHED")
            }
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {status === "SCHEDULED"
              ? "Programma Uscita"
              : status === "PUBLISHED"
              ? "Aggiorna Pubblicazione"
              : "Pubblica Ora"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950/40"
              title="Elimina contenuto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column (8 cols): Title, Slug, Excerpt, WYSIWYG, SEO Suite */}
        <div className="space-y-6 xl:col-span-8">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Inserisci il titolo dell'articolo o della pagina..."
              className="w-full border-0 bg-transparent font-serif text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none sm:text-3xl dark:text-white dark:placeholder:text-slate-700"
            />

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <span className="font-medium text-slate-400">
                Slug URL permanente:
              </span>
              <span className="text-slate-400">
                {type === "PAGE" ? "/pagina/" : "/articolo/"}
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Sommario / Occhiello Editoriale (Excerpt)
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve introduzione (2-3 righe) mostrata nelle card della home page e sotto il titolo..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Tiptap WYSIWYG Editor */}
          <RichTextEditor value={content} onChange={setContent} />

          {/* Yoast/RankMath-style SEO Suite */}
          <SeoSuitePanel
            title={title}
            slug={slug}
            excerpt={excerpt}
            contentHtml={content}
            coverImage={coverImage}
            coverImageAlt={coverImageAlt}
            seo={seo}
            onChange={setSeo}
          />
        </div>

        {/* Right Sidebar (4 cols): Publishing, Cover Image, Categories, Tags (Public & Internal), Revisions */}
        <div className="space-y-6 xl:col-span-4">
          {/* Stato, Programmazione & Opzioni */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Calendar className="h-4 w-4 text-brand-600" /> Pubblicazione &amp; Visibilità
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-500">
                  Tipo Contenuto
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "POST" | "PAGE")
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="POST">Articolo Blog</option>
                  <option value="PAGE">Pagina Statica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500">
                  Stato Editoriale
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as typeof status)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="DRAFT">Bozza</option>
                  <option value="PUBLISHED">Pubblicato</option>
                  <option value="SCHEDULED">Programmato</option>
                  <option value="ARCHIVED">Archiviato</option>
                </select>
              </div>
            </div>

            {status === "SCHEDULED" && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                  <Clock className="h-3.5 w-3.5" /> Data e Ora di Pubblicazione Automatica
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-xs dark:border-amber-800 dark:bg-amber-950/30"
                />
              </div>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Metti in evidenza in Home Page
                </span>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Abilita sezione commenti lettori
                </span>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500">
                Nota di revisione (opzionale)
              </label>
              <input
                type="text"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="es. Ottimizzazione SEO e nuovo paragrafo..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>

          {/* Immagine di Copertina */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <ImageIcon className="h-4 w-4 text-brand-600" /> Immagine in Evidenza
              </h3>
              <button
                type="button"
                onClick={() => setShowCoverPicker(true)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                {coverImage ? "Cambia / Ritaglia" : "Scegli da Media"}
              </button>
            </div>

            {coverImage ? (
              <div className="space-y-2.5">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <img
                    src={coverImage}
                    alt={coverImageAlt || title}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute right-2 top-2 rounded-lg bg-slate-900/75 px-2 py-1 text-[11px] text-white hover:bg-rose-600"
                  >
                    Rimuovi
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500">
                    Testo Alternativo SEO (ALT Immagine)
                  </label>
                  <input
                    type="text"
                    value={coverImageAlt}
                    onChange={(e) => setCoverImageAlt(e.target.value)}
                    placeholder="Descrivi l'immagine per Google e gli screen reader..."
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCoverPicker(true)}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 hover:border-brand-400 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-950"
              >
                <ImageIcon className="h-6 w-6" />
                <span>Seleziona o carica immagine di copertina</span>
              </button>
            )}
          </div>

          {/* Categoria & Tag (Pubblici + Interni) */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <FolderTree className="h-4 w-4 text-brand-600" /> Categoria
              </h3>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="">— Nessuna categoria —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Pubblici */}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <TagIcon className="h-3.5 w-3.5 text-emerald-600" /> Tag Pubblici (Visibili ai lettori)
              </h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {publicTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        active
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag Interni Editoriali */}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Lock className="h-3.5 w-3.5 text-rose-600" /> Tag Interni Editoriali (`#`)
              </h4>
              <p className="text-[11px] text-slate-400">
                Invisibili nel blog pubblico; usati per organizzazione interna o per posizionare i post (es. `#evidenza`).
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {internalTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full border px-2.5 py-1 font-mono text-xs font-semibold transition ${
                        active
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Creazione rapida Tag */}
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder={
                    newTagInternal ? "es. #sponsorizzato" : "Nuovo tag..."
                  }
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={handleQuickCreateTag}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-slate-900"
                >
                  <Plus className="h-3.5 w-3.5" /> Aggiungi
                </button>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <input
                  type="checkbox"
                  checked={newTagInternal}
                  onChange={(e) => setNewTagInternal(e.target.checked)}
                  className="accent-rose-600"
                />
                Crea come Tag Interno Editoriale (`#`)
              </label>
            </div>
          </div>

          {/* Cronologia Revisioni */}
          {revisions.length > 0 && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <History className="h-4 w-4 text-brand-600" /> Storico Revisioni ({revisions.length})
              </h3>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {rev.note || rev.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {rev.author?.name} • {formatDateIt(rev.createdAt, true)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      title="Ripristina questa versione"
                    >
                      <RotateCcw className="h-3 w-3" /> Ripristina
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCoverPicker && (
        <MediaPickerModal
          title="Seleziona o Modifica Immagine di Copertina"
          onClose={() => setShowCoverPicker(false)}
          onSelect={(media) => {
            setCoverImage(media.url);
            if (!coverImageAlt && media.altText) {
              setCoverImageAlt(media.altText);
            }
            setShowCoverPicker(false);
          }}
        />
      )}
    </div>
  );
}

