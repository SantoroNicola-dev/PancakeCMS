"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  ImagePlus,
  Loader2,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { ImageEditorModal, MediaItem } from "./ImageEditorModal";
import { formatBytes } from "@/lib/utils";

interface MediaPickerModalProps {
  onSelect: (media: MediaItem) => void;
  onClose: () => void;
  title?: string;
}

export function MediaPickerModal({
  onSelect,
  onClose,
  title = "Seleziona o Carica Immagine dalla Libreria Media",
}: MediaPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      setMediaList(data.media || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "Articoli");
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.media) {
        setMediaList((prev) => [data.media, ...prev]);
        setSelected(data.media);
      } else {
        alert(data.error || "Errore durante l'upload.");
      }
    } finally {
      setUploading(false);
    }
  };

  const filtered = mediaList.filter(
    (m) =>
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.altText.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ImagePlus className="h-5 w-5 text-brand-600" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative flex-1">
            <Search className=" absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome file, titolo o testo ALT..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Carica nuova immagine (Auto-WebP)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Grid */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 md:col-span-8">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm text-slate-500">
                Nessun file media trovato. Carica un&apos;immagine dal pulsante in alto.
              </div>
            ) : (
              filtered.map((item) => {
                const isSel = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`group relative overflow-hidden rounded-xl border text-left transition ${
                      isSel
                        ? "border-brand-600 ring-2 ring-brand-500/30"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={item.url}
                        alt={item.altText || item.filename}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.title || item.filename}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.width}×{item.height} • {formatBytes(item.sizeBytes)}
                      </p>
                    </div>
                    {isSel && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Inspector */}
          <div className="flex flex-col justify-between border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 md:col-span-4 md:border-l md:border-t-0">
            {selected ? (
              <div className="space-y-4">
                <img
                  src={selected.url}
                  alt={selected.altText}
                  className="aspect-video w-full rounded-xl border border-slate-200 object-cover dark:border-slate-800"
                />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selected.filename}
                  </p>
                  <p className="text-slate-500">
                    Dimensioni: {selected.width}×{selected.height}px ({formatBytes(selected.sizeBytes)})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Testo Alternativo (ALT SEO)
                  </label>
                  <input
                    type="text"
                    value={selected.altText}
                    onChange={(e) =>
                      setSelected({ ...selected, altText: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setEditingItem(selected)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-300 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Apri nell&apos;Editor Immagini (Crop/Filtri)
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Seleziona un&apos;immagine dalla griglia per visualizzarne i dettagli o modificarla.
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
              >
                Annulla
              </button>
              <button
                type="button"
                disabled={!selected}
                onClick={() => selected && onSelect(selected)}
                className="flex-1 rounded-xl bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                Inserisci immagine
              </button>
            </div>
          </div>
        </div>
      </div>

      {editingItem && (
        <ImageEditorModal
          media={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(newOrUpdated) => {
            fetchMedia();
            setSelected(newOrUpdated);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}

