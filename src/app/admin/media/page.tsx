"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Folder,
  Image as ImageIcon,
  Loader2,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { ImageEditorModal, MediaItem } from "@/components/media/ImageEditorModal";
import { formatBytes } from "@/lib/utils";

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFolder, setActiveFolder] = useState("Tutti");
  const [uploadFolder, setUploadFolder] = useState("Copertine");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editingImage, setEditingImage] = useState<MediaItem | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      const items: MediaItem[] = data.media || [];
      setMediaList(items);
      if (items.length > 0 && !selected) {
        setSelected(items[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", uploadFolder || "Generale");
        const res = await fetch("/api/media", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok && data.media) {
          setMediaList((prev) => [data.media, ...prev]);
          setSelected(data.media);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/media/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selected.title,
          altText: selected.altText,
          caption: selected.caption,
          folder: selected.folder,
        }),
      });
      const data = await res.json();
      if (res.ok && data.media) {
        setMediaList((prev) =>
          prev.map((m) => (m.id === selected.id ? { ...m, ...data.media } : m))
        );
      }
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (
      !window.confirm(
        `Vuoi eliminare "${item.filename}" dalla libreria media?`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    }
  };

  const folders = [
    "Tutti",
    ...Array.from(new Set(mediaList.map((m) => m.folder || "Generale"))),
  ];

  const filtered = mediaList.filter((m) => {
    if (activeFolder !== "Tutti" && m.folder !== activeFolder) return false;
    if (
      search &&
      !m.filename.toLowerCase().includes(search.toLowerCase()) &&
      !m.altText.toLowerCase().includes(search.toLowerCase()) &&
      !m.title.toLowerCase().includes(search.toLowerCase())
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
            Libreria Media &amp; Editor Immagini WebP
          </h1>
          <p className="text-xs text-slate-500">
            Ogni caricamento viene convertito e compresso automaticamente in WebP tramite Sharp. Clicca su un&apos;immagine per ritagliarla o applicare filtri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            placeholder="Cartella destinazione..."
            className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Carica Immagini (Auto-WebP)</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Folders & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {folders.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFolder(f)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeFolder === f
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Folder className="h-3.5 w-3.5" /> {f}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, titolo o attributo ALT..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
      </div>

      {/* Main Grid + Inspector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Media Grid (8 cols) */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-8">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              Caricamento libreria media...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              Nessun file media in questa cartella.
            </div>
          ) : (
            filtered.map((item) => {
              const isSel = selected?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white transition dark:bg-slate-900 ${
                    isSel
                      ? "border-brand-600 ring-2 ring-brand-500/30"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.url}
                      alt={item.altText || item.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingImage(item);
                      }}
                      className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-brand-600"
                    >
                      <Sparkles className="h-3 w-3" /> Ritaglia / Filtri
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.title || item.filename}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        {item.width}×{item.height} • {formatBytes(item.sizeBytes)}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.usageCount || 0} usi
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Media Inspector & Editor Launcher (4 cols) */}
        <div className="lg:col-span-4">
          {selected ? (
            <div className="sticky top-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <img
                  src={selected.url}
                  alt={selected.altText}
                  className="aspect-video w-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => setEditingImage(selected)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                <Sparkles className="h-4 w-4" /> Apri Editor Immagini (Crop 16:9 / OG / Filtri)
              </button>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950">
                <span className="truncate font-mono text-[11px] text-slate-500">
                  {selected.url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selected.url);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-600"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copiato
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copia URL
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSaveMetadata} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Titolo Immagine
                  </label>
                  <input
                    type="text"
                    value={selected.title}
                    onChange={(e) =>
                      setSelected({ ...selected, title: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Testo Alternativo SEO (ALT Text)
                  </label>
                  <input
                    type="text"
                    value={selected.altText}
                    onChange={(e) =>
                      setSelected({ ...selected, altText: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Didascalia Editoriale (Caption)
                  </label>
                  <textarea
                    rows={2}
                    value={selected.caption}
                    onChange={(e) =>
                      setSelected({ ...selected, caption: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400">
                    Cartella Libreria
                  </label>
                  <input
                    type="text"
                    value={selected.folder}
                    onChange={(e) =>
                      setSelected({ ...selected, folder: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingMeta}
                    className="flex-1 rounded-xl bg-slate-900 py-2 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                  >
                    {savingMeta ? "Salvataggio..." : "Salva Metadati SEO"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selected)}
                    className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50"
                    title="Elimina file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
              <ImageIcon className="mx-auto mb-2 h-6 w-6" />
              Seleziona un file dalla griglia per gestirne i metadati SEO o aprire l&apos;Editor Immagini.
            </div>
          )}
        </div>
      </div>

      {editingImage && (
        <ImageEditorModal
          media={editingImage}
          onClose={() => setEditingImage(null)}
          onSaved={(updated) => {
            fetchMedia();
            setSelected(updated);
            setEditingImage(null);
          }}
        />
      )}
    </div>
  );
}

