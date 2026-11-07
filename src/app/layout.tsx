import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { GoogleAnalyticsAndConsent } from "@/components/analytics/GoogleAnalyticsAndConsent";
import { buildThemeCss, getGoogleFontsUrl } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const siteName = settings?.siteName || "Il Blog di Sara";
  const description =
    settings?.siteDescription ||
    "Magazine indipendente di scrittura digitale, cultura, libri e slow living.";

  return {
    title: {
      default: `${siteName} — ${settings?.siteTagline || "Blog Editoriale"}`,
      template: `%s | ${siteName}`,
    },
    description,
    icons: settings?.faviconUrl
      ? {
        icon: settings.faviconUrl,
        shortcut: settings.faviconUrl,
        apple: settings.faviconUrl,
      }
      : undefined,
    openGraph: {
      title: siteName,
      description,
      type: "website",
      locale: "it_IT",
      images: settings?.defaultOgImage ? [settings.defaultOgImage] : undefined,
    },
    robots:
      settings && !settings.enableIndexing
        ? { index: false, follow: false }
        : { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);

  const googleFontsUrl = getGoogleFontsUrl(
    settings?.headingFont,
    settings?.bodyFont
  );
  const dynamicCss = buildThemeCss(settings);
  const defaultThemeMode = settings?.defaultThemeMode || "system";
  const allowThemeToggle = settings?.allowThemeToggle ?? true;

  const themeInitScript = `
    (function() {
      try {
        var defaultMode = ${JSON.stringify(defaultThemeMode)};
        var allowToggle = ${JSON.stringify(allowThemeToggle)};
        var stored = localStorage.getItem("pancakecms_theme");
        var isDark = false;
        if (!allowToggle && (defaultMode === "light" || defaultMode === "dark")) {
          isDark = defaultMode === "dark";
        } else if (stored === "dark" || stored === "light") {
          isDark = stored === "dark";
        } else if (defaultMode === "dark") {
          isDark = true;
        } else if (defaultMode === "light") {
          isDark = false;
        } else {
          isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        document.documentElement.classList.toggle("dark", isDark);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="it" suppressHydrationWarning>
        <head>
          {googleFontsUrl && (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
              />
              <link id="cms-google-fonts" rel="stylesheet" href={googleFontsUrl} />
            </>
          )}
          <style
            id="cms-dynamic-theme"
            dangerouslySetInnerHTML={{ __html: dynamicCss }}
          />
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="cms-public-body min-h-screen flex flex-col">
          {children}

          <GoogleAnalyticsAndConsent
            gaMeasurementId={settings?.gaMeasurementId || ""}
            gtmContainerId={settings?.gtmContainerId || ""}
            enableGa4={Boolean(settings?.enableGa4)}
            enableCookieBanner={settings?.enableCookieBanner ?? true}
            cookieBannerTitle={
              settings?.cookieBannerTitle || "Rispettiamo la tua privacy"
            }
            cookieBannerText={
              settings?.cookieBannerText ||
              "Utilizziamo cookie tecnici e, previo tuo consenso, cookie analitici Google Analytics 4 con Consent Mode v2."
            }
            privacyPolicyUrl={
              settings?.privacyPolicyUrl || "/pagina/privacy-policy"
            }
            trackScrollDepth={settings?.trackScrollDepth ?? true}
          />
        </body>
    </html>
  );
}

