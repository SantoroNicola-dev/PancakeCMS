"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Cookie, Mail, Rss, Sparkles } from "lucide-react";
import { trackCmsEvent } from "@/components/analytics/GoogleAnalyticsAndConsent";

interface FooterProps {
  siteName: string;
  siteTagline: string;
  footerMenu: { label: string; href: string }[];
}

export function Footer({ siteName, siteTagline, footerMenu }: FooterProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

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
      className="mt-20 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
    >
      {/* Newsletter Banner */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="space-y-2 lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> La Lettera del Venerdì
            </span>
            <h3 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Ricevi i nuovi articoli e i consigli di lettura nella tua casella email
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Zero spam, nessun algoritmo. Solo saggi curati, note di design e letture scelte una volta a settimana.
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
                >
                  <Mail className="h-4 w-4" /> Iscriviti gratuitamente
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom links */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-500 sm:flex-row dark:border-slate-800">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {siteName}
            </p>
            <p className="mt-0.5">{siteTagline}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5">
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
    </footer>
  );
}

