import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPending2FAToken,
  createSessionToken,
  PENDING_2FA_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Inserisci sia l'indirizzo email sia la password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Credenziali non valide o account disabilitato." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenziali non valide." },
        { status: 401 }
      );
    }

    // Se l'utente ha il 2FA attivo, richiediamo il codice TOTP / Backup code
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const pendingToken = await createPending2FAToken(user.id);
      const res = NextResponse.json({
        requiresTwoFactor: true,
        email: user.email,
      });
      res.cookies.set(PENDING_2FA_COOKIE_NAME, pendingToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
      return res;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
    });

    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    const mustSetup2FA =
      !user.twoFactorEnabled &&
      (user.forceTwoFactor ||
        (settings?.forceStaffTwoFactor && user.role !== "READER"));

    const res = NextResponse.json({
      requiresTwoFactor: false,
      mustSetup2FA: Boolean(mustSetup2FA),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Errore interno durante l'autenticazione." },
      { status: 500 }
    );
  }
}

