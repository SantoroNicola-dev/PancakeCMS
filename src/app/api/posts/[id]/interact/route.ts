import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { action } = await req.json();

  if (action === "view") {
    const updated = await prisma.post.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
      select: { viewsCount: true },
    });
    return NextResponse.json({ viewsCount: updated.viewsCount });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Accedi come lettore per salvare o mettere Mi Piace agli articoli." },
      { status: 401 }
    );
  }

  if (action === "like") {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: params.id, userId: user.id } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({
        data: { postId: params.id, userId: user.id },
      });
    }

    const likesCount = await prisma.postLike.count({
      where: { postId: params.id },
    });

    return NextResponse.json({ liked: !existing, likesCount });
  }

  if (action === "bookmark") {
    const existing = await prisma.bookmark.findUnique({
      where: { postId_userId: { postId: params.id, userId: user.id } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
    } else {
      await prisma.bookmark.create({
        data: { postId: params.id, userId: user.id },
      });
    }

    return NextResponse.json({ bookmarked: !existing });
  }

  return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
}

