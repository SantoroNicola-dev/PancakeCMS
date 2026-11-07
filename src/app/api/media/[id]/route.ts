import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const existing = await prisma.media.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "File media non trovato." }, { status: 404 });
  }

  try {
    const body = await req.json();

    // 1. Se viene inviata un'immagine modificata dall'Editor Immagini In-Browser (dataUrl base64)
    if (body.editedDataUrl) {
      const base64Data = String(body.editedDataUrl).replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const rawBuffer = Buffer.from(base64Data, "base64");
      const webpBuffer = await sharp(rawBuffer).webp({ quality: 88 }).toBuffer();
      const meta = await sharp(webpBuffer).metadata();

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });

      const saveMode = body.saveMode || "copy"; // "overwrite" | "copy"

      if (saveMode === "overwrite") {
        const targetPath = path.join(uploadsDir, existing.filename);
        await fs.writeFile(targetPath, webpBuffer);

        const updated = await prisma.media.update({
          where: { id: existing.id },
          data: {
            sizeBytes: webpBuffer.length,
            width: meta.width || existing.width,
            height: meta.height || existing.height,
            altText: body.altText ?? existing.altText,
            title: body.title ?? existing.title,
            fileData: webpBuffer,
          },
        });
        const { fileData: _omit, ...rest } = updated;
        return NextResponse.json({ media: rest });
      } else {
        const newFilename = `${path.parse(existing.filename).name}-edit-${Date.now()
          .toString()
          .slice(-4)}.webp`;
        const targetPath = path.join(uploadsDir, newFilename);
        await fs.writeFile(targetPath, webpBuffer);

        const createdCopy = await prisma.media.create({
          data: {
            filename: newFilename,
            originalName: existing.originalName,
            url: `/uploads/${newFilename}`,
            folder: existing.folder,
            mimeType: "image/webp",
            sizeBytes: webpBuffer.length,
            width: meta.width || null,
            height: meta.height || null,
            altText: body.altText ?? existing.altText,
            title: `${existing.title || existing.filename} (Modificata)`,
            caption: existing.caption,
            fileData: webpBuffer,
            uploadedById: user.id,
          },
        });
        const { fileData: _omit, ...rest } = createdCopy;
        return NextResponse.json({ media: rest });
      }
    }

    // 2. Aggiornamento metadati (ALT text, titolo, didascalia, cartella, focal point)
    const updated = await prisma.media.update({
      where: { id: existing.id },
      data: {
        altText: body.altText ?? existing.altText,
        title: body.title ?? existing.title,
        caption: body.caption ?? existing.caption,
        folder: body.folder ?? existing.folder,
        focalPointX:
          typeof body.focalPointX === "number"
            ? body.focalPointX
            : existing.focalPointX,
        focalPointY:
          typeof body.focalPointY === "number"
            ? body.focalPointY
            : existing.focalPointY,
      },
    });

    const { fileData: _omit, ...rest } = updated;
    return NextResponse.json({ media: rest });
  } catch (err) {
    console.error("Update media error:", err);
    return NextResponse.json(
      { error: "Errore durante l'elaborazione del file media." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user || !canAccessAdmin(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const existing = await prisma.media.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Media non trovato." }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "uploads", existing.filename);
    await fs.unlink(filePath).catch(() => { });
    await prisma.media.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete media error:", err);
    return NextResponse.json(
      { error: "Errore durante l'eliminazione del file." },
      { status: 500 }
    );
  }
}
