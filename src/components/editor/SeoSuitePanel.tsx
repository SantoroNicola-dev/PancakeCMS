"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Monitor,
  Search,
  Share2,
  ShieldAlert,
  Smartphone,
  Sparkles,
  XCircle,
} from "lucide-react";
import { analyzeSeo } from "@/lib/seo-analyzer";

export interface SeoFormState {
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noIndex: boolean;
  noFollow: boolean;
  schemaType: string;
}

interface SeoSuitePanelProps {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImage: string;
  coverImageAlt: string;
  seo: SeoFormState;
  onChange: (updated: SeoFormState) => void;
  siteUrl?: string;
  siteName?: string;
}

export function SeoSuitePanel({
  title,
  slug,
  excerpt,
  contentHtml,
  coverImage,
  coverImageAlt,
  seo,
  onChange,
  siteUrl = "https://blogdisara.it",
  siteName = "Il Blog di Sara",
}: SeoSuitePanelProps) {
  const [serpMode, setSerpMode] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"general" | "social" | "advanced">(
    "general"
  );

  const report = useMemo(
    () =>
      analyzeSeo({
        title,
        seoTitle: seo.seoTitle,
        slug,
        seoDescription: seo.seoDescription,
        excerpt,
        focusKeyword: seo.focusKeyword,
        contentHtml,
        coverImage,
        coverImageAlt,
      }),
    [
      title,
      seo.seoTitle,
      slug,
      seo.seoDescription,
      excerpt,
      seo.focusKeyword,
      contentHtml,
      coverImage,
      coverImageAlt,
    ]
  );

  const displayTitle =
    (seo.seoTitle || title || "Titolo dell'articolo").trim() +
    ` | ${siteName}`;
  const displayDesc =
    (
      seo.seoDescription ||
      excerpt ||
      "Inserisci una meta description persuasiva per mostrare ai lettori un'anteprima chiara su Google..."
    ).trim();
  const displayUrl = `${siteUrl.replace(/\/$/, "")}/articolo/${
    slug || "esempio-url"
  }`;

  const scoreBadgeColor =
    report.overallScore >= 75
      ? "bg-emerald-500 text-white"
      : report.overallScore >= 45
      ? "bg-amber-500 text-white"
      : "bg-rose-500 text-white";

  const titleLen = (seo.seoTitle || title || "").trim().length;
  const descLen = (seo.seoDescription || excerpt || "").trim().length;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header con Semaforo Punteggio */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold shadow-sm ${scoreBadgeColor}`}
          >
            {report.overallScore}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Suite SEO &amp; Metadati Pagina
              </h3>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                Live Analyzer
              </span>
            </div>
            <p className="text-xs text-slate-500">
              SEO: <strong>{report.seoScore}/100</strong> • Leggibilità:{" "}
              <strong>{report.readabilityScore}/100</strong> • Parole:{" "}
              <strong>{report.wordCount}</strong> • Densità Keyword:{" "}
              <strong>{report.keywordDensity}%</strong>
            </p>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "general"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Ricerca Google &amp; Analisi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "social"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            <Share2 className="h-3.5 w-3.5" /> OpenGraph &amp; Social
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
              activeTab === "advanced"
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> Schema.org &amp; Robots
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "general" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Inputs + SERP Preview */}
            <div className="space-y-5 lg:col-span-7">
              {/* Focus Keyword */}
              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Focus Keyword (Parola Chiave Principale)
                  </span>
                  <span className="text-[11px] font-normal text-slate-400">
                    Usata per calcolare il semaforo SEO
                  </span>
                </label>
                <input
                  type="text"
                  value={seo.focusKeyword}
                  onChange={(e) =>
                    onChange({ ...seo, focusKeyword: e.target.value })
                  }
                  placeholder="es. scrittura digitale, slow living, consigli di lettura..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Titolo SEO (Meta Title)
                  </label>
                  <span
                    className={`font-medium ${
                      titleLen >= 40 && titleLen <= 62
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {titleLen} / 60 caratteri
                  </span>
                </div>
                <input
                  type="text"
                  value={seo.seoTitle}
                  onChange={(e) =>
                    onChange({ ...seo, seoTitle: e.target.value })
                  }
                  placeholder={title || "Lascia vuoto per usare il titolo dell'articolo"}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all ${
                      titleLen >= 40 && titleLen <= 62
                        ? "bg-emerald-500"
                        : titleLen > 62
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, (titleLen / 65) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Meta Description SEO
                  </label>
                  <span
                    className={`font-medium ${
                      descLen >= 120 && descLen <= 160
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {descLen} / 160 caratteri
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seo.seoDescription}
                  onChange={(e) =>
                    onChange({ ...seo, seoDescription: e.target.value })
                  }
                  placeholder={
                    excerpt ||
                    "Scrivi un riassunto invitante (120-160 caratteri) che spinga gli utenti a cliccare..."
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full transition-all ${
                      descLen >= 120 && descLen <= 160
                        ? "bg-emerald-500"
                        : descLen > 165
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, (descLen / 170) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Simulatore Live Google SERP */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Anteprima Risultato Google (SERP)
                  </span>
                  <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
                    <button
                      type="button"
                      onClick={() => setSerpMode("desktop")}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                        serpMode === "desktop"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      <Monitor className="h-3 w-3" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpMode("mobile")}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                        serpMode === "mobile"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500"
                      }`}
                    >
                      <Smartphone className="h-3 w-3" /> Mobile
                    </button>
                  </div>
                </div>

                <div
                  className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
                    serpMode === "mobile" ? "max-w-sm" : "w-full"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                      S
                    </span>
                    <div className="truncate">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {siteName}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {displayUrl}
                      </p>
                    </div>
                  </div>
                  <h4 className="mt-2 line-clamp-1 text-lg font-medium text-[#1a0dab] hover:underline dark:text-blue-400">
                    {displayTitle}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {displayDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Checklist Semaforo SEO & Leggibilità */}
            <div className="space-y-3 lg:col-span-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Checklist Diagnostica SEO &amp; Leggibilità ({report.checks.length} controlli)
              </h4>
              <div className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                {report.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60"
                  >
                    {chk.status === "good" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : chk.status === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {chk.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {chk.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Titolo Social (OpenGraph / Facebook / LinkedIn / X)
                </label>
                <input
                  type="text"
                  value={seo.ogTitle}
                  onChange={(e) =>
                    onChange({ ...seo, ogTitle: e.target.value })
                  }
                  placeholder={seo.seoTitle || title || "Usa Titolo SEO"}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Descrizione Social (OpenGraph)
                </label>
                <textarea
                  rows={3}
                  value={seo.ogDescription}
                  onChange={(e) =>
                    onChange({ ...seo, ogDescription: e.target.value })
                  }
                  placeholder={seo.seoDescription || excerpt || "Usa Meta Description"}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL Immagine Social (Consigliato 1200×630px)
                </label>
                <input
                  type="text"
                  value={seo.ogImage}
                  onChange={(e) =>
                    onChange({ ...seo, ogImage: e.target.value })
                  }
                  placeholder={coverImage || "/uploads/demo-hero-editorial.webp"}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Social Card Preview */}
            <div className="lg:col-span-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Anteprima Card Condivisione Social
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="aspect-[1200/630] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                  {seo.ogImage || coverImage ? (
                    <img
                      src={seo.ogImage || coverImage}
                      alt="OG Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      Nessuna immagine OG selezionata
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">
                    {siteUrl.replace(/^https?:\/\//, "")}
                  </p>
                  <h4 className="mt-1 line-clamp-1 text-base font-bold text-slate-900 dark:text-white">
                    {seo.ogTitle || seo.seoTitle || title || "Titolo Articolo"}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                    {seo.ogDescription || seo.seoDescription || excerpt || "Descrizione anteprima social..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "advanced" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  URL Canonico (Canonical URL)
                </label>
                <input
                  type="text"
                  value={seo.canonicalUrl}
                  onChange={(e) =>
                    onChange({ ...seo, canonicalUrl: e.target.value })
                  }
                  placeholder={displayUrl}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Lascia vuoto per usare l&apos;URL canonico automatico della pagina.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tipo Dati Strutturati Schema.org (JSON-LD)
                </label>
                <select
                  value={seo.schemaType}
                  onChange={(e) =>
                    onChange({ ...seo, schemaType: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="BlogPosting">BlogPosting (Articolo Blog standard)</option>
                  <option value="Article">Article (Articolo Editoriale / Approfondimento)</option>
                  <option value="NewsArticle">NewsArticle (Articolo Giornalistico / Google News)</option>
                  <option value="WebPage">WebPage (Pagina Statica)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <ShieldAlert className="h-4 w-4 text-amber-500" /> Direttive Robots Meta Tag
              </div>

              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Nascondi dai motori di ricerca (`noindex`)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Se attivo, la pagina viene esclusa anche da `sitemap.xml`.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={seo.noIndex}
                  onChange={(e) =>
                    onChange({ ...seo, noIndex: e.target.checked })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Non seguire i link nella pagina (`nofollow`)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Impedisce ai crawler di seguire i link esterni presenti nel testo.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={seo.noFollow}
                  onChange={(e) =>
                    onChange({ ...seo, noFollow: e.target.checked })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

