import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  hashPassword,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tutti i campi (Nome, Email, Password) sono obbligatori." },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "La password deve contenere almeno 8 caratteri." },
        { status: 400 }
      );
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });
    if (settings && !settings.allowRegistration) {
      return NextResponse.json(
        { error: "Le nuove registrazioni sono temporaneamente chiuse." },
        { status: 403 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esiste già un account associato a questo indirizzo email." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(String(password));
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash,
        role: "READER",
        jobTitle: "Lettore della Community",
        avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
          String(name).trim()
        )}`,
        lastLoginAt: new Date(),
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: false,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Errore durante la registrazione dell'account." },
      { status: 500 }
    );
  }
}

