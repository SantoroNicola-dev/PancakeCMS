import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canModerateComments, getSessionUser } from "@/lib/auth";
import { CommentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const status = searchParams.get("status") as CommentStatus | null;
  const adminMode = searchParams.get("admin") === "1";

  const user = await getSessionUser();

  if (adminMode) {
    if (!user || !canModerateComments(user.role)) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }
    const comments = await prisma.comment.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        post: { select: { id: true, title: true, slug: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });
    return NextResponse.json({ comments });
  }

  if (!postId) {
    return NextResponse.json({ error: "postId richiesto." }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
      status: "APPROVED",
    },
    include: {
      user: { select: { id: true, name: true, role: true, avatarUrl: true, jobTitle: true } },
      replies: {
        where: { status: "APPROVED" },
        include: {
          user: { select: { id: true, name: true, role: true, avatarUrl: true, jobTitle: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Devi effettuare l'accesso come lettore per pubblicare un commento." },
      { status: 401 }
    );
  }

  try {
    const { postId, parentId, content } = await req.json();
    const cleanContent = String(content || "").trim();

    if (!postId || !cleanContent) {
      return NextResponse.json(
        { error: "Scrivi un messaggio prima di inviare il commento." },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: String(postId) } });
    if (!post || !post.allowComments) {
      return NextResponse.json(
        { error: "I commenti sono disabilitati per questo articolo." },
        { status: 403 }
      );
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    const bannedWords = (settings?.profanityFilterWords || "spam,casino,viagra")
      .split(",")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    const lowerText = cleanContent.toLowerCase();
    const containsSpam = bannedWords.some((w) => lowerText.includes(w));

    let initialStatus: CommentStatus = "APPROVED";
    if (containsSpam) {
      initialStatus = "SPAM";
    } else if (
      settings?.commentModeration === "manual" &&
      user.role === "READER"
    ) {
      initialStatus = "PENDING";
    }

    const comment = await prisma.comment.create({
      data: {
        postId: String(postId),
        userId: user.id,
        parentId: parentId ? String(parentId) : null,
        content: cleanContent,
        status: initialStatus,
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true, jobTitle: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, role: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({
      comment,
      pendingModeration: initialStatus !== "APPROVED",
    });
  } catch (err) {
    console.error("Create comment error:", err);
    return NextResponse.json(
      { error: "Errore durante l'invio del commento." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const { id, action, status } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID commento mancante." }, { status: 400 });
    }

    if (action === "like") {
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { likesCount: { increment: 1 } },
      });
      return NextResponse.json({ comment: updated });
    }

    if (action === "flag") {
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { flaggedCount: { increment: 1 } },
      });
      return NextResponse.json({ comment: updated });
    }

    if (!canModerateComments(user.role)) {
      return NextResponse.json({ error: "Permessi insufficienti." }, { status: 403 });
    }

    if (action === "pin") {
      const target = await prisma.comment.findUnique({ where: { id: String(id) } });
      if (!target) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { isPinned: !target.isPinned },
      });
      return NextResponse.json({ comment: updated });
    }

    if (status) {
      const updated = await prisma.comment.update({
        where: { id: String(id) },
        data: { status: status as CommentStatus },
      });
      return NextResponse.json({ comment: updated });
    }

    return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
  } catch (err) {
    console.error("Update comment error:", err);
    return NextResponse.json(
      { error: "Errore nella moderazione del commento." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID richiesto." }, { status: 400 });
  }

  const existing = await prisma.comment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Commento non trovato." }, { status: 404 });
  }

  if (existing.userId !== user.id && !canModerateComments(user.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

