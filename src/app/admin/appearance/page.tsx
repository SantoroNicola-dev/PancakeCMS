"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Code2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Layout,
  LayoutGrid,
  Loader2,
  Monitor,
  Moon,
  Navigation,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  BODY_FONTS,
  buildThemeCss,
  generateBrandPaletteRgb,
  getGoogleFontsUrl,
  HEADING_FONTS,
  THEME_PRESETS,
  ThemePreset,
} from "@/lib/theme";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";

type ActiveTab =
  | "themes"
  | "branding"
  | "typography"
  | "layout"
  | "cards_article"
  | "header_footer"
  | "custom_css";

interface MenuItem {
  label: string;
  href: string;
}

export default function AdminAppearancePage() {
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("themes");
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  // Live Preview Controls
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [previewDark, setPreviewDark] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Media Picker target field
  const [mediaTargetField, setMediaTargetField] = useState<
    | null
    | "logoImageUrl"
    | "logoDarkImageUrl"
    | "faviconUrl"
    | "authorWidgetImage"
    | "defaultOgImage"
  >(null);

  const loadSettings = async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    if (data.settings) {
      setSettings(data.settings);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Inject live CSS variables & Google Fonts into the browser as settings change
  useEffect(() => {
    if (!settings) return;
    const styleEl = document.getElementById("cms-dynamic-theme");
    if (styleEl) {
      styleEl.innerHTML = buildThemeCss(settings);
    }
    const gfUrl = getGoogleFontsUrl(settings.headingFont, settings.bodyFont);
    if (gfUrl) {
      let linkEl = document.getElementById(
        "cms-google-fonts"
      ) as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = "cms-google-fonts";
        linkEl.rel = "stylesheet";
        document.head.appendChild(linkEl);
      }
      linkEl.href = gfUrl;
    }
  }, [settings]);

  const updateField = (key: string, value: any) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const applyPreset = (preset: ThemePreset) => {
    setSettings((prev) =>
      prev
        ? {
          ...prev,
          themePreset: preset.id,
          primaryColor: preset.primaryColor,
          accentColor: preset.accentColor,
          bgLightColor: preset.bgLightColor,
          surfaceLightColor: preset.surfaceLightColor,
          textLightColor: preset.textLightColor,
          bgDarkColor: preset.bgDarkColor,
          surfaceDarkColor: preset.surfaceDarkColor,
          textDarkColor: preset.textDarkColor,
          headingFont: preset.headingFont,
          bodyFont: preset.bodyFont,
          borderRadiusStyle: preset.borderRadiusStyle,
          cardStyle: preset.cardStyle,
          navbarStyle: preset.navbarStyle,
          heroLayout: preset.heroLayout,
        }
        : prev
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSavedNotice("");
    setErrorNotice("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setSavedNotice("Design e tema salvati e pubblicati sul sito!");
        setTimeout(() => setSavedNotice(""), 4000);
      } else {
        setErrorNotice(data.error || "Errore durante il salvataggio.");
      }
    } catch {
      setErrorNotice("Errore di rete durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    const def = THEME_PRESETS[0];
    applyPreset(def);
    setSettings((prev) =>
      prev
        ? {
          ...prev,
          baseFontSize: 16,
          articleLineHeight: "relaxed",
          headingTracking: "tight",
          containerWidth: "standard",
          postsGridLayout: "grid-2",
          sidebarPosition: "right",
          cardImageRatio: "video",
          buttonStyle: "pill",
          customCss: "",
        }
        : prev
    );
  };

  const handleExportThemeJson = () => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tema-${(settings.siteName || "cms").toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportThemeJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setSettings((prev) => ({ ...prev, ...parsed, id: "default" }));
        setSavedNotice("Configurazione JSON caricata! Clicca Salva per applicarla.");
      } catch {
        setErrorNotice("File JSON non valido.");
      }
    };
    reader.readAsText(file);
  };

  // Parsed Menus & Socials
  const headerMenu: MenuItem[] = useMemo(() => {
    try {
      return JSON.parse(settings?.headerMenuJson || "[]");
    } catch {
      return [];
    }
  }, [settings?.headerMenuJson]);

  const footerMenu: MenuItem[] = useMemo(() => {
    try {
      return JSON.parse(settings?.footerMenuJson || "[]");
    } catch {
      return [];
    }
  }, [settings?.footerMenuJson]);

  const socialLinks: Record<string, string> = useMemo(() => {
    try {
      return JSON.parse(settings?.socialLinksJson || "{}");
    } catch {
      return {};
    }
  }, [settings?.socialLinksJson]);

  const setHeaderMenu = (items: MenuItem[]) => {
    updateField("headerMenuJson", JSON.stringify(items));
  };

  const setFooterMenu = (items: MenuItem[]) => {
    updateField("footerMenuJson", JSON.stringify(items));
  };

  const setSocialLink = (platform: string, url: string) => {
    const next = { ...socialLinks, [platform]: url };
    updateField("socialLinksJson", JSON.stringify(next));
  };

  const brandPalette = useMemo(
    () => generateBrandPaletteRgb(settings?.primaryColor || "#c54c3d"),
    [settings?.primaryColor]
  );

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-600" />
        Caricamento Studio Design 360°...
      </div>
    );
  }

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: "themes", label: "Temi & Palette Colori", icon: Palette },
    { id: "branding", label: "Loghi, Brand & Identità", icon: Sparkles },
    { id: "typography", label: "Tipografia & Font", icon: Type },
    { id: "layout", label: "Layout Home, Hero & Sidebar", icon: Layout },
    {
      id: "cards_article",
      label: "Card, Bordi & Pagina Articolo",
      icon: LayoutGrid,
    },
    {
      id: "header_footer",
      label: "Header, Menu, Banner & Footer",
      icon: Navigation,
    },
    { id: "custom_css", label: "CSS Custom & Backup JSON", icon: Code2 },
  ];

  const radiusPreviewPx =
    settings.borderRadiusStyle === "sharp"
      ? "0px"
      : settings.borderRadiusStyle === "subtle"
        ? "6px"
        : settings.borderRadiusStyle === "pill"
          ? "24px"
          : "14px";

  const btnRadiusPreviewPx =
    settings.buttonStyle === "sharp"
      ? "0px"
      : settings.buttonStyle === "rounded"
        ? "10px"
        : "9999px";

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Palette className="h-3 w-3" /> Design Studio 360°
            </span>
            <span className="text-xs text-slate-400">• Solo Amministratori</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
            Personalizzazione Grafica, Loghi, Layout &amp; Tema
          </h1>
          <p className="text-xs text-slate-500">
            Modifica a 360° ogni dettaglio visivo del blog: preset tema, palette colori, loghi, tipografia Google Fonts, layout Home/Articoli, card, menu e CSS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Check className="h-4 w-4" /> {savedNotice}
            </span>
          )}
          {errorNotice && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              <X className="h-4 w-4" /> {errorNotice}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowLivePreview((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <Eye className="h-4 w-4 text-brand-600" />
            {showLivePreview ? "Nascondi Anteprima" : "Mostra Anteprima Live"}
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            Apri Sito Live <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salva &amp; Pubblica Design
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${isActive
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Workspace: Controls + Sticky Live Preview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT COLUMN: Controls */}
        <div
          className={`space-y-6 ${showLivePreview ? "xl:col-span-7" : "xl:col-span-12"
            }`}
        >
          {/* TAB 1: TEMI & PALETTE COLORI */}
          {activeTab === "themes" && (
            <div className="space-y-6">
              {/* 1-Click Theme Presets */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      Preset Temi Editoriali 1-Click
                    </h2>
                    <p className="text-xs text-slate-500">
                      Seleziona una direzione artistica completa (colori, superfici, font, raggio bordi e layout) e poi personalizza ogni singolo parametro sotto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Ripristina Default
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = settings.themePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`group flex flex-col justify-between rounded-2xl border p-4 text-left transition ${isSelected
                            ? "border-brand-600 bg-brand-50/30 ring-2 ring-brand-500/20 dark:bg-brand-950/20"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-sm font-bold text-slate-900 dark:text-white">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Attivo
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {preset.tagline}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.primaryColor }}
                              title={`Primario: ${preset.primaryColor}`}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: preset.accentColor }}
                              title={`Accento: ${preset.accentColor}`}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-slate-300"
                              style={{ backgroundColor: preset.bgLightColor }}
                              title={`Sfondo Chiaro: ${preset.bgLightColor}`}
                            />
                            <span
                              className="h-5 w-5 rounded-full border border-slate-700"
                              style={{ backgroundColor: preset.bgDarkColor }}
                              title={`Sfondo Scuro: ${preset.bgDarkColor}`}
                            />
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">
                            {preset.headingFont} + {preset.bodyFont}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fine-tuned Color Pickers */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Palette Colori Su Misura (Chiaro &amp; Scuro)
                </h2>
                <p className="text-xs text-slate-500">
                  Il Colore Primario genera automaticamente tutte le 11 sfumature (da 50 a 950) utilizzate da bottoni, badge, link, citazioni e accenti.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Primary Brand Color */}
                  <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Colore Primario Brand
                    </label>
                    <div className="mt-2 flex items-center gap-2.5">
                      <input
                        type="color"
                        value={settings.primaryColor || "#c54c3d"}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                        className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={settings.primaryColor || "#c54c3d"}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  {/* Secondary / Accent Color */}
                  <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Colore Secondario / Accento
                    </label>
                    <div className="mt-2 flex items-center gap-2.5">
                      <input
                        type="color"
                        value={settings.accentColor || "#1e293b"}
                        onChange={(e) =>
                          updateField("accentColor", e.target.value)
                        }
                        className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5"
                      />
                      <input
                        type="text"
                        value={settings.accentColor || "#1e293b"}
                        onChange={(e) =>
                          updateField("accentColor", e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>

                {/* Generated 50-950 Brand Scale Preview */}
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-semibold text-slate-500">
                    Scala Cromatica Brand Generata in Tempo Reale (`brand-50` → `brand-950`):
                  </p>
                  <div className="grid grid-cols-11 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    {[
                      "50",
                      "100",
                      "200",
                      "300",
                      "400",
                      "500",
                      "600",
                      "700",
                      "800",
                      "900",
                      "950",
                    ].map((shade) => (
                      <div
                        key={shade}
                        className="flex h-9 items-end justify-center pb-1 text-[9px] font-mono font-bold"
                        style={{
                          backgroundColor: `rgb(${brandPalette[shade]})`,
                          color: Number(shade) >= 500 ? "#ffffff" : "#0f172a",
                        }}
                      >
                        {shade}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Light & Dark Surface Colors */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Sun className="h-4 w-4 text-amber-500" /> Superfici Tema Chiaro (Light Mode)
                    </p>
                    {[
                      {
                        key: "bgLightColor",
                        label: "Sfondo Pagina (Chiaro)",
                        def: "#ffffff",
                      },
                      {
                        key: "surfaceLightColor",
                        label: "Sfondo Card & Box (Chiaro)",
                        def: "#ffffff",
                      },
                      {
                        key: "textLightColor",
                        label: "Colore Testo Principale (Chiaro)",
                        def: "#0f172a",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={settings[item.key] || item.def}
                            onChange={(e) =>
                              updateField(item.key, e.target.value)
                            }
                            className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-transparent"
                          />
                          <input
                            type="text"
                            value={settings[item.key] || item.def}
                            onChange={(e) =>
                              updateField(item.key, e.target.value)
                            }
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Moon className="h-4 w-4 text-indigo-400" /> Superfici Tema Scuro (Dark Mode)
                    </p>
                    {[
                      {
                        key: "bgDarkColor",
                        label: "Sfondo Pagina (Scuro)",
                        def: "#020617",
                      },
                      {
                        key: "surfaceDarkColor",
                        label: "Sfondo Card & Box (Scuro)",
                        def: "#0f172a",
                      },
                      {
                        key: "textDarkColor",
                        label: "Colore Testo Principale (Scuro)",
                        def: "#f1f5f9",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={settings[item.key] || item.def}
                            onChange={(e) =>
                              updateField(item.key, e.target.value)
                            }
                            className="h-7 w-9 cursor-pointer rounded border border-slate-200 bg-transparent"
                          />
                          <input
                            type="text"
                            value={settings[item.key] || item.def}
                            onChange={(e) =>
                              updateField(item.key, e.target.value)
                            }
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Default Theme Mode & Toggle */}
                <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Modalità Colore Predefinita per i Nuovi Visitatori
                    </label>
                    <select
                      value={settings.defaultThemeMode || "system"}
                      onChange={(e) =>
                        updateField("defaultThemeMode", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="system">
                        Automatica (segue le preferenze del dispositivo)
                      </option>
                      <option value="light">Sempre Tema Chiaro (Light)</option>
                      <option value="dark">Sempre Tema Scuro (Dark)</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Mostra pulsante Sole/Luna nella Navbar
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Consente ai lettori di passare da chiaro a scuro.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowThemeToggle ?? true}
                      onChange={(e) =>
                        updateField("allowThemeToggle", e.target.checked)
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGHI, BRAND & IDENTITÀ */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Loghi, Favicon &amp; Identità del Brand
                </h2>
                <p className="text-xs text-slate-500">
                  Scegli se mostrare un logo testuale tipografico, un&apos;immagine caricata dalla Libreria Media (anche con variante per tema scuro) o entrambi.
                </p>

                {/* Logo Mode Selector */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { id: "text", label: "Solo Testo Tipografico" },
                    { id: "image", label: "Solo Immagine Logo" },
                    { id: "both", label: "Immagine + Testo" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateField("logoType", mode.id)}
                      className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${(settings.logoType || "text") === mode.id
                          ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                        }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Testo del Logo (`logoText`)
                    </label>
                    <input
                      type="text"
                      value={settings.logoText || ""}
                      onChange={(e) => updateField("logoText", e.target.value)}
                      placeholder="Sara."
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-serif text-sm font-bold dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Altezza Logo in Pixel ({settings.logoHeight || 36}px)
                    </label>
                    <input
                      type="range"
                      min={24}
                      max={72}
                      value={settings.logoHeight || 36}
                      onChange={(e) =>
                        updateField("logoHeight", Number(e.target.value))
                      }
                      className="mt-3 w-full accent-brand-600"
                    />
                  </div>
                </div>

                {/* Logo Images Pickers */}
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Main Logo */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Logo Principale (Tema Chiaro)
                      </p>
                      <div className="my-3 flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                        {settings.logoImageUrl ? (
                          <img
                            src={settings.logoImageUrl}
                            alt="Logo"
                            className="max-h-14 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Nessun file selezionato
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMediaTargetField("logoImageUrl")}
                        className="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700"
                      >
                        Scegli Media
                      </button>
                      {settings.logoImageUrl && (
                        <button
                          type="button"
                          onClick={() => updateField("logoImageUrl", "")}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dark Mode Logo */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Logo Tema Scuro (Opzionale)
                      </p>
                      <div className="my-3 flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900 p-2">
                        {settings.logoDarkImageUrl ? (
                          <img
                            src={settings.logoDarkImageUrl}
                            alt="Logo Dark"
                            className="max-h-14 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Usa logo principale
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMediaTargetField("logoDarkImageUrl")}
                        className="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700"
                      >
                        Scegli Media
                      </button>
                      {settings.logoDarkImageUrl && (
                        <button
                          type="button"
                          onClick={() => updateField("logoDarkImageUrl", "")}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Favicon / Icona Browser
                      </p>
                      <div className="my-3 flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
                        {settings.faviconUrl ? (
                          <img
                            src={settings.faviconUrl}
                            alt="Favicon"
                            className="h-10 w-10 rounded object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Favicon standard
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMediaTargetField("faviconUrl")}
                        className="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700"
                      >
                        Scegli Icona
                      </button>
                      {settings.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => updateField("faviconUrl", "")}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Site Identity & Masthead */}
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Nome del Sito / Magazine (`siteName`)
                      </label>
                      <input
                        type="text"
                        value={settings.siteName || ""}
                        onChange={(e) =>
                          updateField("siteName", e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Badge Soprattitolo Masthead (`mastheadBadge`)
                      </label>
                      <input
                        type="text"
                        value={settings.mastheadBadge ?? "Magazine Indipendente"}
                        onChange={(e) =>
                          updateField("mastheadBadge", e.target.value)
                        }
                        placeholder="Es. Magazine Indipendente"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Tagline / Sottotitolo Editoriale (`siteTagline`)
                    </label>
                    <input
                      type="text"
                      value={settings.siteTagline || ""}
                      onChange={(e) =>
                        updateField("siteTagline", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-medium">
                        Mostra Nome Sito accanto al Logo
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showSiteNameInNavbar ?? true}
                        onChange={(e) =>
                          updateField("showSiteNameInNavbar", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-medium">
                        Mostra Testata Masthead in Home
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showMasthead ?? true}
                        onChange={(e) =>
                          updateField("showMasthead", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-medium">
                        Mostra Barra Categorie in Home
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showCategoryBar ?? true}
                        onChange={(e) =>
                          updateField("showCategoryBar", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TIPOGRAFIA & FONT */}
          {activeTab === "typography" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Tipografia, Google Fonts &amp; Proporzioni di Lettura
                </h2>
                <p className="text-xs text-slate-500">
                  Combina liberamente il carattere tipografico dei titoli con quello del corpo testo. I Google Fonts vengono caricati automaticamente.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Heading Font */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Font per Titoli &amp; Testate (`headingFont`)
                    </label>
                    <div className="mt-2 space-y-2">
                      {HEADING_FONTS.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updateField("headingFont", f.id)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${(settings.headingFont || "Georgia") === f.id
                              ? "border-brand-600 bg-brand-50/40 ring-1 ring-brand-500/30 dark:bg-brand-950/30"
                              : "border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                            }`}
                        >
                          <div>
                            <p
                              style={{ fontFamily: f.cssFamily }}
                              className="text-sm font-bold text-slate-900 dark:text-white"
                            >
                              {f.id} — Aa Bb Cc
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {f.label}
                            </p>
                          </div>
                          {(settings.headingFont || "Georgia") === f.id && (
                            <Check className="h-4 w-4 text-brand-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body Font + Scales */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Font per Corpo Articoli &amp; Interfaccia (`bodyFont`)
                      </label>
                      <div className="mt-2 space-y-2">
                        {BODY_FONTS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => updateField("bodyFont", f.id)}
                            className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition ${(settings.bodyFont || "Inter") === f.id
                                ? "border-brand-600 bg-brand-50/40 ring-1 ring-brand-500/30 dark:bg-brand-950/30"
                                : "border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                              }`}
                          >
                            <div>
                              <p
                                style={{ fontFamily: f.cssFamily }}
                                className="text-sm font-medium text-slate-900 dark:text-white"
                              >
                                {f.id} — Il piacere della lettura
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {f.label}
                              </p>
                            </div>
                            {(settings.bodyFont || "Inter") === f.id && (
                              <Check className="h-4 w-4 text-brand-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Base Font Size, Line Height, Tracking */}
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Dimensione Testo Base</span>
                          <span className="text-brand-600">
                            {settings.baseFontSize || 16}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={14}
                          max={20}
                          value={settings.baseFontSize || 16}
                          onChange={(e) =>
                            updateField("baseFontSize", Number(e.target.value))
                          }
                          className="mt-2 w-full accent-brand-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Interlinea Paragrafi Articolo (`articleLineHeight`)
                        </label>
                        <select
                          value={settings.articleLineHeight || "relaxed"}
                          onChange={(e) =>
                            updateField("articleLineHeight", e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <option value="compact">
                            Compatta (1.55 — stile quotidiano denso)
                          </option>
                          <option value="relaxed">
                            Equilibrata (1.78 — consigliata per lettura)
                          </option>
                          <option value="loose">
                            Ariosa (1.95 — saggistica lenta)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Spaziatura Lettere Titoli (`headingTracking`)
                        </label>
                        <select
                          value={settings.headingTracking || "tight"}
                          onChange={(e) =>
                            updateField("headingTracking", e.target.value)
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <option value="tighter">
                            Ultra-compatta (-0.04em)
                          </option>
                          <option value="tight">
                            Editoriale Compatta (-0.025em)
                          </option>
                          <option value="normal">Normale (0em)</option>
                          <option value="wide">Ampia (+0.025em)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LAYOUT HOME, HERO & SIDEBAR */}
          {activeTab === "layout" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Layout Sezione Hero (Articolo Principale in Home)
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: "magazine",
                      title: "Magazine Split (7+5)",
                      desc: "Immagine grande a sinistra e box testo editoriale a destra",
                    },
                    {
                      id: "spotlight",
                      title: "Spotlight Fullscreen",
                      desc: "Immagine panoramica a tutto schermo con titolo sovrapposto",
                    },
                    {
                      id: "minimal",
                      title: "Minimal Tipografico",
                      desc: "Focus puro sul titolo centrato senza immagine gigante",
                    },
                    {
                      id: "dual",
                      title: "Doppio Primo Piano",
                      desc: "Due articoli principali affiancati in evidenza",
                    },
                    {
                      id: "none",
                      title: "Nessun Hero",
                      desc: "Mostra direttamente la griglia degli articoli",
                    },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => updateField("heroLayout", h.id)}
                      className={`rounded-xl border p-3.5 text-left transition ${(settings.heroLayout || "magazine") === h.id
                          ? "border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20 dark:bg-brand-950/30"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-800"
                        }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {h.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {h.desc}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Feed Grid Layout & Container Width */}
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Disposizione Articoli (`postsGridLayout`)
                    </label>
                    <select
                      value={settings.postsGridLayout || "grid-2"}
                      onChange={(e) =>
                        updateField("postsGridLayout", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="grid-2">Griglia a 2 Colonne</option>
                      <option value="grid-3">Griglia a 3 Colonne</option>
                      <option value="list">
                        Lista Editoriale Orizzontale
                      </option>
                      <option value="magazine-mix">
                        Magazine Mix (1 Largo + 2 Affiancati)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Posizione Sidebar (`sidebarPosition`)
                    </label>
                    <select
                      value={settings.sidebarPosition || "right"}
                      onChange={(e) =>
                        updateField("sidebarPosition", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="right">Sidebar a Destra (Default)</option>
                      <option value="left">Sidebar a Sinistra</option>
                      <option value="none">
                        Nessuna Sidebar (Full-Width)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Larghezza Contenitore (`containerWidth`)
                    </label>
                    <select
                      value={settings.containerWidth || "standard"}
                      onChange={(e) =>
                        updateField("containerWidth", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="compact">Compatto (1024px)</option>
                      <option value="standard">Standard (1152px)</option>
                      <option value="wide">Ampio Magazine (1280px)</option>
                    </select>
                  </div>
                </div>

                {/* Sidebar Widgets Configuration */}
                <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    Widget della Sidebar &amp; Box Presentazione Autore
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-semibold">
                        Box &ldquo;Chi scrive qui&rdquo;
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showAuthorWidget ?? true}
                        onChange={(e) =>
                          updateField("showAuthorWidget", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-semibold">
                        Classifica &ldquo;Articoli più letti&rdquo;
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showMostReadWidget ?? true}
                        onChange={(e) =>
                          updateField("showMostReadWidget", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>

                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                      <span className="font-semibold">
                        Nuvola Tag &ldquo;Argomenti&rdquo;
                      </span>
                      <input
                        type="checkbox"
                        checked={settings.showTagsWidget ?? true}
                        onChange={(e) =>
                          updateField("showTagsWidget", e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-600"
                      />
                    </label>
                  </div>

                  {(settings.showAuthorWidget ?? true) && (
                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-12 dark:border-slate-800 dark:bg-slate-950">
                      <div className="sm:col-span-8 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Titolo Widget Autore/Redazione
                          </label>
                          <input
                            type="text"
                            value={
                              settings.authorWidgetTitle || "Chi scrive qui"
                            }
                            onChange={(e) =>
                              updateField("authorWidgetTitle", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Testo Breve Presentazione
                          </label>
                          <textarea
                            rows={2}
                            value={settings.authorWidgetBio || ""}
                            onChange={(e) =>
                              updateField("authorWidgetBio", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-4 flex flex-col justify-between">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Foto/Avatar Box Sidebar
                        </p>
                        <div className="my-2 flex items-center gap-3">
                          {settings.authorWidgetImage ? (
                            <img
                              src={settings.authorWidgetImage}
                              alt="Avatar"
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 font-serif font-bold text-white">
                              S
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setMediaTargetField("authorWidgetImage")
                            }
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            Scegli Foto
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STILE CARD, BORDI & PAGINA ARTICOLO */}
          {activeTab === "cards_article" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Design Card Articoli, Raggio Bordi &amp; Bottoni
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Raggio di Curvatura Bordi (`borderRadiusStyle`)
                    </label>
                    <select
                      value={settings.borderRadiusStyle || "rounded"}
                      onChange={(e) =>
                        updateField("borderRadiusStyle", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="sharp">
                        Netto / Brutalist (0px — angoli vivi da quotidiano)
                      </option>
                      <option value="subtle">Sobrio &amp; Classico (6px)</option>
                      <option value="rounded">
                        Morbido Moderno (16px — default)
                      </option>
                      <option value="pill">
                        Ultra-Arrotondato Organico (28px)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Stile Superficie Card (`cardStyle`)
                    </label>
                    <select
                      value={settings.cardStyle || "bordered"}
                      onChange={(e) => updateField("cardStyle", e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="bordered">
                        Bordo Sottile + Ombra Leggera
                      </option>
                      <option value="elevated">
                        Elevata (Senza bordo, ombra morbida profonda)
                      </option>
                      <option value="flat">
                        Piatta Minimal (Senza bordi né ombre)
                      </option>
                      <option value="glass">
                        Glassmorphism (Effetto vetro traslucido)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Proporzione Immagini Copertina (`cardImageRatio`)
                    </label>
                    <select
                      value={settings.cardImageRatio || "video"}
                      onChange={(e) =>
                        updateField("cardImageRatio", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="video">Panoramica 16:9 (Video)</option>
                      <option value="classic">Fotografica 4:3 (Classica)</option>
                      <option value="square">Quadrata 1:1</option>
                      <option value="portrait">Editoriale Verticale 4:5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Forma Pulsanti &amp; Tag (`buttonStyle`)
                    </label>
                    <select
                      value={settings.buttonStyle || "pill"}
                      onChange={(e) =>
                        updateField("buttonStyle", e.target.value)
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="pill">A Pillola (Arrotondati)</option>
                      <option value="rounded">Angoli Morbidi (Rounded)</option>
                      <option value="sharp">Squadrati Netti (Sharp)</option>
                    </select>
                  </div>
                </div>

                {/* Card Metadata Toggles */}
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Elementi Visibili nelle Card Articolo:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                    {[
                      { key: "showCardCategory", label: "Categoria" },
                      { key: "showCardExcerpt", label: "Estratto" },
                      { key: "showCardAuthor", label: "Autore" },
                      { key: "showCardDate", label: "Data" },
                      { key: "showCardStats", label: "Like & Commenti" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                      >
                        <input
                          type="checkbox"
                          checked={settings[item.key] ?? true}
                          onChange={(e) =>
                            updateField(item.key, e.target.checked)
                          }
                          className="h-3.5 w-3.5 accent-brand-600"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Single Article Page Layout */}
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white">
                    Esperienza di Lettura Pagina Singolo Articolo
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Larghezza Colonna di Lettura (`articleWidth`)
                      </label>
                      <select
                        value={settings.articleWidth || "normal"}
                        onChange={(e) =>
                          updateField("articleWidth", e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                      >
                        <option value="narrow">
                          Stretta Focalizzata (672px — stile libro)
                        </option>
                        <option value="normal">
                          Classica Editoriale (896px)
                        </option>
                        <option value="wide">Ampia Magazine (1024px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Allineamento Intestazione Articolo (`articleHeaderStyle`)
                      </label>
                      <select
                        value={settings.articleHeaderStyle || "classic"}
                        onChange={(e) =>
                          updateField("articleHeaderStyle", e.target.value)
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                      >
                        <option value="classic">Allineato a Sinistra</option>
                        <option value="centered">
                          Centrato Simmetrico da Rivista
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {[
                      {
                        key: "showReadingProgress",
                        label: "Barra Avanzamento Lettura in alto",
                      },
                      {
                        key: "showArticleToc",
                        label: "Indice dei Contenuti Automatico (TOC)",
                      },
                      {
                        key: "showAuthorBioCard",
                        label: "Box Biografia Autore a fine articolo",
                      },
                      {
                        key: "showRelatedPosts",
                        label: "Sezione Articoli Correlati",
                      },
                    ].map((t) => (
                      <label
                        key={t.key}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950"
                      >
                        <span className="font-medium">{t.label}</span>
                        <input
                          type="checkbox"
                          checked={settings[t.key] ?? true}
                          onChange={(e) => updateField(t.key, e.target.checked)}
                          className="h-4 w-4 accent-brand-600"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: HEADER, MENU, BANNER ANNUNCI & FOOTER */}
          {activeTab === "header_footer" && (
            <div className="space-y-6">
              {/* Navbar & Announcement Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Stile Header / Navbar &amp; Barra Annunci Superiore
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Layout Navbar (`navbarStyle`)
                    </label>
                    <select
                      value={settings.navbarStyle || "classic"}
                      onChange={(e) =>
                        updateField("navbarStyle", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="classic">
                        Classica (Logo a sinistra, Menu al centro)
                      </option>
                      <option value="centered">
                        Editoriale Centrata (Grande testata + barra menu sotto)
                      </option>
                      <option value="minimal">Minimale Compatta</option>
                      <option value="floating">
                        Flottante a Pillola (Staccata dal bordo superiore)
                      </option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Navbar Sticky (Fissa in alto allo scorrimento)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Con effetto sfocatura vetro (backdrop-blur).
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.stickyNavbar ?? true}
                      onChange={(e) =>
                        updateField("stickyNavbar", e.target.checked)
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                  </label>
                </div>

                {/* Top Announcement Bar */}
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Barra Annunci Promozionale / Editoriale (Top Bar)
                    </p>
                    <input
                      type="checkbox"
                      checked={Boolean(settings.enableAnnouncementBar)}
                      onChange={(e) =>
                        updateField("enableAnnouncementBar", e.target.checked)
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                  </div>

                  {settings.enableAnnouncementBar && (
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Testo Annuncio
                        </label>
                        <input
                          type="text"
                          value={settings.announcementText || ""}
                          onChange={(e) =>
                            updateField("announcementText", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Testo Link Call-To-Action
                        </label>
                        <input
                          type="text"
                          value={settings.announcementLinkText || ""}
                          onChange={(e) =>
                            updateField("announcementLinkText", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">
                          URL Destinazione Link
                        </label>
                        <input
                          type="text"
                          value={settings.announcementLinkUrl || ""}
                          onChange={(e) =>
                            updateField("announcementLinkUrl", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Sfondo:</span>
                        <input
                          type="color"
                          value={settings.announcementBgColor || "#c54c3d"}
                          onChange={(e) =>
                            updateField("announcementBgColor", e.target.value)
                          }
                          className="h-7 w-10 rounded border"
                        />
                        <span className="ml-3 text-xs text-slate-500">
                          Testo:
                        </span>
                        <input
                          type="color"
                          value={settings.announcementTextColor || "#ffffff"}
                          onChange={(e) =>
                            updateField("announcementTextColor", e.target.value)
                          }
                          className="h-7 w-10 rounded border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Menu Builder (Header & Footer) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      Costruttore Visuale Menu di Navigazione
                    </h2>
                    <p className="text-xs text-slate-500">
                      Aggiungi, rinomina o riordina le voci del menu Header e del Footer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setHeaderMenu([
                        ...headerMenu,
                        { label: "Nuova Voce", href: "/" },
                      ])
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Aggiungi Voce Header
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {headerMenu.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const next = [...headerMenu];
                          next[idx] = { ...next[idx], label: e.target.value };
                          setHeaderMenu(next);
                        }}
                        placeholder="Etichetta"
                        className="w-1/3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-900"
                      />
                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => {
                          const next = [...headerMenu];
                          next[idx] = { ...next[idx], href: e.target.value };
                          setHeaderMenu(next);
                        }}
                        placeholder="/percorso"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = [...headerMenu];
                          [next[idx - 1], next[idx]] = [
                            next[idx],
                            next[idx - 1],
                          ];
                          setHeaderMenu(next);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === headerMenu.length - 1}
                        onClick={() => {
                          const next = [...headerMenu];
                          [next[idx + 1], next[idx]] = [
                            next[idx],
                            next[idx + 1],
                          ];
                          setHeaderMenu(next);
                        }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHeaderMenu(headerMenu.filter((_, i) => i !== idx))
                        }
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer Menu */}
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Link Rapidi nel Footer
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setFooterMenu([
                          ...footerMenu,
                          { label: "Nuovo Link", href: "/" },
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300"
                    >
                      <Plus className="h-3 w-3" /> Aggiungi Link Footer
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {footerMenu.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950"
                      >
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const next = [...footerMenu];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setFooterMenu(next);
                          }}
                          className="w-1/3 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-800 dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={item.href}
                          onChange={(e) => {
                            const next = [...footerMenu];
                            next[idx] = { ...next[idx], href: e.target.value };
                            setFooterMenu(next);
                          }}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFooterMenu(footerMenu.filter((_, i) => i !== idx))
                          }
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer, Newsletter Box & Social Links */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Footer, Box Newsletter &amp; Canali Social
                </h2>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Layout Footer (`footerStyle`)
                    </label>
                    <select
                      value={settings.footerStyle || "editorial"}
                      onChange={(e) =>
                        updateField("footerStyle", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="editorial">
                        Editoriale Completo (Brand + Tagline + Social + Link)
                      </option>
                      <option value="centered">Centrato Simmetrico</option>
                      <option value="minimal">Minimale Compatto</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                    <span className="font-bold">
                      Mostra Box Iscrizione Newsletter nel Footer
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.showFooterNewsletter ?? true}
                      onChange={(e) =>
                        updateField("showFooterNewsletter", e.target.checked)
                      }
                      className="h-4 w-4 accent-brand-600"
                    />
                  </label>
                </div>

                {(settings.showFooterNewsletter ?? true) && (
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Badge Newsletter
                      </label>
                      <input
                        type="text"
                        value={settings.newsletterBadge || ""}
                        onChange={(e) =>
                          updateField("newsletterBadge", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Testo Bottone Newsletter
                      </label>
                      <input
                        type="text"
                        value={settings.newsletterButtonText || ""}
                        onChange={(e) =>
                          updateField("newsletterButtonText", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Titolo Box Newsletter
                      </label>
                      <input
                        type="text"
                        value={settings.newsletterTitle || ""}
                        onChange={(e) =>
                          updateField("newsletterTitle", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Descrizione Sottotitolo Newsletter
                      </label>
                      <input
                        type="text"
                        value={settings.newsletterDescription || ""}
                        onChange={(e) =>
                          updateField("newsletterDescription", e.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Testo Copyright / Crediti Footer (`footerCopyrightText`)
                  </label>
                  <input
                    type="text"
                    value={settings.footerCopyrightText || ""}
                    onChange={(e) =>
                      updateField("footerCopyrightText", e.target.value)
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                {/* Social Links */}
                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="mb-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Profili Social (mostrati nel Footer se compilati):
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { id: "instagram", label: "Instagram URL" },
                      { id: "linkedin", label: "LinkedIn URL" },
                      { id: "x", label: "X / Twitter URL" },
                      { id: "youtube", label: "YouTube URL" },
                      { id: "tiktok", label: "TikTok URL" },
                      { id: "substack", label: "Substack / Podcast URL" },
                    ].map((soc) => (
                      <div key={soc.id}>
                        <label className="block text-[11px] font-medium text-slate-500">
                          {soc.label}
                        </label>
                        <input
                          type="text"
                          value={socialLinks[soc.id] || ""}
                          onChange={(e) =>
                            setSocialLink(soc.id, e.target.value)
                          }
                          placeholder={`https://${soc.id}.com/...`}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CSS CUSTOM & BACKUP TEMA JSON */}
          {activeTab === "custom_css" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  Foglio di Stile CSS Personalizzato (`customCss`)
                </h2>
                <p className="text-xs text-slate-500">
                  Aggiungi regole CSS personalizzate che verranno iniettate globalmente in tutte le pagine del sito.
                </p>

                <textarea
                  rows={10}
                  value={settings.customCss || ""}
                  onChange={(e) => updateField("customCss", e.target.value)}
                  placeholder={`/* Esempio:\n.prose h2 {\n  border-bottom: 1px solid rgb(var(--brand-200));\n  padding-bottom: 0.4rem;\n}\n*/`}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-950 p-4 font-mono text-xs text-emerald-300 focus:border-brand-500 focus:outline-none"
                />

                {/* Import / Export Theme JSON */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Esporta o Importa Configurazione Grafica (JSON)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Salva un backup completo del tuo tema grafico o carica un preset salvato.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportThemeJson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    >
                      <Download className="h-3.5 w-3.5" /> Esporta Tema (.json)
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300">
                      <Upload className="h-3.5 w-3.5" /> Importa Tema (.json)
                      <input
                        type="file"
                        accept="application/json"
                        onChange={handleImportThemeJson}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Live Preview Canvas */}
        {showLivePreview && (
          <div className="xl:col-span-5">
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {/* Preview Toolbar */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Anteprima Live in Tempo Reale
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`rounded-lg p-1.5 text-xs ${previewDevice === "desktop"
                        ? "bg-brand-600 text-white"
                        : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    title="Vista Desktop"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`rounded-lg p-1.5 text-xs ${previewDevice === "mobile"
                        ? "bg-brand-600 text-white"
                        : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    title="Vista Smartphone"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDark((d) => !d)}
                    className="ml-1 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {previewDark ? (
                      <>
                        <Moon className="h-3 w-3 text-indigo-400" /> Scuro
                      </>
                    ) : (
                      <>
                        <Sun className="h-3 w-3 text-amber-500" /> Chiaro
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Miniature Simulated Website */}
              <div className="flex justify-center bg-slate-100 p-3 dark:bg-slate-950">
                <div
                  style={{
                    backgroundColor: previewDark
                      ? settings.bgDarkColor || "#020617"
                      : settings.bgLightColor || "#ffffff",
                    color: previewDark
                      ? settings.textDarkColor || "#f1f5f9"
                      : settings.textLightColor || "#0f172a",
                    fontFamily: "var(--font-sans)",
                  }}
                  className={`overflow-hidden rounded-xl border border-slate-200 shadow-inner transition-all dark:border-slate-800 ${previewDevice === "mobile" ? "w-[320px]" : "w-full"
                    }`}
                >
                  {/* Simulated Announcement Bar */}
                  {settings.enableAnnouncementBar && (
                    <div
                      style={{
                        backgroundColor:
                          settings.announcementBgColor || "#c54c3d",
                        color: settings.announcementTextColor || "#ffffff",
                      }}
                      className="px-3 py-1.5 text-center text-[10px] font-semibold"
                    >
                      {settings.announcementText}{" "}
                      <span className="underline">
                        {settings.announcementLinkText}
                      </span>
                    </div>
                  )}

                  {/* Simulated Navbar */}
                  <div
                    style={{
                      backgroundColor: previewDark
                        ? settings.surfaceDarkColor || "#0f172a"
                        : settings.surfaceLightColor || "#ffffff",
                    }}
                    className={`border-b border-slate-200/40 px-4 py-3 ${settings.navbarStyle === "floating"
                        ? "mx-3 mt-2 rounded-xl border shadow-sm"
                        : ""
                      }`}
                  >
                    <div
                      className={`flex items-center justify-between ${settings.navbarStyle === "centered"
                          ? "flex-col gap-2 text-center"
                          : ""
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {(settings.logoType === "image" ||
                          settings.logoType === "both") &&
                          (previewDark && settings.logoDarkImageUrl
                            ? settings.logoDarkImageUrl
                            : settings.logoImageUrl) && (
                            <img
                              src={
                                previewDark && settings.logoDarkImageUrl
                                  ? settings.logoDarkImageUrl
                                  : settings.logoImageUrl
                              }
                              alt="Logo"
                              className="h-6 w-auto object-contain"
                            />
                          )}
                        {(settings.logoType === "text" ||
                          settings.logoType === "both" ||
                          !settings.logoImageUrl) && (
                            <span
                              style={{ fontFamily: "var(--font-serif)" }}
                              className="text-base font-bold"
                            >
                              {settings.logoText || settings.siteName}
                            </span>
                          )}
                      </div>

                      <div className="flex items-center gap-3 text-[10px] opacity-75">
                        {headerMenu.slice(0, 3).map((m, i) => (
                          <span key={i}>{m.label}</span>
                        ))}
                      </div>

                      <span
                        style={{
                          backgroundColor: settings.primaryColor || "#c54c3d",
                          borderRadius: btnRadiusPreviewPx,
                        }}
                        className="px-2.5 py-1 text-[9px] font-semibold text-white"
                      >
                        Accedi
                      </span>
                    </div>
                  </div>

                  {/* Simulated Main Content */}
                  <div className="space-y-4 p-4">
                    {/* Simulated Masthead */}
                    {(settings.showMasthead ?? true) && (
                      <div className="border-b border-slate-200/30 pb-3">
                        <span
                          style={{ color: settings.primaryColor || "#c54c3d" }}
                          className="text-[9px] font-bold uppercase tracking-widest"
                        >
                          ✦ {settings.mastheadBadge || "Magazine Indipendente"}
                        </span>
                        <h3
                          style={{ fontFamily: "var(--font-serif)" }}
                          className="mt-0.5 text-lg font-bold leading-tight"
                        >
                          {settings.siteName || "Il Blog di Sara"}
                        </h3>
                        <p className="mt-0.5 text-[10px] opacity-70 line-clamp-1">
                          {settings.siteTagline}
                        </p>
                      </div>
                    )}

                    {/* Simulated Hero */}
                    {settings.heroLayout !== "none" && (
                      <div
                        style={{
                          backgroundColor: previewDark
                            ? settings.surfaceDarkColor || "#0f172a"
                            : settings.surfaceLightColor || "#ffffff",
                          borderRadius: radiusPreviewPx,
                        }}
                        className="overflow-hidden border border-slate-200/40 p-3 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              backgroundColor:
                                settings.primaryColor || "#c54c3d",
                              borderRadius: btnRadiusPreviewPx,
                            }}
                            className="px-2 py-0.5 text-[8px] font-bold uppercase text-white"
                          >
                            Hero: {settings.heroLayout}
                          </span>
                          <span className="text-[9px] opacity-60">
                            5 min di lettura
                          </span>
                        </div>
                        <h4
                          style={{ fontFamily: "var(--font-serif)" }}
                          className="mt-1.5 text-sm font-bold leading-snug"
                        >
                          Perché la scrittura digitale ha bisogno di spazi indipendenti
                        </h4>
                        <p className="mt-1 text-[10px] opacity-70 line-clamp-2">
                          Tipografia curata, palette cromatica armoniosa e controllo totale sul design editoriale.
                        </p>
                      </div>
                    )}

                    {/* Simulated Feed + Sidebar */}
                    <div className="grid grid-cols-12 gap-3">
                      <div
                        className={
                          settings.sidebarPosition === "none" ||
                            previewDevice === "mobile"
                            ? "col-span-12 space-y-2.5"
                            : settings.sidebarPosition === "left"
                              ? "order-2 col-span-8 space-y-2.5"
                              : "col-span-8 space-y-2.5"
                        }
                      >
                        <div
                          className={
                            settings.postsGridLayout === "list" ||
                              previewDevice === "mobile"
                              ? "space-y-2"
                              : "grid grid-cols-2 gap-2"
                          }
                        >
                          {[1, 2].map((n) => (
                            <div
                              key={n}
                              style={{
                                backgroundColor: previewDark
                                  ? settings.surfaceDarkColor || "#0f172a"
                                  : settings.surfaceLightColor || "#ffffff",
                                borderRadius: radiusPreviewPx,
                              }}
                              className="overflow-hidden border border-slate-200/40 p-2.5 shadow-sm"
                            >
                              <div
                                style={{
                                  backgroundColor:
                                    settings.primaryColor || "#c54c3d",
                                  opacity: 0.18,
                                  borderRadius:
                                    settings.borderRadiusStyle === "sharp"
                                      ? "0px"
                                      : "6px",
                                }}
                                className="mb-2 h-14 w-full"
                              />
                              {(settings.showCardCategory ?? true) && (
                                <span
                                  style={{
                                    color: settings.primaryColor || "#c54c3d",
                                  }}
                                  className="text-[8px] font-bold uppercase"
                                >
                                  Editoriali
                                </span>
                              )}
                              <p
                                style={{ fontFamily: "var(--font-serif)" }}
                                className="mt-0.5 text-[11px] font-bold leading-tight"
                              >
                                Articolo di esempio #{n}
                              </p>
                              {(settings.showCardExcerpt ?? true) && (
                                <p className="mt-1 text-[9px] opacity-65 line-clamp-2">
                                  Anteprima dello stile card ({settings.cardStyle}) e raggio bordi.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {settings.sidebarPosition !== "none" &&
                        previewDevice !== "mobile" && (
                          <div
                            className={`col-span-4 space-y-2 ${settings.sidebarPosition === "left"
                                ? "order-1"
                                : ""
                              }`}
                          >
                            <div
                              style={{
                                backgroundColor: previewDark
                                  ? settings.surfaceDarkColor || "#0f172a"
                                  : settings.surfaceLightColor || "#ffffff",
                                borderRadius: radiusPreviewPx,
                              }}
                              className="border border-slate-200/40 p-2.5"
                            >
                              <p
                                style={{ fontFamily: "var(--font-serif)" }}
                                className="text-[10px] font-bold"
                              >
                                {settings.authorWidgetTitle || "Chi scrive qui"}
                              </p>
                              <p className="mt-1 text-[8px] opacity-70 line-clamp-3">
                                {settings.authorWidgetBio}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Simulated Footer */}
                    <div
                      style={{
                        backgroundColor: previewDark
                          ? settings.surfaceDarkColor || "#0f172a"
                          : settings.surfaceLightColor || "#ffffff",
                        borderRadius: radiusPreviewPx,
                      }}
                      className="border border-slate-200/40 p-3 text-center"
                    >
                      <p
                        style={{ fontFamily: "var(--font-serif)" }}
                        className="text-xs font-bold"
                      >
                        {settings.newsletterTitle || "Iscriviti alla Newsletter"}
                      </p>
                      <span
                        style={{
                          backgroundColor: settings.primaryColor || "#c54c3d",
                          borderRadius: btnRadiusPreviewPx,
                        }}
                        className="mt-2 inline-block px-3 py-1 text-[9px] font-semibold text-white"
                      >
                        {settings.newsletterButtonText || "Iscriviti"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Picker Modal for Logos, Favicon & Author Widget Image */}
      {mediaTargetField && (
        <MediaPickerModal
          title="Seleziona o Carica Immagine per il Brand / Tema"
          onClose={() => setMediaTargetField(null)}
          onSelect={(media) => {
            updateField(mediaTargetField, media.url);
            setMediaTargetField(null);
          }}
        />
      )}
    </div>
  );
}
