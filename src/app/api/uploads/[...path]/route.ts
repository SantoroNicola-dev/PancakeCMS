import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const segments = params.path || [];
  const safeSegments = segments.map((s) => path.basename(s));
  const filename = safeSegments[safeSegments.length - 1] || "image.webp";
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadsDir, ...safeSegments);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "image/webp";

  // 1. Try serving directly from disk
  try {
    const fileBuffer = await fs.readFile(filePath);
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // File not on disk — check PostgreSQL backup in Media.fileData
    }

    // 2. Fallback: Restore from PostgreSQL Media.fileData if present
    try {
      const record = await prisma.media.findFirst({
        where: {
          OR: [{ filename }, { url: `/uploads/${filename}` }],
        },
      });

      if (record?.fileData) {
        const buf = Buffer.from(record.fileData);
        await fs.mkdir(uploadsDir, { recursive: true }).catch(() => { });
        await fs.writeFile(filePath, buf).catch(() => { });
        return new NextResponse(new Uint8Array(buf), {
          status: 200,
          headers: {
            "Content-Type": record.mimeType || contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // 3. Fallback for legacy records whose disk file was wiped before DB binary backup
      const label = (record?.title || filename.replace(/\.\w+$/, ""))
        .replace(/[<>&"']/g, "")
        .slice(0, 42);
      const fallbackSvg = `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#c54c3d"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="38" font-weight="bold">${label}</text>
    </svg>`;
      const generatedWebp = await sharp(Buffer.from(fallbackSvg))
        .webp({ quality: 85 })
        .toBuffer();

      return new NextResponse(new Uint8Array(generatedWebp), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch {
      return new NextResponse("File media non trovato", { status: 404 });
    }
  }
