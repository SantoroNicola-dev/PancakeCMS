"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  Loader2,
  RotateCcw,
  RotateCw,
  Save,
  Sliders,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  folder: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  title: string;
  caption: string;
  usageCount?: number;
  usedInPosts?: { id: string; title: string }[];
}

interface ImageEditorModalProps {
  media: MediaItem;
  onClose: () => void;
  onSaved: (updatedOrNewMedia: MediaItem) => void;
}

type AspectPreset = "free" | "16:9" | "4:3" | "1:1" | "og";

export function ImageEditorModal({
  media,
  onClose,
  onSaved,
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
  const [cropZoom, setCropZoom] = useState(100); // 100% to 160%
  const [altText, setAltText] = useState(media.altText || "");
  const [title, setTitle] = useState(media.title || "");
  const [saveMode, setSaveMode] = useState<"copy" | "overwrite">("copy");
  const [saving, setSaving] = useState(false);
  const [outputDims, setOutputDims] = useState({ w: media.width || 1200, h: media.height || 675 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageObjRef.current = img;
      setLoaded(true);
    };
    img.src = `${media.url}?t=${Date.now()}`;
  }, [media.url]);

  useEffect(() => {
    if (!loaded || !imageObjRef.current || !canvasRef.current) return;
    const img = imageObjRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isRotated90 = rotation % 180 !== 0;
    const baseW = isRotated90 ? img.naturalHeight : img.naturalWidth;
    const baseH = isRotated90 ? img.naturalWidth : img.naturalHeight;

    let targetW = baseW;
    let targetH = baseH;

    const ratioMap: Record<Exclude<AspectPreset, "free">, number> = {
      "16:9": 16 / 9,
      "4:3": 4 / 3,
      "1:1": 1,
      og: 1200 / 630,
    };

    if (aspectPreset !== "free") {
      const desiredRatio = ratioMap[aspectPreset];
      const currentRatio = baseW / baseH;
      if (currentRatio > desiredRatio) {
        targetW = Math.round(baseH * desiredRatio);
        targetH = baseH;
      } else {
        targetW = baseW;
        targetH = Math.round(baseW / desiredRatio);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    setOutputDims({ w: targetW, h: targetH });

    ctx.save();
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%)`;

    ctx.translate(targetW / 2, targetH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const scaleFactor = cropZoom / 100;
    ctx.scale(
      (flipH ? -1 : 1) * scaleFactor,
      (flipV ? -1 : 1) * scaleFactor
    );

    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    ctx.restore();
  }, [
    loaded,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    sepia,
    aspectPreset,
    cropZoom,
  ]);

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setAspectPreset("free");
    setCropZoom(100);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const editedDataUrl = canvasRef.current.toDataURL("image/webp", 0.9);
      const res = await fetch(`/api/media/${media.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editedDataUrl,
          saveMode,
          altText,
          title,
        }),
      });
      const data = await res.json();
      if (res.ok && data.media) {
        onSaved(data.media);
        onClose();
      } else {
        alert(data.error || "Errore durante il salvataggio dell'immagine.");
      }
    } catch {
      alert("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 text-brand-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                Editor Immagini &amp; Ottimizzazione WebP
              </h2>
              <p className="text-xs text-slate-400">
                {media.filename} • Output previsto: {outputDims.w}×{outputDims.h}px (WebP)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              <Undo2 className="h-3.5 w-3.5" /> Ripristina originale
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Canvas Preview */}
          <div className="flex min-h-[340px] items-center justify-center bg-slate-950 p-6 lg:col-span-8">
            <canvas
              ref={canvasRef}
              className="max-h-[60vh] max-w-full rounded-lg border border-slate-800 object-contain shadow-xl"
            />
          </div>

          {/* Controls Sidebar */}
          <div className="flex flex-col justify-between space-y-5 border-t border-slate-800 bg-slate-900 p-5 lg:col-span-4 lg:border-l lg:border-t-0">
            <div className="space-y-5">
              {/* Aspect Ratio / Crop */}
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Crop className="h-3.5 w-3.5 text-brand-400" /> Ritaglio Formato (Aspect Ratio)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: "free", label: "Originale" },
                      { id: "16:9", label: "16:9 Hero" },
                      { id: "4:3", label: "4:3 Post" },
                      { id: "1:1", label: "1:1 Square" },
                      { id: "og", label: "1200×630 OG" },
                    ] as { id: AspectPreset; label: string }[]
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAspectPreset(preset.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                        aspectPreset === preset.id
                          ? "border-brand-500 bg-brand-600 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Zoom Ritaglio</span>
                    <span>{cropZoom}%</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={160}
                    value={cropZoom}
                    onChange={(e) => setCropZoom(Number(e.target.value))}
                    className="mt-1 w-full accent-brand-500"
                  />
                </div>
              </div>

              {/* Rotate & Flip */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Rotazione &amp; Specchiatura
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs hover:bg-slate-700"
                  >
                    <RotateCcw className="h-4 w-4" /> -90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs hover:bg-slate-700"
                  >
                    <RotateCw className="h-4 w-4" /> +90°
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipH((f) => !f)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs ${
                      flipH
                        ? "border-brand-500 bg-brand-600/30 text-brand-300"
                        : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <FlipHorizontal className="h-4 w-4" /> Orizz.
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlipV((f) => !f)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs ${
                      flipV
                        ? "border-brand-500 bg-brand-600/30 text-brand-300"
                        : "border-slate-700 bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <FlipVertical className="h-4 w-4" /> Vert.
                  </button>
                </div>
              </div>

              {/* Regolazioni Colore / Luce */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Sliders className="h-3.5 w-3.5 text-brand-400" /> Regolazioni Fotografiche
                </label>

                <div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Luminosità</span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Contrasto</span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={150}
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Saturazione</span>
                    <span>{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={180}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Filtro Caldo / Editoriale</span>
                    <span>{sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={sepia}
                    onChange={(e) => setSepia(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                </div>
              </div>

              {/* SEO Alt Text & Save Mode */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div>
                  <label className="block text-xs text-slate-400">
                    Testo Alternativo SEO (ALT)
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Descrivi l'immagine per Google e accessibilità..."
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSaveMode("copy")}
                    className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      saveMode === "copy"
                        ? "border-brand-500 bg-brand-600/20 text-brand-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    Salva nuova copia
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveMode("overwrite")}
                    className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                      saveMode === "overwrite"
                        ? "border-amber-500 bg-amber-600/20 text-amber-300"
                        : "border-slate-700 bg-slate-800 text-slate-400"
                    }`}
                  >
                    Sovrascrivi file
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saveMode === "copy"
                ? "Esporta nuova copia WebP"
                : "Applica e sovrascrivi WebP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

