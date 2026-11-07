import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PUT(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, bio, jobTitle, avatarUrl, currentPassword, newPassword } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (typeof bio === "string") updateData.bio = bio.trim();
    if (typeof jobTitle === "string") updateData.jobTitle = jobTitle.trim();
    if (typeof avatarUrl === "string") updateData.avatarUrl = avatarUrl.trim();

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Inserisci la password attuale per poterla modificare." },
          { status: 400 }
        );
      }
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "Utente non trovato." }, { status: 404 });
      }
      const valid = await verifyPassword(String(currentPassword), dbUser.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "La password attuale non è corretta." },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { error: "La nuova password deve avere almeno 8 caratteri." },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(String(newPassword));
    }

    const updated = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        jobTitle: true,
        avatarUrl: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento del profilo." },
      { status: 500 }
    );
  }
}

