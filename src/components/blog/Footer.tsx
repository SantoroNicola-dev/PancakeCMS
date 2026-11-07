"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Cookie,
  ExternalLink,
  Mail,
  Rss,
  Sparkles,
} from "lucide-react";
import { trackCmsEvent } from "@/components/analytics/GoogleAnalyticsAndConsent";
import { getButtonRadiusClass, getContainerWidthClass } from "@/lib/theme";

interface FooterProps {
  siteName: string;
  siteTagline: string;
  footerMenu: { label: string; href: string }[];
  settings?: Record<string, any> | null;
}

  export function Footer({
    siteName,
    siteTagline,
    footerMenu,
    settings,
  }: FooterProps) {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [subscribed, setSubscribed] = useState(false);
    const [error, setError] = useState("");

    const s = settings || {};
    const showFooterNewsletter = s.showFooterNewsletter ?? true;
    const footerStyle = s.footerStyle || "editorial";
    const newsletterBadge = s.newsletterBadge || "La Lettera del Venerdì";
    const newsletterTitle =
      s.newsletterTitle ||
      "Ricevi i nuovi articoli e i consigli di lettura nella tua casella email";
    const newsletterDescription =
      s.newsletterDescription ||
      "Zero spam, nessun algoritmo. Solo saggi curati, note di design e letture scelte una volta a settimana.";
    const newsletterButtonText =
      s.newsletterButtonText || "Iscriviti gratuitamente";
    const footerCopyrightText =
      s.footerCopyrightText ||
      "Tutti i diritti riservati. Realizzato con cura editoriale.";
    const containerClass = getContainerWidthClass(s.containerWidth);
    const btnRadius = getButtonRadiusClass(s.buttonStyle);

    const socialLinks: Record<string, string> = (() => {
      try {
        return JSON.parse(s.socialLinksJson || "{}");
      } catch {
        return {};
      }
    })();

    const activeSocials = Object.entries(socialLinks).filter(
      ([key, val]) =>
        Boolean(val && String(val).trim()) && key !== "newsletter"
    );

    const handleSubscribe = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe_newsletter",
          email,
          name,
          source: "footer",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(true);
        setEmail("");
        setName("");
        trackCmsEvent("newsletter_signup", { source: "footer" });
      } else {
        setError(data.error || "Errore durante l'iscrizione.");
      }
    };

    return (
      <footer
        id="newsletter"
        className="mt-20 border-t border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950"
      >
            <div className={`mx-auto ${containerClass} px-4 py-12 sm:px-6`}>
              {/* Newsletter Banner */}
              {showFooterNewsletter && (
                <div className="cms-hero-card mb-10 grid grid-cols-1 items-center gap-8 border border-slate-200/80 p-8 shadow-sm lg:grid-cols-12 dark:border-slate-800">
                  <div className="space-y-2 lg:col-span-7">
                    {newsletterBadge && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        <Sparkles className="h-3.5 w-3.5" /> {newsletterBadge}
                      </span>
                    )}
                    <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                      {newsletterTitle}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {newsletterDescription}
                    </p>
                  </div>

                          <div className="lg:col-span-5">
                            {subscribed ? (
                              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <span>Grazie per esserti iscritto alla newsletter!</span>
                              </div>
                          ) : (
                          <form onSubmit={handleSubscribe} className="space-y-2.5">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Il tuo nome (opzionale)"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-brand-500 focus:bg-white focus:outline-none sm:w-2/5 dark:border-slate-800 dark:bg-slate-950"
                              />
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="La tua migliore email..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:border-brand-500 focus:bg-white focus:outline-none sm:w-3/5 dark:border-slate-800 dark:bg-slate-950"
                              />
                            </div>
                            {error && <p className="text-xs text-rose-600">{error}</p>}
                            <button
                              type="submit"
                              className={`inline-flex w-full items-center justify-center gap-2 ${btnRadius} bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700`}
                            >
                              <Mail className="h-4 w-4" /> {newsletterButtonText}
                            </button>
                          </form>
              )}
                        </div>
                      </div>
        )}

                  {/* Bottom links */}
                    <div
                      className={`flex flex-col gap-6 border-t border-slate-200/80 pt-8 text-xs text-slate-500 dark:border-slate-800 ${footerStyle === "centered"
                          ? "items-center text-center"
                          : "items-center justify-between sm:flex-row"
                        }`}
                    >
                      <div>
                          <p className="font-serif text-base font-bold text-slate-900 dark:text-white">
                            {siteName}
                          </p>
                          {footerStyle !== "minimal" && siteTagline && (
                            <p className="mt-0.5 max-w-md">{siteTagline}</p>
                          )}
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            © {new Date().getFullYear()} {siteName} — {footerCopyrightText}
                          </p>
                      </div>

                          <div className="flex flex-col items-center gap-3 sm:items-end">
                            {activeSocials.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2">
                                {activeSocials.map(([platform, url]) => (
                                  <a
                                    key={platform}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold capitalize text-slate-700 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                  >
                                    {platform} <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-5">
                              {footerMenu.map((item, idx) => (
                                <Link
                                  key={idx}
                                  href={item.href}
                                  className="hover:text-brand-600 dark:hover:text-brand-400"
                                >
                                  {item.label}
                                </Link>
                              ))}
                              <Link
                                href="/feed.xml"
                                className="inline-flex items-center gap-1 hover:text-brand-600"
                              >
                                <Rss className="h-3.5 w-3.5" /> Feed RSS
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    typeof window !== "undefined" &&
                                    typeof window.openCookiePreferences === "function"
                                  ) {
                                    window.openCookiePreferences();
                                  }
                                }}
                                className="inline-flex items-center gap-1 hover:text-brand-600"
                              >
                                <Cookie className="h-3.5 w-3.5" /> Preferenze Cookie GDPR
                              </button>
                            </div>
                          </div>
        </div>
                    </div>
                  </footer>
                  );
}
