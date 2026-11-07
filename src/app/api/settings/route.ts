import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, canManageSettings, getSessionUser } from "@/lib/auth";
import { calculateReadingTime, slugify } from "@/lib/utils";
import { analyzeSeo } from "@/lib/seo-analyzer";

export async function GET() {
  const [settings, redirects, subscribers] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    }),
    prisma.redirect.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return NextResponse.json({ settings, redirects, subscribers });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canManageSettings(user.role)) {
    return NextResponse.json(
      { error: "Solo gli amministratori possono modificare le impostazioni del sito." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      id: _ignoreId,
      updatedAt: _ignoreUpdated,
      ...updateFields
    } = body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: updateFields,
      create: { id: "default", ...updateFields },
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Update settings error:", err);
    return NextResponse.json(
      { error: "Errore nel salvataggio delle impostazioni." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Iscrizione pubblica alla Newsletter
    if (action === "subscribe_newsletter") {
      const email = String(body.email || "").toLowerCase().trim();
      if (!email || !email.includes("@")) {
        return NextResponse.json(
          { error: "Inserisci un indirizzo email valido." },
          { status: 400 }
        );
      }

      const sub = await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: { isActive: true, name: body.name || undefined },
        create: {
          email,
          name: body.name ? String(body.name).trim() : null,
          source: body.source || "blog",
        },
      });
      return NextResponse.json({ subscriber: sub });
    }

    const user = await getSessionUser();
    if (!user || !canAccessAdmin(user.role)) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }

    // 2. Gestione Redirect 301/302
    if (action === "create_redirect") {
      let sourcePath = String(body.sourcePath || "").trim();
      let destinationPath = String(body.destinationPath || "").trim();
      if (!sourcePath.startsWith("/")) sourcePath = `/${sourcePath}`;
      if (!destinationPath.startsWith("/") && !destinationPath.startsWith("http")) {
        destinationPath = `/${destinationPath}`;
      }

      const redirect = await prisma.redirect.upsert({
        where: { sourcePath },
        update: {
          destinationPath,
          statusCode: Number(body.statusCode) === 302 ? 302 : 301,
          isActive: true,
        },
        create: {
          sourcePath,
          destinationPath,
          statusCode: Number(body.statusCode) === 302 ? 302 : 301,
        },
      });
      return NextResponse.json({ redirect });
    }

    if (action === "delete_redirect" && body.id) {
      await prisma.redirect.delete({ where: { id: String(body.id) } });
      return NextResponse.json({ success: true });
    }

    if (action === "delete_subscriber" && body.id) {
      await prisma.newsletterSubscriber.delete({ where: { id: String(body.id) } });
      return NextResponse.json({ success: true });
    }

    // 3. Importatore WordPress (XML / WXR)
    if (action === "import_wordpress") {
      const xml = String(body.xmlContent || "");
      if (!xml.includes("<item>")) {
        return NextResponse.json(
          {
            error:
              "Il file XML fornito non contiene elementi <item> validi nel formato WordPress WXR.",
          },
          { status: 400 }
        );
      }

      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      let importedCount = 0;

      for (const itemXml of items) {
        const extractTag = (tagName: string) => {
          const match = itemXml.match(
            new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i")
          );
          if (!match) return "";
          return match[1]
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
            .trim();
        };

        const title = extractTag("title") || `Articolo Importato ${importedCount + 1}`;
        const rawContent =
          extractTag("content:encoded") ||
          extractTag("description") ||
          "<p>Contenuto importato da WordPress.</p>";
        const excerpt = extractTag("excerpt:encoded") || "";
        const postTypeRaw = extractTag("wp:post_type");
        const statusRaw = extractTag("wp:status");
        const wpSlug = extractTag("wp:post_name");

        if (postTypeRaw && postTypeRaw !== "post" && postTypeRaw !== "page") {
          continue;
        }

        const slugBase = slugify(wpSlug || title) || `wp-import-${Date.now()}`;
        const existing = await prisma.post.findUnique({ where: { slug: slugBase } });
        const finalSlug = existing
          ? `${slugBase}-${Math.floor(100 + Math.random() * 900)}`
          : slugBase;

        const htmlContent = rawContent.includes("<p")
          ? rawContent
          : rawContent
              .split(/\n\n+/)
              .map((p) => `<p>${p}</p>`)
              .join("");

        const seo = analyzeSeo({
          title,
          slug: finalSlug,
          excerpt,
          contentHtml: htmlContent,
        });

        await prisma.post.create({
          data: {
            title,
            slug: finalSlug,
            excerpt: excerpt || null,
            content: htmlContent,
            type: postTypeRaw === "page" ? "PAGE" : "POST",
            status: statusRaw === "draft" ? "DRAFT" : "PUBLISHED",
            publishedAt: new Date(),
            readingTimeMin: calculateReadingTime(htmlContent),
            authorId: user.id,
            seoScore: seo.overallScore,
          },
        });
        importedCount++;
      }

      return NextResponse.json({
        success: true,
        importedCount,
      });
    }

    return NextResponse.json({ error: "Azione non riconosciuta." }, { status: 400 });
  } catch (err) {
    console.error("Settings POST error:", err);
    return NextResponse.json(
      { error: "Errore durante l'esecuzione dell'operazione." },
      { status: 500 }
    );
  }
}

