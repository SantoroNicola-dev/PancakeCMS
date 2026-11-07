import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageUsers, getSessionUser, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Accesso riservato agli Admin." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      jobTitle: true,
      avatarUrl: true,
      isActive: true,
      twoFactorEnabled: true,
      forceTwoFactor: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: { posts: true, comments: true, bookmarks: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || !canManageUsers(admin.role)) {
    return NextResponse.json({ error: "Accesso riservato agli Admin." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role = "READER", jobTitle, forceTwoFactor = false } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e password sono obbligatori." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return NextResponse.json(
        { error: "Esiste già un utente con questa email." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));
    const created = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: role as Role,
        jobTitle: jobTitle || null,
        forceTwoFactor: Boolean(forceTwoFactor),
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
          String(name).trim()
        )}`,
      },
    });

    return NextResponse.json({ user: created });
  } catch (err) {
    console.error("Create user error:", err);
    return NextResponse.json(
      { error: "Errore nella creazione dell'utente." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || !canManageUsers(admin.role)) {
    return NextResponse.json({ error: "Accesso riservato agli Admin." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, role, isActive, forceTwoFactor, resetTwoFactor, newPassword, name, jobTitle } = body;

    if (!id) {
      return NextResponse.json({ error: "ID utente mancante." }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (role) data.role = role as Role;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof forceTwoFactor === "boolean") data.forceTwoFactor = forceTwoFactor;
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof jobTitle === "string") data.jobTitle = jobTitle.trim();

    if (resetTwoFactor) {
      data.twoFactorEnabled = false;
      data.twoFactorSecret = null;
      data.backupCodes = null;
    }

    if (newPassword && String(newPassword).length >= 8) {
      data.passwordHash = await hashPassword(String(newPassword));
    }

    const updated = await prisma.user.update({
      where: { id: String(id) },
      data,
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json(
      { error: "Errore durante l'aggiornamento dell'utente." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getSessionUser();
  if (!admin || !canManageUsers(admin.role)) {
    return NextResponse.json({ error: "Accesso riservato agli Admin." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mancante." }, { status: 400 });
  }
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Non puoi eliminare il tuo stesso account amministratore." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

