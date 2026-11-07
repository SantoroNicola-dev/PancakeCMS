"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRightLeft,
  Check,
  Cookie,
  ExternalLink,
  FileCode2,
  Globe,
  Loader2,
  Mail,
  Plus,
  Save,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { formatDateIt } from "@/lib/utils";

interface RedirectRow {
  id: string;
  sourcePath: string;
  destinationPath: string;
  statusCode: number;
  hits: number;
}

interface SubscriberRow {
  id: string;
  email: string;
  name: string | null;
  source: string;
  createdAt: string;
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "seo" | "general" | "newsletter_wp"
  >("analytics");

  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [redirects, setRedirects] = useState<RedirectRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");

  // New Redirect State
  const [sourcePath, setSourcePath] = useState("");
  const [destinationPath, setDestinationPath] = useState("");
  const [statusCode, setStatusCode] = useState(301);

  // WordPress XML Importer State
  const [wpXml, setWpXml] = useState("");
  const [importingWp, setImportingWp] = useState(false);
  const [importResult, setImportResult] = useState("");

  const loadAll = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setSettings(data.settings || {});
    setRedirects(data.redirects || []);
    setSubscribers(data.subscribers || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedNotice("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedNotice("Impostazioni salvate con successo!");
        setTimeout(() => setSavedNotice(""), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourcePath || !destinationPath) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_redirect",
        sourcePath,
        destinationPath,
        statusCode,
      }),
    });
    if (res.ok) {
      setSourcePath("");
      setDestinationPath("");
      loadAll();
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_redirect", id }),
    });
    loadAll();
  };

  const handleDeleteSubscriber = async (id: string) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_subscriber", id }),
    });
    loadAll();
  };

  const handleImportWordPress = async () => {
    if (!wpXml.trim()) return;
    setImportingWp(true);
    setImportResult("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import_wordpress",
          xmlContent: wpXml,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(
          `Importazione completata! Sono stati migrati ${data.importedCount} contenuti da WordPress.`
        );
        setWpXml("");
      } else {
        alert(data.error || "Errore durante l'importazione.");
      }
    } finally {
      setImportingWp(false);
    }
  };

  const loadSampleWpXml = () => {
    setWpXml(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>Vecchio Blog WordPress di Sara</title>
    <item>
      <title><![CDATA[Migrare da WordPress a un CMS moderno: la mia esperienza]]></title>
      <wp:post_name>migrare-da-wordpress-a-cms-moderno</wp:post_name>
      <wp:post_type>post</wp:post_type>
      <wp:status>publish</wp:status>
      <excerpt:encoded><![CDATA[Come ho velocizzato il mio blog eliminando decine di plugin pesanti e passando a un'architettura moderna.]]></excerpt:encoded>
      <content:encoded><![CDATA[<p>Questo articolo è stato importato automaticamente da un file di esportazione XML/WXR di <strong>WordPress</strong>.</p><h2>Perché ho lasciato WordPress</h2><p>Volevo un editor WYSIWYG pulito, una suite SEO nativa e la sicurezza del 2FA senza dover installare venti plugin diversi.</p>]]></content:encoded>
    </item>
  </channel>
</rss>`);
  };

  if (!settings) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        Caricamento configurazione...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Google Analytics, SEO Globale, Redirect &amp; Impostazioni
          </h1>
          <p className="text-xs text-slate-500">
            Configura i tag Google Analytics 4 / GTM, il Cookie Banner GDPR, i Redirect 301, l&apos;identità del blog e l&apos;importatore WordPress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="h-4 w-4" /> {savedNotice}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salva Tutte le Impostazioni
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "analytics"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Activity className="h-4 w-4" /> Google Analytics 4, GTM &amp; Cookie GDPR
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "seo"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Globe className="h-4 w-4" /> SEO Tecnica, Sitemap &amp; Redirect 301
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "general"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Settings className="h-4 w-4" /> Identità Blog, Menu &amp; Sicurezza
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("newsletter_wp")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            activeTab === "newsletter_wp"
              ? "bg-brand-600 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Upload className="h-4 w-4" /> Newsletter &amp; Importatore WordPress
        </button>
      </div>

      {/* TAB 1: GOOGLE ANALYTICS 4, GTM & COOKIE BANNER GDPR */}
      {activeTab === "analytics" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                <Activity className="h-5 w-5 text-brand-600" /> Configurazione Tag Google Analytics 4 &amp; GTM
              </h2>
              <label className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <input
                  type="checkbox"
                  checked={Boolean(settings.enableGa4)}
                  onChange={(e) =>
                    setSettings({ ...settings, enableGa4: e.target.checked })
                  }
                  className="h-4 w-4 accent-emerald-600"
                />
                Attiva Tracciamento GA4
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ID Misurazione Google Analytics 4 (`G-XXXXXXXXXX`)
                </label>
                <input
                  type="text"
                  value={settings.gaMeasurementId || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gaMeasurementId: e.target.value,
                    })
                  }
                  placeholder="G-PANCAKE2026"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ID Contenitore Google Tag Manager (`GTM-XXXXXXX`)
                </label>
                <input
                  type="text"
                  value={settings.gtmContainerId || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, gtmContainerId: e.target.value })
                  }
                  placeholder="GTM-XXXXXXX (Opzionale)"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-sm dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Automatic Custom Events */}
            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Eventi Editoriali Automatici inviati a GA4 (`gtag(&apos;event&apos;, ...)`)
              </p>
              <label className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Traccia lettura approfondita articolo (`article_read_75_percent` allo scroll 75%)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.trackScrollDepth)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      trackScrollDepth: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Traccia interazioni lettori (`post_like`, `post_bookmark`, `comment_posted`, `newsletter_signup`)
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.trackArticleRead)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      trackArticleRead: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-brand-600"
                />
              </label>
            </div>

            {/* Custom Head/Body Scripts */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <FileCode2 className="h-4 w-4 text-brand-600" /> Script Custom in `&lt;head&gt;` (Pixel, Meta Verification, ecc.)
              </label>
              <textarea
                rows={3}
                value={settings.customHeadScripts || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    customHeadScripts: e.target.value,
                  })
                }
                placeholder="<!-- Incolla qui eventuali tag di verifica o script custom -->"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs text-emerald-300"
              />
            </div>
          </div>

          {/* Right: GDPR Cookie Banner & Consent Mode v2 */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                <Cookie className="h-5 w-5 text-brand-600" /> Cookie Banner GDPR (Consent Mode v2)
              </h2>
              <input
                type="checkbox"
                checked={Boolean(settings.enableCookieBanner)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enableCookieBanner: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-brand-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Titolo Banner Cookie
              </label>
              <input
                type="text"
                value={settings.cookieBannerTitle || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cookieBannerTitle: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Testo Informativa Breve
              </label>
              <textarea
                rows={4}
                value={settings.cookieBannerText || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cookieBannerText: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                URL Pagina Privacy &amp; Cookie Policy
              </label>
              <input
                type="text"
                value={settings.privacyPolicyUrl || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    privacyPolicyUrl: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SEO GLOBALE, SITEMAP & REDIRECT 301 */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              Indicizzazione, Sitemap.xml &amp; Robots.txt
            </h2>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Consenti indicizzazione motori di ricerca
                </p>
                <p className="text-[11px] text-slate-500">
                  Se disattivato, imposta `Disallow: /` in `robots.txt` e `noindex` globale.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.enableIndexing)}
                onChange={(e) =>
                  setSettings({ ...settings, enableIndexing: e.target.checked })
                }
                className="h-4 w-4 accent-brand-600"
              />
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                URL Pubblico Canonico del Sito
              </label>
              <input
                type="text"
                value={settings.siteUrl || ""}
                onChange={(e) =>
                  setSettings({ ...settings, siteUrl: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/sitemap.xml"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Apri /sitemap.xml <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/robots.txt"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Apri /robots.txt <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/feed.xml"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Apri /feed.xml (RSS) <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Gestore Redirect 301 / 302 */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
              <ArrowRightLeft className="h-5 w-5 text-brand-600" /> Gestore Redirect SEO 301 / 302
            </h2>
            <p className="text-xs text-slate-500">
              Reindirizza i vecchi URL di WordPress verso i nuovi slug per non perdere il posizionamento acquisito su Google.
            </p>

            <form
              onSubmit={handleCreateRedirect}
              className="grid grid-cols-1 gap-2 sm:grid-cols-12"
            >
              <input
                type="text"
                required
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/vecchio-percorso-wp"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs sm:col-span-4 dark:border-slate-800 dark:bg-slate-950"
              />
              <input
                type="text"
                required
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                placeholder="/articolo/nuovo-slug"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs sm:col-span-5 dark:border-slate-800 dark:bg-slate-950"
              />
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold sm:col-span-1 dark:border-slate-800 dark:bg-slate-950"
              >
                <option value={301}>301</option>
                <option value={302}>302</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white sm:col-span-2"
              >
                <Plus className="h-3.5 w-3.5" /> Aggiungi
              </button>
            </form>

            <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {redirects.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {r.statusCode}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {r.sourcePath}
                    </span>
                    <span>→</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {r.destinationPath}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteRedirect(r.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: IDENTITÀ BLOG, MENU & SICUREZZA */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              Identità Editoriale &amp; Menu di Navigazione
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nome del Blog / Magazine
              </label>
              <input
                type="text"
                value={settings.siteName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tagline / Sottotitolo Home Page
              </label>
              <input
                type="text"
                value={settings.siteTagline || ""}
                onChange={(e) =>
                  setSettings({ ...settings, siteTagline: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Menu Header (JSON dinamico)
              </label>
              <textarea
                rows={4}
                value={settings.headerMenuJson || ""}
                onChange={(e) =>
                  setSettings({ ...settings, headerMenuJson: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
              Policy Moderazione Commenti &amp; Sicurezza Staff 2FA
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Modalità Pubblicazione Commenti Lettori
              </label>
              <select
                value={settings.commentModeration || "auto"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    commentModeration: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="auto">
                  Pubblicazione immediata per lettori registrati (con filtro anti-spam automatico)
                </option>
                <option value="manual">
                  Moderazione manuale preventiva (tutti i commenti entrano in coda PENDING)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Parole Bloccate dal Filtro Anti-Spam (separate da virgola)
              </label>
              <input
                type="text"
                value={settings.profanityFilterWords || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profanityFilterWords: e.target.value,
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Obbliga 2FA TOTP per tutti i membri dello Staff (Admin, Editor, Author)
                </p>
                <p className="text-[11px] text-slate-500">
                  Chi non ha ancora attivo il 2FA verrà indirizzato alla configurazione QR al login.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.forceStaffTwoFactor)}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    forceStaffTwoFactor: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-brand-600"
              />
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: NEWSLETTER & IMPORTATORE WORDPRESS */}
      {activeTab === "newsletter_wp" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* WordPress XML/WXR Importer (7 cols) */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-brand-600" /> Importatore Articoli da WordPress (WXR / XML)
              </h2>
              <button
                type="button"
                onClick={loadSampleWpXml}
                className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
              >
                Carica XML Demo WordPress
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Incolla o carica il file XML esportato da WordPress (Strumenti → Esporta) per importare automaticamente articoli, pagine, estratti e calcolare il punteggio SEO iniziale.
            </p>

            <textarea
              rows={8}
              value={wpXml}
              onChange={(e) => setWpXml(e.target.value)}
              placeholder="Incolla qui il contenuto del file .xml esportato da WordPress oppure clicca su 'Carica XML Demo WordPress'..."
              className="w-full rounded-xl border border-slate-200 bg-slate-950 p-3.5 font-mono text-xs text-emerald-300"
            />

            {importResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {importResult}
              </div>
            )}

            <button
              type="button"
              onClick={handleImportWordPress}
              disabled={importingWp || !wpXml.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {importingWp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Avvia Migrazione da WordPress
            </button>
          </div>

          {/* Newsletter Subscribers (5 cols) */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-brand-600" /> Iscritti Newsletter ({subscribers.length})
            </h2>
            <div className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {sub.email}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {sub.name || "Lettore"} • {formatDateIt(sub.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubscriber(sub.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

