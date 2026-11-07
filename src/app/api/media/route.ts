import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = {};
  if (folder && folder !== "Tutti") {
    where.folder = folder;
  }
  if (q) {
    where.OR = [
      { filename: { contains: q, mode: "insensitive" } },
      { altText: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
    ];
  }

  const [mediaList, allPosts] = await Promise.all([
    prisma.media.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.post.findMany({
      select: { id: true, title: true, coverImage: true, content: true },
    }),
  ]);

  const enriched = mediaList.map((m) => {
    const usedIn = allPosts.filter(
      (p) => p.coverImage === m.url || (p.content && p.content.includes(m.url))
    );
    return {
      ...m,
      usageCount: usedIn.length,
      usedInPosts: usedIn.map((p) => ({ id: p.id, title: p.title })),
    };
  });

  return NextResponse.json({ media: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = String(formData.get("folder") || "Generale").trim();
    const altText = String(formData.get("altText") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const caption = String(formData.get("caption") || "").trim();

    if (!file) {
      return NextResponse.json(
        { error: "Nessun file selezionato." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const baseName =
      slugify(path.parse(file.name).name) || `media-${Date.now()}`;
    const filename = `${baseName}-${Date.now().toString().slice(-5)}.webp`;
    const outputPath = path.join(uploadsDir, filename);

    // Ottimizzazione automatica WebP + ridimensionamento max 1920px con Sharp
    const processedBuffer = await sharp(inputBuffer)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer();

    await fs.writeFile(outputPath, processedBuffer);
    const metadata = await sharp(processedBuffer).metadata();

    const created = await prisma.media.create({
      data: {
        filename,
        originalName: file.name,
        url: `/uploads/${filename}`,
        folder: folder || "Generale",
        mimeType: "image/webp",
        sizeBytes: processedBuffer.length,
        width: metadata.width || null,
        height: metadata.height || null,
        altText: altText || baseName.replace(/-/g, " "),
        title: title || baseName.replace(/-/g, " "),
        caption,
        uploadedById: user.id,
      },
    });

    return NextResponse.json({ media: created });
  } catch (err) {
    console.error("Media upload error:", err);
    return NextResponse.json(
      { error: "Errore durante il caricamento e l'ottimizzazione dell'immagine." },
      { status: 500 }
    );
  }
}

