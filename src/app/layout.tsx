import type { Metadata } from "next";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { GoogleAnalyticsAndConsent } from "@/components/analytics/GoogleAnalyticsAndConsent";

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

  return (
    <html lang="it" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
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

