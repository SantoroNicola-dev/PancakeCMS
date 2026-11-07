"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { Cookie, ShieldCheck, Sliders, X } from "lucide-react";

interface Props {
  gaMeasurementId: string;
  gtmContainerId: string;
  enableGa4: boolean;
  enableCookieBanner: boolean;
  cookieBannerTitle: string;
  cookieBannerText: string;
  privacyPolicyUrl: string;
  trackScrollDepth: boolean;
}

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    openCookiePreferences?: () => void;
  }
}

export function trackCmsEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params || {});
  }
}

export function GoogleAnalyticsAndConsent({
  gaMeasurementId,
  gtmContainerId,
  enableGa4,
  enableCookieBanner,
  cookieBannerTitle,
  cookieBannerText,
  privacyPolicyUrl,
  trackScrollDepth,
}: Props) {
  const [consent, setConsent] = useState<"granted" | "denied" | "undecided">(
    "undecided"
  );
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("pancakecms_cookie_consent");
    if (saved === "granted" || saved === "denied") {
      setConsent(saved);
      setAnalyticsChecked(saved === "granted");
      setShowBanner(false);
    } else if (enableCookieBanner) {
      setShowBanner(true);
    } else {
      setConsent("granted");
    }

    window.openCookiePreferences = () => {
      setShowBanner(true);
      setShowDetails(true);
    };
  }, [enableCookieBanner]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      if (consent === "granted") {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
        });
      } else if (consent === "denied") {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
    }
  }, [consent]);

  // Tracciamento automatico profondità di lettura (Scroll Depth 75%)
  useEffect(() => {
    if (!enableGa4 || consent !== "granted" || !trackScrollDepth) return;
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const scrolled =
        (window.scrollY + window.innerHeight) /
        Math.max(1, document.documentElement.scrollHeight);
      if (scrolled >= 0.75) {
        fired = true;
        trackCmsEvent("article_read_75_percent", {
          page_path: window.location.pathname,
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enableGa4, consent, trackScrollDepth]);

  const handleAcceptAll = () => {
    localStorage.setItem("pancakecms_cookie_consent", "granted");
    setConsent("granted");
    setAnalyticsChecked(true);
    setShowBanner(false);
  };

  const handleRejectAnalytics = () => {
    localStorage.setItem("pancakecms_cookie_consent", "denied");
    setConsent("denied");
    setAnalyticsChecked(false);
    setShowBanner(false);
  };

  const handleSaveCustom = () => {
    const nextState = analyticsChecked ? "granted" : "denied";
    localStorage.setItem("pancakecms_cookie_consent", nextState);
    setConsent(nextState);
    setShowBanner(false);
  };

  const hasValidGaId = Boolean(enableGa4 && gaMeasurementId.trim());
  const hasValidGtmId = Boolean(gtmContainerId.trim());

  return (
    <>
      {hasValidGaId && (
        <>
          <Script id="ga-consent-default" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'analytics_storage': '${consent === "granted" ? "granted" : "denied"}',
                'wait_for_update': 500
              });
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId.trim()}', {
                anonymize_ip: true
              });
            `}
          </Script>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId.trim()}`}
            strategy="afterInteractive"
          />
        </>
      )}

      {hasValidGtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmContainerId.trim()}');
          `}
        </Script>
      )}

      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Cookie className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {cookieBannerTitle || "Rispettiamo la tua privacy"}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Google Consent Mode v2 • GDPR Compliant
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Chiudi banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {cookieBannerText}{" "}
            <Link
              href={privacyPolicyUrl || "/pagina/privacy-policy"}
              className="font-medium text-brand-600 underline hover:text-brand-700 dark:text-brand-400"
            >
              Leggi l&apos;informativa completa
            </Link>
            .
          </p>

          {showDetails && (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Cookie Tecnici &amp; Sicurezza 2FA (Necessari)
                  </p>
                  <p className="text-slate-500">
                    Indispensabili per il login, i commenti, il tema chiaro/scuro e il salvataggio di questa preferenza.
                  </p>
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Sempre attivi
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Cookie Analitici (Google Analytics 4: {gaMeasurementId || "Non configurato"})
                  </p>
                  <p className="text-slate-500">
                    Ci aiutano a capire in forma aggregata e con IP anonimizzato quali articoli vengono letti di più.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={analyticsChecked}
                    onChange={(e) => setAnalyticsChecked(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-full dark:bg-slate-700" />
                </label>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Sliders className="h-3.5 w-3.5" />
              {showDetails ? "Nascondi opzioni" : "Personalizza"}
            </button>
            <button
              type="button"
              onClick={handleRejectAnalytics}
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Solo tecnici necessari
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                Salva preferenze
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Accetta tutti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

